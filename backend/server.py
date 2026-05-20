from dotenv import load_dotenv
from pathlib import Path

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

import os
import re
import uuid
import logging
import secrets
import random
import asyncio
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime, timezone, timedelta
from typing import List, Optional, Dict, Any, Literal
from concurrent.futures import ThreadPoolExecutor

import bcrypt
import jwt
import certifi
import shutil
import json
from bson import ObjectId
from fastapi import FastAPI, APIRouter, HTTPException, Request, Response, Depends, UploadFile, File
from fastapi.staticfiles import StaticFiles
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, Field, EmailStr

import firebase_admin
from firebase_admin import credentials, auth as firebase_auth

import google.generativeai as genai


# ---------- Config ----------
JWT_ALGORITHM = "HS256"
ACCESS_MIN = 15
REFRESH_DAYS = 7
BRUTE_LIMIT = 5
BRUTE_WINDOW_MIN = 15
OTP_LENGTH = 6
OTP_EXPIRY_MIN = 10
OTP_MAX_ATTEMPTS = 5
OTP_RATE_LIMIT = 3  # max OTP requests per email per window
OTP_RATE_WINDOW_MIN = 15

mongo_url = os.environ["MONGO_URL"]
client = AsyncIOMotorClient(mongo_url, tlsCAFile=certifi.where())
db = client[os.environ["DB_NAME"]]

# ---------- Firebase Init ----------
firebase_json_str = os.environ.get("FIREBASE_SERVICE_ACCOUNT_JSON")
firebase_path = os.environ.get("FIREBASE_SERVICE_ACCOUNT_PATH")

try:
    if firebase_json_str:
        cred_dict = json.loads(firebase_json_str)
        cred = credentials.Certificate(cred_dict)
        firebase_admin.initialize_app(cred)
    elif firebase_path and os.path.exists(firebase_path):
        cred = credentials.Certificate(firebase_path)
        firebase_admin.initialize_app(cred)
    else:
        firebase_admin.initialize_app()
except ValueError as e:
    # App already initialized
    pass
except Exception as e:
    print("Firebase admin init failed:", e)

# ---------- Gemini AI Init ----------
GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY", "")
gemini_model = None
if GEMINI_API_KEY:
    try:
        genai.configure(api_key=GEMINI_API_KEY)
        gemini_model = genai.GenerativeModel("gemini-2.5-flash")
        print("✅ Gemini AI initialized (gemini-2.5-flash)")
    except Exception as e:
        print(f"⚠️ Gemini AI init failed: {e}")


app = FastAPI(title="Itinera API")
api = APIRouter(prefix="/api")
_thread_pool = ThreadPoolExecutor(max_workers=2)


# ---------- Helpers ----------
def make_slug(name: str) -> str:
    s = name.lower().strip()
    s = re.sub(r'[^a-z0-9\s-]', '', s)
    s = re.sub(r'[\s-]+', '-', s).strip('-')
    return s


def _hash_password_sync(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def hash_password(password: str) -> str:
    return _hash_password_sync(password)


async def hash_password_async(password: str) -> str:
    loop = asyncio.get_event_loop()
    return await loop.run_in_executor(_thread_pool, _hash_password_sync, password)


def verify_password(plain: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(plain.encode("utf-8"), hashed.encode("utf-8"))
    except Exception:
        return False


def get_jwt_secret() -> str:
    return os.environ["JWT_SECRET"]


def create_access_token(user_id: str, email: str) -> str:
    payload = {
        "sub": user_id,
        "email": email,
        "exp": datetime.now(timezone.utc) + timedelta(minutes=ACCESS_MIN),
        "type": "access",
    }
    return jwt.encode(payload, get_jwt_secret(), algorithm=JWT_ALGORITHM)


def create_refresh_token(user_id: str) -> str:
    payload = {
        "sub": user_id,
        "exp": datetime.now(timezone.utc) + timedelta(days=REFRESH_DAYS),
        "type": "refresh",
    }
    return jwt.encode(payload, get_jwt_secret(), algorithm=JWT_ALGORITHM)


def set_auth_cookies(response: Response, access: str, refresh: str) -> None:
    response.set_cookie(
        key="access_token",
        value=access,
        httponly=True,
        secure=True,
        samesite="none",
        max_age=ACCESS_MIN * 60,
        path="/",
    )
    response.set_cookie(
        key="refresh_token",
        value=refresh,
        httponly=True,
        secure=True,
        samesite="none",
        max_age=REFRESH_DAYS * 24 * 3600,
        path="/",
    )


def clear_auth_cookies(response: Response) -> None:
    for name in ("access_token", "refresh_token"):
        response.delete_cookie(
            key=name,
            path="/",
            secure=True,
            samesite="none",
        )
        # Belt-and-suspenders: also set an expired cookie with max_age=0
        response.set_cookie(
            key=name,
            value="",
            httponly=True,
            secure=True,
            samesite="none",
            max_age=0,
            path="/",
        )


def user_to_public(u: dict) -> dict:
    return {
        "id": str(u["_id"]) if "_id" in u else u.get("id"),
        "email": u["email"],
        "name": u.get("name", ""),
        "phone": u.get("phone", ""),
        "city": u.get("city", ""),
        "profile_image": u.get("profile_image", ""),
        "role": u.get("role", "user"),
        "wishlist": u.get("wishlist", []),
        "created_at": u.get("created_at").isoformat() if isinstance(u.get("created_at"), datetime) else u.get("created_at"),
    }


async def get_current_user(request: Request) -> dict:
    token = request.cookies.get("access_token")
    if not token:
        header = request.headers.get("Authorization", "")
        if header.startswith("Bearer "):
            token = header[7:]
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    try:
        decoded_token = firebase_auth.verify_id_token(token)
        uid = decoded_token['uid']
        
        user = await db.users.find_one({"firebase_uid": uid})
        if not user:
            # Check by email or phone to link existing account
            email = decoded_token.get("email")
            phone = decoded_token.get("phone_number")
            query = []
            if email: query.append({"email": email})
            if phone: query.append({"phone": phone})
            
            if query:
                user = await db.users.find_one({"$or": query})
            
            # Determine if this email should be admin
            admin_emails = [e.strip().lower() for e in os.environ.get("ADMIN_EMAIL", "").split(",") if e.strip()]
            is_admin = email and email.lower() in admin_emails

            if user:
                # Link account
                updates = {"firebase_uid": uid}
                if is_admin and user.get("role") != "admin":
                    updates["role"] = "admin"
                await db.users.update_one({"_id": user["_id"]}, {"$set": updates})
                user["firebase_uid"] = uid
                if is_admin:
                    user["role"] = "admin"
            else:
                # Create new account
                new_user = {
                    "firebase_uid": uid,
                    "email": email or "",
                    "phone": phone or "",
                    "name": decoded_token.get("name", "Wanderer"),
                    "profile_image": decoded_token.get("picture", ""),
                    "role": "admin" if is_admin else "user",
                    "created_at": datetime.now(timezone.utc)
                }
                res = await db.users.insert_one(new_user)
                new_user["_id"] = res.inserted_id
                user = new_user
                
        return user
    except Exception as e:
        print("Firebase auth error:", e)
        raise HTTPException(status_code=401, detail="Invalid or expired token")


async def require_admin(user: dict = Depends(get_current_user)) -> dict:
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin privileges required")
    return user


# ---------- Schemas ----------
class RegisterInput(BaseModel):
    email: EmailStr
    password: str = Field(min_length=6, max_length=128)
    name: str = Field(min_length=1, max_length=80)


class OTPSendInput(BaseModel):
    email: EmailStr
    password: str = Field(min_length=6, max_length=128)
    name: str = Field(min_length=1, max_length=80)


class OTPVerifyInput(BaseModel):
    email: EmailStr
    otp: str = Field(min_length=6, max_length=6)


class LoginInput(BaseModel):
    email: EmailStr
    password: str


class ProfileUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=80)
    phone: Optional[str] = Field(None, max_length=20)
    city: Optional[str] = Field(None, max_length=80)
    profile_image: Optional[str] = Field(None, max_length=500)


class AdminUserUpdate(BaseModel):
    role: Optional[Literal["user", "admin"]] = None
    disabled: Optional[bool] = None


class InquiryStatusUpdate(BaseModel):
    status: Literal["new", "contacted", "resolved", "archived"]


class TimelineEvent(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    day_index: int = 0
    time: str = ""  # HH:MM
    title: str
    location: str = ""
    lat: Optional[float] = None
    lng: Optional[float] = None
    notes: str = ""
    category: str = "activity"  # activity|food|transport|stay|meeting


class ExpenseItem(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    category: str = "other"
    description: str
    amount: float = 0.0
    currency: str = "USD"
    date: Optional[str] = None


class PackingItem(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    text: str
    category: str = "general"
    packed: bool = False


class ItineraryBase(BaseModel):
    title: str = Field(min_length=1, max_length=120)
    type: Literal["travel", "event", "generic"] = "travel"
    destination: str = ""
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    description: str = ""
    cover_emoji: str = ""
    budget_limit: float = 0.0
    currency: str = "USD"


class ItineraryCreate(ItineraryBase):
    pass


class ItineraryUpdate(BaseModel):
    title: Optional[str] = None
    type: Optional[Literal["travel", "event", "generic"]] = None
    destination: Optional[str] = None
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    description: Optional[str] = None
    cover_emoji: Optional[str] = None
    budget_limit: Optional[float] = None
    currency: Optional[str] = None
    events: Optional[List[TimelineEvent]] = None
    expenses: Optional[List[ExpenseItem]] = None
    packing: Optional[List[PackingItem]] = None


class Itinerary(ItineraryBase):
    id: str
    user_id: str
    events: List[TimelineEvent] = []
    expenses: List[ExpenseItem] = []
    packing: List[PackingItem] = []
    created_at: str
    updated_at: str


# ---------- Email OTP Helpers ----------
def generate_otp() -> str:
    return "".join([str(random.randint(0, 9)) for _ in range(OTP_LENGTH)])


def _build_otp_html(name: str, otp_code: str) -> str:
    return f"""
    <div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px; background: #F7F3ED; border-radius: 12px;">
        <div style="text-align: center; margin-bottom: 24px;">
            <h2 style="color: #0A3D62; margin: 0; font-size: 22px;">Wanderlust Adventure</h2>
            <p style="color: #8D7B68; font-size: 12px; text-transform: uppercase; letter-spacing: 2px; margin-top: 4px;">Email Verification</p>
        </div>
        <div style="background: white; border-radius: 10px; padding: 28px; text-align: center; border: 1px solid #E5E5E5;">
            <p style="color: #1C1C1E; font-size: 16px; margin: 0 0 8px;">Hi {name},</p>
            <p style="color: #525252; font-size: 14px; margin: 0 0 24px;">Use this code to verify your email and complete your registration:</p>
            <div style="background: #0A3D62; color: #F5A623; font-size: 32px; font-weight: bold; letter-spacing: 8px; padding: 16px 24px; border-radius: 8px; display: inline-block; font-family: monospace;">
                {otp_code}
            </div>
            <p style="color: #8D7B68; font-size: 13px; margin: 24px 0 0;">This code expires in {OTP_EXPIRY_MIN} minutes.</p>
        </div>
        <p style="color: #8D7B68; font-size: 11px; text-align: center; margin-top: 20px;">If you didn't request this, please ignore this email.</p>
    </div>
    """


async def _send_via_resend(to_email: str, otp_code: str, name: str) -> bool:
    """Send OTP email via Resend HTTP API (works on Render free tier)."""
    api_key = os.environ.get("RESEND_API_KEY", "")
    from_email = os.environ.get("RESEND_FROM", "Wanderlust Adventure <onboarding@resend.dev>")
    if not api_key:
        return False

    import httpx
    html = _build_otp_html(name, otp_code)
    try:
        async with httpx.AsyncClient(timeout=15) as client:
            resp = await client.post(
                "https://api.resend.com/emails",
                headers={"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"},
                json={
                    "from": from_email,
                    "to": [to_email],
                    "subject": f"Your Wanderlust Adventure verification code: {otp_code}",
                    "html": html,
                },
            )
            if resp.status_code in (200, 201):
                logging.info(f"OTP email sent via Resend to {to_email}")
                return True
            else:
                logging.error(f"Resend API error {resp.status_code}: {resp.text}")
                return False
    except Exception as e:
        logging.error(f"Resend send failed: {e}")
        return False


async def send_resend_event(event_name: str, email: str, payload: dict = None) -> bool:
    """Send an event to Resend to trigger automations."""
    api_key = os.environ.get("RESEND_API_KEY", "")
    if not api_key:
        logging.warning("RESEND_API_KEY not set — resend event skipped")
        return False

    import httpx
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            resp = await client.post(
                "https://api.resend.com/events",
                headers={"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"},
                json={
                    "event": event_name,
                    "email": email,
                    "payload": payload or {}
                },
            )
            if resp.status_code in (200, 201):
                logging.info(f"Resend event '{event_name}' sent for {email}")
                return True
            else:
                logging.error(f"Failed to send resend event: {resp.status_code} {resp.text}")
                return False
    except Exception as e:
        logging.error(f"Error sending resend event: {e}")
        return False


def _send_via_smtp_sync(to_email: str, otp_code: str, name: str) -> bool:
    """Fallback: send OTP email via SMTP (works locally, blocked on Render free tier)."""
    smtp_host = os.environ.get("SMTP_HOST", "smtp.gmail.com")
    smtp_port = int(os.environ.get("SMTP_PORT", "587"))
    smtp_email = os.environ.get("SMTP_EMAIL", "")
    smtp_password = os.environ.get("SMTP_PASSWORD", "")

    if not smtp_email or not smtp_password:
        return False

    msg = MIMEMultipart("alternative")
    msg["Subject"] = f"Your Wanderlust Adventure verification code: {otp_code}"
    msg["From"] = f"Wanderlust Adventure <{smtp_email}>"
    msg["To"] = to_email

    html = _build_otp_html(name, otp_code)
    text = f"Hi {name}, your Wanderlust Adventure verification code is: {otp_code}. It expires in {OTP_EXPIRY_MIN} minutes."
    msg.attach(MIMEText(text, "plain"))
    msg.attach(MIMEText(html, "html"))

    try:
        with smtplib.SMTP(smtp_host, smtp_port, timeout=10) as server:
            server.starttls()
            server.login(smtp_email, smtp_password)
            server.sendmail(smtp_email, to_email, msg.as_string())
        logging.info(f"OTP email sent via SMTP to {to_email}")
        return True
    except Exception as e:
        logging.error(f"SMTP send failed: {e}")
        return False


async def send_otp_email(to_email: str, otp_code: str, name: str) -> bool:
    """Try Resend first (HTTP API, works everywhere), fall back to SMTP."""
    # Try Resend API first
    if os.environ.get("RESEND_API_KEY"):
        sent = await _send_via_resend(to_email, otp_code, name)
        if sent:
            return True

    # Fall back to SMTP (works locally, not on Render free tier)
    loop = asyncio.get_event_loop()
    sent = await loop.run_in_executor(_thread_pool, _send_via_smtp_sync, to_email, otp_code, name)
    if sent:
        return True

    logging.warning(f"No email provider configured or all failed for {to_email}")
    return False


# ---------- Welcome Email ----------
def _build_welcome_html(name: str) -> str:
    logo_url = os.environ.get("FRONTEND_URL", "https://wanderlustadventure.in") + "/wanderlust-logo.png"
    site_url = os.environ.get("FRONTEND_URL", "https://wanderlustadventure.in")
    return f"""
    <!DOCTYPE html>
    <html lang="en">
    <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
    <body style="margin: 0; padding: 0; background-color: #F7F3ED; font-family: 'Helvetica Neue', Arial, sans-serif;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #F7F3ED; padding: 40px 16px;">
        <tr><td align="center">
          <table width="520" cellpadding="0" cellspacing="0" style="max-width: 520px; width: 100%;">

            <!-- Header with Logo -->
            <tr><td style="text-align: center; padding-bottom: 32px;">
              <img src="{logo_url}" alt="Wanderlust Adventure" width="180" style="display: inline-block; max-width: 180px; height: auto;" />
            </td></tr>

            <!-- Hero Section -->
            <tr><td style="background: linear-gradient(135deg, #0A3D62 0%, #0E5A8A 100%); border-radius: 16px 16px 0 0; padding: 48px 36px 40px; text-align: center;">
              <div style="font-size: 42px; margin-bottom: 16px;">🌍✈️</div>
              <h1 style="color: #FFFFFF; font-size: 28px; font-weight: 700; margin: 0 0 12px; font-family: Georgia, serif;">
                Welcome to the Family, {name}!
              </h1>
              <p style="color: #B8D4E8; font-size: 15px; margin: 0; line-height: 1.6;">
                Your adventure begins now. We're thrilled to have you join<br/>thousands of explorers discovering incredible destinations.
              </p>
            </td></tr>

            <!-- Main Content -->
            <tr><td style="background: #FFFFFF; padding: 36px; border-left: 1px solid #E8E2D8; border-right: 1px solid #E8E2D8;">

              <!-- What's Next Section -->
              <h2 style="color: #0A3D62; font-size: 18px; font-weight: 600; margin: 0 0 20px; font-family: Georgia, serif;">
                🗺️ Here's what you can do now:
              </h2>

              <!-- Feature 1 -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 16px;">
                <tr>
                  <td width="48" valign="top">
                    <div style="width: 40px; height: 40px; background: #FFF8F0; border-radius: 10px; text-align: center; line-height: 40px; font-size: 18px;">🏔️</div>
                  </td>
                  <td style="padding-left: 12px; vertical-align: top;">
                    <div style="color: #0A3D62; font-weight: 600; font-size: 14px; margin-bottom: 2px;">Explore Curated Packages</div>
                    <div style="color: #6B7280; font-size: 13px; line-height: 1.5;">Discover hand-picked adventures across India — from the Himalayas to Kerala's backwaters.</div>
                  </td>
                </tr>
              </table>

              <!-- Feature 2 -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 16px;">
                <tr>
                  <td width="48" valign="top">
                    <div style="width: 40px; height: 40px; background: #FFF8F0; border-radius: 10px; text-align: center; line-height: 40px; font-size: 18px;">❤️</div>
                  </td>
                  <td style="padding-left: 12px; vertical-align: top;">
                    <div style="color: #0A3D62; font-weight: 600; font-size: 14px; margin-bottom: 2px;">Save to Wishlist</div>
                    <div style="color: #6B7280; font-size: 13px; line-height: 1.5;">Found something you love? Add it to your wishlist and come back anytime.</div>
                  </td>
                </tr>
              </table>

              <!-- Feature 3 -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 16px;">
                <tr>
                  <td width="48" valign="top">
                    <div style="width: 40px; height: 40px; background: #FFF8F0; border-radius: 10px; text-align: center; line-height: 40px; font-size: 18px;">📋</div>
                  </td>
                  <td style="padding-left: 12px; vertical-align: top;">
                    <div style="color: #0A3D62; font-weight: 600; font-size: 14px; margin-bottom: 2px;">Plan Your Itinerary</div>
                    <div style="color: #6B7280; font-size: 13px; line-height: 1.5;">Use our smart itinerary planner to organize your dream trip day by day.</div>
                  </td>
                </tr>
              </table>

              <!-- Feature 4 -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 24px;">
                <tr>
                  <td width="48" valign="top">
                    <div style="width: 40px; height: 40px; background: #FFF8F0; border-radius: 10px; text-align: center; line-height: 40px; font-size: 18px;">👤</div>
                  </td>
                  <td style="padding-left: 12px; vertical-align: top;">
                    <div style="color: #0A3D62; font-weight: 600; font-size: 14px; margin-bottom: 2px;">Complete Your Profile</div>
                    <div style="color: #6B7280; font-size: 13px; line-height: 1.5;">Add your details for a personalized experience and faster bookings.</div>
                  </td>
                </tr>
              </table>

              <!-- CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr><td align="center" style="padding: 8px 0 16px;">
                  <a href="{site_url}/destinations" style="display: inline-block; background: linear-gradient(135deg, #D4A05A 0%, #C4903A 100%); color: #FFFFFF; text-decoration: none; padding: 14px 40px; border-radius: 8px; font-weight: 600; font-size: 14px; letter-spacing: 0.5px;">
                    Start Exploring →
                  </a>
                </td></tr>
              </table>

            </td></tr>

            <!-- Divider -->
            <tr><td style="background: #FFFFFF; padding: 0 36px; border-left: 1px solid #E8E2D8; border-right: 1px solid #E8E2D8;">
              <div style="border-top: 1px solid #E8E2D8;"></div>
            </td></tr>

            <!-- Quick Contact -->
            <tr><td style="background: #FFFFFF; padding: 24px 36px 32px; border-left: 1px solid #E8E2D8; border-right: 1px solid #E8E2D8;">
              <p style="color: #6B7280; font-size: 13px; margin: 0 0 12px; text-align: center;">
                Need help planning your trip? We're just a message away!
              </p>
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <a href="https://wa.me/918160317044" style="display: inline-block; background: #25D366; color: #FFFFFF; text-decoration: none; padding: 10px 24px; border-radius: 6px; font-size: 13px; font-weight: 500; margin: 0 4px;">
                      💬 WhatsApp Us
                    </a>
                    <a href="mailto:info@wanderlustadventure.in" style="display: inline-block; background: #F3F0EB; color: #0A3D62; text-decoration: none; padding: 10px 24px; border-radius: 6px; font-size: 13px; font-weight: 500; margin: 0 4px;">
                      ✉️ Email Us
                    </a>
                  </td>
                </tr>
              </table>
            </td></tr>

            <!-- Social Links -->
            <tr><td style="background: #0A3D62; padding: 28px 36px; text-align: center;">
              <p style="color: #B8D4E8; font-size: 12px; text-transform: uppercase; letter-spacing: 2px; margin: 0 0 16px;">Follow Our Adventures</p>
              <table cellpadding="0" cellspacing="0" align="center">
                <tr>
                  <td style="padding: 0 8px;">
                    <a href="https://www.instagram.com/wanderlustadventure.in/" style="color: #F5A623; text-decoration: none; font-size: 13px;">Instagram</a>
                  </td>
                  <td style="color: #2D6B96;">|</td>
                  <td style="padding: 0 8px;">
                    <a href="https://www.facebook.com/wanderlustadventures.in" style="color: #F5A623; text-decoration: none; font-size: 13px;">Facebook</a>
                  </td>
                  <td style="color: #2D6B96;">|</td>
                  <td style="padding: 0 8px;">
                    <a href="https://www.linkedin.com/company/wanderlustadventure" style="color: #F5A623; text-decoration: none; font-size: 13px;">LinkedIn</a>
                  </td>
                  <td style="color: #2D6B96;">|</td>
                  <td style="padding: 0 8px;">
                    <a href="https://www.threads.com/@wanderlustadventure.in" style="color: #F5A623; text-decoration: none; font-size: 13px;">Threads</a>
                  </td>
                </tr>
              </table>
            </td></tr>

            <!-- Footer -->
            <tr><td style="background: #07304F; border-radius: 0 0 16px 16px; padding: 24px 36px; text-align: center;">
              <p style="color: #7BA3BF; font-size: 12px; margin: 0 0 4px; line-height: 1.6;">
                📍 Everest Park, Kalawad Road, Rajkot 360005, Gujarat, India
              </p>
              <p style="color: #7BA3BF; font-size: 12px; margin: 0 0 4px;">
                📞 <a href="tel:+918160317044" style="color: #7BA3BF; text-decoration: none;">+91 81603 17044</a> &nbsp;·&nbsp;
                ✉️ <a href="mailto:info@wanderlustadventure.in" style="color: #7BA3BF; text-decoration: none;">info@wanderlustadventure.in</a>
              </p>
              <p style="color: #4A7A99; font-size: 11px; margin: 16px 0 0;">
                © 2025 Wanderlust Adventure. All rights reserved.
              </p>
              <p style="color: #4A7A99; font-size: 11px; margin: 4px 0 0;">
                <a href="{site_url}" style="color: #4A7A99; text-decoration: none;">wanderlustadventure.in</a>
              </p>
            </td></tr>

          </table>
        </td></tr>
      </table>
    </body>
    </html>
    """


async def send_welcome_email(to_email: str, name: str) -> bool:
    """Send a branded welcome email after successful registration."""
    api_key = os.environ.get("RESEND_API_KEY", "")
    from_email = os.environ.get("RESEND_FROM", "Wanderlust Adventure <noreply@wanderlustadventure.in>")

    if not api_key:
        logging.warning("RESEND_API_KEY not set — welcome email skipped")
        return False

    import httpx
    html = _build_welcome_html(name)
    try:
        async with httpx.AsyncClient(timeout=15) as client:
            resp = await client.post(
                "https://api.resend.com/emails",
                headers={"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"},
                json={
                    "from": from_email,
                    "to": [to_email],
                    "subject": f"Welcome to Wanderlust Adventure, {name}! 🌍",
                    "html": html,
                },
            )
            if resp.status_code in (200, 201):
                logging.info(f"Welcome email sent to {to_email}")
                return True
            else:
                logging.error(f"Welcome email Resend error {resp.status_code}: {resp.text}")
                return False
    except Exception as e:
        logging.error(f"Welcome email failed: {e}")
        return False


# ---------- Auth Endpoints ----------
@api.post("/auth/send-otp")
async def send_otp(data: OTPSendInput):
    email = data.email.lower().strip()

    # Check if email already registered
    existing = await db.users.find_one({"email": email})
    if existing:
        raise HTTPException(status_code=409, detail="Email already registered")

    # Rate limit: max OTP_RATE_LIMIT requests per email per window
    now = datetime.now(timezone.utc)
    window_start = now - timedelta(minutes=OTP_RATE_WINDOW_MIN)
    recent_count = await db.otp_rate_limits.count_documents(
        {"email": email, "created_at": {"$gte": window_start}}
    )
    if recent_count >= OTP_RATE_LIMIT:
        raise HTTPException(status_code=429, detail="Too many OTP requests. Please try again later.")

    # Generate OTP
    otp_code = generate_otp()

    # Upsert pending OTP (one per email)
    await db.pending_otps.update_one(
        {"email": email},
        {
            "$set": {
                "email": email,
                "name": data.name.strip(),
                "password_hash": await hash_password_async(data.password),
                "otp": otp_code,
                "attempts": 0,
                "created_at": now,
            }
        },
        upsert=True,
    )

    # Track rate limit
    await db.otp_rate_limits.insert_one({"email": email, "created_at": now})

    # Send email
    sent = await send_otp_email(email, otp_code, data.name.strip())
    if not sent:
        # If SMTP not configured, still return success (for dev/testing)
        logging.warning(f"OTP for {email}: {otp_code} (email not sent — SMTP not configured)")

    return {"ok": True, "message": "Verification code sent to your email"}


@api.post("/auth/verify-otp")
async def verify_otp(data: OTPVerifyInput, response: Response):
    email = data.email.lower().strip()
    now = datetime.now(timezone.utc)

    pending = await db.pending_otps.find_one({"email": email})
    if not pending:
        raise HTTPException(status_code=400, detail="No pending verification found. Please request a new code.")

    # Check expiry (10 min)
    created = pending["created_at"]
    if isinstance(created, datetime) and created.tzinfo is None:
        created = created.replace(tzinfo=timezone.utc)
    if (now - created).total_seconds() > OTP_EXPIRY_MIN * 60:
        await db.pending_otps.delete_one({"email": email})
        raise HTTPException(status_code=400, detail="Verification code expired. Please request a new one.")

    # Check max attempts
    if pending.get("attempts", 0) >= OTP_MAX_ATTEMPTS:
        await db.pending_otps.delete_one({"email": email})
        raise HTTPException(status_code=400, detail="Too many wrong attempts. Please request a new code.")

    # Verify OTP
    if pending["otp"] != data.otp.strip():
        await db.pending_otps.update_one(
            {"email": email},
            {"$inc": {"attempts": 1}}
        )
        remaining = OTP_MAX_ATTEMPTS - pending.get("attempts", 0) - 1
        raise HTTPException(
            status_code=400,
            detail=f"Incorrect code. {remaining} attempt{'s' if remaining != 1 else ''} remaining."
        )

    # OTP correct — create the user
    existing = await db.users.find_one({"email": email})
    if existing:
        await db.pending_otps.delete_one({"email": email})
        raise HTTPException(status_code=409, detail="Email already registered")

    doc = {
        "email": email,
        "password_hash": pending["password_hash"],
        "name": pending["name"],
        "role": "user",
        "email_verified": True,
        "created_at": now,
    }
    res = await db.users.insert_one(doc)
    uid = str(res.inserted_id)

    # Clean up
    await db.pending_otps.delete_one({"email": email})

    # Send welcome email asynchronously to not block the response
    asyncio.create_task(send_welcome_email(email, pending["name"]))
    # Trigger Resend Automation Event
    asyncio.create_task(send_resend_event("user.created", email, {"name": pending["name"]}))

    # Issue tokens
    access = create_access_token(uid, email)
    refresh = create_refresh_token(uid)
    set_auth_cookies(response, access, refresh)
    user_data = user_to_public({**doc, "_id": res.inserted_id})
    return {**user_data, "access_token": access, "refresh_token": refresh}


@api.post("/auth/register")
async def register(data: RegisterInput, response: Response):
    email = data.email.lower().strip()
    existing = await db.users.find_one({"email": email})
    if existing:
        raise HTTPException(status_code=409, detail="Email already registered")
    doc = {
        "email": email,
        "password_hash": hash_password(data.password),
        "name": data.name.strip(),
        "role": "user",
        "created_at": datetime.now(timezone.utc),
    }
    res = await db.users.insert_one(doc)
    uid = str(res.inserted_id)
    access = create_access_token(uid, email)
    refresh = create_refresh_token(uid)
    set_auth_cookies(response, access, refresh)
    user_data = user_to_public({**doc, "_id": res.inserted_id})
    return {**user_data, "access_token": access, "refresh_token": refresh}


@api.post("/auth/login")
async def login(data: LoginInput, request: Request, response: Response):
    email = data.email.lower().strip()
    # Lock by email only (key stable behind load balancers / ingress IP pools).
    identifier = f"email:{email}"

    # brute force check
    now = datetime.now(timezone.utc)
    attempts = await db.login_attempts.find_one({"identifier": identifier})
    if attempts and attempts.get("count", 0) >= BRUTE_LIMIT:
        locked_until = attempts.get("locked_until")
        # Coerce naive datetimes (Mongo default) to UTC-aware for safe comparison.
        if isinstance(locked_until, datetime):
            if locked_until.tzinfo is None:
                locked_until = locked_until.replace(tzinfo=timezone.utc)
            if locked_until > now:
                raise HTTPException(status_code=429, detail="Too many attempts. Try again later.")

    user = await db.users.find_one({"email": email})
    if not user or not verify_password(data.password, user["password_hash"]):
        await db.login_attempts.update_one(
            {"identifier": identifier},
            {
                "$inc": {"count": 1},
                "$set": {"locked_until": now + timedelta(minutes=BRUTE_WINDOW_MIN)},
            },
            upsert=True,
        )
        raise HTTPException(status_code=401, detail="Invalid email or password")

    await db.login_attempts.delete_one({"identifier": identifier})
    uid = str(user["_id"])
    access = create_access_token(uid, email)
    refresh = create_refresh_token(uid)
    set_auth_cookies(response, access, refresh)
    user_data = user_to_public(user)
    return {**user_data, "access_token": access, "refresh_token": refresh}


@api.post("/auth/logout")
async def logout(response: Response):
    # Logout always succeeds — clears cookies whether or not the access token is valid.
    clear_auth_cookies(response)
    return {"ok": True}


@api.get("/auth/me")
async def me(user: dict = Depends(get_current_user)):
    return user_to_public(user)


@api.put("/auth/profile")
async def update_profile(data: ProfileUpdate, user: dict = Depends(get_current_user)):
    updates: Dict[str, Any] = {
        k: v for k, v in data.model_dump(exclude_unset=True).items() if v is not None
    }
    if not updates:
        return user_to_public(user)
    await db.users.update_one({"_id": user["_id"]}, {"$set": updates})
    updated = await db.users.find_one({"_id": user["_id"]})
    return user_to_public(updated)


# ---------- Wishlist Endpoints ----------
@api.get("/wishlist")
async def list_wishlist(user: dict = Depends(get_current_user)):
    wishlist_ids = user.get("wishlist", [])
    if not wishlist_ids:
        return []
    cursor = db.destinations.find({"id": {"$in": wishlist_ids}}, {"_id": 0})
    items = await cursor.to_list(length=100)
    return items


@api.post("/wishlist/{destination_id}")
async def add_to_wishlist(destination_id: str, user: dict = Depends(get_current_user)):
    dest = await db.destinations.find_one({"id": destination_id})
    if not dest:
        raise HTTPException(status_code=404, detail="Destination not found")
    await db.users.update_one(
        {"_id": user["_id"]},
        {"$addToSet": {"wishlist": destination_id}}
    )
    return {"ok": True}


@api.delete("/wishlist/{destination_id}")
async def remove_from_wishlist(destination_id: str, user: dict = Depends(get_current_user)):
    await db.users.update_one(
        {"_id": user["_id"]},
        {"$pull": {"wishlist": destination_id}}
    )
    return {"ok": True}


@api.post("/auth/refresh")
async def refresh_token(request: Request, response: Response):
    # Accept refresh token from cookie OR request body
    token = request.cookies.get("refresh_token")
    if not token:
        try:
            body = await request.json()
            token = body.get("refresh_token")
        except Exception:
            pass
    if not token:
        raise HTTPException(status_code=401, detail="No refresh token")
    try:
        payload = jwt.decode(token, get_jwt_secret(), algorithms=[JWT_ALGORITHM])
        if payload.get("type") != "refresh":
            raise HTTPException(status_code=401, detail="Invalid token type")
        uid = payload["sub"]
        user = await db.users.find_one({"_id": ObjectId(uid)})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        access = create_access_token(uid, user["email"])
        response.set_cookie(
            key="access_token",
            value=access,
            httponly=True,
            secure=True,
            samesite="none",
            max_age=ACCESS_MIN * 60,
            path="/",
        )
        return {"ok": True, "access_token": access}
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Refresh token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid refresh token")


# ---------- Itinerary Endpoints ----------
def _serialize_itinerary(doc: dict) -> dict:
    doc = {**doc}
    doc.pop("_id", None)
    ca = doc.get("created_at")
    ua = doc.get("updated_at")
    if isinstance(ca, datetime):
        doc["created_at"] = ca.isoformat()
    if isinstance(ua, datetime):
        doc["updated_at"] = ua.isoformat()
    return doc


@api.get("/itineraries")
async def list_itineraries(user: dict = Depends(get_current_user)):
    uid = str(user["_id"])
    cursor = db.itineraries.find({"user_id": uid}, {"_id": 0}).sort("created_at", -1)
    items = await cursor.to_list(length=500)
    for it in items:
        if isinstance(it.get("created_at"), datetime):
            it["created_at"] = it["created_at"].isoformat()
        if isinstance(it.get("updated_at"), datetime):
            it["updated_at"] = it["updated_at"].isoformat()
    return items


@api.post("/itineraries")
async def create_itinerary(data: ItineraryCreate, user: dict = Depends(get_current_user)):
    now = datetime.now(timezone.utc)
    uid = str(user["_id"])
    doc = {
        "id": str(uuid.uuid4()),
        "user_id": uid,
        **data.model_dump(),
        "events": [],
        "expenses": [],
        "packing": [],
        "created_at": now.isoformat(),
        "updated_at": now.isoformat(),
    }
    await db.itineraries.insert_one(doc)
    return _serialize_itinerary(doc)


@api.get("/itineraries/{itinerary_id}")
async def get_itinerary(itinerary_id: str, user: dict = Depends(get_current_user)):
    uid = str(user["_id"])
    doc = await db.itineraries.find_one({"id": itinerary_id, "user_id": uid}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Itinerary not found")
    if isinstance(doc.get("created_at"), datetime):
        doc["created_at"] = doc["created_at"].isoformat()
    if isinstance(doc.get("updated_at"), datetime):
        doc["updated_at"] = doc["updated_at"].isoformat()
    return doc


@api.put("/itineraries/{itinerary_id}")
async def update_itinerary(
    itinerary_id: str, data: ItineraryUpdate, user: dict = Depends(get_current_user)
):
    uid = str(user["_id"])
    existing = await db.itineraries.find_one({"id": itinerary_id, "user_id": uid})
    if not existing:
        raise HTTPException(status_code=404, detail="Itinerary not found")
    updates: Dict[str, Any] = {
        k: v for k, v in data.model_dump(exclude_unset=True).items() if v is not None
    }
    updates["updated_at"] = datetime.now(timezone.utc).isoformat()
    await db.itineraries.update_one({"id": itinerary_id, "user_id": uid}, {"$set": updates})
    doc = await db.itineraries.find_one({"id": itinerary_id, "user_id": uid}, {"_id": 0})
    return doc


@api.delete("/itineraries/{itinerary_id}")
async def delete_itinerary(itinerary_id: str, user: dict = Depends(get_current_user)):
    uid = str(user["_id"])
    res = await db.itineraries.delete_one({"id": itinerary_id, "user_id": uid})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Itinerary not found")
    return {"ok": True}


# ---------- AI Trip Planner (Gemini) ----------

AI_SYSTEM_PROMPT = """You are Wanderlust AI, an expert travel planner. Generate a detailed, day-by-day travel itinerary.

IMPORTANT: Return ONLY valid JSON matching this exact schema (no markdown, no code fences, no explanation):
{
  "title": "string - catchy trip title",
  "description": "string - 2-3 sentence overview",
  "cover_emoji": "string - single relevant emoji",
  "destination": "string - main destination",
  "type": "travel",
  "start_date": "YYYY-MM-DD or null",
  "end_date": "YYYY-MM-DD or null",
  "budget_limit": number,
  "currency": "string - 3-letter code",
  "events": [
    {
      "day_index": 0,
      "time": "HH:MM",
      "title": "string - activity name",
      "location": "string - specific place name",
      "notes": "string - tips, details, duration",
      "category": "activity|food|transport|stay|meeting"
    }
  ],
  "expenses": [
    {
      "category": "accommodation|food|transport|activities|shopping|other",
      "description": "string",
      "amount": number,
      "currency": "string",
      "date": "YYYY-MM-DD or null"
    }
  ],
  "packing": [
    {
      "text": "string - item name",
      "category": "clothing|toiletries|electronics|documents|medicine|gear|general",
      "packed": false
    }
  ]
}

Guidelines:
- Create 3-6 events per day, with realistic timings
- Include breakfast, lunch, dinner suggestions
- Add transport between major activities
- Estimate realistic costs for the destination and travel style
- Suggest packing items relevant to the destination, weather, and activities
- day_index starts at 0 for Day 1
- Be specific with location names (actual restaurants, landmarks, hotels)
"""


class AIGenerateRequest(BaseModel):
    destination: str = Field(min_length=1, max_length=200)
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    travelers: int = Field(default=1, ge=1, le=20)
    travel_style: Literal["budget", "mid-range", "luxury"] = "mid-range"
    interests: List[str] = []
    budget_amount: Optional[float] = None
    currency: str = "INR"
    special_requests: str = ""


class AIDescribeRequest(BaseModel):
    prompt: str = Field(min_length=5, max_length=2000)


def _parse_ai_json(text: str) -> dict:
    """Extract JSON from Gemini response, stripping markdown fences if present."""
    cleaned = text.strip()
    # Strip markdown code fences
    if cleaned.startswith("```"):
        lines = cleaned.split("\n")
        # Remove first line (```json) and last line (```)
        lines = [l for l in lines if not l.strip().startswith("```")]
        cleaned = "\n".join(lines).strip()
    try:
        return json.loads(cleaned)
    except json.JSONDecodeError:
        # Try to find JSON object in the text
        start = cleaned.find("{")
        end = cleaned.rfind("}") + 1
        if start >= 0 and end > start:
            return json.loads(cleaned[start:end])
        raise ValueError("Could not parse AI response as JSON")


def _enrich_ids(data: dict) -> dict:
    """Add UUIDs to events, expenses, packing items if missing."""
    for evt in data.get("events", []):
        if "id" not in evt:
            evt["id"] = str(uuid.uuid4())
    for exp in data.get("expenses", []):
        if "id" not in exp:
            exp["id"] = str(uuid.uuid4())
    for pkg in data.get("packing", []):
        if "id" not in pkg:
            pkg["id"] = str(uuid.uuid4())
    return data


@api.post("/itineraries/ai-generate")
async def ai_generate_itinerary(
    data: AIGenerateRequest,
    user: dict = Depends(get_current_user),
):
    if not gemini_model:
        raise HTTPException(status_code=503, detail="AI service not configured")

    # Build the prompt
    duration = ""
    if data.start_date and data.end_date:
        try:
            d1 = datetime.strptime(data.start_date, "%Y-%m-%d")
            d2 = datetime.strptime(data.end_date, "%Y-%m-%d")
            days = (d2 - d1).days + 1
            duration = f" for {days} days ({data.start_date} to {data.end_date})"
        except ValueError:
            duration = ""

    interests_str = ", ".join(data.interests) if data.interests else "general sightseeing"
    budget_str = f"Budget: {data.budget_amount} {data.currency}" if data.budget_amount else f"Currency: {data.currency}"

    user_prompt = f"""Plan a trip to {data.destination}{duration}.
Travelers: {data.travelers}
Travel style: {data.travel_style}
Interests: {interests_str}
{budget_str}
{"Special requests: " + data.special_requests if data.special_requests else ""}

Generate a complete day-by-day itinerary with timeline events, estimated expenses, and packing list.
Return ONLY the JSON object, no other text."""

    try:
        loop = asyncio.get_event_loop()
        response = await loop.run_in_executor(
            _thread_pool,
            lambda: gemini_model.generate_content(
                [AI_SYSTEM_PROMPT, user_prompt],
                generation_config=genai.GenerationConfig(
                    temperature=0.8,
                    max_output_tokens=8192,
                ),
            ),
        )
        result = _parse_ai_json(response.text)
        result = _enrich_ids(result)
        # Ensure required fields
        result.setdefault("type", "travel")
        result.setdefault("currency", data.currency)
        result.setdefault("destination", data.destination)
        if data.start_date:
            result.setdefault("start_date", data.start_date)
        if data.end_date:
            result.setdefault("end_date", data.end_date)
        return result
    except Exception as e:
        logging.exception("AI generate failed")
        raise HTTPException(status_code=500, detail=f"AI generation failed: {str(e)}")


@api.post("/itineraries/ai-import-file")
async def ai_import_file(
    file: UploadFile = File(...),
    user: dict = Depends(get_current_user),
):
    if not gemini_model:
        raise HTTPException(status_code=503, detail="AI service not configured")

    # Validate file type
    allowed_types = {
        "application/pdf": "pdf",
        "image/jpeg": "jpeg",
        "image/jpg": "jpg",
        "image/png": "png",
        "text/plain": "txt",
        "text/csv": "csv",
    }
    content_type = file.content_type or ""
    if content_type not in allowed_types:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type: {content_type}. Allowed: PDF, JPG, PNG, TXT, CSV",
        )

    # Read file content
    file_bytes = await file.read()
    if len(file_bytes) > 10 * 1024 * 1024:  # 10MB limit
        raise HTTPException(status_code=400, detail="File too large (max 10MB)")

    import_prompt = """Analyze this file and extract all travel/trip-related information.
Create a structured itinerary from any bookings, reservations, tickets, or travel plans found.
If it's a flight booking, hotel reservation, or tour confirmation, extract dates, destinations, and details.
Return ONLY the JSON object matching the schema, no other text."""

    try:
        loop = asyncio.get_event_loop()

        if content_type.startswith("text/"):
            # Text files: send as text
            text_content = file_bytes.decode("utf-8", errors="replace")
            response = await loop.run_in_executor(
                _thread_pool,
                lambda: gemini_model.generate_content(
                    [AI_SYSTEM_PROMPT, import_prompt, f"File content:\n{text_content}"],
                    generation_config=genai.GenerationConfig(
                        temperature=0.5,
                        max_output_tokens=8192,
                    ),
                ),
            )
        else:
            # Binary files (PDF, images): use Gemini multimodal
            import base64
            b64_data = base64.b64encode(file_bytes).decode("utf-8")
            file_part = {
                "inline_data": {
                    "mime_type": content_type,
                    "data": b64_data,
                }
            }
            response = await loop.run_in_executor(
                _thread_pool,
                lambda: gemini_model.generate_content(
                    [AI_SYSTEM_PROMPT, import_prompt, file_part],
                    generation_config=genai.GenerationConfig(
                        temperature=0.5,
                        max_output_tokens=8192,
                    ),
                ),
            )

        result = _parse_ai_json(response.text)
        result = _enrich_ids(result)
        result.setdefault("type", "travel")
        result.setdefault("currency", "INR")
        return result
    except Exception as e:
        logging.exception("AI file import failed")
        raise HTTPException(status_code=500, detail=f"AI import failed: {str(e)}")


@api.post("/itineraries/ai-describe")
async def ai_describe_itinerary(
    data: AIDescribeRequest,
    user: dict = Depends(get_current_user),
):
    """Generate itinerary from a free-form text description."""
    if not gemini_model:
        raise HTTPException(status_code=503, detail="AI service not configured")

    user_prompt = f"""The user described their trip as follows:
"{data.prompt}"

Generate a complete day-by-day itinerary with timeline events, estimated expenses, and packing list based on this description.
Infer destination, dates, travel style, and interests from the description.
Return ONLY the JSON object, no other text."""

    try:
        loop = asyncio.get_event_loop()
        response = await loop.run_in_executor(
            _thread_pool,
            lambda: gemini_model.generate_content(
                [AI_SYSTEM_PROMPT, user_prompt],
                generation_config=genai.GenerationConfig(
                    temperature=0.8,
                    max_output_tokens=8192,
                ),
            ),
        )
        result = _parse_ai_json(response.text)
        result = _enrich_ids(result)
        result.setdefault("type", "travel")
        result.setdefault("currency", "INR")
        return result
    except Exception as e:
        logging.exception("AI describe failed")
        raise HTTPException(status_code=500, detail=f"AI generation failed: {str(e)}")


# ---------- Destinations (admin-managed, public read) ----------
class CustomDestinationInput(BaseModel):
    name: str = Field(min_length=1, max_length=80)
    region: Literal["international", "domestic"] = "international"
    tag: str = Field(default="", max_length=80)
    theme: Literal["honeymoon", "family", "friends", "solo", "adventure", "luxury"] = "family"
    budget: Literal["budget", "mid", "luxury"] = "mid"
    image_url: str = Field(default="", max_length=500)
    notes: str = Field(default="", max_length=1000)
    description: str = Field(default="", max_length=5000)
    highlights: str = Field(default="", max_length=2000)
    best_time: str = Field(default="", max_length=200)
    duration: str = Field(default="", max_length=100)
    price_from: str = Field(default="", max_length=50)


class DestinationUpdate(BaseModel):
    name: Optional[str] = None
    region: Optional[Literal["international", "domestic"]] = None
    tag: Optional[str] = None
    theme: Optional[Literal["honeymoon", "family", "friends", "solo", "adventure", "luxury"]] = None
    budget: Optional[Literal["budget", "mid", "luxury"]] = None
    image_url: Optional[str] = None
    notes: Optional[str] = None
    description: Optional[str] = None
    highlights: Optional[str] = None
    best_time: Optional[str] = None
    duration: Optional[str] = None
    price_from: Optional[str] = None


@api.get("/destinations")
async def list_destinations():
    # Public — any visitor can see admin-curated destinations.
    cursor = db.destinations.find({}, {"_id": 0}).sort("created_at", -1)
    items = await cursor.to_list(length=500)
    return items


@api.get("/destinations/{slug}")
async def get_destination(slug: str):
    doc = await db.destinations.find_one({"slug": slug}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Destination not found")
    return doc


@api.post("/destinations")
async def create_destination(data: CustomDestinationInput, admin: dict = Depends(require_admin)):
    slug = make_slug(data.name)
    # ensure unique slug
    existing = await db.destinations.find_one({"slug": slug})
    if existing:
        slug = f"{slug}-{str(uuid.uuid4())[:6]}"
    doc = {
        "id": str(uuid.uuid4()),
        "slug": slug,
        "created_by": str(admin["_id"]),
        **data.model_dump(),
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.destinations.insert_one(doc)
    doc.pop("_id", None)
    return doc


@api.put("/destinations/{destination_id}")
async def update_destination(destination_id: str, data: DestinationUpdate, admin: dict = Depends(require_admin)):
    existing = await db.destinations.find_one({"id": destination_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Destination not found")
    updates: Dict[str, Any] = {
        k: v for k, v in data.model_dump(exclude_unset=True).items() if v is not None
    }
    # update slug if name changed
    if "name" in updates:
        updates["slug"] = make_slug(updates["name"])
    await db.destinations.update_one({"id": destination_id}, {"$set": updates})
    doc = await db.destinations.find_one({"id": destination_id}, {"_id": 0})
    return doc


@api.delete("/destinations/{destination_id}")
async def delete_destination(destination_id: str, admin: dict = Depends(require_admin)):
    res = await db.destinations.delete_one({"id": destination_id})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Destination not found")
    return {"ok": True}


# ---------- Blog integration ----------

class BlogInput(BaseModel):
    title: str
    slug: str
    content: str
    excerpt: Optional[str] = None
    cover_image_url: Optional[str] = None
    tags: List[str] = []
    published: bool = False

@api.get("/blogs")
async def list_published_blogs():
    cursor = db.blogs.find({"published": True}, {"_id": 0}).sort("created_at", -1)
    return await cursor.to_list(length=100)

@api.get("/blogs/{slug}")
async def get_blog(slug: str):
    blog = await db.blogs.find_one({"slug": slug, "published": True}, {"_id": 0})
    if not blog:
        raise HTTPException(status_code=404, detail="Blog not found")
    return blog

@api.get("/admin/blogs")
async def admin_list_blogs(admin: dict = Depends(require_admin)):
    cursor = db.blogs.find({}, {"_id": 0}).sort("created_at", -1)
    return await cursor.to_list(length=100)

@api.post("/admin/blogs")
async def create_blog(data: BlogInput, admin: dict = Depends(require_admin)):
    doc = {
        "id": str(uuid.uuid4()),
        **data.model_dump(),
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.blogs.insert_one(doc)
    doc.pop("_id", None)
    return doc

@api.put("/admin/blogs/{blog_id}")
async def update_blog(blog_id: str, data: BlogInput, admin: dict = Depends(require_admin)):
    updates = data.model_dump()
    updates["updated_at"] = datetime.now(timezone.utc).isoformat()
    res = await db.blogs.update_one({"id": blog_id}, {"$set": updates})
    if res.matched_count == 0:
        raise HTTPException(status_code=404, detail="Blog not found")
    return await db.blogs.find_one({"id": blog_id}, {"_id": 0})

@api.delete("/admin/blogs/{blog_id}")
async def delete_blog(blog_id: str, admin: dict = Depends(require_admin)):
    res = await db.blogs.delete_one({"id": blog_id})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Blog not found")
    return {"ok": True}

@api.post("/admin/upload")
async def upload_file(request: Request, file: UploadFile = File(...), admin: dict = Depends(require_admin)):
    from firebase_admin import storage
    
    ext = file.filename.split(".")[-1] if "." in file.filename else "jpg"
    filename = f"uploads/{uuid.uuid4().hex}.{ext}"
    contents = await file.read()
    
    def _upload():
        bucket = storage.bucket("wanderlust-adventure-81e8b.firebasestorage.app")
        blob = bucket.blob(filename)
        blob.upload_from_string(contents, content_type=file.content_type)
        blob.make_public()
        return blob.public_url

    loop = asyncio.get_event_loop()
    url = await loop.run_in_executor(_thread_pool, _upload)
    
    return {"url": url}


# ---------- Social Feed integration ----------

class FeedPostInput(BaseModel):
    platform: Literal["instagram", "twitter", "custom"]
    content: str
    image_url: Optional[str] = None
    link_url: Optional[str] = None

@api.get("/feed")
async def list_feed():
    # Public — any visitor can see feed posts.
    cursor = db.feed.find({}, {"_id": 0}).sort("created_at", -1)
    items = await cursor.to_list(length=100)
    return items

@api.post("/admin/feed")
async def create_feed_post(data: FeedPostInput, admin: dict = Depends(require_admin)):
    doc = {
        "id": str(uuid.uuid4()),
        "created_by": str(admin["_id"]),
        **data.model_dump(),
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.feed.insert_one(doc)
    doc.pop("_id", None)
    return doc

@api.delete("/admin/feed/{post_id}")
async def delete_feed_post(post_id: str, admin: dict = Depends(require_admin)):
    res = await db.feed.delete_one({"id": post_id})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Post not found")
    return {"ok": True}


@api.get("/feed/instagram")
async def get_instagram_feed():
    token = os.environ.get("INSTAGRAM_ACCESS_TOKEN")
    if not token:
        return []
    
    # Check cache in DB (refresh every 1 hour)
    cache = await db.cache.find_one({"id": "instagram_feed"})
    now = datetime.now(timezone.utc)
    
    if cache and cache.get("updated_at"):
        updated_at = datetime.fromisoformat(cache["updated_at"])
        if (now - updated_at).total_seconds() < 3600:
            return cache.get("data", [])
            
    # Fetch fresh data
    async with httpx.AsyncClient(timeout=15) as client:
        try:
            resp = await client.get(
                "https://graph.instagram.com/me/media",
                params={
                    "fields": "id,caption,media_type,media_url,thumbnail_url,permalink,timestamp",
                    "access_token": token,
                    "limit": 12
                }
            )
            if resp.status_code == 200:
                data = resp.json().get("data", [])
                await db.cache.update_one(
                    {"id": "instagram_feed"},
                    {"$set": {"data": data, "updated_at": now.isoformat()}},
                    upsert=True
                )
                return data
            else:
                logging.error(f"Instagram API Error: {resp.status_code} - {resp.text}")
                return cache.get("data", []) if cache else []
        except Exception as e:
            logging.error(f"Instagram Fetch Error: {e}")
            return cache.get("data", []) if cache else []


# ---------- Google Maps integration ----------
import httpx

GOOGLE_MAPS_KEY = os.environ.get("GOOGLE_MAPS_KEY", "AIzaSyDzESV2Qc0Ik_pJMvgvrXCGaLL-UNOZFyw")


@api.get("/maps/key")
async def get_maps_key(user: dict = Depends(get_current_user)):
    """Return Maps API key to authenticated users only."""
    return {"key": GOOGLE_MAPS_KEY}


@api.get("/maps/geocode")
async def geocode_address(address: str, user: dict = Depends(get_current_user)):
    """Geocode an address string → lat/lng using Google Geocoding API."""
    async with httpx.AsyncClient() as client:
        resp = await client.get(
            "https://maps.googleapis.com/maps/api/geocode/json",
            params={"address": address, "key": GOOGLE_MAPS_KEY},
        )
        data = resp.json()
    if data.get("status") != "OK" or not data.get("results"):
        raise HTTPException(status_code=404, detail="Could not geocode address")
    result = data["results"][0]
    loc = result["geometry"]["location"]
    return {
        "lat": loc["lat"],
        "lng": loc["lng"],
        "formatted_address": result.get("formatted_address", address),
        "place_id": result.get("place_id", ""),
    }


@api.get("/maps/places")
async def search_places(query: str, user: dict = Depends(get_current_user)):
    """Search for places using Google Places Text Search."""
    async with httpx.AsyncClient() as client:
        resp = await client.get(
            "https://maps.googleapis.com/maps/api/place/textsearch/json",
            params={"query": query, "key": GOOGLE_MAPS_KEY},
        )
        data = resp.json()
    if data.get("status") not in ("OK", "ZERO_RESULTS"):
        raise HTTPException(status_code=502, detail=data.get("error_message", "Places API error"))
    results = []
    for r in (data.get("results") or [])[:8]:
        loc = r.get("geometry", {}).get("location", {})
        results.append({
            "name": r.get("name", ""),
            "address": r.get("formatted_address", ""),
            "lat": loc.get("lat"),
            "lng": loc.get("lng"),
            "place_id": r.get("place_id", ""),
            "rating": r.get("rating"),
            "types": r.get("types", [])[:3],
        })
    return results


class InquiryInput(BaseModel):
    name: str = Field(min_length=1, max_length=80)
    email: EmailStr
    phone: str = Field(default="", max_length=40)
    destination: str = Field(default="", max_length=120)
    travel_dates: str = Field(default="", max_length=120)
    budget: str = Field(default="", max_length=60)
    message: str = Field(default="", max_length=2000)


@api.post("/inquiries")
async def create_inquiry(payload: InquiryInput):
    # Contact form: public endpoint. Stores lead for follow-up.
    doc = payload.model_dump()
    # drop empties for cleaner leads
    doc = {k: v for k, v in doc.items() if v}
    doc["id"] = str(uuid.uuid4())
    doc["created_at"] = datetime.now(timezone.utc).isoformat()
    doc["status"] = "new"
    await db.inquiries.insert_one(doc)
    return {"ok": True, "id": doc["id"]}


# ---------- Admin Endpoints ----------
@api.get("/admin/stats")
async def admin_stats(admin: dict = Depends(require_admin)):
    total_users = await db.users.count_documents({})
    total_itineraries = await db.itineraries.count_documents({})
    total_inquiries = await db.inquiries.count_documents({})
    new_inquiries = await db.inquiries.count_documents({"status": "new"})
    total_destinations = await db.destinations.count_documents({})
    return {
        "total_users": total_users,
        "total_itineraries": total_itineraries,
        "total_inquiries": total_inquiries,
        "new_inquiries": new_inquiries,
        "total_destinations": total_destinations,
    }


@api.get("/admin/users")
async def admin_list_users(admin: dict = Depends(require_admin)):
    cursor = db.users.find({}).sort("created_at", -1)
    users = await cursor.to_list(length=500)
    result = []
    for u in users:
        pub = user_to_public(u)
        pub["disabled"] = u.get("disabled", False)
        # Count itineraries for each user
        uid = str(u["_id"])
        itin_count = await db.itineraries.count_documents({"user_id": uid})
        pub["itinerary_count"] = itin_count
        result.append(pub)
    return result


@api.get("/admin/users/{user_id}")
async def admin_get_user(user_id: str, admin: dict = Depends(require_admin)):
    user = await db.users.find_one({"_id": ObjectId(user_id)})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    pub = user_to_public(user)
    pub["disabled"] = user.get("disabled", False)
    # Fetch user's itineraries
    cursor = db.itineraries.find({"user_id": user_id}, {"_id": 0}).sort("created_at", -1)
    itineraries = await cursor.to_list(length=100)
    for it in itineraries:
        if isinstance(it.get("created_at"), datetime):
            it["created_at"] = it["created_at"].isoformat()
        if isinstance(it.get("updated_at"), datetime):
            it["updated_at"] = it["updated_at"].isoformat()
    pub["itineraries"] = itineraries
    return pub


@api.put("/admin/users/{user_id}")
async def admin_update_user(user_id: str, data: AdminUserUpdate, admin: dict = Depends(require_admin)):
    user = await db.users.find_one({"_id": ObjectId(user_id)})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    # Prevent self-demotion
    if str(admin["_id"]) == user_id and data.role and data.role != "admin":
        raise HTTPException(status_code=400, detail="Cannot remove your own admin role")
    updates: Dict[str, Any] = {
        k: v for k, v in data.model_dump(exclude_unset=True).items() if v is not None
    }
    if not updates:
        return user_to_public(user)
    await db.users.update_one({"_id": ObjectId(user_id)}, {"$set": updates})
    updated = await db.users.find_one({"_id": ObjectId(user_id)})
    pub = user_to_public(updated)
    pub["disabled"] = updated.get("disabled", False)
    return pub


@api.delete("/admin/users/{user_id}")
async def admin_delete_user(user_id: str, admin: dict = Depends(require_admin)):
    if str(admin["_id"]) == user_id:
        raise HTTPException(status_code=400, detail="Cannot delete your own account")
    user = await db.users.find_one({"_id": ObjectId(user_id)})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    # Cascade: delete user's itineraries
    await db.itineraries.delete_many({"user_id": user_id})
    await db.users.delete_one({"_id": ObjectId(user_id)})
    return {"ok": True}


@api.get("/admin/inquiries")
async def admin_list_inquiries(admin: dict = Depends(require_admin)):
    cursor = db.inquiries.find({}, {"_id": 0}).sort("created_at", -1)
    items = await cursor.to_list(length=500)
    return items


@api.put("/admin/inquiries/{inquiry_id}")
async def admin_update_inquiry(inquiry_id: str, data: InquiryStatusUpdate, admin: dict = Depends(require_admin)):
    result = await db.inquiries.update_one(
        {"id": inquiry_id},
        {"$set": {"status": data.status}}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Inquiry not found")
    doc = await db.inquiries.find_one({"id": inquiry_id}, {"_id": 0})
    return doc


# ---------- Startup ----------
@app.on_event("startup")
async def on_startup():
    await db.users.create_index("email", unique=True)
    await db.login_attempts.create_index("identifier")
    await db.itineraries.create_index([("user_id", 1), ("created_at", -1)])
    await db.itineraries.create_index("id", unique=True)
    await db.destinations.create_index("id", unique=True)
    await db.destinations.create_index("slug", unique=True)
    await db.destinations.create_index([("created_at", -1)])
    await db.inquiries.create_index("id", unique=True)
    await db.inquiries.create_index([("created_at", -1)])
    # OTP indexes
    await db.pending_otps.create_index("email", unique=True)
    await db.pending_otps.create_index("created_at", expireAfterSeconds=OTP_EXPIRY_MIN * 60)
    await db.otp_rate_limits.create_index("created_at", expireAfterSeconds=OTP_RATE_WINDOW_MIN * 60)

    admin_email = os.environ.get("ADMIN_EMAIL", "info@wanderlustadventure.in").lower()
    admin_password = os.environ.get("ADMIN_PASSWORD", "admin123")
    existing = await db.users.find_one({"email": admin_email})
    if existing is None:
        await db.users.insert_one(
            {
                "email": admin_email,
                "password_hash": hash_password(admin_password),
                "name": "Wanderlust Admin",
                "role": "admin",
                "created_at": datetime.now(timezone.utc),
            }
        )
    else:
        updates = {"role": "admin"}
        if not verify_password(admin_password, existing["password_hash"]):
            updates["password_hash"] = hash_password(admin_password)
        await db.users.update_one({"email": admin_email}, {"$set": updates})


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()


# ---------- Health ----------
@api.get("/")
async def root():
    return {"ok": True, "service": "itinera-api"}


# mount router
app.include_router(api)


# ---------- OG Meta Tags for Social Sharing ----------
from fastapi.responses import HTMLResponse
from html import escape as html_escape

KNOWN_BOTS = [
    "facebookexternalhit", "Facebot", "Twitterbot", "WhatsApp",
    "LinkedInBot", "Slackbot", "TelegramBot", "Pinterest",
    "Discordbot", "Googlebot", "bingbot",
]

def _is_crawler(user_agent: str) -> bool:
    ua = user_agent.lower()
    return any(bot.lower() in ua for bot in KNOWN_BOTS)


@app.get("/blog/{slug}", response_class=HTMLResponse)
async def og_blog_page(slug: str, request: Request):
    """
    Serves an HTML page with proper OG meta tags for social sharing.
    - Crawlers (WhatsApp, FB, Twitter, etc.) get the OG-enriched HTML.
    - Real browsers get a JavaScript redirect to the SPA frontend.
    """
    frontend_url = os.environ.get("FRONTEND_URL", "https://wanderlustadventure.in")
    canonical_url = f"{frontend_url}/blog/{slug}"

    # Fetch the blog from MongoDB
    blog = await db.blogs.find_one({"slug": slug, "published": True}, {"_id": 0})

    if not blog:
        # Blog not found — redirect to frontend (which will show 404)
        return HTMLResponse(
            content=f'<html><head><meta http-equiv="refresh" content="0;url={canonical_url}"></head></html>',
            status_code=200
        )

    title = html_escape(blog.get("title", "Wanderlust Adventure Blog"))
    excerpt = html_escape(blog.get("excerpt", blog.get("title", "")))
    cover = blog.get("cover_image_url", f"{frontend_url}/og-image.png")
    site_name = "Wanderlust Adventure"

    html = f"""<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8"/>
    <title>{title} | {site_name}</title>
    <meta name="description" content="{excerpt}"/>

    <!-- Open Graph / Facebook / WhatsApp -->
    <meta property="og:type" content="article"/>
    <meta property="og:site_name" content="{site_name}"/>
    <meta property="og:title" content="{title}"/>
    <meta property="og:description" content="{excerpt}"/>
    <meta property="og:url" content="{canonical_url}"/>
    <meta property="og:image" content="{cover}"/>
    <meta property="og:image:width" content="1200"/>
    <meta property="og:image:height" content="630"/>
    <meta property="og:locale" content="en_IN"/>

    <!-- Twitter -->
    <meta name="twitter:card" content="summary_large_image"/>
    <meta name="twitter:title" content="{title}"/>
    <meta name="twitter:description" content="{excerpt}"/>
    <meta name="twitter:image" content="{cover}"/>

    <link rel="canonical" href="{canonical_url}"/>

    <!-- Redirect real browsers to the SPA -->
    <script>window.location.replace("{canonical_url}");</script>
    <meta http-equiv="refresh" content="0;url={canonical_url}"/>
</head>
<body>
    <h1>{title}</h1>
    <p>{excerpt}</p>
    <p><a href="{canonical_url}">Read full article on {site_name}</a></p>
</body>
</html>"""

    return HTMLResponse(content=html, status_code=200)

# CORS
frontend_url = os.environ.get("FRONTEND_URL", "http://localhost:3000")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        frontend_url,
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "https://wanderlustadventure.in",
        "https://www.wanderlustadventure.in",
        "https://wanderlust-adventure-81e8b.web.app"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Ensure uploads directory exists and mount it
UPLOAD_DIR = ROOT_DIR / "uploads"
UPLOAD_DIR.mkdir(exist_ok=True)
app.mount("/uploads", StaticFiles(directory=str(UPLOAD_DIR)), name="uploads")

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)

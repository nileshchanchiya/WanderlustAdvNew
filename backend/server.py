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
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime, timezone, timedelta
from typing import List, Optional, Dict, Any, Literal

import bcrypt
import jwt
import certifi
from bson import ObjectId
from fastapi import FastAPI, APIRouter, HTTPException, Request, Response, Depends
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, Field, EmailStr


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

app = FastAPI(title="Itinera API")
api = APIRouter(prefix="/api")


# ---------- Helpers ----------
def make_slug(name: str) -> str:
    s = name.lower().strip()
    s = re.sub(r'[^a-z0-9\s-]', '', s)
    s = re.sub(r'[\s-]+', '-', s).strip('-')
    return s


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


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
        payload = jwt.decode(token, get_jwt_secret(), algorithms=[JWT_ALGORITHM])
        if payload.get("type") != "access":
            raise HTTPException(status_code=401, detail="Invalid token type")
        user = await db.users.find_one({"_id": ObjectId(payload["sub"])})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")


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


def send_otp_email(to_email: str, otp_code: str, name: str) -> bool:
    smtp_host = os.environ.get("SMTP_HOST", "smtp.gmail.com")
    smtp_port = int(os.environ.get("SMTP_PORT", "587"))
    smtp_email = os.environ.get("SMTP_EMAIL", "")
    smtp_password = os.environ.get("SMTP_PASSWORD", "")

    if not smtp_email or not smtp_password:
        logging.warning("SMTP not configured — OTP email skipped")
        return False

    msg = MIMEMultipart("alternative")
    msg["Subject"] = f"Your Wanderlust Adventure verification code: {otp_code}"
    msg["From"] = f"Wanderlust Adventure <{smtp_email}>"
    msg["To"] = to_email

    html = f"""
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

    text = f"Hi {name}, your Wanderlust Adventure verification code is: {otp_code}. It expires in {OTP_EXPIRY_MIN} minutes."

    msg.attach(MIMEText(text, "plain"))
    msg.attach(MIMEText(html, "html"))

    try:
        with smtplib.SMTP(smtp_host, smtp_port) as server:
            server.starttls()
            server.login(smtp_email, smtp_password)
            server.sendmail(smtp_email, to_email, msg.as_string())
        return True
    except Exception as e:
        logging.error(f"Failed to send OTP email: {e}")
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
                "password_hash": hash_password(data.password),
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
    sent = send_otp_email(email, otp_code, data.name.strip())
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

# CORS
frontend_url = os.environ.get("FRONTEND_URL", "http://localhost:3000")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        frontend_url,
        "http://localhost:3000",
        "https://wanderlustadventure.in",
        "https://www.wanderlustadventure.in",
        "https://wanderlust-adventure-81e8b.web.app",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)

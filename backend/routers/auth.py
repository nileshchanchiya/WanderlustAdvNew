import logging
import asyncio
from datetime import datetime, timezone, timedelta
from typing import Dict, Any
from fastapi import APIRouter, HTTPException, Request, Response, Depends

from config import db, OTP_RATE_WINDOW_MIN, OTP_RATE_LIMIT, OTP_EXPIRY_MIN, OTP_MAX_ATTEMPTS, BRUTE_LIMIT, BRUTE_WINDOW_MIN
from models import OTPSendInput, OTPVerifyInput, RegisterInput, LoginInput, ProfileUpdate
from auth import (
    get_current_user, user_to_public, hash_password, hash_password_async, verify_password,
    create_access_token, create_refresh_token, set_auth_cookies, clear_auth_cookies
)
from email_service import generate_otp, send_otp_email, send_welcome_email, send_resend_event

router = APIRouter(prefix="/auth", tags=["auth"])

@router.post("/send-otp")
async def send_otp(data: OTPSendInput):
    email = data.email.lower().strip()
    existing = await db.users.find_one({"email": email})
    if existing:
        raise HTTPException(status_code=409, detail="Email already registered")

    now = datetime.now(timezone.utc)
    window_start = now - timedelta(minutes=OTP_RATE_WINDOW_MIN)
    recent_count = await db.otp_rate_limits.count_documents({"email": email, "created_at": {"$gte": window_start}})
    if recent_count >= OTP_RATE_LIMIT:
        raise HTTPException(status_code=429, detail="Too many OTP requests. Please try again later.")

    otp_code = generate_otp()
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
    await db.otp_rate_limits.insert_one({"email": email, "created_at": now})

    sent = await send_otp_email(email, otp_code, data.name.strip())
    if not sent:
        logging.warning(f"OTP for {email}: {otp_code} (email not sent)")
    return {"ok": True, "message": "Verification code sent to your email"}

@router.post("/verify-otp")
async def verify_otp(data: OTPVerifyInput, response: Response):
    email = data.email.lower().strip()
    now = datetime.now(timezone.utc)
    pending = await db.pending_otps.find_one({"email": email})
    if not pending:
        raise HTTPException(status_code=400, detail="No pending verification found. Please request a new code.")

    created = pending["created_at"]
    if isinstance(created, datetime) and created.tzinfo is None:
        created = created.replace(tzinfo=timezone.utc)
    if (now - created).total_seconds() > OTP_EXPIRY_MIN * 60:
        await db.pending_otps.delete_one({"email": email})
        raise HTTPException(status_code=400, detail="Verification code expired. Please request a new one.")

    if pending.get("attempts", 0) >= OTP_MAX_ATTEMPTS:
        await db.pending_otps.delete_one({"email": email})
        raise HTTPException(status_code=400, detail="Too many wrong attempts. Please request a new code.")

    if pending["otp"] != data.otp.strip():
        await db.pending_otps.update_one({"email": email}, {"$inc": {"attempts": 1}})
        remaining = OTP_MAX_ATTEMPTS - pending.get("attempts", 0) - 1
        raise HTTPException(status_code=400, detail=f"Incorrect code. {remaining} attempt{'s' if remaining != 1 else ''} remaining.")

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
    await db.pending_otps.delete_one({"email": email})
    asyncio.create_task(send_welcome_email(email, pending["name"]))
    asyncio.create_task(send_resend_event("user.created", email, {"name": pending["name"]}))

    access = create_access_token(uid, email)
    refresh = create_refresh_token(uid)
    set_auth_cookies(response, access, refresh)
    user_data = user_to_public({**doc, "_id": res.inserted_id})
    return {**user_data, "access_token": access, "refresh_token": refresh}

@router.post("/register")
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

@router.post("/login")
async def login(data: LoginInput, request: Request, response: Response):
    email = data.email.lower().strip()
    identifier = f"email:{email}"
    now = datetime.now(timezone.utc)
    attempts = await db.login_attempts.find_one({"identifier": identifier})
    if attempts and attempts.get("count", 0) >= BRUTE_LIMIT:
        locked_until = attempts.get("locked_until")
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

@router.post("/logout")
async def logout(response: Response):
    clear_auth_cookies(response)
    return {"ok": True}

@router.get("/me")
async def me(user: dict = Depends(get_current_user)):
    return user_to_public(user)

@router.put("/profile")
async def update_profile(data: ProfileUpdate, user: dict = Depends(get_current_user)):
    updates: Dict[str, Any] = {
        k: v for k, v in data.model_dump(exclude_unset=True).items() if v is not None
    }
    if not updates:
        return user_to_public(user)
    await db.users.update_one({"_id": user["_id"]}, {"$set": updates})
    updated = await db.users.find_one({"_id": user["_id"]})
    return user_to_public(updated)

import jwt
from bson import ObjectId
from config import JWT_ALGORITHM, ACCESS_MIN
from auth import get_jwt_secret

@router.post("/refresh")
async def refresh_token(request: Request, response: Response):
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

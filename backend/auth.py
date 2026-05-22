import os
import jwt
import bcrypt
import asyncio
from datetime import datetime, timezone, timedelta
from concurrent.futures import ThreadPoolExecutor
from fastapi import Request, Response, HTTPException, Depends
from firebase_admin import auth as firebase_auth
from config import db, JWT_ALGORITHM, ACCESS_MIN, REFRESH_DAYS

_thread_pool = ThreadPoolExecutor(max_workers=2)

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
    return os.environ.get("JWT_SECRET", "supersecretkey")

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
    response.set_cookie(key="access_token", value=access, httponly=True, secure=True, samesite="none", max_age=ACCESS_MIN * 60, path="/")
    response.set_cookie(key="refresh_token", value=refresh, httponly=True, secure=True, samesite="none", max_age=REFRESH_DAYS * 24 * 3600, path="/")

def clear_auth_cookies(response: Response) -> None:
    for name in ("access_token", "refresh_token"):
        response.delete_cookie(key=name, path="/", secure=True, samesite="none")
        response.set_cookie(key=name, value="", httponly=True, secure=True, samesite="none", max_age=0, path="/")

def user_to_public(u: dict) -> dict:
    return {
        "id": str(u["_id"]) if "_id" in u else u.get("id"),
        "email": u.get("email", ""),
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
                updates = {"firebase_uid": uid}
                if is_admin and user.get("role") != "admin":
                    updates["role"] = "admin"
                await db.users.update_one({"_id": user["_id"]}, {"$set": updates})
                user["firebase_uid"] = uid
                if is_admin:
                    user["role"] = "admin"
            else:
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

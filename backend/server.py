from dotenv import load_dotenv
from pathlib import Path

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

import os
import uuid
import logging
import secrets
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

mongo_url = os.environ["MONGO_URL"]
client = AsyncIOMotorClient(mongo_url, tlsCAFile=certifi.where())
db = client[os.environ["DB_NAME"]]

app = FastAPI(title="Itinera API")
api = APIRouter(prefix="/api")


# ---------- Helpers ----------
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
    response.delete_cookie("access_token", path="/")
    response.delete_cookie("refresh_token", path="/")


def user_to_public(u: dict) -> dict:
    return {
        "id": str(u["_id"]) if "_id" in u else u.get("id"),
        "email": u["email"],
        "name": u.get("name", ""),
        "role": u.get("role", "user"),
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


class LoginInput(BaseModel):
    email: EmailStr
    password: str


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


# ---------- Auth Endpoints ----------
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
    return user_to_public({**doc, "_id": res.inserted_id})


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
    return user_to_public(user)


@api.post("/auth/logout")
async def logout(response: Response):
    # Logout always succeeds — clears cookies whether or not the access token is valid.
    clear_auth_cookies(response)
    return {"ok": True}


@api.get("/auth/me")
async def me(user: dict = Depends(get_current_user)):
    return user_to_public(user)


@api.post("/auth/refresh")
async def refresh_token(request: Request, response: Response):
    token = request.cookies.get("refresh_token")
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
        return {"ok": True}
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


@api.get("/destinations")
async def list_destinations():
    # Public — any visitor can see admin-curated destinations.
    cursor = db.destinations.find({}, {"_id": 0}).sort("created_at", -1)
    items = await cursor.to_list(length=500)
    return items


@api.post("/destinations")
async def create_destination(data: CustomDestinationInput, admin: dict = Depends(require_admin)):
    doc = {
        "id": str(uuid.uuid4()),
        "created_by": str(admin["_id"]),
        **data.model_dump(),
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.destinations.insert_one(doc)
    doc.pop("_id", None)
    return doc


@api.delete("/destinations/{destination_id}")
async def delete_destination(destination_id: str, admin: dict = Depends(require_admin)):
    res = await db.destinations.delete_one({"id": destination_id})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Destination not found")
    return {"ok": True}


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


# ---------- Startup ----------
@app.on_event("startup")
async def on_startup():
    await db.users.create_index("email", unique=True)
    await db.login_attempts.create_index("identifier")
    await db.itineraries.create_index([("user_id", 1), ("created_at", -1)])
    await db.itineraries.create_index("id", unique=True)
    await db.destinations.create_index("id", unique=True)
    await db.destinations.create_index([("created_at", -1)])

    admin_email = os.environ.get("ADMIN_EMAIL", "admin@example.com").lower()
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

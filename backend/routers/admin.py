import os
import uuid
from datetime import datetime, timezone
from typing import Dict, Any, Optional, Literal
from pydantic import BaseModel, Field, EmailStr
from fastapi import APIRouter, HTTPException, Depends
import httpx
from config import db
from auth import get_current_user, require_admin, user_to_public

class InquiryInput(BaseModel):
    name: str = Field(min_length=1, max_length=80)
    email: EmailStr
    phone: str = Field(default="", max_length=40)
    destination: str = Field(default="", max_length=120)
    travel_dates: str = Field(default="", max_length=120)
    budget: str = Field(default="", max_length=60)
    message: str = Field(default="", max_length=2000)

class InquiryStatusUpdate(BaseModel):
    status: Literal["new", "contacted", "resolved", "archived"]

class AdminUserUpdate(BaseModel):
    role: Optional[Literal["user", "admin"]] = None
    disabled: Optional[bool] = None

router = APIRouter(prefix="", tags=["misc"])
admin_router = APIRouter(prefix="/admin", tags=["admin"])

GOOGLE_MAPS_KEY = os.environ.get("GOOGLE_MAPS_KEY", "AIzaSyDzESV2Qc0Ik_pJMvgvrXCGaLL-UNOZFyw")

@router.get("/maps/key")
async def get_maps_key(user: dict = Depends(get_current_user)):
    return {"key": GOOGLE_MAPS_KEY}

@router.get("/maps/geocode")
async def geocode_address(address: str, user: dict = Depends(get_current_user)):
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

@router.get("/maps/places")
async def search_places(query: str, user: dict = Depends(get_current_user)):
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

@router.post("/inquiries")
async def create_inquiry(payload: InquiryInput):
    doc = payload.model_dump()
    doc = {k: v for k, v in doc.items() if v}
    doc["id"] = str(uuid.uuid4())
    doc["created_at"] = datetime.now(timezone.utc).isoformat()
    doc["status"] = "new"
    await db.inquiries.insert_one(doc)
    return {"ok": True, "id": doc["id"]}

@admin_router.get("/stats")
async def admin_stats(admin: dict = Depends(require_admin)):
    users_count = await db.users.count_documents({})
    itineraries_count = await db.itineraries.count_documents({})
    inquiries_count = await db.inquiries.count_documents({"status": "new"})
    destinations_count = await db.destinations.count_documents({})
    return {
        "users": users_count,
        "itineraries": itineraries_count,
        "new_inquiries": inquiries_count,
        "destinations": destinations_count
    }

@admin_router.get("/users")
async def admin_list_users(admin: dict = Depends(require_admin)):
    cursor = db.users.find({}, {"password_hash": 0}).sort("created_at", -1)
    users = await cursor.to_list(length=1000)
    return [user_to_public(u) for u in users]

@admin_router.put("/users/{user_id}")
async def admin_update_user(user_id: str, data: AdminUserUpdate, admin: dict = Depends(require_admin)):
    updates: Dict[str, Any] = {
        k: v for k, v in data.model_dump(exclude_unset=True).items() if v is not None
    }
    from bson import ObjectId
    try:
        oid = ObjectId(user_id)
    except:
        raise HTTPException(status_code=400, detail="Invalid user ID format")
    if updates:
        await db.users.update_one({"_id": oid}, {"$set": updates})
    updated = await db.users.find_one({"_id": oid}, {"password_hash": 0})
    if not updated:
        raise HTTPException(status_code=404, detail="User not found")
    return user_to_public(updated)

@admin_router.delete("/users/{user_id}")
async def admin_delete_user(user_id: str, admin: dict = Depends(require_admin)):
    from bson import ObjectId
    try:
        oid = ObjectId(user_id)
    except:
        raise HTTPException(status_code=400, detail="Invalid user ID format")
    if str(admin["_id"]) == str(oid):
        raise HTTPException(status_code=400, detail="Cannot delete yourself")
    res = await db.users.delete_one({"_id": oid})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    await db.itineraries.delete_many({"user_id": user_id})
    return {"ok": True}

@admin_router.get("/inquiries")
async def admin_list_inquiries(admin: dict = Depends(require_admin)):
    cursor = db.inquiries.find({}, {"_id": 0}).sort("created_at", -1)
    return await cursor.to_list(length=500)

@admin_router.put("/inquiries/{inquiry_id}/status")
async def admin_update_inquiry_status(inquiry_id: str, data: InquiryStatusUpdate, admin: dict = Depends(require_admin)):
    await db.inquiries.update_one({"id": inquiry_id}, {"$set": {"status": data.status}})
    doc = await db.inquiries.find_one({"id": inquiry_id}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Inquiry not found")
    return doc

@admin_router.delete("/inquiries/{inquiry_id}")
async def admin_delete_inquiry(inquiry_id: str, admin: dict = Depends(require_admin)):
    res = await db.inquiries.delete_one({"id": inquiry_id})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Inquiry not found")
    return {"ok": True}

import uuid
from datetime import datetime, timezone
from typing import Dict, Any
from fastapi import APIRouter, HTTPException, Depends
from config import db
from auth import get_current_user
from models import ItineraryCreate, ItineraryUpdate

router = APIRouter(prefix="/itineraries", tags=["itineraries"])

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

@router.get("/")
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

@router.post("/")
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

@router.get("/{itinerary_id}")
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

@router.put("/{itinerary_id}")
async def update_itinerary(itinerary_id: str, data: ItineraryUpdate, user: dict = Depends(get_current_user)):
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

@router.delete("/{itinerary_id}")
async def delete_itinerary(itinerary_id: str, user: dict = Depends(get_current_user)):
    uid = str(user["_id"])
    res = await db.itineraries.delete_one({"id": itinerary_id, "user_id": uid})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Itinerary not found")
    return {"ok": True}

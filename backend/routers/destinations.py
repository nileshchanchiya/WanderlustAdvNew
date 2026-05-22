import uuid
from datetime import datetime, timezone
from typing import Dict, Any, Optional, Literal, List
from pydantic import BaseModel, Field
from fastapi import APIRouter, HTTPException, Depends
from config import db
from auth import require_admin
import re

def make_slug(name: str) -> str:
    s = name.lower().strip()
    s = re.sub(r'[^a-z0-9\s-]', '', s)
    s = re.sub(r'[\s-]+', '-', s).strip('-')
    return s

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
    gallery_images: list = Field(default_factory=list)
    latitude: Optional[float] = None
    longitude: Optional[float] = None

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
    gallery_images: Optional[list] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None

router = APIRouter(prefix="/destinations", tags=["destinations"])

@router.get("/")
async def list_destinations():
    cursor = db.destinations.find({}, {"_id": 0}).sort("created_at", -1)
    items = await cursor.to_list(length=500)
    return items

@router.get("/{slug}/related")
async def get_related_destinations(slug: str):
    doc = await db.destinations.find_one({"slug": slug}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Destination not found")
    # Find destinations with matching theme or region, excluding the current one
    query = {
        "slug": {"$ne": slug},
        "$or": [
            {"theme": doc.get("theme")},
            {"region": doc.get("region")}
        ]
    }
    cursor = db.destinations.find(query, {"_id": 0}).limit(4)
    related = await cursor.to_list(length=4)
    return related

@router.get("/{slug}")
async def get_destination(slug: str):
    doc = await db.destinations.find_one({"slug": slug}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Destination not found")
    return doc

@router.post("/")
async def create_destination(data: CustomDestinationInput, admin: dict = Depends(require_admin)):
    slug = make_slug(data.name)
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

@router.put("/{destination_id}")
async def update_destination(destination_id: str, data: DestinationUpdate, admin: dict = Depends(require_admin)):
    existing = await db.destinations.find_one({"id": destination_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Destination not found")
    updates: Dict[str, Any] = {
        k: v for k, v in data.model_dump(exclude_unset=True).items() if v is not None
    }
    if "name" in updates:
        updates["slug"] = make_slug(updates["name"])
    await db.destinations.update_one({"id": destination_id}, {"$set": updates})
    doc = await db.destinations.find_one({"id": destination_id}, {"_id": 0})
    return doc

@router.delete("/{destination_id}")
async def delete_destination(destination_id: str, admin: dict = Depends(require_admin)):
    res = await db.destinations.delete_one({"id": destination_id})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Destination not found")
    return {"ok": True}

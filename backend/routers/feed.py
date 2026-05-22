import os
import uuid
import httpx
import logging
from datetime import datetime, timezone
from typing import Optional, Literal
from pydantic import BaseModel
from fastapi import APIRouter, HTTPException, Depends
from config import db
from auth import require_admin

class FeedPostInput(BaseModel):
    platform: Literal["instagram", "twitter", "custom"]
    content: str
    image_url: Optional[str] = None
    link_url: Optional[str] = None

router = APIRouter(prefix="/feed", tags=["feed"])
admin_router = APIRouter(prefix="/admin/feed", tags=["admin-feed"])

@router.get("/")
async def list_feed():
    cursor = db.feed.find({}, {"_id": 0}).sort("created_at", -1)
    items = await cursor.to_list(length=100)
    return items

@admin_router.post("/")
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

@admin_router.delete("/{post_id}")
async def delete_feed_post(post_id: str, admin: dict = Depends(require_admin)):
    res = await db.feed.delete_one({"id": post_id})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Post not found")
    return {"ok": True}

@router.get("/instagram")
async def get_instagram_feed():
    token = os.environ.get("INSTAGRAM_ACCESS_TOKEN")
    if not token:
        return []
    
    cache = await db.cache.find_one({"id": "instagram_feed"})
    now = datetime.now(timezone.utc)
    
    if cache and cache.get("updated_at"):
        updated_at = datetime.fromisoformat(cache["updated_at"])
        if (now - updated_at).total_seconds() < 3600:
            return cache.get("data", [])
            
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

import uuid
from datetime import datetime, timezone
from typing import List, Optional
from pydantic import BaseModel
from fastapi import APIRouter, HTTPException, Depends
from config import db
from auth import require_admin

class BlogInput(BaseModel):
    title: str
    slug: str
    content: str
    excerpt: Optional[str] = None
    cover_image_url: Optional[str] = None
    tags: List[str] = []
    published: bool = False

router = APIRouter(prefix="/blogs", tags=["blogs"])
admin_router = APIRouter(prefix="/admin/blogs", tags=["admin-blogs"])

@router.get("/")
async def list_published_blogs():
    cursor = db.blogs.find({"published": True}, {"_id": 0}).sort("created_at", -1)
    return await cursor.to_list(length=100)

@router.get("/{slug}")
async def get_blog(slug: str):
    blog = await db.blogs.find_one({"slug": slug, "published": True}, {"_id": 0})
    if not blog:
        raise HTTPException(status_code=404, detail="Blog not found")
    return blog

@admin_router.get("/")
async def admin_list_blogs(admin: dict = Depends(require_admin)):
    cursor = db.blogs.find({}, {"_id": 0}).sort("created_at", -1)
    return await cursor.to_list(length=100)

@admin_router.post("/")
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

@admin_router.put("/{blog_id}")
async def update_blog(blog_id: str, data: BlogInput, admin: dict = Depends(require_admin)):
    updates = data.model_dump()
    updates["updated_at"] = datetime.now(timezone.utc).isoformat()
    res = await db.blogs.update_one({"id": blog_id}, {"$set": updates})
    if res.matched_count == 0:
        raise HTTPException(status_code=404, detail="Blog not found")
    return await db.blogs.find_one({"id": blog_id}, {"_id": 0})

@admin_router.delete("/{blog_id}")
async def delete_blog(blog_id: str, admin: dict = Depends(require_admin)):
    res = await db.blogs.delete_one({"id": blog_id})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Blog not found")
    return {"ok": True}

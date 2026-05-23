import uuid
import logging
from datetime import datetime, timezone
from typing import List, Optional
from pydantic import BaseModel
from fastapi import APIRouter, HTTPException, Depends
from config import db
from auth import require_admin
from routers.upload import delete_storage_files, extract_image_urls_from_html

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

def _collect_blog_images(blog: dict) -> list[str]:
    """Collect all Firebase Storage image URLs from a blog document."""
    urls = []
    if blog.get("cover_image_url"):
        urls.append(blog["cover_image_url"])
    urls.extend(extract_image_urls_from_html(blog.get("content", "")))
    return urls

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
    # If saving as draft, strip images and clean up uploaded files
    if not doc["published"]:
        images_to_delete = _collect_blog_images(doc)
        doc["cover_image_url"] = None
        doc["content"] = _strip_images_from_html(doc.get("content", ""))
        await delete_storage_files(images_to_delete)

    await db.blogs.insert_one(doc)
    doc.pop("_id", None)
    return doc

@admin_router.put("/{blog_id}")
async def update_blog(blog_id: str, data: BlogInput, admin: dict = Depends(require_admin)):
    existing = await db.blogs.find_one({"id": blog_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Blog not found")

    updates = data.model_dump()
    updates["updated_at"] = datetime.now(timezone.utc).isoformat()

    if not updates["published"]:
        # Saving as draft — strip images from new data and clean up all images
        new_images = _collect_blog_images(updates)
        old_images = _collect_blog_images(existing)
        all_images = list(set(new_images + old_images))
        updates["cover_image_url"] = None
        updates["content"] = _strip_images_from_html(updates.get("content", ""))
        await delete_storage_files(all_images)
    else:
        # Publishing — clean up any old images that were removed in the edit
        old_images = set(_collect_blog_images(existing))
        new_images = set(_collect_blog_images(updates))
        removed_images = list(old_images - new_images)
        if removed_images:
            await delete_storage_files(removed_images)

    res = await db.blogs.update_one({"id": blog_id}, {"$set": updates})
    return await db.blogs.find_one({"id": blog_id}, {"_id": 0})

@admin_router.delete("/{blog_id}")
async def delete_blog(blog_id: str, admin: dict = Depends(require_admin)):
    blog = await db.blogs.find_one({"id": blog_id})
    if not blog:
        raise HTTPException(status_code=404, detail="Blog not found")

    # Clean up all images from Firebase Storage
    images = _collect_blog_images(blog)
    if images:
        logging.info(f"Deleting {len(images)} image(s) for blog {blog_id}")
        await delete_storage_files(images)

    await db.blogs.delete_one({"id": blog_id})
    return {"ok": True}

def _strip_images_from_html(html: str) -> str:
    """Remove <img> tags with Firebase Storage src from HTML content."""
    import re
    from routers.upload import STORAGE_BUCKET
    pattern = rf'<img[^>]+src="https://firebasestorage\.googleapis\.com/v0/b/{re.escape(STORAGE_BUCKET)}/o/[^"]*"[^>]*/?>'
    return re.sub(pattern, '', html or "")


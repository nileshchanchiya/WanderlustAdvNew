import uuid
from datetime import datetime, timezone
from typing import Optional
from pydantic import BaseModel, Field
from fastapi import APIRouter, HTTPException, Depends, Query
from config import db
from auth import get_current_user

class ReviewInput(BaseModel):
    rating: int = Field(ge=1, le=5)
    comment: str = Field(default="", max_length=2000)

router = APIRouter(prefix="/reviews", tags=["reviews"])

@router.get("/{destination_slug}")
async def list_reviews(destination_slug: str, page: int = Query(1, ge=1), limit: int = Query(10, ge=1, le=50)):
    skip = (page - 1) * limit
    cursor = db.reviews.find(
        {"destination_slug": destination_slug},
        {"_id": 0}
    ).sort("created_at", -1).skip(skip).limit(limit)
    reviews = await cursor.to_list(length=limit)
    total = await db.reviews.count_documents({"destination_slug": destination_slug})
    
    # Compute aggregate stats
    pipeline = [
        {"$match": {"destination_slug": destination_slug}},
        {"$group": {"_id": None, "avg_rating": {"$avg": "$rating"}, "count": {"$sum": 1}}}
    ]
    stats_cursor = db.reviews.aggregate(pipeline)
    stats_list = await stats_cursor.to_list(length=1)
    stats = stats_list[0] if stats_list else {"avg_rating": 0, "count": 0}
    
    return {
        "reviews": reviews,
        "total": total,
        "avg_rating": round(stats.get("avg_rating", 0), 1),
        "review_count": stats.get("count", 0),
        "page": page,
        "limit": limit
    }

@router.post("/{destination_slug}")
async def create_review(destination_slug: str, data: ReviewInput, user: dict = Depends(get_current_user)):
    user_id = str(user["_id"])
    # Check if user already reviewed this destination
    existing = await db.reviews.find_one({
        "destination_slug": destination_slug,
        "user_id": user_id
    })
    if existing:
        raise HTTPException(status_code=409, detail="You have already reviewed this destination")
    
    doc = {
        "id": str(uuid.uuid4()),
        "destination_slug": destination_slug,
        "user_id": user_id,
        "user_name": user.get("name", "Wanderer"),
        "user_image": user.get("profile_image", ""),
        "rating": data.rating,
        "comment": data.comment,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.reviews.insert_one(doc)
    doc.pop("_id", None)
    return doc

@router.delete("/{review_id}")
async def delete_review(review_id: str, user: dict = Depends(get_current_user)):
    review = await db.reviews.find_one({"id": review_id})
    if not review:
        raise HTTPException(status_code=404, detail="Review not found")
    # Allow owner or admin to delete
    user_id = str(user["_id"])
    is_admin = user.get("role") == "admin"
    if review["user_id"] != user_id and not is_admin:
        raise HTTPException(status_code=403, detail="Not authorized to delete this review")
    await db.reviews.delete_one({"id": review_id})
    return {"ok": True}

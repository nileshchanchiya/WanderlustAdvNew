from fastapi import APIRouter, HTTPException, Depends
from config import db
from auth import get_current_user

router = APIRouter(prefix="/wishlist", tags=["wishlist"])

# Built-in destination slugs that exist in frontend but not in DB
BUILTIN_SLUGS = {
    "dubai", "bali", "europe", "maldives", "thailand", "singapore",
    "goa", "manali", "kashmir", "kerala", "ladakh", "rajasthan"
}

@router.get("/")
async def list_wishlist(user: dict = Depends(get_current_user)):
    wishlist_ids = user.get("wishlist", [])
    if not wishlist_ids:
        return []
    # Fetch custom destinations from DB
    cursor = db.destinations.find({"id": {"$in": wishlist_ids}}, {"_id": 0})
    items = await cursor.to_list(length=100)
    # Also include built-in slugs that are in the wishlist
    found_ids = {item["id"] for item in items}
    for wid in wishlist_ids:
        if wid.startswith("builtin-") and wid not in found_ids:
            slug = wid.replace("builtin-", "")
            if slug in BUILTIN_SLUGS:
                items.append({"id": wid, "slug": slug, "builtin": True})
    return items

@router.post("/{destination_id}")
async def add_to_wishlist(destination_id: str, user: dict = Depends(get_current_user)):
    # Allow built-in destinations (prefixed with "builtin-")
    if destination_id.startswith("builtin-"):
        slug = destination_id.replace("builtin-", "")
        if slug not in BUILTIN_SLUGS:
            raise HTTPException(status_code=404, detail="Destination not found")
    else:
        dest = await db.destinations.find_one({"id": destination_id})
        if not dest:
            raise HTTPException(status_code=404, detail="Destination not found")
    await db.users.update_one(
        {"_id": user["_id"]},
        {"$addToSet": {"wishlist": destination_id}}
    )
    return {"ok": True}

@router.delete("/{destination_id}")
async def remove_from_wishlist(destination_id: str, user: dict = Depends(get_current_user)):
    await db.users.update_one(
        {"_id": user["_id"]},
        {"$pull": {"wishlist": destination_id}}
    )
    return {"ok": True}

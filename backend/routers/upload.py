import uuid
import re
import asyncio
import logging
import urllib.parse
from fastapi import APIRouter, UploadFile, File, Depends, Request, HTTPException
from auth import require_admin
from concurrent.futures import ThreadPoolExecutor

_thread_pool = ThreadPoolExecutor(max_workers=2)

STORAGE_BUCKET = "wanderlust-adventure-81e8b.firebasestorage.app"

router = APIRouter(prefix="/admin", tags=["admin-upload"])

def _extract_blob_path(url: str) -> str | None:
    """Extract the blob path from a Firebase Storage download URL."""
    pattern = rf"/v0/b/{re.escape(STORAGE_BUCKET)}/o/(.+?)(\?|$)"
    match = re.search(pattern, url)
    if match:
        return urllib.parse.unquote(match.group(1))
    return None

def delete_storage_blobs(urls: list[str]):
    """Delete blobs from Firebase Storage given their download URLs (synchronous)."""
    from firebase_admin import storage
    bucket = storage.bucket(STORAGE_BUCKET)
    for url in urls:
        path = _extract_blob_path(url)
        if not path:
            continue
        try:
            blob = bucket.blob(path)
            blob.delete()
            logging.info(f"Deleted blob: {path}")
        except Exception:
            logging.warning(f"Failed to delete blob: {path}", exc_info=True)

async def delete_storage_files(urls: list[str]):
    """Async wrapper to delete Firebase Storage files in a thread pool."""
    if not urls:
        return
    loop = asyncio.get_event_loop()
    await loop.run_in_executor(_thread_pool, delete_storage_blobs, urls)

def extract_image_urls_from_html(html: str) -> list[str]:
    """Extract all Firebase Storage image URLs from HTML content."""
    pattern = rf'https://firebasestorage\.googleapis\.com/v0/b/{re.escape(STORAGE_BUCKET)}/o/[^"\'>\s]+'
    return re.findall(pattern, html or "")

@router.post("/upload")
async def upload_file(request: Request, file: UploadFile = File(...), admin: dict = Depends(require_admin)):
    from firebase_admin import storage
    
    ext = file.filename.split(".")[-1] if "." in file.filename else "jpg"
    filename = f"uploads/{uuid.uuid4().hex}.{ext}"
    contents = await file.read()
    
    download_token = uuid.uuid4().hex

    def _upload():
        bucket = storage.bucket(STORAGE_BUCKET)
        blob = bucket.blob(filename)
        blob.metadata = {"firebaseStorageDownloadTokens": download_token}
        blob.upload_from_string(contents, content_type=file.content_type)
        encoded_path = urllib.parse.quote(filename, safe="")
        return f"https://firebasestorage.googleapis.com/v0/b/{STORAGE_BUCKET}/o/{encoded_path}?alt=media&token={download_token}"

    try:
        loop = asyncio.get_event_loop()
        url = await loop.run_in_executor(_thread_pool, _upload)
        return {"url": url}
    except Exception as e:
        logging.exception("Upload to Firebase Storage failed")
        raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}")


import uuid
import asyncio
import logging
import urllib.parse
from fastapi import APIRouter, UploadFile, File, Depends, Request, HTTPException
from auth import require_admin
from concurrent.futures import ThreadPoolExecutor

_thread_pool = ThreadPoolExecutor(max_workers=2)

STORAGE_BUCKET = "wanderlust-adventure-81e8b.firebasestorage.app"

router = APIRouter(prefix="/admin", tags=["admin-upload"])

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

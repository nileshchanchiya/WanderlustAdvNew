import uuid
import asyncio
from fastapi import APIRouter, UploadFile, File, Depends, Request
from auth import require_admin
from concurrent.futures import ThreadPoolExecutor

_thread_pool = ThreadPoolExecutor(max_workers=2)

router = APIRouter(prefix="/admin", tags=["admin-upload"])

@router.post("/upload")
async def upload_file(request: Request, file: UploadFile = File(...), admin: dict = Depends(require_admin)):
    from firebase_admin import storage
    
    ext = file.filename.split(".")[-1] if "." in file.filename else "jpg"
    filename = f"uploads/{uuid.uuid4().hex}.{ext}"
    contents = await file.read()
    
    def _upload():
        bucket = storage.bucket("wanderlust-adventure-81e8b.firebasestorage.app")
        blob = bucket.blob(filename)
        blob.upload_from_string(contents, content_type=file.content_type)
        blob.make_public()
        return blob.public_url

    loop = asyncio.get_event_loop()
    url = await loop.run_in_executor(_thread_pool, _upload)
    
    return {"url": url}

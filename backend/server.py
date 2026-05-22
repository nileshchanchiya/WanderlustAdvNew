import os
import time
import logging
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from config import FRONTEND_URL
from routers import auth, destinations, blogs, upload, feed, itineraries, ai, admin, wishlist, reviews

# Setup standard logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")

app = FastAPI(title="Wanderlust Adventure API")

# Setup CORS
allowed_origins = [
    FRONTEND_URL,
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global Exception Handler
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logging.exception("Unhandled Exception")
    return JSONResponse(status_code=500, content={"detail": "Internal server error"})

# Include Routers
app.include_router(auth.router)
app.include_router(destinations.router)
app.include_router(blogs.router)
app.include_router(blogs.admin_router)
app.include_router(upload.router)
app.include_router(feed.router)
app.include_router(feed.admin_router)
app.include_router(itineraries.router)
app.include_router(ai.router)
app.include_router(admin.router)
app.include_router(admin.admin_router)
app.include_router(wishlist.router)
app.include_router(reviews.router)

# ---------- Startup ----------
@app.on_event("startup")
async def startup_event():
    logging.info("Starting up server... DB and Firebase are already initialized via config.")

# ---------- Health ----------
@app.get("/health")
async def health_check():
    return {"status": "ok", "timestamp": time.time()}

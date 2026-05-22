import os
import json
import certifi
import logging
from pathlib import Path
from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient

import firebase_admin
from firebase_admin import credentials

# Load env vars
ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

# ---------- Config ----------
JWT_ALGORITHM = "HS256"
ACCESS_MIN = 15
REFRESH_DAYS = 7
BRUTE_LIMIT = 5
BRUTE_WINDOW_MIN = 15
OTP_LENGTH = 6
OTP_EXPIRY_MIN = 10
OTP_MAX_ATTEMPTS = 5
OTP_RATE_LIMIT = 3
OTP_RATE_WINDOW_MIN = 15

# ---------- MongoDB Init ----------
mongo_url = os.environ.get("MONGO_URL", "")
db = None
if mongo_url:
    client = AsyncIOMotorClient(mongo_url, tlsCAFile=certifi.where())
    db = client[os.environ.get("DB_NAME", "wanderlust")]

# ---------- Firebase Init ----------
firebase_json_str = os.environ.get("FIREBASE_SERVICE_ACCOUNT_JSON")
firebase_path = os.environ.get("FIREBASE_SERVICE_ACCOUNT_PATH")
FIREBASE_STORAGE_BUCKET = "wanderlust-adventure-81e8b.firebasestorage.app"

try:
    if firebase_json_str:
        cred_dict = json.loads(firebase_json_str)
        cred = credentials.Certificate(cred_dict)
        firebase_admin.initialize_app(cred, {'storageBucket': FIREBASE_STORAGE_BUCKET})
    elif firebase_path and os.path.exists(firebase_path):
        cred = credentials.Certificate(firebase_path)
        firebase_admin.initialize_app(cred, {'storageBucket': FIREBASE_STORAGE_BUCKET})
    else:
        firebase_admin.initialize_app(options={'storageBucket': FIREBASE_STORAGE_BUCKET})
except ValueError:
    pass
except Exception as e:
    logging.error(f"Firebase admin init failed: {e}")

# ---------- Gemini AI Init ----------
GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY", "")
GEMINI_MODEL = "gemini-2.5-flash"
GEMINI_URL = f"https://generativelanguage.googleapis.com/v1beta/models/{GEMINI_MODEL}:generateContent"
if GEMINI_API_KEY:
    print(f"✅ Gemini AI configured ({GEMINI_MODEL}, REST API)")
else:
    print("⚠️ GEMINI_API_KEY not set — AI features disabled")
FRONTEND_URL = os.environ.get("FRONTEND_URL", "https://wanderlustadventure.in")

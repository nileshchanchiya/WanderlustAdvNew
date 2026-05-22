import os
import uuid
import logging
from datetime import datetime
from typing import List, Optional, Literal
from pydantic import BaseModel, Field
from fastapi import APIRouter, HTTPException, Depends, UploadFile, File
import httpx as _httpx
import json_repair

from config import GEMINI_URL, GEMINI_API_KEY
from auth import get_current_user

router = APIRouter(prefix="/itineraries", tags=["ai"])

AI_SYSTEM_PROMPT = """You are Wanderlust AI, an expert travel planner. Generate a detailed, day-by-day travel itinerary.

IMPORTANT: Return ONLY valid JSON matching this exact schema (no markdown, no code fences, no explanation):
{
  "title": "string - catchy trip title",
  "description": "string - 2-3 sentence overview",
  "cover_emoji": "string - single relevant emoji",
  "destination": "string - main destination",
  "type": "travel",
  "start_date": "YYYY-MM-DD or null",
  "end_date": "YYYY-MM-DD or null",
  "budget_limit": number,
  "currency": "string - 3-letter code",
  "events": [
    {
      "day_index": 0,
      "time": "HH:MM",
      "title": "string - activity name",
      "location": "string - specific place name",
      "notes": "string - tips, details, duration",
      "category": "activity|food|transport|stay|meeting"
    }
  ],
  "expenses": [
    {
      "category": "accommodation|food|transport|activities|shopping|other",
      "description": "string",
      "amount": number,
      "currency": "string",
      "date": "YYYY-MM-DD or null"
    }
  ],
  "packing": [
    {
      "text": "string - item name",
      "category": "clothing|toiletries|electronics|documents|medicine|gear|general",
      "packed": false
    }
  ]
}

Guidelines:
- Create 3-6 events per day, with realistic timings
- Include breakfast, lunch, dinner suggestions
- Add transport between major activities
- Estimate realistic costs for the destination and travel style
- Suggest packing items relevant to the destination, weather, and activities
- day_index starts at 0 for Day 1
- Be specific with location names (actual restaurants, landmarks, hotels)
- CRITICAL: Ensure all JSON strings are properly escaped. Do NOT use unescaped double quotes (") inside strings. Use single quotes (') instead.
- CRITICAL: Do NOT use unescaped newlines or control characters inside strings.
- CRITICAL: Keep descriptions concise to prevent the response from being truncated.
"""

class AIGenerateRequest(BaseModel):
    destination: str = Field(min_length=1, max_length=200)
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    travelers: int = Field(default=1, ge=1, le=20)
    travel_style: Literal["budget", "mid-range", "luxury"] = "mid-range"
    interests: List[str] = []
    budget_amount: Optional[float] = None
    currency: str = "INR"
    special_requests: str = ""

class AIDescribeRequest(BaseModel):
    prompt: str = Field(min_length=5, max_length=2000)

def _parse_ai_json(text: str) -> dict:
    cleaned = text.strip()
    if cleaned.startswith("```"):
        lines = cleaned.split("\n")
        lines = [l for l in lines if not l.strip().startswith("```")]
        cleaned = "\n".join(lines).strip()
    try:
        parsed = json_repair.loads(cleaned)
        if not isinstance(parsed, dict):
            raise ValueError("Parsed JSON is not a dictionary")
        return parsed
    except Exception as e:
        logging.exception("json_repair failed to parse AI output")
        raise ValueError(f"Could not parse AI response: {str(e)}")

def _enrich_ids(data: dict) -> dict:
    for evt in data.get("events", []):
        if "id" not in evt:
            evt["id"] = str(uuid.uuid4())
    for exp in data.get("expenses", []):
        if "id" not in exp:
            exp["id"] = str(uuid.uuid4())
    for pkg in data.get("packing", []):
        if "id" not in pkg:
            pkg["id"] = str(uuid.uuid4())
    return data

async def _call_gemini(parts: list, temperature: float = 0.8) -> dict:
    payload = {
        "contents": [{"parts": parts}],
        "generationConfig": {
            "temperature": temperature,
            "maxOutputTokens": 8192,
            "responseMimeType": "application/json",
        },
    }
    async with _httpx.AsyncClient(timeout=90) as client:
        resp = await client.post(GEMINI_URL, params={"key": GEMINI_API_KEY}, json=payload)
        resp.raise_for_status()
        body = resp.json()

    candidates = body.get("candidates", [])
    if not candidates:
        raise ValueError("No response from Gemini AI")
    text = candidates[0].get("content", {}).get("parts", [{}])[0].get("text", "")
    if not text:
        raise ValueError("Empty response from Gemini AI")

    result = _parse_ai_json(text)
    return _enrich_ids(result)

@router.post("/ai-generate")
async def ai_generate_itinerary(data: AIGenerateRequest, user: dict = Depends(get_current_user)):
    if not GEMINI_API_KEY:
        raise HTTPException(status_code=503, detail="AI service not configured")
    duration = ""
    if data.start_date and data.end_date:
        try:
            d1 = datetime.strptime(data.start_date, "%Y-%m-%d")
            d2 = datetime.strptime(data.end_date, "%Y-%m-%d")
            days = (d2 - d1).days + 1
            duration = f" for {days} days ({data.start_date} to {data.end_date})"
        except ValueError:
            pass
    interests_str = ", ".join(data.interests) if data.interests else "general sightseeing"
    budget_str = f"Budget: {data.budget_amount} {data.currency}" if data.budget_amount else f"Currency: {data.currency}"
    user_prompt = f"Plan a trip to {data.destination}{duration}.\nTravelers: {data.travelers}\nTravel style: {data.travel_style}\nInterests: {interests_str}\n{budget_str}\nSpecial requests: {data.special_requests}\nGenerate a complete day-by-day itinerary with timeline events, estimated expenses, and packing list.\nReturn ONLY the JSON object, no other text."
    try:
        parts = [{"text": AI_SYSTEM_PROMPT}, {"text": user_prompt}]
        result = await _call_gemini(parts, temperature=0.8)
        result.setdefault("type", "travel")
        result.setdefault("currency", data.currency)
        result.setdefault("destination", data.destination)
        if data.start_date: result.setdefault("start_date", data.start_date)
        if data.end_date: result.setdefault("end_date", data.end_date)
        return result
    except Exception as e:
        logging.exception("AI generate failed")
        raise HTTPException(status_code=500, detail=f"AI generation failed: {str(e)}")

@router.post("/ai-import-file")
async def ai_import_file(file: UploadFile = File(...), user: dict = Depends(get_current_user)):
    if not GEMINI_API_KEY:
        raise HTTPException(status_code=503, detail="AI service not configured")
    allowed_types = {"application/pdf": "pdf", "image/jpeg": "jpeg", "image/jpg": "jpg", "image/png": "png", "text/plain": "txt", "text/csv": "csv"}
    content_type = file.content_type or ""
    if content_type not in allowed_types:
        raise HTTPException(status_code=400, detail=f"Unsupported file type: {content_type}. Allowed: PDF, JPG, PNG, TXT, CSV")
    file_bytes = await file.read()
    if len(file_bytes) > 10 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File too large (max 10MB)")
    import_prompt = "Analyze this file and extract all travel/trip-related information.\nCreate a structured itinerary from any bookings, reservations, tickets, or travel plans found.\nReturn ONLY the JSON object matching the schema, no other text."
    try:
        parts = [{"text": AI_SYSTEM_PROMPT}, {"text": import_prompt}]
        if content_type.startswith("text/"):
            parts.append({"text": f"File content:\n{file_bytes.decode('utf-8', errors='replace')}"})
        else:
            import base64
            parts.append({"inline_data": {"mime_type": content_type, "data": base64.b64encode(file_bytes).decode("utf-8")}})
        result = await _call_gemini(parts, temperature=0.5)
        result.setdefault("type", "travel")
        result.setdefault("currency", "INR")
        return result
    except Exception as e:
        logging.exception("AI file import failed")
        raise HTTPException(status_code=500, detail=f"AI import failed: {str(e)}")

@router.post("/ai-describe")
async def ai_describe_itinerary(data: AIDescribeRequest, user: dict = Depends(get_current_user)):
    if not GEMINI_API_KEY:
        raise HTTPException(status_code=503, detail="AI service not configured")
    user_prompt = f"The user described their trip as follows:\n\"{data.prompt}\"\n\nGenerate a complete day-by-day itinerary with timeline events, estimated expenses, and packing list based on this description.\nInfer destination, dates, travel style, and interests from the description.\nReturn ONLY the JSON object, no other text."
    try:
        parts = [{"text": AI_SYSTEM_PROMPT}, {"text": user_prompt}]
        result = await _call_gemini(parts, temperature=0.8)
        result.setdefault("type", "travel")
        result.setdefault("currency", "INR")
        return result
    except Exception as e:
        logging.exception("AI describe failed")
        raise HTTPException(status_code=500, detail=f"AI generation failed: {str(e)}")

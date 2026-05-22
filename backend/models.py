from typing import List, Optional, Literal
import uuid
from pydantic import BaseModel, Field, EmailStr

class RegisterInput(BaseModel):
    email: EmailStr
    password: str = Field(min_length=6, max_length=128)
    name: str = Field(min_length=1, max_length=80)

class OTPSendInput(BaseModel):
    email: EmailStr
    password: str = Field(min_length=6, max_length=128)
    name: str = Field(min_length=1, max_length=80)

class OTPVerifyInput(BaseModel):
    email: EmailStr
    otp: str = Field(min_length=6, max_length=6)

class LoginInput(BaseModel):
    email: EmailStr
    password: str

class ProfileUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=80)
    phone: Optional[str] = Field(None, max_length=20)
    city: Optional[str] = Field(None, max_length=80)
    profile_image: Optional[str] = Field(None, max_length=500)

class AdminUserUpdate(BaseModel):
    role: Optional[Literal["user", "admin"]] = None
    disabled: Optional[bool] = None

class InquiryStatusUpdate(BaseModel):
    status: Literal["new", "contacted", "resolved", "archived"]

class TimelineEvent(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    day_index: int = 0
    time: str = ""  # HH:MM
    title: str
    location: str = ""
    lat: Optional[float] = None
    lng: Optional[float] = None
    notes: str = ""
    category: str = "activity"  # activity|food|transport|stay|meeting

class ExpenseItem(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    category: str = "other"
    description: str
    amount: float = 0.0
    currency: str = "USD"
    date: Optional[str] = None

class PackingItem(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    text: str
    category: str = "general"
    packed: bool = False

class ItineraryBase(BaseModel):
    title: str = Field(min_length=1, max_length=120)
    type: Literal["travel", "event", "generic"] = "travel"
    destination: str = ""
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    description: str = ""
    cover_emoji: str = ""
    budget_limit: float = 0.0
    currency: str = "USD"

class ItineraryCreate(ItineraryBase):
    pass

class ItineraryUpdate(BaseModel):
    title: Optional[str] = None
    type: Optional[Literal["travel", "event", "generic"]] = None
    destination: Optional[str] = None
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    description: Optional[str] = None
    cover_emoji: Optional[str] = None
    budget_limit: Optional[float] = None
    currency: Optional[str] = None
    events: Optional[List[TimelineEvent]] = None
    expenses: Optional[List[ExpenseItem]] = None
    packing: Optional[List[PackingItem]] = None

class Itinerary(ItineraryBase):
    id: str
    user_id: str
    events: List[TimelineEvent] = []
    expenses: List[ExpenseItem] = []
    packing: List[PackingItem] = []
    created_at: str
    updated_at: str

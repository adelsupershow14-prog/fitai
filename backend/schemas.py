from pydantic import BaseModel, EmailStr
from typing import Optional, List, Any
from datetime import datetime

class UserRegister(BaseModel):
    email: EmailStr
    username: str
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: int
    email: str
    username: str
    name: Optional[str] = None
    tokens: int
    streak: int
    active_avatar: str
    is_onboarded: bool
    is_voice_enabled: bool
    last_workout_date: Optional[str] = None
    goal: Optional[str] = None
    level: Optional[str] = None
    frequency: Optional[int] = None
    inventory: List[str] = []
    workoutPlan: Optional[Any] = None

    class Config:
        from_attributes = True

class PlanUpdate(BaseModel):
    name: Optional[str] = None
    goal: str
    level: str
    frequency: int
    weeklyPlan: Optional[Any] = None

class PlanGenerateRequest(BaseModel):
    goal: str
    level: Optional[str] = "intermediate"
    frequency: Optional[int] = 3

class ProfileUpdate(BaseModel):
    name: Optional[str] = None
    goal: Optional[str] = None
    level: Optional[str] = None
    frequency: Optional[int] = None

class VoiceUpdate(BaseModel):
    is_voice_enabled: bool

class ShopPurchase(BaseModel):
    avatar_id: str
    price: int

class EquipAvatar(BaseModel):
    avatar_id: str

class WorkoutRecord(BaseModel):
    exercise_name: str
    reps_count: int
    perfect_reps_count: int

class WorkoutHistoryItem(BaseModel):
    id: int
    exercise: str
    reps: int
    accuracy: int
    tokensEarned: int
    date: str

    class Config:
        from_attributes = True

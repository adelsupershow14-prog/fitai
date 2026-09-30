import os
from sqlalchemy import create_engine, Column, Integer, String, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship
from datetime import datetime

# Absolute path to database.db in the backend folder
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.path.join(BASE_DIR, "database.db")
SQLITE_DATABASE_URL = f"sqlite:///{DB_PATH.replace(os.sep, '/')}"

engine = create_engine(
    SQLITE_DATABASE_URL, connect_args={"check_same_thread": False}
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    username = Column(String, nullable=False)
    password_hash = Column(String, nullable=False)
    tokens = Column(Integer, default=0)
    streak = Column(Integer, default=1)
    active_avatar = Column(String, default="avatar_cyberpunk")
    is_onboarded = Column(Boolean, default=False)
    is_voice_enabled = Column(Boolean, default=True)
    last_workout_date = Column(String, nullable=True)
    goal = Column(String, default="muscle")
    level = Column(String, default="intermediate")
    frequency = Column(Integer, default=3)
    created_at = Column(DateTime, default=datetime.utcnow)

    plans = relationship("WorkoutPlan", back_populates="user", cascade="all, delete-orphan")
    avatars = relationship("UserAvatar", back_populates="user", cascade="all, delete-orphan")
    history = relationship("WorkoutHistory", back_populates="user", cascade="all, delete-orphan")

class WorkoutPlan(Base):
    __tablename__ = "workout_plans"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    goal = Column(String, nullable=False)
    level = Column(String, nullable=False)
    frequency = Column(Integer, nullable=False)
    plan_data_json = Column(Text, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = relationship("User", back_populates="plans")

class UserAvatar(Base):
    __tablename__ = "user_avatars"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    avatar_id = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="avatars")

class WorkoutHistory(Base):
    __tablename__ = "workout_history"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    exercise = Column(String, nullable=False)
    reps = Column(Integer, nullable=False)
    accuracy = Column(Integer, nullable=False)
    tokens_earned = Column(Integer, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="history")

# Create tables
Base.metadata.create_all(bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

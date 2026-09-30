import json
import hashlib
from datetime import datetime, timedelta
from typing import List, Optional
from fastapi import FastAPI, Depends, HTTPException, Header, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from .database import get_db, engine, Base, User, WorkoutPlan, UserAvatar, WorkoutHistory, DB_PATH
from .schemas import (
    UserRegister,
    UserLogin,
    UserResponse,
    PlanUpdate,
    PlanGenerateRequest,
    ProfileUpdate,
    VoiceUpdate,
    ShopPurchase,
    EquipAvatar,
    WorkoutRecord,
    WorkoutHistoryItem,
)
from .plan_generator import generate_workout_plan

# Automatically initialize and verify SQLite schema
Base.metadata.create_all(bind=engine)

app = FastAPI(title="FitAI Backend API", version="2.0.0")

# Enable CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode("utf-8")).hexdigest()

def get_user_profile_dict(user: User, db: Session) -> dict:
    avatars = db.query(UserAvatar).filter(UserAvatar.user_id == user.id).all()
    # 3 free default emoji avatars are always in inventory
    free_ids = ["emoji_fox", "emoji_robot", "emoji_lion"]
    purchased_ids = [a.avatar_id for a in avatars]
    inventory = list(dict.fromkeys(free_ids + purchased_ids))

    active_av = user.active_avatar
    if not active_av or active_av in ["avatar_default", "avatar_cyberpunk", "avatar_ninja", "avatar_gold"]:
        active_av = "emoji_fox"

    latest_plan = (
        db.query(WorkoutPlan)
        .filter(WorkoutPlan.user_id == user.id)
        .order_by(WorkoutPlan.id.desc())
        .first()
    )
    workout_plan = json.loads(latest_plan.plan_data_json) if latest_plan else None

    # Calculate real stats from workout history
    history = db.query(WorkoutHistory).filter(WorkoutHistory.user_id == user.id).all()
    total_workouts = len(history)
    total_reps = sum(h.reps for h in history)

    return {
        "id": user.id,
        "email": user.email,
        "username": user.username,
        "name": user.username,
        "tokens": user.tokens,
        "streak": user.streak,
        "active_avatar": active_av,
        "is_onboarded": user.is_onboarded,
        "is_voice_enabled": user.is_voice_enabled,
        "last_workout_date": user.last_workout_date,
        "goal": user.goal,
        "level": user.level,
        "frequency": user.frequency,
        "totalWorkouts": total_workouts,
        "totalReps": total_reps,
        "inventory": inventory,
        "workoutPlan": workout_plan,
    }

@app.get("/")
def read_root():
    return {"status": "ok", "message": "FitAI FastAPI Backend is running"}

# 1. REGISTER
@app.post("/api/auth/register")
def register(user_data: UserRegister, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.email == user_data.email.lower().strip()).first()
    if existing:
        raise HTTPException(status_code=400, detail="Пользователь с таким Email уже существует")

    pwd_hash = hash_password(user_data.password)
    new_user = User(
        email=user_data.email.lower().strip(),
        username=user_data.username.strip(),
        password_hash=pwd_hash,
        tokens=0,
        streak=1,
        active_avatar="emoji_fox",
        is_onboarded=False,
        is_voice_enabled=True,
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    # Insert default 3 free emoji avatars into inventory
    for aid in ["emoji_fox", "emoji_robot", "emoji_lion"]:
        db.add(UserAvatar(user_id=new_user.id, avatar_id=aid))
    db.commit()

    user_dict = get_user_profile_dict(new_user, db)
    return {"token": str(new_user.id), "user": user_dict}

# 2. LOGIN
@app.post("/api/auth/login")
def login(user_data: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == user_data.email.lower().strip()).first()
    if not user:
        raise HTTPException(status_code=400, detail="Пользователь не найден")

    if user.password_hash != hash_password(user_data.password):
        raise HTTPException(status_code=400, detail="Неверный пароль")

    user_dict = get_user_profile_dict(user, db)
    return {"token": str(user.id), "user": user_dict}

# 3. GET CURRENT USER (ME)
@app.get("/api/users/me")
def get_me(authorization: Optional[str] = Header(None), db: Session = Depends(get_db)):
    if not authorization:
        raise HTTPException(status_code=401, detail="Необходима авторизация")

    user_id_str = authorization.replace("Bearer ", "").strip()
    try:
        user_id = int(user_id_str)
    except ValueError:
        raise HTTPException(status_code=401, detail="Недействительный токен")

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Пользователь не найден")

    return {"user": get_user_profile_dict(user, db)}

# 3.1 GENERATE WORKOUT PLAN BASED ON GOAL
@app.post("/api/plans/generate")
def generate_plan_endpoint(req: PlanGenerateRequest):
    plan = generate_workout_plan(req.goal, req.level or "intermediate", req.frequency or 3)
    return {"success": True, "plan": plan}

# 4. SAVE WORKOUT PLAN (Onboarding or Single-Page Edit)
@app.post("/api/users/{user_id}/plan")
def save_plan(user_id: int, plan_req: PlanUpdate, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Пользователь не найден")

    if plan_req.name and plan_req.name.strip():
        user.username = plan_req.name.strip()
    user.goal = plan_req.goal
    user.level = plan_req.level
    user.frequency = plan_req.frequency
    user.is_onboarded = True

    # If weeklyPlan is not provided or incomplete, auto-generate on FastAPI backend
    weekly_plan = plan_req.weeklyPlan
    if not weekly_plan or not isinstance(weekly_plan, dict) or not weekly_plan.get("schedule"):
        weekly_plan = generate_workout_plan(plan_req.goal, plan_req.level, plan_req.frequency)

    plan_json = json.dumps(weekly_plan)
    new_plan = WorkoutPlan(
        user_id=user.id,
        goal=plan_req.goal,
        level=plan_req.level,
        frequency=plan_req.frequency,
        plan_data_json=plan_json,
    )
    db.add(new_plan)
    db.commit()

    return {"success": True, "user": get_user_profile_dict(user, db)}

# 4.1 UPDATE PROFILE (Name, Goal, Level, Frequency)
@app.patch("/api/users/profile")
def update_profile(prof: ProfileUpdate, authorization: Optional[str] = Header(None), db: Session = Depends(get_db)):
    if not authorization:
        raise HTTPException(status_code=401, detail="Необходима авторизация")

    user_id_str = authorization.replace("Bearer ", "").strip()
    try:
        user_id = int(user_id_str)
    except ValueError:
        raise HTTPException(status_code=401, detail="Недействительный токен")

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Пользователь не найден")

    if prof.name and prof.name.strip():
        user.username = prof.name.strip()
    if prof.goal:
        user.goal = prof.goal
    if prof.level:
        user.level = prof.level
    if prof.frequency:
        user.frequency = prof.frequency

    # Auto-regenerate workout plan if goal, level, or frequency changed
    if prof.goal or prof.level or prof.frequency:
        updated_goal = user.goal or "muscle"
        updated_level = user.level or "intermediate"
        updated_freq = user.frequency or 3
        new_weekly_plan = generate_workout_plan(updated_goal, updated_level, updated_freq)
        new_plan = WorkoutPlan(
            user_id=user.id,
            goal=updated_goal,
            level=updated_level,
            frequency=updated_freq,
            plan_data_json=json.dumps(new_weekly_plan),
        )
        db.add(new_plan)

    db.commit()
    return {"success": True, "user": get_user_profile_dict(user, db)}

# 4.2 ADMIN: VIEW ALL USERS IN DB
@app.get("/api/admin/users")
def get_all_users(db: Session = Depends(get_db)):
    users = db.query(User).order_by(User.id.asc()).all()
    return {"total": len(users), "users": [get_user_profile_dict(u, db) for u in users]}

# 5. TOGGLE VOICE SETTING
@app.post("/api/users/{user_id}/voice")
def toggle_voice(user_id: int, voice_req: VoiceUpdate, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Пользователь не найден")

    user.is_voice_enabled = voice_req.is_voice_enabled
    db.commit()
    return {"success": True, "is_voice_enabled": user.is_voice_enabled}

# 6. BUY AVATAR
@app.post("/api/shop/buy")
def buy_avatar(purchase: ShopPurchase, authorization: Optional[str] = Header(None), db: Session = Depends(get_db)):
    if not authorization:
        raise HTTPException(status_code=401, detail="Необходима авторизация")

    user_id = int(authorization.replace("Bearer ", "").strip())
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Пользователь не найден")

    # Define avatar prices
    prices = {
        "avatar_icon1": 100,
        "avatar_icon2": 200,
        "avatar_icon3": 300,
        "avatar_cyberpunk": 50,
        "avatar_ninja": 120,
        "avatar_gold": 250,
        "avatar_titan": 400,
        "avatar_samurai": 600,
    }
    price = prices.get(purchase.avatar_id, purchase.price)

    if user.tokens < price:
        raise HTTPException(status_code=400, detail="Недостаточно токенов")

    user.tokens -= price
    user.active_avatar = purchase.avatar_id

    # Add to inventory if not exists
    existing = db.query(UserAvatar).filter(UserAvatar.user_id == user.id, UserAvatar.avatar_id == purchase.avatar_id).first()
    if not existing:
        db.add(UserAvatar(user_id=user.id, avatar_id=purchase.avatar_id))

    db.commit()
    return {"success": True, "user": get_user_profile_dict(user, db)}

# 7. EQUIP AVATAR
@app.post("/api/shop/equip")
def equip_avatar(equip: EquipAvatar, authorization: Optional[str] = Header(None), db: Session = Depends(get_db)):
    if not authorization:
        raise HTTPException(status_code=401, detail="Необходима авторизация")

    user_id = int(authorization.replace("Bearer ", "").strip())
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Пользователь не найден")

    # Free default avatars are always allowed
    FREE_AVATARS = {"emoji_fox", "emoji_robot", "emoji_lion", "avatar_default"}
    if equip.avatar_id not in FREE_AVATARS:
        owned = db.query(UserAvatar).filter(UserAvatar.user_id == user.id, UserAvatar.avatar_id == equip.avatar_id).first()
        if not owned:
            raise HTTPException(status_code=400, detail="Аватарка еще не разблокирована")

    user.active_avatar = equip.avatar_id
    db.commit()
    return {"success": True, "active_avatar": user.active_avatar, "user": get_user_profile_dict(user, db)}

# 8. RECORD WORKOUT COMPLETION
@app.post("/api/workouts/record")
def record_workout(rec: WorkoutRecord, authorization: Optional[str] = Header(None), db: Session = Depends(get_db)):
    if not authorization:
        raise HTTPException(status_code=401, detail="Необходима авторизация")

    user_id = int(authorization.replace("Bearer ", "").strip())
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Пользователь не найден")

    today = datetime.utcnow().strftime("%Y-%m-%d")
    streak = user.streak or 1

    if user.last_workout_date:
        try:
            last_d = datetime.strptime(user.last_workout_date, "%Y-%m-%d")
            curr_d = datetime.strptime(today, "%Y-%m-%d")
            diff = (curr_d - last_d).days
            if diff == 1:
                streak += 1
            elif diff > 1:
                streak = 1
        except Exception:
            streak = 1
    else:
        streak = 1

    accuracy_pct = round((rec.perfect_reps_count / rec.reps_count) * 100) if rec.reps_count > 0 else 100
    tokens_earned = round(rec.reps_count * 2 + accuracy_pct * 0.5 + streak * 5)

    user.tokens += tokens_earned
    user.streak = streak
    user.last_workout_date = today

    history_item = WorkoutHistory(
        user_id=user.id,
        exercise=rec.exercise_name,
        reps=rec.reps_count,
        accuracy=accuracy_pct,
        tokens_earned=tokens_earned,
    )
    db.add(history_item)
    db.commit()

    return {
        "success": True,
        "tokensEarned": tokens_earned,
        "accuracyPct": accuracy_pct,
        "streak": streak,
        "user": get_user_profile_dict(user, db),
    }

# 9. GET WORKOUT HISTORY
@app.get("/api/workouts/history/{user_id}")
def get_history(user_id: int, db: Session = Depends(get_db)):
    rows = (
        db.query(WorkoutHistory)
        .filter(WorkoutHistory.user_id == user_id)
        .order_by(WorkoutHistory.id.desc())
        .limit(20)
        .all()
    )
    result = []
    for r in rows:
        result.append({
            "id": r.id,
            "exercise": r.exercise,
            "reps": r.reps,
            "accuracy": r.accuracy,
            "tokensEarned": r.tokens_earned,
            "date": r.created_at.strftime("%d %b, %H:%M") if r.created_at else "",
        })
    return {"history": result}

AVATAR_EMOJIS = {
    "emoji_fox": "🦊",
    "emoji_robot": "🤖",
    "emoji_lion": "🦁",
    "avatar_icon1": "/icons/icon1.jpeg",
    "avatar_icon2": "/icons/icon2.jpeg",
    "avatar_icon3": "/icons/icon3.jpeg",
    "avatar_default": "🦊",
    "avatar_cyberpunk": "🤖",
    "avatar_ninja": "🦁",
    "avatar_gold": "👑",
    "avatar_titan": "🦾",
    "avatar_samurai": "⚔️",
}

def calculate_user_rating(user: User, db: Session) -> dict:
    history = db.query(WorkoutHistory).filter(WorkoutHistory.user_id == user.id).all()
    total_workouts = len(history)
    total_reps = sum(h.reps for h in history)

    accuracies = [h.accuracy for h in history if h.accuracy is not None]
    avg_accuracy = round(sum(accuracies) / len(accuracies), 1) if accuracies else (94.0 if user.is_onboarded else 80.0)

    # Fullness: completed sets without early drop
    full_sets = sum(1 for h in history if (h.accuracy or 0) >= 80 and h.reps >= 8)

    streak = user.streak or 1

    # 1. Frequency (стрик дней + количество тренировок)
    freq_score = (streak * 75) + (total_workouts * 50)
    # 2. Completeness (объем повторов + полные завершенные подходы)
    comp_score = (total_reps * 8) + (full_sets * 60)
    # 3. Accuracy (средний процент правильной техники без режима ошибок)
    acc_multiplier = avg_accuracy / 100.0
    acc_score = round(acc_multiplier * (total_reps * 6 + 250))
    # 4. Token bonus
    token_bonus = (user.tokens or 0) // 3

    total_score = max(100, freq_score + comp_score + acc_score + token_bonus)

    if total_score >= 2500:
        tier = "Легенда"
        tier_color = "text-purple-400"
    elif total_score >= 1400:
        tier = "Мастер"
        tier_color = "text-amber-400"
    elif total_score >= 700:
        tier = "Атлет"
        tier_color = "text-blue-400"
    else:
        tier = "Новичок"
        tier_color = "text-emerald-400"

    return {
        "score": total_score,
        "total_workouts": total_workouts,
        "total_reps": total_reps,
        "avg_accuracy": avg_accuracy,
        "full_sets": full_sets,
        "streak": streak,
        "tier": tier,
        "tier_color": tier_color,
    }

# 10. GLOBAL LEADERBOARD
@app.get("/api/leaderboard")
def get_leaderboard(authorization: Optional[str] = Header(None), db: Session = Depends(get_db)):
    current_user_id = None
    if authorization:
        try:
            current_user_id = int(authorization.replace("Bearer ", "").strip())
        except Exception:
            current_user_id = None

    users = db.query(User).all()
    entries = []

    for u in users:
        rating = calculate_user_rating(u, db)
        avatar_key = u.active_avatar or "emoji_fox"
        emoji = AVATAR_EMOJIS.get(avatar_key, "🦊")

        entries.append({
            "user_id": u.id,
            "username": u.username or f"Атлет #{u.id}",
            "active_avatar": avatar_key,
            "avatar_emoji": emoji,
            "streak": rating["streak"],
            "score": rating["score"],
            "avg_accuracy": rating["avg_accuracy"],
            "total_workouts": rating["total_workouts"],
            "total_reps": rating["total_reps"],
            "tier": rating["tier"],
            "tier_color": rating["tier_color"],
            "is_current_user": (u.id == current_user_id),
        })

    # Sort descending by score
    entries.sort(key=lambda x: x["score"], reverse=True)

    # Assign positions (ranks)
    current_user_rank = None
    for idx, entry in enumerate(entries, start=1):
        entry["rank"] = idx
        if entry["is_current_user"]:
            current_user_rank = entry

    return {
        "leaderboard": entries,
        "total": len(entries),
        "currentUser": current_user_rank,
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=10000, reload=True)

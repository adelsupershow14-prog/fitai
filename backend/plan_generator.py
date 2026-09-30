"""
FitAI Backend - Workout Plan Generator
Intelligent exercise combination engine tailored to user goals:
- Weight Loss / Cardio: High tempo, Jumping Jacks, fast squats, plank (short rest, high intensity)
- Legs / Muscle / Strength: Classic squats with strict depth control, pushups, core stabilization (longer rest, maximum hypertrophy)
- Posture / Spine: Core plank, arm raises for thoracic mobility & posture, light squats with strict upright spine
"""

EXERCISE_CATALOG = {
    "squats": {
        "id": "squats",
        "name": "Классические приседания",
        "type": "reps",
        "icon": "🏋️‍♂️",
        "baseReps": 12,
        "description": "Контроль угла сгибания коленей (до 90°) и ровной линии спины",
        "techniqueFocus": "Держите спину ровной, не сводите колени внутрь, опускайтесь на пятки",
        "targetErrorCheck": "Спина округлилась / Сведение коленей / Недостаточная глубина",
    },
    "plank": {
        "id": "plank",
        "name": "Планка (Статика)",
        "type": "hold",
        "icon": "⏱️",
        "baseSeconds": 35,
        "description": "Удержание ровной линии корпуса (плечо - таз - голеностоп)",
        "techniqueFocus": "Идеально прямая линия тела без прогиба поясницы и задирания таза",
        "targetErrorCheck": "Провис поясницы / Подъем таза вверх / Потеря горизонтали",
    },
    "pushups": {
        "id": "pushups",
        "name": "Классические отжимания",
        "type": "reps",
        "icon": "🤸‍♂️",
        "baseReps": 10,
        "description": "Контроль сгибания локтей до 90° и ровной линии позвоночника",
        "techniqueFocus": "Прямая планка тела, касание грудью нижней точки, локти под 45-75°",
        "targetErrorCheck": "Прогиб поясницы / Неполная амплитуда локтей / Падение головы",
    },
    "jumping_jacks": {
        "id": "jumping_jacks",
        "name": "Jumping Jacks (Прыжки)",
        "type": "reps",
        "icon": "⚡",
        "baseReps": 25,
        "description": "Динамический подсчет синхронного разведения рук и ног в темпе",
        "techniqueFocus": "Руки соединяются прямо над головой, ноги прыгают шире плеч",
        "targetErrorCheck": "Руки не поднимаются выше головы / Узкое разведение ног / Рассинхрон",
    },
    "arm_raises": {
        "id": "arm_raises",
        "name": "Подъемы рук для осанки",
        "type": "reps",
        "icon": "🧘",
        "baseReps": 12,
        "description": "Контроль подъема прямых рук вверх с удержанием нейтральной спины",
        "techniqueFocus": "Подъем рук строго вертикально над головой без компенсаторного прогиба поясницы",
        "targetErrorCheck": "Прогиб в пояснице / Согнутые локти / Неполный подъем рук",
    },
}

GOAL_CONFIG = {
    "loss": {
        "key": "loss",
        "title": "Сбросить вес (Кардио)",
        "icon": "🔥",
        "description": "Высокий темп, минимальные паузы между сетами, акцент на жиросжигание и выносливость",
        "restSeconds": {
            "beginner": 20,
            "intermediate": 15,
            "advanced": 12,
        },
    },
    "muscle": {
        "key": "muscle",
        "title": "Накачать ноги & Сила",
        "icon": "💪",
        "description": "Строгий контроль глубокого седа 90°, гипертрофия мышц ног и силовая база",
        "restSeconds": {
            "beginner": 50,
            "intermediate": 40,
            "advanced": 35,
        },
    },
    "posture": {
        "key": "posture",
        "title": "Улучшить осанку (Здоровая спина)",
        "icon": "🧘",
        "description": "Укрепление мышечного корсета, снятие спазмов плечевого пояса, стабилизация позвоночника",
        "restSeconds": {
            "beginner": 35,
            "intermediate": 25,
            "advanced": 20,
        },
    },
}

LEVEL_CONFIG = {
    "beginner": {
        "label": "Новичок",
        "sets": 2,
        "repsMult": 0.85,
        "holdMult": 0.8,
    },
    "intermediate": {
        "label": "Любитель",
        "sets": 3,
        "repsMult": 1.2,
        "holdMult": 1.2,
    },
    "advanced": {
        "label": "Продвинутый",
        "sets": 4,
        "repsMult": 1.6,
        "holdMult": 1.6,
    },
}


def build_exercise_item(ex_id: str, level: str, goal: str, custom_name: str = None, tempo: str = "Обычный") -> dict:
    catalog_item = EXERCISE_CATALOG.get(ex_id, EXERCISE_CATALOG["squats"]).copy()
    lvl = LEVEL_CONFIG.get(level, LEVEL_CONFIG["intermediate"])
    g_conf = GOAL_CONFIG.get(goal, GOAL_CONFIG["muscle"])

    sets = lvl["sets"]
    rest_time = g_conf["restSeconds"].get(level, 30)

    if catalog_item["type"] == "hold":
        base_sec = catalog_item["baseSeconds"]
        target_reps = round(base_sec * lvl["holdMult"])
    else:
        base_reps = catalog_item["baseReps"]
        # In weight loss goal, jumping jacks and fast squats have higher reps
        if goal == "loss" and ex_id == "jumping_jacks":
            target_reps = round(base_reps * lvl["repsMult"] * 1.2)
        elif goal == "loss" and ex_id == "squats":
            target_reps = round(base_reps * lvl["repsMult"] * 1.1)
        elif goal == "posture" and ex_id == "squats":
            # For posture, squats are lighter with focus on spine control
            target_reps = round(base_reps * lvl["repsMult"] * 0.85)
        else:
            target_reps = round(base_reps * lvl["repsMult"])

    item = {
        "id": catalog_item["id"],
        "name": custom_name or catalog_item["name"],
        "type": catalog_item["type"],
        "icon": catalog_item["icon"],
        "description": catalog_item["description"],
        "techniqueFocus": catalog_item["techniqueFocus"],
        "targetErrorCheck": catalog_item["targetErrorCheck"],
        "targetSets": sets,
        "targetReps": target_reps,
        "restTime": rest_time,
        "tempo": tempo,
        "completed": False,
    }
    return item


def generate_workout_plan(goal: str = "muscle", level: str = "intermediate", frequency: int = 3) -> dict:
    """
    Generates a personalized weekly workout schedule based on goal, level, and frequency.
    """
    # Normalize goal key
    goal_key = goal.lower()
    if "loss" in goal_key or "cardio" in goal_key or "похуден" in goal_key or "вес" in goal_key:
        norm_goal = "loss"
    elif "posture" in goal_key or "осанк" in goal_key or "спин" in goal_key:
        norm_goal = "posture"
    else:
        norm_goal = "muscle"

    norm_level = level.lower() if level and level.lower() in LEVEL_CONFIG else "intermediate"
    freq = int(frequency) if frequency and 1 <= int(frequency) <= 7 else 3

    goal_meta = GOAL_CONFIG[norm_goal]
    level_meta = LEVEL_CONFIG[norm_level]

    schedule = []

    for day in range(1, freq + 1):
        if norm_goal == "loss":
            # Weight Loss / Cardio: Jumping Jacks, fast squats, plank (short rests, high tempo)
            if day % 3 == 1:
                day_title = f"День {day}: Кардио-интенсив (Jumping Jacks & Быстрые приседания)"
                exercises = [
                    build_exercise_item("jumping_jacks", norm_level, norm_goal, "Jumping Jacks (Кардио-спринт)", tempo="Высокий темп"),
                    build_exercise_item("squats", norm_level, norm_goal, "Быстрые приседания (Жиросжигание)", tempo="Динамичный"),
                ]
            elif day % 3 == 2:
                day_title = f"День {day}: Жиросжигание & Кор (Планка & Прыжки)"
                exercises = [
                    build_exercise_item("plank", norm_level, norm_goal, "Планка (Стабилизация кора)", tempo="Статика"),
                    build_exercise_item("jumping_jacks", norm_level, norm_goal, "Jumping Jacks (Прыжковый интервал)", tempo="Высокий темп"),
                ]
            else:
                day_title = f"День {day}: HIIT Фулбоди (Прыжки + Приседания + Планка)"
                exercises = [
                    build_exercise_item("jumping_jacks", norm_level, norm_goal, "Jumping Jacks", tempo="Высокий темп"),
                    build_exercise_item("squats", norm_level, norm_goal, "Быстрые приседания", tempo="Динамичный"),
                    build_exercise_item("plank", norm_level, norm_goal, "Планка (Финишное удержание)", tempo="Статика"),
                ]

        elif norm_goal == "muscle":
            # Legs / Strength / Muscle: Classic squats with strict depth control, pushups
            if day % 3 == 1:
                day_title = f"День {day}: Сила ног (Классические приседания с глубоким седом)"
                exercises = [
                    build_exercise_item("squats", norm_level, norm_goal, "Классические приседания (Глубина 90°)", tempo="Контролируемый"),
                    build_exercise_item("plank", norm_level, norm_goal, "Планка (Базовый кор)", tempo="Статика"),
                ]
            elif day % 3 == 2:
                day_title = f"День {day}: Верх тела & Сила (Отжимания со строгим AI-контролем)"
                exercises = [
                    build_exercise_item("pushups", norm_level, norm_goal, "Классические отжимания (Полная амплитуда)", tempo="Силовой"),
                    build_exercise_item("plank", norm_level, norm_goal, "Планка (Жесткий упор)", tempo="Статика"),
                ]
            else:
                day_title = f"День {day}: Силовой Фулбоди (Приседания + Отжимания)"
                exercises = [
                    build_exercise_item("squats", norm_level, norm_goal, "Классические приседания", tempo="Контролируемый"),
                    build_exercise_item("pushups", norm_level, norm_goal, "Классические отжимания", tempo="Силовой"),
                ]

        else: # posture
            # Posture: Plank, Arm Raises for posture, light squats with strict back angle
            if day % 3 == 1:
                day_title = f"День {day}: Кор & Раскрытие плеч (Планка + Подъемы рук)"
                exercises = [
                    build_exercise_item("plank", norm_level, norm_goal, "Планка (Идеальная линия плечо-таз)", tempo="Статика"),
                    build_exercise_item("arm_raises", norm_level, norm_goal, "Подъемы рук для осанки (Без прогиба)", tempo="Плавный"),
                ]
            elif day % 3 == 2:
                day_title = f"День {day}: Ровная спина & Баланс (Подъемы рук + Приседания)"
                exercises = [
                    build_exercise_item("arm_raises", norm_level, norm_goal, "Подъемы рук для осанки", tempo="Плавный"),
                    build_exercise_item("squats", norm_level, norm_goal, "Легкие приседания (Контроль вертикальной спины)", tempo="Умеренный"),
                ]
            else:
                day_title = f"День {day}: Комплекс идеальной осанки (Планка + Подъемы рук + Приседания)"
                exercises = [
                    build_exercise_item("plank", norm_level, norm_goal, "Планка (Линия позвоночника)", tempo="Статика"),
                    build_exercise_item("arm_raises", norm_level, norm_goal, "Подъемы рук для осанки", tempo="Плавный"),
                    build_exercise_item("squats", norm_level, norm_goal, "Легкие приседания с ровной спиной", tempo="Умеренный"),
                ]

        schedule.append({
            "dayNumber": day,
            "dayTitle": day_title,
            "exercises": exercises,
        })

    return {
        "goal": goal_meta["title"],
        "goalKey": norm_goal,
        "level": level_meta["label"],
        "levelKey": norm_level,
        "frequency": f"{freq} дня в неделю",
        "frequencyNumber": freq,
        "description": goal_meta["description"],
        "restSeconds": goal_meta["restSeconds"].get(norm_level, 30),
        "schedule": schedule,
    }

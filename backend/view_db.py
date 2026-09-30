"""
FitAI Database Viewer CLI
Скрипт для удобного просмотра данных в SQLite базе (fitness.db).
Запуск: python backend/view_db.py
"""

import sqlite3
import os
import sys

# Обеспечиваем корректный вывод UTF-8 в консоли Windows
if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass

# Путь к БД
BASE_DIR = os.path.dirname(__file__)
DB_PATH = os.path.join(BASE_DIR, "database.db")
if not os.path.exists(DB_PATH) and os.path.exists(os.path.join(BASE_DIR, "fitness.db")):
    DB_PATH = os.path.join(BASE_DIR, "fitness.db")

def print_separator(char="=", length=80):
    print(char * length)

def view_database():
    if not os.path.exists(DB_PATH):
        print(f"❌ База данных не найдена по пути: {DB_PATH}")
        return

    con = sqlite3.connect(DB_PATH)
    cur = con.cursor()

    print_separator("=")
    print(f"📊 FIT.AI — ПРОСМОТР ДАННЫХ В SQLITE БАЗЕ ({os.path.basename(DB_PATH)})")
    print_separator("=")
    print(f"Путь к файлу: {os.path.abspath(DB_PATH)}\n")

    # 1. ТАБЛИЦА ПОЛЬЗОВАТЕЛЕЙ (users)
    print("👤 1. ТАБЛИЦА: users (Пользователи)")
    print_separator("-")
    try:
        cur.execute("SELECT id, email, username, tokens, streak, goal, level, frequency, is_onboarded, created_at FROM users")
        users = cur.fetchall()
        if not users:
            print("  (Таблица пуста)")
        else:
            fmt = "  {:<4} | {:<25} | {:<15} | {:<6} | {:<6} | {:<12} | {:<12} | {:<4} | {:<10}"
            print(fmt.format("ID", "Email", "Имя (Username)", "Токены", "Стрик", "Цель", "Уровень", "Дни", "Онбординг"))
            print("  " + "-" * 105)
            for u in users:
                onboarded_str = "Да" if u[8] else "Нет"
                print(fmt.format(u[0], str(u[1]), str(u[2]), u[3], u[4], str(u[5]), str(u[6]), u[7], onboarded_str))
    except Exception as e:
        print(f"  Ошибка чтения users: {e}")

    print("\n")

    # 2. ТАБЛИЦА ПЛАНОВ ТРЕНИРОВОК (workout_plans)
    print("📋 2. ТАБЛИЦА: workout_plans (Планы тренировок)")
    print_separator("-")
    try:
        cur.execute("SELECT id, user_id, goal, level, frequency, updated_at FROM workout_plans")
        plans = cur.fetchall()
        if not plans:
            print("  (Планы пока не созданы)")
        else:
            fmt = "  {:<4} | {:<8} | {:<15} | {:<15} | {:<5} | {:<20}"
            print(fmt.format("ID", "User ID", "Цель", "Уровень", "Дней", "Обновлено"))
            print("  " + "-" * 75)
            for p in plans:
                print(fmt.format(p[0], p[1], str(p[2]), str(p[3]), p[4], str(p[5])[:19]))
    except Exception as e:
        print(f"  Ошибка чтения workout_plans: {e}")

    print("\n")

    # 3. ТАБЛИЦА ИСТОРИИ ТРЕНИРОВОК (workout_history)
    print("🏋️ 3. ТАБЛИЦА: workout_history (История выполненных тренировок)")
    print_separator("-")
    try:
        cur.execute("SELECT id, user_id, exercise, reps, accuracy, tokens_earned, created_at FROM workout_history ORDER BY id DESC LIMIT 15")
        history = cur.fetchall()
        if not history:
            print("  (История тренировок пуста)")
        else:
            fmt = "  {:<4} | {:<8} | {:<16} | {:<8} | {:<10} | {:<14} | {:<20}"
            print(fmt.format("ID", "User ID", "Упражнение", "Повторы", "Точность", "Награда (FIT)", "Дата"))
            print("  " + "-" * 90)
            for h in history:
                print(fmt.format(h[0], h[1], str(h[2]), h[3], f"{h[4]}%", f"+{h[5]}", str(h[6])[:19]))
    except Exception as e:
        print(f"  Ошибка чтения workout_history: {e}")

    print("\n")

    # 4. ТАБЛИЦА АВАТАРОВ (user_avatars)
    print("👾 4. ТАБЛИЦА: user_avatars (Инвентарь скинов)")
    print_separator("-")
    try:
        cur.execute("SELECT id, user_id, avatar_id FROM user_avatars")
        avatars = cur.fetchall()
        if not avatars:
            print("  (Инвентарь пуст)")
        else:
            fmt = "  {:<4} | {:<8} | {:<25}"
            print(fmt.format("ID", "User ID", "Аватар ID"))
            print("  " + "-" * 42)
            for a in avatars:
                print(fmt.format(a[0], a[1], str(a[2])))
    except Exception as e:
        print(f"  Ошибка чтения user_avatars: {e}")

    print_separator("=")
    con.close()

if __name__ == "__main__":
    view_database()

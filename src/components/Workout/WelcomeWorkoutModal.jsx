import React, { useState, useMemo } from 'react';
import { UserAvatarDisplay } from '../Common/UserAvatarDisplay';
import {
  Sparkles,
  Flame,
  Coins,
  Play,
  Calendar,
  Clock,
  Dumbbell,
  CheckCircle2,
  ChevronRight,
  Target,
  Trophy,
  Coffee,
  X,
  Info,
} from 'lucide-react';
import { EXERCISE_DETECTOR_CONFIG } from '../../services/pose';

const WEEKDAY_NAMES = [
  { short: 'Пн', full: 'Понедельник', dayIndex: 0 },
  { short: 'Вт', full: 'Вторник', dayIndex: 1 },
  { short: 'Ср', full: 'Среда', dayIndex: 2 },
  { short: 'Чт', full: 'Четверг', dayIndex: 3 },
  { short: 'Пт', full: 'Пятница', dayIndex: 4 },
  { short: 'Сб', full: 'Суббота', dayIndex: 5 },
  { short: 'Вс', full: 'Воскресенье', dayIndex: 6 },
];

export function WelcomeWorkoutModal({
  isOpen,
  onClose,
  userProfile,
  onStartWorkout,
}) {
  if (!isOpen) return null;

  const currentName = userProfile?.name || userProfile?.username || 'Атлет';
  const streak = userProfile?.streak || 1;
  const tokens = userProfile?.tokens || 0;
  const activeAvatar = userProfile?.active_avatar || 'emoji_fox';
  const frequency = userProfile?.frequency || 3;
  const level = userProfile?.level || 'intermediate';
  const goal = userProfile?.workoutPlan?.goal || userProfile?.goal || 'muscle';

  // Calculate current weekday (0 = Monday, ..., 6 = Sunday)
  const now = new Date();
  const currentDayOfWeekIndex = (now.getDay() + 6) % 7;
  const todayMeta = WEEKDAY_NAMES[currentDayOfWeekIndex];

  // Schedule from SQLite database
  const rawSchedule = userProfile?.workoutPlan?.schedule || [];

  // Map 7 calendar days to user's weekly training schedule
  const calendarWeek = useMemo(() => {
    const freq = parseInt(frequency) || 3;
    let trainingDayIndices = [0, 2, 4]; // default 3 days: Mon, Wed, Fri
    if (freq === 1) trainingDayIndices = [2];
    else if (freq === 2) trainingDayIndices = [1, 3];
    else if (freq === 3) trainingDayIndices = [0, 2, 4];
    else if (freq === 4) trainingDayIndices = [0, 1, 3, 5];
    else if (freq === 5) trainingDayIndices = [0, 1, 2, 3, 4];
    else if (freq === 6) trainingDayIndices = [0, 1, 2, 3, 4, 5];
    else if (freq === 7) trainingDayIndices = [0, 1, 2, 3, 4, 5, 6];

    let scheduleCounter = 0;
    return WEEKDAY_NAMES.map((wd) => {
      const isTraining = trainingDayIndices.includes(wd.dayIndex);
      const scheduleDay =
        isTraining && rawSchedule.length > 0
          ? rawSchedule[scheduleCounter % rawSchedule.length]
          : null;
      if (isTraining) scheduleCounter++;

      return {
        ...wd,
        isToday: wd.dayIndex === currentDayOfWeekIndex,
        isTraining,
        scheduleDay,
      };
    });
  }, [frequency, rawSchedule, currentDayOfWeekIndex]);

  // Today's schedule entry (if today is a rest day, default to next training day or day 1)
  const todayCalendarDay = calendarWeek.find((d) => d.isToday);
  const isRestDayToday = !todayCalendarDay?.isTraining || !todayCalendarDay?.scheduleDay;

  // Selected day to preview (defaults to today's training day, or first training day if rest day)
  const defaultSelectedDay = todayCalendarDay?.scheduleDay || rawSchedule[0] || null;
  const [selectedDayToView, setSelectedDayToView] = useState(defaultSelectedDay);

  const activeDay = selectedDayToView || defaultSelectedDay;
  const activeExercises = activeDay?.exercises || [];

  // Goal Title Helper
  const goalTitle =
    goal === 'loss'
      ? 'Сбросить вес (Кардио)'
      : goal === 'posture'
      ? 'Улучшить осанку'
      : 'Накачать ноги & Сила';

  const levelTitle =
    level === 'beginner' ? 'Новичок' : level === 'advanced' ? 'Продвинутый' : 'Любитель';

  const handleStart = () => {
    if (onStartWorkout) {
      onStartWorkout(activeDay);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-xl animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget && onClose) onClose();
      }}
    >
      <div className="relative w-full max-w-4xl max-h-[92vh] flex flex-col glass-panel rounded-3xl border border-blue-500/30 shadow-2xl bg-gray-950/95 overflow-hidden text-left">
        {/* Sticky Header with Personal Welcome */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-800/80 bg-gradient-to-r from-gray-950 via-gray-900 to-indigo-950/60 shrink-0 z-20">
          <div className="flex items-center gap-4">
            <UserAvatarDisplay avatarId={activeAvatar} size="lg" />
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                  С возвращением, {currentName}! 👋
                </h2>
              </div>
              <p className="text-xs sm:text-sm text-gray-400 mt-0.5">
                Ваш персональный ИИ-план на неделю готов. Проведите тренировку с голосовым контролем!
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Streak & Tokens Badges */}
            <div className="hidden sm:flex items-center gap-2">
              <span className="px-3 py-1.5 rounded-xl bg-orange-500/10 border border-orange-500/30 text-orange-400 font-bold text-xs flex items-center gap-1.5 shadow-sm">
                <Flame className="w-4 h-4 fill-orange-400" /> {streak} дн. стрик
              </span>
              <span className="px-3 py-1.5 rounded-xl bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 font-mono font-bold text-xs flex items-center gap-1.5 shadow-sm">
                <Coins className="w-4 h-4" /> {tokens} FIT
              </span>
            </div>

            {onClose && (
              <button
                onClick={onClose}
                className="p-2 rounded-xl bg-gray-900/80 hover:bg-gray-800 text-gray-400 hover:text-white transition-all border border-gray-800"
                title="Закрыть"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Scrollable Content Body */}
        <div className="overflow-y-auto flex-1 p-5 sm:p-7 space-y-6 overscroll-contain custom-scrollbar">
          {/* Target & Program Ribbon */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl bg-gradient-to-r from-blue-900/20 via-indigo-900/20 to-purple-900/20 border border-blue-500/20">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-blue-500/20 text-blue-400 border border-blue-500/30">
                <Target className="w-5 h-5" />
              </div>
              <div>
                <div className="text-[11px] font-bold uppercase tracking-wider text-blue-400">
                  Ваша программа
                </div>
                <div className="text-sm sm:text-base font-extrabold text-white">
                  {goalTitle} • <span className="text-indigo-300 font-medium">{levelTitle}</span>
                </div>
              </div>
            </div>

            <div className="text-right">
              <div className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
                Режим тренировок
              </div>
              <div className="text-sm font-bold text-emerald-400">
                {frequency} дня в неделю
              </div>
            </div>
          </div>

          {/* 1. WEEKLY PLAN CALENDAR STRIP */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-gray-300">
                <Calendar className="w-4 h-4 text-blue-400" />
                <span>План тренировок на текущую неделю</span>
              </div>
              <span className="text-xs text-blue-400 font-semibold">
                Сегодня: <strong className="text-white">{todayMeta.full}</strong>
              </span>
            </div>

            <div className="grid grid-cols-7 gap-2">
              {calendarWeek.map((day) => {
                const isSelected = activeDay?.day && day.scheduleDay?.day === activeDay.day;
                const isToday = day.isToday;
                const isTraining = day.isTraining && day.scheduleDay;

                return (
                  <button
                    key={day.dayIndex}
                    type="button"
                    onClick={() => {
                      if (day.scheduleDay) {
                        setSelectedDayToView(day.scheduleDay);
                      }
                    }}
                    className={`relative p-2.5 sm:p-3 rounded-2xl flex flex-col items-center justify-between transition-all text-center border cursor-pointer ${
                      isToday
                        ? 'bg-blue-600/30 border-blue-400 ring-2 ring-blue-400/60 shadow-lg glow-blue scale-[1.03] z-10'
                        : isSelected
                        ? 'bg-gray-800/90 border-blue-500/70 shadow-md'
                        : isTraining
                        ? 'bg-gray-900/70 hover:bg-gray-800/60 border-gray-800 text-gray-300'
                        : 'bg-gray-950/40 border-gray-900 text-gray-600 opacity-60'
                    }`}
                  >
                    {/* Badge for Today */}
                    {isToday && (
                      <span className="absolute -top-2.5 px-2 py-0.5 rounded-full bg-blue-500 text-white font-black text-[9px] uppercase tracking-wider shadow-md">
                        Сегодня
                      </span>
                    )}

                    <span
                      className={`text-xs font-black uppercase ${
                        isToday ? 'text-white' : isTraining ? 'text-gray-300' : 'text-gray-500'
                      }`}
                    >
                      {day.short}
                    </span>

                    <div className="my-1.5 flex items-center justify-center">
                      {isTraining ? (
                        <div
                          className={`w-7 h-7 rounded-xl flex items-center justify-center text-xs font-mono font-bold ${
                            isToday
                              ? 'bg-blue-500 text-white shadow-sm'
                              : 'bg-indigo-600/30 text-indigo-300 border border-indigo-500/30'
                          }`}
                        >
                          Д{day.scheduleDay?.day || 1}
                        </div>
                      ) : (
                        <div className="w-7 h-7 rounded-xl flex items-center justify-center text-gray-600">
                          <Coffee className="w-4 h-4" />
                        </div>
                      )}
                    </div>

                    <span className="text-[10px] truncate max-w-full font-semibold">
                      {isTraining ? 'Тренировка' : 'Отдых'}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. TODAY'S WORKOUT HIGHLIGHT & EXERCISES LIST */}
          <div className="p-5 rounded-3xl bg-gray-900/60 border border-gray-800/80 shadow-lg space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-800/70 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/40 text-[10px] font-black uppercase tracking-wider">
                    {isRestDayToday && selectedDayToView === defaultSelectedDay
                      ? 'Рекомендация на день'
                      : 'План на сегодня'}
                  </span>
                  {activeDay?.day && (
                    <span className="text-xs font-bold text-gray-400">
                      День {activeDay.day} из {rawSchedule.length}
                    </span>
                  )}
                </div>
                <h3 className="text-lg sm:text-xl font-black text-white mt-1">
                  {activeDay?.title || 'Персональная тренировка'}
                </h3>
              </div>

              {activeDay?.focus && (
                <span className="text-xs px-3 py-1 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-300 font-semibold self-start sm:self-auto">
                  🎯 Фокус: {activeDay.focus}
                </span>
              )}
            </div>

            {/* If rest day notice */}
            {isRestDayToday && selectedDayToView === defaultSelectedDay && (
              <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs flex items-center gap-3">
                <Coffee className="w-5 h-5 text-amber-400 shrink-0" />
                <span>
                  По расписанию сегодня день отдыха, но вы можете провести следующую тренировку (День {activeDay?.day || 1}) прямо сейчас!
                </span>
              </div>
            )}

            {/* Exercise List */}
            <div className="space-y-2.5">
              <div className="text-xs font-bold uppercase tracking-wider text-gray-400 flex items-center justify-between px-2">
                <span>Запланированные упражнения ({activeExercises.length})</span>
                <span>Нагрузка & Отдых</span>
              </div>

              {activeExercises.length === 0 ? (
                <div className="py-6 text-center text-sm text-gray-400">
                  Упражнения для этого дня загружаются...
                </div>
              ) : (
                activeExercises.map((ex, idx) => {
                  const cfg = EXERCISE_DETECTOR_CONFIG[ex.id] || {};
                  const isHold = ex.type === 'hold' || cfg.type === 'hold';
                  const unitLabel = isHold ? 'сек удержания' : 'повторений';
                  const icon = ex.icon || cfg.icon || '⚡';

                  return (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-3.5 rounded-2xl bg-gray-950/80 hover:bg-gray-800/60 border border-gray-800/80 transition-all"
                    >
                      {/* Left: Icon & Name & Description */}
                      <div className="flex items-center gap-3.5 min-w-0">
                        <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-blue-600/30 via-indigo-600/20 to-purple-600/30 border border-blue-500/30 flex items-center justify-center text-2xl shrink-0 shadow-sm">
                          {icon}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-extrabold text-sm text-white truncate">
                              {ex.name || cfg.name || ex.id}
                            </span>
                            {ex.tempo && (
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-800 text-indigo-300 font-semibold border border-gray-700 hidden sm:inline-block">
                                {ex.tempo}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-gray-400 truncate mt-0.5 max-w-md">
                            {ex.description || cfg.description || 'ИИ-контроль правильной техники'}
                          </p>
                        </div>
                      </div>

                      {/* Right: Target & Sets & Rest */}
                      <div className="text-right shrink-0">
                        <div className="text-sm font-black text-white font-mono">
                          {ex.targetReps || cfg.defaultReps || 12} {unitLabel}
                        </div>
                        <div className="text-[11px] text-gray-400 flex items-center justify-end gap-1.5 mt-0.5">
                          <span className="text-blue-400 font-semibold">
                            {ex.targetSets || 3} подхода
                          </span>
                          <span>•</span>
                          <span className="text-gray-400 flex items-center gap-0.5">
                            <Clock className="w-3 h-3" /> {ex.restTime || 25}с
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Sticky Footer with Prominent "Начать тренировку" Button */}
        <div className="px-6 py-4 bg-gray-950/95 border-t border-gray-800/90 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0 z-20">
          <div className="text-xs text-gray-400 text-center sm:text-left">
            💡 <span className="text-gray-300 font-semibold">Следующий шаг:</span> Озвучка правил и техники перед включением камеры
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="w-full sm:w-auto px-4 py-3 rounded-2xl bg-gray-900 hover:bg-gray-800 text-gray-400 hover:text-white text-xs font-bold transition-all border border-gray-800"
              >
                Позже
              </button>
            )}

            <button
              type="button"
              onClick={handleStart}
              className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-black text-sm sm:text-base transition-all shadow-xl glow-blue flex items-center justify-center gap-2.5 cursor-pointer transform hover:scale-[1.02] active:scale-[0.98]"
            >
              <Play className="w-5 h-5 fill-white" />
              <span>Начать тренировку</span>
              <ChevronRight className="w-4 h-4 text-white/80" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

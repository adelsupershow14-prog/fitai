import React from 'react';
import {
  Trophy,
  CheckCircle2,
  RotateCcw,
  Award,
  AlertCircle,
  Sparkles,
  HelpCircle,
  StopCircle,
} from 'lucide-react';
import { EXERCISE_DETECTOR_CONFIG } from '../../services/pose';

export function RepCounterDisplay({
  exerciseId = 'squats',
  exerciseName,
  currentReps = 0,
  targetReps = 12,
  isHold = false,
  currentSet = 1,
  targetSets = 3,
  perfectReps = 0,
  planExercises = [],
  onReset,
  onFinishEarly,
  onShowInstruction,
  onSwitchExercise,
  isFullscreen = false,
}) {
  const accuracyPct = currentReps > 0 ? Math.round((perfectReps / currentReps) * 100) : 100;
  const progressPct = Math.min(100, Math.round((currentReps / (targetReps || 1)) * 100));
  const isGoalReached = currentReps >= targetReps && targetReps > 0;

  const currentConfig = EXERCISE_DETECTOR_CONFIG[exerciseId] || EXERCISE_DETECTOR_CONFIG.squats;
  const displayName = exerciseName || currentConfig.name;

  return (
    <div
      className={
        isFullscreen
          ? 'flex flex-col justify-between space-y-3.5 text-white'
          : 'glass-panel rounded-3xl p-5 sm:p-6 border border-gray-800 flex flex-col justify-between h-full space-y-4'
      }
    >
      {/* User's Personal Plan Exercises Only */}
      <div>
        <div className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2 flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <Sparkles className="w-3 h-3 text-blue-400" /> Упражнения вашей программы
          </span>
          {onShowInstruction && (
            <button
              onClick={onShowInstruction}
              className="text-[11px] text-blue-400 hover:text-blue-300 font-semibold flex items-center gap-1 transition-colors"
              title="Открыть инструкцию по технике"
            >
              <HelpCircle className="w-3.5 h-3.5" /> Инструкция
            </button>
          )}
        </div>

        {/* Display strictly the user's plan exercises */}
        <div className="flex flex-col gap-1.5 bg-gray-900/80 p-1.5 rounded-2xl border border-gray-800/80">
          {planExercises && planExercises.length > 0 ? (
            planExercises.map((ex) => {
              const isSelected = exerciseId === ex.id;
              const config = EXERCISE_DETECTOR_CONFIG[ex.id] || {};
              const icon = ex.icon || config.icon || '⚡';
              const name = ex.name || config.name || ex.id;
              const typeLabel = ex.type === 'hold' ? 'с' : 'повт.';

              return (
                <button
                  key={ex.id}
                  onClick={() => onSwitchExercise(ex.id)}
                  className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-between ${
                    isSelected
                      ? 'bg-blue-600 text-white shadow-md glow-blue scale-[1.01]'
                      : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
                  }`}
                  title={name}
                >
                  <div className="flex items-center gap-2 truncate">
                    <span className="text-base shrink-0">{icon}</span>
                    <span className="truncate">{name}</span>
                  </div>
                  <span
                    className={`text-[10px] font-mono px-2 py-0.5 rounded-full shrink-0 ${
                      isSelected
                        ? 'bg-white/20 text-white'
                        : 'bg-gray-800 text-gray-400'
                    }`}
                  >
                    {ex.targetReps ? `${ex.targetReps} ${typeLabel}` : ''}
                  </span>
                </button>
              );
            })
          ) : (
            <div className="py-2 text-center text-xs text-gray-400">
              {currentConfig.name}
            </div>
          )}
        </div>
      </div>

      {/* Main Counter Display */}
      <div className="text-center py-2 relative">
        <div className="text-xs uppercase tracking-widest text-gray-400 font-bold mb-1 flex items-center justify-center gap-1.5">
          <span className="truncate max-w-[180px]">{displayName}</span>
          <span className="text-gray-600">•</span>
          <span className="text-blue-400 shrink-0">
            Подход {currentSet} из {targetSets}
          </span>
        </div>

        {/* Reps / Hold Seconds Count */}
        <div className="flex items-baseline justify-center gap-2 mt-1">
          <span className="text-6xl sm:text-7xl font-extrabold text-transparent bg-clip-text bg-gradient-to-br from-white via-gray-100 to-gray-300 font-mono tracking-tight">
            {currentReps}
          </span>
          <span className="text-2xl font-bold text-gray-500 font-mono">
            / {targetReps} {isHold ? 'сек' : ''}
          </span>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-gray-800/80 rounded-full h-2.5 mt-3 overflow-hidden border border-gray-700/50">
          <div
            className={`h-full transition-all duration-300 rounded-full ${
              isGoalReached
                ? 'bg-gradient-to-r from-emerald-500 to-teal-400 shadow-md glow-green'
                : 'bg-gradient-to-r from-blue-600 to-indigo-500'
            }`}
            style={{ width: `${progressPct}%` }}
          />
        </div>

        <p className="text-xs font-semibold mt-2 text-center">
          {isGoalReached ? (
            <span className="text-emerald-400 flex items-center justify-center gap-1">
              <Sparkles className="w-3.5 h-3.5" /> Цель выполнена! Переход на отдых...
            </span>
          ) : (
            <span className="text-gray-400">
              {isHold ? 'Секунды чистого удержания позы' : 'Повторений засчитано ИИ-тренером'}
            </span>
          )}
        </p>
      </div>

      {/* AI Error Mode & Technique Checklist */}
      <div className="p-3.5 rounded-2xl bg-gray-900/60 border border-gray-800 text-left">
        <div className="text-[11px] font-bold text-blue-400 uppercase tracking-wider flex items-center gap-1.5 mb-2">
          <AlertCircle className="w-3.5 h-3.5 text-blue-400" /> Чеклист техники и ошибки
        </div>
        <div className="space-y-1.5 text-xs text-gray-300">
          {currentConfig.errorModeTips?.map((tip, idx) => (
            <div key={idx} className="flex items-start gap-2">
              <span className="text-emerald-400 font-bold shrink-0">✓</span>
              <div>
                <span className="font-semibold text-white">{tip.rule}:</span>{' '}
                <span className="text-gray-400 text-[11px]">{tip.desc}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3">
        <div className="p-3 rounded-2xl bg-gray-900/60 border border-gray-800 text-center">
          <div className="text-[11px] text-gray-400 font-semibold flex items-center justify-center gap-1 mb-0.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Чистая техника
          </div>
          <div className="text-lg font-bold text-emerald-400 font-mono">
            {perfectReps} <span className="text-xs text-gray-500 font-normal">{isHold ? 'сек' : 'повт.'}</span>
          </div>
        </div>

        <div className="p-3 rounded-2xl bg-gray-900/60 border border-gray-800 text-center">
          <div className="text-[11px] text-gray-400 font-semibold flex items-center justify-center gap-1 mb-0.5">
            <Award className="w-3.5 h-3.5 text-yellow-400" /> Точность
          </div>
          <div className="text-lg font-bold text-yellow-400 font-mono">{accuracyPct}%</div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="space-y-2 pt-1">
        {/* Early Finish Button */}
        <button
          onClick={onFinishEarly}
          className="w-full py-3 rounded-2xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 hover:text-amber-200 border border-amber-500/40 font-bold text-xs transition-all flex items-center justify-center gap-2 shadow-sm"
          title="Завершить подход сейчас и перейти к отдыху"
        >
          <StopCircle className="w-4 h-4 text-amber-400" /> Закончить подход раньше времени
        </button>

        {/* Reset Counter Button */}
        <button
          onClick={onReset}
          className="w-full py-2 rounded-xl bg-gray-800/80 hover:bg-gray-700/80 text-gray-400 hover:text-white font-semibold text-xs transition-all flex items-center justify-center gap-1.5"
        >
          <RotateCcw className="w-3.5 h-3.5" /> Сбросить счетчик подхода
        </button>
      </div>
    </div>
  );
}

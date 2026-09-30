import React, { useState } from 'react';
import { GOALS, LEVELS, generateWeeklyPlan } from '../../services/workoutPlan/planMatrix';
import { dbService } from '../../services/api/dbService';
import { CheckCircle2, Sparkles, Save, X } from 'lucide-react';

export function EditPlanModal({ user, currentProfile, onClose, onPlanUpdated }) {
  const [goal, setGoal] = useState(currentProfile?.goal || 'muscle');
  const [level, setLevel] = useState(currentProfile?.level || 'intermediate');
  const [frequency, setFrequency] = useState(currentProfile?.frequency || 3);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    const backendPlan = await dbService.generatePlan(goal, level, frequency);
    const weeklyPlan = backendPlan || generateWeeklyPlan(goal, level, frequency);

    const profileData = {
      name: currentProfile?.name || currentProfile?.username || user?.displayName || 'Атлет',
      goal,
      level,
      frequency,
    };

    await dbService.saveUserPlan(profileData, weeklyPlan);

    setIsSaving(false);
    onPlanUpdated({ ...currentProfile, ...profileData, workoutPlan: weeklyPlan });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xl animate-fade-in overflow-y-auto">
      <div className="w-full max-w-3xl glass-panel rounded-3xl p-6 sm:p-8 border border-blue-500/30 shadow-2xl relative text-left my-8">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white p-2 rounded-xl bg-gray-800/80 hover:bg-gray-700 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="mb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs font-semibold mb-2">
            <Sparkles className="w-3.5 h-3.5" /> Настройка Программы Тренировок
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white">Изменение Персонального Плана</h2>
          <p className="text-gray-400 text-xs sm:text-sm mt-1">
            Выберите новые параметры. Изменения моментально перезапишут расписание в вашем профиле.
          </p>
        </div>

        <div className="space-y-6">
          {/* SECTION 1: Goal Selection */}
          <div>
            <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-3">
              1. Главная Цель Тренировок
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {Object.entries(GOALS).map(([key, item]) => (
                <div
                  key={key}
                  onClick={() => setGoal(key)}
                  className={`p-3.5 rounded-2xl cursor-pointer transition-all border flex items-center justify-between ${
                    goal === key
                      ? 'bg-blue-600/20 border-blue-500 shadow-md glow-blue'
                      : 'bg-gray-900/60 border-gray-800 hover:bg-gray-800/80'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{item.icon}</span>
                    <div>
                      <span className="font-bold text-white text-sm block">{item.label}</span>
                      <span className="text-[11px] text-gray-400 block mt-0.5">{item.description}</span>
                    </div>
                  </div>
                  {goal === key && <CheckCircle2 className="w-5 h-5 text-blue-400 shrink-0" />}
                </div>
              ))}
            </div>
          </div>

          {/* SECTION 2: Fitness Level */}
          <div>
            <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-3">
              2. Уровень Подготовки
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {Object.entries(LEVELS).map(([key, item]) => (
                <div
                  key={key}
                  onClick={() => setLevel(key)}
                  className={`p-3.5 rounded-2xl cursor-pointer transition-all border ${
                    level === key
                      ? 'bg-blue-600/20 border-blue-500 shadow-md'
                      : 'bg-gray-900/60 border-gray-800 hover:bg-gray-800/80'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-white text-sm">{item.label}</span>
                    {level === key && <CheckCircle2 className="w-4 h-4 text-blue-400" />}
                  </div>
                  <p className="text-[11px] text-gray-400">
                    {item.sets} подхода • Пауза: {item.rest}с
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* SECTION 3: Frequency */}
          <div>
            <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-3">
              3. Количество Дней в Неделю
            </label>
            <div className="grid grid-cols-4 gap-3">
              {[2, 3, 4, 5].map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => setFrequency(num)}
                  className={`py-3 rounded-2xl font-bold text-sm transition-all border ${
                    frequency === num
                      ? 'bg-blue-600 text-white border-blue-400 shadow-md'
                      : 'bg-gray-900/60 text-gray-400 border-gray-800 hover:bg-gray-800'
                  }`}
                >
                  {num} дня
                </button>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4 border-t border-gray-800">
            <button
              type="button"
              onClick={onClose}
              className="w-1/3 py-3.5 rounded-2xl bg-gray-800 hover:bg-gray-700 text-gray-300 font-bold text-sm transition-all"
            >
              Отмена
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className="w-2/3 py-3.5 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-500 to-blue-600 hover:from-blue-500 hover:to-indigo-400 text-white font-extrabold text-sm tracking-wide shadow-xl glow-blue transition-all flex items-center justify-center gap-2"
            >
              <Save className="w-4 h-4" /> {isSaving ? 'Сохранение...' : 'Сохранить новый план'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

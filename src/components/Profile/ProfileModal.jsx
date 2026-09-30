import React, { useEffect, useState } from 'react';
import { dbService } from '../../services/api/dbService';
import { authService } from '../../services/api/authService';
import { UserAvatarDisplay } from '../Common/UserAvatarDisplay';
import { AvatarSelectorModal } from './AvatarSelectorModal';
import { Flame, Trophy, Activity, Calendar, RefreshCw, LogOut, Mail, Edit2, Check, X, Sparkles } from 'lucide-react';

export function ProfileModal({ user, userProfile, onOpenEditPlan, onLogout, onProfileUpdated }) {
  const [history, setHistory] = useState([]);
  const [isEditingName, setIsEditingName] = useState(false);
  const [showAvatarModal, setShowAvatarModal] = useState(false);
  const currentName = userProfile?.name || userProfile?.username || user?.displayName || 'Атлет';
  const [editNameVal, setEditNameVal] = useState(currentName);
  const workoutPlan = userProfile?.workoutPlan;

  useEffect(() => {
    setEditNameVal(currentName);
  }, [currentName]);

  useEffect(() => {
    async function loadHistory() {
      const data = await dbService.fetchWorkoutHistory();
      setHistory(data);
    }
    loadHistory();
  }, [user, userProfile]);

  const handleSaveName = async (e) => {
    if (e) e.preventDefault();
    if (!editNameVal.trim()) return;
    setIsEditingName(false);
    const res = await dbService.updateProfile({ name: editNameVal.trim() });
    if (res?.user && onProfileUpdated) {
      onProfileUpdated(res.user);
    }
  };

  const handleLogoutClick = async () => {
    await authService.logout();
    if (onLogout) onLogout();
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 text-left">
      {/* Profile Header Card */}
      <div className="glass-panel rounded-3xl p-6 sm:p-8 border border-indigo-500/20 shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-4 text-center sm:text-left">
          {/* Clickable Avatar to Open Selector Modal */}
          <div
            onClick={() => setShowAvatarModal(true)}
            className="relative group cursor-pointer shrink-0"
            title="Нажмите, чтобы сменить аватар"
          >
            <UserAvatarDisplay
              avatarId={userProfile?.active_avatar || userProfile?.activeAvatar}
              size="xl"
            />
            <div className="absolute inset-0 rounded-2xl bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white text-[10px] font-bold">
              <Edit2 className="w-4 h-4 mb-0.5" />
              <span>Сменить</span>
            </div>
            <div className="absolute -bottom-1 -right-1 p-1 rounded-full bg-blue-600 text-white shadow-md border-2 border-gray-950">
              <Edit2 className="w-3 h-3" />
            </div>
          </div>

          <div>
            {isEditingName ? (
              <form onSubmit={handleSaveName} className="flex items-center gap-2 mb-1">
                <input
                  type="text"
                  value={editNameVal}
                  onChange={(e) => setEditNameVal(e.target.value)}
                  className="px-3 py-1 rounded-xl bg-gray-900 border border-blue-500 text-white text-lg font-bold focus:outline-none"
                  autoFocus
                />
                <button
                  type="submit"
                  className="p-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white"
                  title="Сохранить имя"
                >
                  <Check className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditingName(false)}
                  className="p-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-400"
                  title="Отмена"
                >
                  <X className="w-4 h-4" />
                </button>
              </form>
            ) : (
              <div className="flex items-center gap-2 justify-center sm:justify-start">
                <h2 className="text-2xl font-extrabold text-white">
                  {currentName}
                </h2>
                <button
                  onClick={() => {
                    setIsEditingName(true);
                    setEditNameVal(currentName);
                  }}
                  className="p-1 text-gray-400 hover:text-blue-400 transition-colors cursor-pointer"
                  title="Изменить имя"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
              </div>
            )}

            {(userProfile?.email || user?.email) && (
              <p className="text-xs text-gray-400 flex items-center gap-1.5 mt-0.5 justify-center sm:justify-start">
                <Mail className="w-3.5 h-3.5 text-blue-400" /> {userProfile?.email || user?.email}
              </p>
            )}
            <p className="text-xs text-indigo-300 font-semibold mt-1">
              Цель: {workoutPlan?.goal || userProfile?.goal || 'Набор массы'} ({userProfile?.frequency || 3} дня/нед)
            </p>
            <div className="flex items-center gap-2 mt-2 justify-center sm:justify-start">
              <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30 font-semibold">
                Уровень: {userProfile?.level === 'beginner' ? 'Новичок' : userProfile?.level === 'advanced' ? 'Продвинутый' : 'Любитель'}
              </span>
            </div>
          </div>
        </div>

        {/* Profile Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
          <button
            onClick={onOpenEditPlan}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2 glow-blue"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Изменить План (Форма)
          </button>

          <button
            onClick={handleLogoutClick}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-red-600/20 hover:bg-red-600 text-red-300 hover:text-white text-xs font-bold transition-all border border-red-500/30 flex items-center justify-center gap-2"
          >
            <LogOut className="w-3.5 h-3.5" /> Выйти из аккаунта
          </button>
        </div>
      </div>

      {/* Daily Schedule Card from Firestore userProfile.workoutPlan */}
      {workoutPlan?.schedule && (
        <div className="glass-panel rounded-3xl p-6 border border-blue-500/20 shadow-xl">
          <h3 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-blue-400" /> Персональное расписание по дням
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {workoutPlan.schedule.map((day) => (
              <div key={day.dayNumber} className="p-4 rounded-2xl bg-gray-900/60 border border-gray-800">
                <div className="text-xs font-bold text-blue-400 uppercase">{day.dayTitle}</div>
                <div className="mt-2 space-y-1">
                  {day.exercises.map((ex, idx) => (
                    <div key={idx} className="text-xs text-gray-300 flex items-center justify-between">
                      <span>{ex.name}</span>
                      <span className="font-mono text-gray-400">{ex.targetSets} × {ex.targetReps}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Gamification Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="glass-card rounded-3xl p-6 border border-orange-500/30 text-center relative overflow-hidden">
          <div className="w-12 h-12 mx-auto mb-3 rounded-2xl bg-orange-500/20 border border-orange-500/40 flex items-center justify-center text-orange-400">
            <Flame className="w-6 h-6 animate-pulse text-orange-500" />
          </div>
          <div className="text-xs text-gray-400 uppercase font-bold">Стрик Тренировок</div>
          <div className="text-4xl font-extrabold text-orange-400 font-mono mt-1">{userProfile?.streak || 0} Дней 🔥</div>
          <p className="text-[11px] text-gray-500 mt-1">Серия ежедневных занятий</p>
        </div>

        <div className="glass-card rounded-3xl p-6 border border-blue-500/30 text-center">
          <div className="w-12 h-12 mx-auto mb-3 rounded-2xl bg-blue-500/20 border border-blue-500/40 flex items-center justify-center text-blue-400">
            <Activity className="w-6 h-6" />
          </div>
          <div className="text-xs text-gray-400 uppercase font-bold">Завершено Тренировок</div>
          <div className="text-4xl font-extrabold text-blue-400 font-mono mt-1">{userProfile?.totalWorkouts || 0}</div>
          <p className="text-[11px] text-gray-500 mt-1">Всего проведенных сессий</p>
        </div>

        <div className="glass-card rounded-3xl p-6 border border-emerald-500/30 text-center">
          <div className="w-12 h-12 mx-auto mb-3 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
            <Trophy className="w-6 h-6" />
          </div>
          <div className="text-xs text-gray-400 uppercase font-bold">Всего Повторений</div>
          <div className="text-4xl font-extrabold text-emerald-400 font-mono mt-1">{userProfile?.totalReps || 0}</div>
          <p className="text-[11px] text-gray-500 mt-1">С валидацией MediaPipe AI</p>
        </div>
      </div>

      {/* Workout History Table */}
      <div className="glass-panel rounded-3xl p-6 border border-gray-800">
        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <Calendar className="w-5 h-5 text-indigo-400" /> История тренировок
        </h3>

        {history.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-800 text-xs text-gray-400 uppercase">
                  <th className="py-3 px-4">Дата</th>
                  <th className="py-3 px-4">Упражнение</th>
                  <th className="py-3 px-4">Повторы</th>
                  <th className="py-3 px-4">Точность техники</th>
                  <th className="py-3 px-4 text-right">Награда</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/60 text-sm">
                {history.map((row) => (
                  <tr key={row.id} className="hover:bg-gray-800/30 transition-colors">
                    <td className="py-3 px-4 text-gray-400 font-mono text-xs">{row.date}</td>
                    <td className="py-3 px-4 font-bold text-white">{row.exercise}</td>
                    <td className="py-3 px-4 font-mono font-bold text-blue-400">{row.reps}</td>
                    <td className="py-3 px-4">
                      <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        {row.accuracy}%
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-yellow-400">
                      +{row.tokensEarned} FIT
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-sm text-gray-500 italic text-center py-4">
            Вы пока не завершили ни одной тренировки в вашей учетной записи.
          </p>
        )}
      </div>

      {/* Avatar Selector Modal */}
      <AvatarSelectorModal
        isOpen={showAvatarModal}
        onClose={() => setShowAvatarModal(false)}
        userProfile={userProfile}
        onProfileUpdated={onProfileUpdated}
      />
    </div>
  );
}

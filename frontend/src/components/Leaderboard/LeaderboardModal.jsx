import React, { useEffect, useState } from 'react';
import { dbService } from '../../services/api/dbService';
import { UserAvatarDisplay } from '../Common/UserAvatarDisplay';
import {
  Trophy,
  Flame,
  CheckCircle2,
  Sparkles,
  X,
  RefreshCw,
  Crown,
  Medal,
  Award,
  Zap,
  Target,
  User,
} from 'lucide-react';

export function LeaderboardModal({ isOpen, onClose, currentUserId }) {
  const [leaderboard, setLeaderboard] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [totalParticipants, setTotalParticipants] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // 'all' | 'top10'

  const loadData = async () => {
    setLoading(true);
    const data = await dbService.fetchLeaderboard();
    setLeaderboard(data.leaderboard || []);
    setCurrentUser(data.currentUser || null);
    setTotalParticipants(data.total || 0);
    setLoading(false);
  };

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const top3 = leaderboard.slice(0, 3);
  const displayList = filter === 'top10' ? leaderboard.slice(0, 10) : leaderboard;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-xl animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative w-full max-w-4xl max-h-[92vh] flex flex-col glass-panel rounded-3xl border border-amber-500/30 shadow-2xl bg-gray-950/95 overflow-hidden">
        {/* Sticky Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800/80 bg-gray-950/90 backdrop-blur-md shrink-0 z-30">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-gradient-to-tr from-amber-500 via-yellow-400 to-amber-600 text-gray-950 shadow-[0_0_20px_rgba(245,158,11,0.4)]">
              <Trophy className="w-6 h-6 fill-gray-950" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
                  Глобальный Лидерборд
                </h2>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/40 text-amber-300">
                  Сезон 2026
                </span>
              </div>
              <p className="text-xs text-gray-400 mt-0.5">
                Рейтинг реальных участников на основе регулярности, техники ИИ-контроля и повторений
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={loadData}
              disabled={loading}
              className="p-2 rounded-xl bg-gray-900/80 hover:bg-gray-800 text-gray-400 hover:text-white transition-all border border-gray-800 shadow-sm"
              title="Обновить рейтинг"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-amber-400' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-xl bg-gray-800/90 hover:bg-gray-700 text-gray-300 hover:text-white text-xs font-bold transition-all border border-gray-700 flex items-center gap-1.5 shadow-md"
            >
              <X className="w-4 h-4" /> Закрыть
            </button>
          </div>
        </div>

        {/* Scrollable Container */}
        <div className="overflow-y-auto flex-1 p-5 sm:p-7 space-y-6 overscroll-contain custom-scrollbar">
          {/* Top Podium Cards (adapts to 1, 2, or 3 athletes) */}
          {top3.length > 0 && (
            <div className={`grid gap-3.5 pt-2 ${
              top3.length === 1 ? 'grid-cols-1 max-w-xs mx-auto' : top3.length === 2 ? 'grid-cols-1 sm:grid-cols-2 max-w-lg mx-auto' : 'grid-cols-1 md:grid-cols-3'
            }`}>
              {/* 2nd Place (Silver) */}
              {top3.length >= 2 && (
                <div className="order-2 md:order-1 rounded-2xl p-4 bg-gradient-to-b from-slate-800/60 to-slate-900/80 border border-slate-400/30 flex flex-col items-center text-center relative shadow-lg">
                  <div className="absolute -top-3 px-3 py-0.5 rounded-full bg-slate-300 text-slate-950 font-black text-xs shadow-md flex items-center gap-1">
                    🥈 2 Место
                  </div>
                  <div className="mt-2 mb-2">
                    <UserAvatarDisplay avatarId={top3[1].active_avatar} size="lg" />
                  </div>
                  <div className="text-sm font-extrabold text-white truncate max-w-[160px]">
                    {top3[1].username}
                  </div>
                  <span className="text-[10px] font-bold text-slate-300 uppercase tracking-wider mb-2">
                    {top3[1].tier}
                  </span>
                  <div className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-slate-200 to-slate-400 font-mono">
                    {top3[1].score.toLocaleString()} XP
                  </div>
                  <div className="flex items-center gap-3 text-[11px] text-gray-400 mt-2">
                    <span className="flex items-center gap-0.5 text-orange-400 font-bold">
                      <Flame className="w-3 h-3 fill-orange-400" /> {top3[1].streak} дн
                    </span>
                    <span>•</span>
                    <span className="text-emerald-400 font-semibold">{top3[1].avg_accuracy}%</span>
                  </div>
                </div>
              )}

              {/* 1st Place (Gold Champion) */}
              <div className="order-1 md:order-2 rounded-2xl p-5 bg-gradient-to-b from-amber-500/20 via-yellow-500/10 to-gray-900/90 border-2 border-amber-400/60 flex flex-col items-center text-center relative shadow-[0_0_30px_rgba(245,158,11,0.25)] transform md:-translate-y-2">
                <div className="absolute -top-3.5 px-3.5 py-1 rounded-full bg-gradient-to-r from-amber-400 to-yellow-300 text-gray-950 font-black text-xs shadow-lg flex items-center gap-1">
                  <Crown className="w-3.5 h-3.5 fill-gray-950" /> 🥇 1 Место
                </div>
                <div className="mt-2 mb-2">
                  <UserAvatarDisplay avatarId={top3[0].active_avatar} size="xl" />
                </div>
                <div className="text-base font-black text-white truncate max-w-[180px] flex items-center gap-1.5">
                  <span>{top3[0].username}</span>
                  <Sparkles className="w-3.5 h-3.5 text-yellow-400" />
                </div>
                <span className="text-[11px] font-bold text-amber-300 uppercase tracking-wider mb-2">
                  {top3[0].tier}
                </span>
                <div className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-amber-200 to-yellow-400 font-mono">
                  {top3[0].score.toLocaleString()} XP
                </div>
                <div className="flex items-center gap-3 text-xs text-gray-300 mt-2">
                  <span className="flex items-center gap-0.5 text-orange-400 font-bold">
                    <Flame className="w-3.5 h-3.5 fill-orange-400" /> {top3[0].streak} дн
                  </span>
                  <span>•</span>
                  <span className="text-emerald-400 font-bold">{top3[0].avg_accuracy}% техника</span>
                </div>
              </div>

              {/* 3rd Place (Bronze) */}
              {top3.length >= 3 && (
                <div className="order-3 md:order-3 rounded-2xl p-4 bg-gradient-to-b from-amber-950/40 to-slate-900/80 border border-amber-600/30 flex flex-col items-center text-center relative shadow-lg">
                  <div className="absolute -top-3 px-3 py-0.5 rounded-full bg-amber-700 text-amber-100 font-black text-xs shadow-md flex items-center gap-1">
                    🥉 3 Место
                  </div>
                  <div className="mt-2 mb-2">
                    <UserAvatarDisplay avatarId={top3[2].active_avatar} size="lg" />
                  </div>
                  <div className="text-sm font-extrabold text-white truncate max-w-[160px]">
                    {top3[2].username}
                  </div>
                  <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider mb-2">
                    {top3[2].tier}
                  </span>
                  <div className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-300 to-amber-500 font-mono">
                    {top3[2].score.toLocaleString()} XP
                  </div>
                  <div className="flex items-center gap-3 text-[11px] text-gray-400 mt-2">
                    <span className="flex items-center gap-0.5 text-orange-400 font-bold">
                      <Flame className="w-3.5 h-3.5 fill-orange-400" /> {top3[2].streak} дн
                    </span>
                    <span>•</span>
                    <span className="text-emerald-400 font-semibold">{top3[2].avg_accuracy}%</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* List of Athletes */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-gray-400 uppercase tracking-wider px-4 py-1">
              <span>Атлет и Ранг</span>
              <div className="flex items-center gap-8">
                <span className="hidden sm:inline">Стрик / Техника</span>
                <span>Очки (XP)</span>
              </div>
            </div>

            {loading ? (
              <div className="py-12 flex flex-col items-center justify-center gap-3 text-gray-400">
                <div className="w-8 h-8 border-3 border-amber-500 border-t-transparent rounded-full animate-spin" />
                <span className="text-xs">Загрузка таблицы лидеров...</span>
              </div>
            ) : displayList.length === 0 ? (
              <div className="py-12 text-center text-sm text-gray-400">
                Пока нет участников. Будьте первыми!
              </div>
            ) : (
              displayList.map((entry) => {
                const isMe = entry.is_current_user || (currentUserId && entry.user_id === currentUserId);
                const isTop3 = entry.rank <= 3;

                return (
                  <div
                    key={entry.rank + (entry.user_id || entry.username)}
                    className={`flex items-center justify-between px-4 py-3 rounded-2xl transition-all ${
                      isMe
                        ? 'bg-gradient-to-r from-blue-900/40 via-indigo-900/30 to-purple-900/40 border-2 border-blue-500/70 shadow-[0_0_20px_rgba(59,130,246,0.3)] ring-1 ring-blue-400/40 scale-[1.01]'
                        : 'bg-gray-900/60 hover:bg-gray-800/60 border border-gray-800/80'
                    }`}
                  >
                    {/* Left: Rank & Avatar & Name */}
                    <div className="flex items-center gap-3.5 min-w-0">
                      {/* Rank badge */}
                      <div className="w-8 flex items-center justify-center shrink-0">
                        {entry.rank === 1 ? (
                          <span className="text-lg">🥇</span>
                        ) : entry.rank === 2 ? (
                          <span className="text-lg">🥈</span>
                        ) : entry.rank === 3 ? (
                          <span className="text-lg">🥉</span>
                        ) : (
                          <span className="font-mono font-bold text-xs text-gray-400">
                            #{entry.rank}
                          </span>
                        )}
                      </div>

                      {/* Avatar */}
                      <UserAvatarDisplay avatarId={entry.active_avatar} size="md" />

                      {/* Username & Badges */}
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 truncate">
                          <span className="font-extrabold text-sm text-white truncate">
                            {entry.username}
                          </span>
                          {isMe && (
                            <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-blue-500 text-white shadow-sm shrink-0">
                              Вы
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-[11px] text-gray-400">
                          <span className={`font-semibold ${entry.tier_color || 'text-blue-400'}`}>
                            {entry.tier}
                          </span>
                          <span>•</span>
                          <span>{entry.total_workouts} тренировок</span>
                        </div>
                      </div>
                    </div>

                    {/* Right: Stats & Score */}
                    <div className="flex items-center gap-4 sm:gap-8 shrink-0 text-right">
                      {/* Streaks & Accuracy */}
                      <div className="hidden sm:flex flex-col items-end">
                        <div className="flex items-center gap-1 text-xs font-bold text-orange-400">
                          <Flame className="w-3.5 h-3.5 fill-orange-400" />
                          <span>{entry.streak} дн стрик</span>
                        </div>
                        <div className="flex items-center gap-1 text-[11px] text-emerald-400 font-semibold">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>{entry.avg_accuracy}% техника</span>
                        </div>
                      </div>

                      {/* Score / XP */}
                      <div className="w-24 sm:w-28 text-right">
                        <div className="text-base sm:text-lg font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-300 to-yellow-200 font-mono tracking-tight">
                          {entry.score.toLocaleString()}
                        </div>
                        <div className="text-[10px] uppercase font-bold text-amber-400/80">
                          XP очков
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Sticky Footer: Current User Status Bar */}
        {currentUser && (
          <div className="px-6 py-3.5 bg-gray-900/95 border-t border-gray-800/90 flex flex-wrap items-center justify-between gap-3 shrink-0 z-30">
            <div className="flex items-center gap-2.5">
              <span className="text-xs uppercase font-bold text-blue-400">Ваша позиция:</span>
              <span className="px-2.5 py-0.5 rounded-lg bg-blue-600/30 border border-blue-500/50 text-blue-200 text-xs font-mono font-black">
                #{currentUser.rank} из {totalParticipants}
              </span>
              <span className="text-xs text-gray-400 hidden sm:inline">
                ({currentUser.tier} • {currentUser.streak} дн. стрик)
              </span>
            </div>

            <div className="flex items-center gap-3">
              <div className="text-right">
                <span className="text-xs text-gray-400 mr-2">Ваш рейтинг:</span>
                <span className="text-sm font-black text-amber-300 font-mono">
                  {currentUser.score.toLocaleString()} XP
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

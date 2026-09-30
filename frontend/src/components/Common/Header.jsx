import React from 'react';
import { Flame, Coins, User, ShoppingBag, Dumbbell, Trophy } from 'lucide-react';
import { UserAvatarDisplay } from './UserAvatarDisplay';

export function Header({
  activeTab,
  setActiveTab,
  user,
  userProfile,
  onOpenProfileModal,
  onOpenLeaderboardModal,
}) {
  const userDisplayName = userProfile?.name || userProfile?.username || user?.displayName || 'Атлет';

  return (
    <header className="sticky top-0 z-40 w-full glass-panel border-b border-gray-800/80 px-4 lg:px-8 py-3 mb-6">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
        {/* Brand Logo */}
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => setActiveTab('workout')}>
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-500 to-purple-600 flex items-center justify-center shadow-lg glow-blue">
            <Dumbbell className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-blue-400 via-indigo-300 to-purple-400 bg-clip-text text-transparent">
                FIT<span className="text-blue-500">.AI</span>
              </span>
              <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400 border border-blue-500/30">
                PRO AI
              </span>
            </div>
            <p className="text-xs text-gray-400 hidden sm:block">Умный AI Тренер с Веб-камерой</p>
          </div>
        </div>

        {/* Navigation Tabs (Тренировка, Магазин, Лидерборд) */}
        <nav className="flex items-center gap-1 sm:gap-2 bg-gray-900/60 p-1 rounded-xl border border-gray-800">
          <button
            onClick={() => setActiveTab('workout')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer ${
              activeTab === 'workout'
                ? 'bg-blue-600 text-white shadow-md glow-blue'
                : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/50'
            }`}
          >
            <Dumbbell className="w-4 h-4" />
            <span>Тренировка</span>
          </button>

          <button
            onClick={() => setActiveTab('shop')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer ${
              activeTab === 'shop'
                ? 'bg-purple-600 text-white shadow-md glow-blue'
                : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/50'
            }`}
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Магазин</span>
          </button>

          <button
            onClick={onOpenLeaderboardModal}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all text-gray-400 hover:text-gray-200 hover:bg-gray-800/50 cursor-pointer"
          >
            <Trophy className="w-4 h-4 text-yellow-400" />
            <span>Лидерборд</span>
          </button>
        </nav>

        {/* Dynamic User Profile Pill Button */}
        <div className="flex items-center gap-3">
          <button
            onClick={onOpenProfileModal}
            className="flex items-center gap-3 px-3.5 py-1.5 rounded-2xl bg-gray-900/90 hover:bg-gray-800/90 border border-gray-700/80 transition-all shadow-md group cursor-pointer"
            title="Открыть Профиль и Статистику"
          >
            {/* User Avatar */}
            <UserAvatarDisplay
              avatarId={userProfile?.active_avatar || userProfile?.activeAvatar}
              size="sm"
            />

            <div className="text-left hidden sm:block">
              <div className="text-xs font-bold text-white group-hover:text-blue-400 transition-colors">
                {userDisplayName}
              </div>
              <div className="flex items-center gap-2 text-[10px] text-gray-400">
                <span className="flex items-center gap-0.5 text-orange-400 font-bold">
                  <Flame className="w-3 h-3 text-orange-500 fill-orange-500" /> {userProfile?.streak || 1} дн
                </span>
                <span>•</span>
                <span className="flex items-center gap-0.5 text-yellow-400 font-bold">
                  <Coins className="w-3 h-3 text-yellow-400" /> {userProfile?.tokens || 0}
                </span>
              </div>
            </div>

            <User className="w-4 h-4 text-gray-400 group-hover:text-white transition-colors" />
          </button>
        </div>
      </div>
    </header>
  );
}

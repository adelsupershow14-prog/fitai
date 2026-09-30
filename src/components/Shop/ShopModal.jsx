import React, { useState } from 'react';
import { dbService } from '../../services/api/dbService';
import { authService } from '../../services/api/authService';
import { DEFAULT_AVATARS, SHOP_AVATARS } from '../../services/avatars';
import { Coins, Sparkles, ShieldCheck, Check, Lock } from 'lucide-react';
import confetti from 'canvas-confetti';

export function ShopModal({ userProfile, onProfileUpdate }) {
  const [errorMsg, setErrorMsg] = useState('');
  const [loadingAvatarId, setLoadingAvatarId] = useState(null);

  const inventory = userProfile?.inventory || ['emoji_fox', 'emoji_robot', 'emoji_lion'];
  const activeAvatarId = userProfile?.active_avatar || userProfile?.activeAvatar || 'emoji_fox';
  const userTokens = userProfile?.tokens || 0;

  const handleBuy = async (avatar) => {
    setErrorMsg('');
    setLoadingAvatarId(avatar.id);
    const res = await dbService.buyAvatar(avatar.id, avatar.price, userTokens);
    setLoadingAvatarId(null);
    if (res.success) {
      confetti({ particleCount: 60, spread: 70, origin: { y: 0.6 } });
      const updated = await authService.getMe();
      if (updated && onProfileUpdate) onProfileUpdate(updated);
    } else {
      setErrorMsg(res.reason || 'Ошибка покупки');
    }
  };

  const handleEquip = async (avatarId) => {
    setLoadingAvatarId(avatarId);
    await dbService.setActiveAvatar(avatarId);
    setLoadingAvatarId(null);
    const updated = await authService.getMe();
    if (updated && onProfileUpdate) onProfileUpdate(updated);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 text-left">
      {/* Header Banner */}
      <div className="glass-panel rounded-3xl p-6 sm:p-8 border border-purple-500/20 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row items-center justify-between gap-6 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-400 text-xs font-semibold mb-2">
              <Sparkles className="w-3.5 h-3.5" /> Магазин Аватаров & Наград
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white">Обменяйте токены на стиль</h2>
            <p className="text-gray-400 text-sm mt-1">Все покупки сохраняются в вашей локальной SQLite базе данных</p>
          </div>

          <div className="flex items-center gap-3 bg-gray-900/80 px-5 py-3 rounded-2xl border border-yellow-500/30 shadow-lg">
            <Coins className="w-7 h-7 text-yellow-400 animate-bounce" />
            <div>
              <div className="text-xs text-gray-400 uppercase font-bold">Баланс Токенов</div>
              <div className="text-2xl font-extrabold text-yellow-400 font-mono">{userTokens} FIT</div>
            </div>
          </div>
        </div>

        {errorMsg && (
          <div className="mt-4 p-3 rounded-xl bg-red-500/20 border border-red-500/40 text-red-300 text-xs font-semibold">
            ⚠️ {errorMsg}
          </div>
        )}
      </div>

      {/* Section 1: Premium Paid Avatars from icons folder */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-extrabold text-white flex items-center gap-2">
              <span>🖼️</span> Премиум Аватары (3 эксклюзивных арта)
            </h3>
            <p className="text-xs text-gray-400">Купите за заработанные FIT токены и выделитесь в лидерборде</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {SHOP_AVATARS.map((avatar) => {
            const isOwned = inventory.includes(avatar.id);
            const isActive = activeAvatarId === avatar.id;
            const canAfford = userTokens >= avatar.price;
            const isLoading = loadingAvatarId === avatar.id;

            return (
              <div
                key={avatar.id}
                className={`glass-card rounded-3xl p-6 border flex flex-col justify-between relative overflow-hidden transition-all duration-300 ${
                  isActive
                    ? 'border-purple-500 shadow-xl glow-blue ring-2 ring-purple-500/50'
                    : isOwned
                    ? 'border-gray-700 hover:border-gray-600'
                    : 'border-gray-800/80'
                }`}
              >
                {isActive && (
                  <div className="absolute top-3 right-3 px-2.5 py-0.5 rounded-full bg-purple-500 text-white text-[10px] font-bold uppercase tracking-wider shadow-md flex items-center gap-1 z-10">
                    <Check className="w-3 h-3" /> Активен
                  </div>
                )}

                {!isOwned && (
                  <div className="absolute top-3 right-3 p-1.5 rounded-full bg-gray-900/80 border border-yellow-500/40 text-yellow-400 text-xs shadow-md z-10">
                    <Lock className="w-3.5 h-3.5" />
                  </div>
                )}

                <div className="text-center py-2">
                  <div className="w-32 h-32 mx-auto rounded-2xl overflow-hidden mb-4 border-2 border-purple-500/40 shadow-xl relative group">
                    <img
                      src={avatar.imageSrc}
                      alt={avatar.name}
                      className={`w-full h-full object-cover transition-transform duration-300 ${
                        !isOwned ? 'brightness-90' : 'group-hover:scale-105'
                      }`}
                    />
                  </div>
                  <h3 className="font-extrabold text-white text-lg">{avatar.name}</h3>
                  <p className="text-xs text-gray-400 mt-1 min-h-[32px]">{avatar.description}</p>
                </div>

                <div className="pt-4 border-t border-gray-800/80">
                  {isActive ? (
                    <button
                      disabled
                      className="w-full py-2.5 rounded-xl bg-purple-600/30 text-purple-300 font-bold text-xs flex items-center justify-center gap-1.5 cursor-default"
                    >
                      <ShieldCheck className="w-4 h-4" /> Надет
                    </button>
                  ) : isOwned ? (
                    <button
                      onClick={() => handleEquip(avatar.id)}
                      disabled={isLoading}
                      className="w-full py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs transition-all shadow-md cursor-pointer"
                    >
                      {isLoading ? 'Применение...' : 'Надеть аватар'}
                    </button>
                  ) : (
                    <button
                      onClick={() => handleBuy(avatar)}
                      disabled={!canAfford || isLoading}
                      className={`w-full py-2.5 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-1.5 shadow-md ${
                        canAfford
                          ? 'bg-amber-500 hover:bg-amber-400 text-gray-950 glow-yellow cursor-pointer'
                          : 'bg-gray-800 text-gray-500 cursor-not-allowed'
                      }`}
                    >
                      <Coins className="w-4 h-4" />
                      <span>{isLoading ? 'Покупка...' : `Купить за ${avatar.price} FIT`}</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Section 2: Free Default Emoji Avatars */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-extrabold text-white flex items-center gap-2">
              <span>🦊</span> Базовые Аватары (Бесплатно)
            </h3>
            <p className="text-xs text-gray-400">Доступны бесплатно всем атлетам с первого дня</p>
          </div>
          <span className="text-xs text-emerald-400 font-semibold px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
            Бесплатно
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {DEFAULT_AVATARS.map((avatar) => {
            const isActive = activeAvatarId === avatar.id;
            const isLoading = loadingAvatarId === avatar.id;

            return (
              <div
                key={avatar.id}
                className={`glass-card rounded-3xl p-6 border flex flex-col justify-between relative overflow-hidden transition-all duration-300 ${
                  isActive
                    ? 'border-blue-500 shadow-xl glow-blue ring-2 ring-blue-500/50'
                    : 'border-gray-800/80 hover:border-gray-700'
                }`}
              >
                {isActive && (
                  <div className="absolute top-3 right-3 px-2.5 py-0.5 rounded-full bg-blue-500 text-white text-[10px] font-bold uppercase tracking-wider shadow-md flex items-center gap-1 z-10">
                    <Check className="w-3 h-3" /> Активен
                  </div>
                )}

                <div className="text-center py-2">
                  <div className="w-24 h-24 mx-auto rounded-2xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-blue-600 flex items-center justify-center text-5xl shadow-xl mb-4 border border-white/20">
                    {avatar.icon}
                  </div>
                  <h3 className="font-extrabold text-white text-lg">{avatar.name}</h3>
                  <p className="text-xs text-gray-400 mt-1 min-h-[32px]">{avatar.description}</p>
                </div>

                <div className="pt-4 border-t border-gray-800/80">
                  {isActive ? (
                    <button
                      disabled
                      className="w-full py-2.5 rounded-xl bg-blue-600/30 text-blue-300 font-bold text-xs flex items-center justify-center gap-1.5 cursor-default"
                    >
                      <ShieldCheck className="w-4 h-4" /> Надет
                    </button>
                  ) : (
                    <button
                      onClick={() => handleEquip(avatar.id)}
                      disabled={isLoading}
                      className="w-full py-2.5 rounded-xl bg-gray-800 hover:bg-gray-700 text-white font-bold text-xs transition-all shadow-md cursor-pointer"
                    >
                      {isLoading ? 'Применение...' : 'Надеть аватар'}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

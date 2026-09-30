import React, { useState } from 'react';
import { DEFAULT_AVATARS, SHOP_AVATARS } from '../../services/avatars';
import { dbService } from '../../services/api/dbService';
import { authService } from '../../services/api/authService';
import { X, Check, Lock, Sparkles, Coins, ShoppingBag } from 'lucide-react';
import confetti from 'canvas-confetti';

export function AvatarSelectorModal({ isOpen, onClose, userProfile, onProfileUpdated }) {
  const [loadingAvatarId, setLoadingAvatarId] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const activeAvatarId = userProfile?.active_avatar || userProfile?.activeAvatar || 'emoji_fox';
  const inventory = userProfile?.inventory || ['emoji_fox', 'emoji_robot', 'emoji_lion'];
  const userTokens = userProfile?.tokens || 0;

  // Equip already available avatar
  const handleEquip = async (avatarId) => {
    if (avatarId === activeAvatarId) return;
    setErrorMsg('');
    setLoadingAvatarId(avatarId);
    try {
      await dbService.setActiveAvatar(avatarId);
      const updated = await authService.getMe();
      if (updated && onProfileUpdated) {
        onProfileUpdated(updated);
      }
    } catch (err) {
      setErrorMsg('Не удалось сменить аватар');
    } finally {
      setLoadingAvatarId(null);
    }
  };

  // Buy and equip avatar
  const handleBuyAndEquip = async (avatar) => {
    setErrorMsg('');
    setLoadingAvatarId(avatar.id);
    try {
      const res = await dbService.buyAvatar(avatar.id, avatar.price, userTokens);
      if (res.success) {
        confetti({ particleCount: 50, spread: 60, origin: { y: 0.6 } });
        const updated = await authService.getMe();
        if (updated && onProfileUpdated) {
          onProfileUpdated(updated);
        }
      } else {
        setErrorMsg(res.reason || 'Ошибка покупки');
      }
    } catch (err) {
      setErrorMsg('Ошибка соединения при покупке');
    } finally {
      setLoadingAvatarId(null);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-xl animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative w-full max-w-2xl max-h-[90vh] flex flex-col glass-panel rounded-3xl border border-purple-500/30 shadow-2xl bg-gray-950/95 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800/80 bg-gray-950/90 backdrop-blur-md shrink-0 z-30">
          <div className="flex items-center gap-2.5">
            <span className="text-2xl">🎭</span>
            <div>
              <h3 className="text-lg font-extrabold text-white">Выбор Аватара</h3>
              <p className="text-xs text-gray-400">Выберите или разблокируйте аватар для профиля и лидерборда</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-gray-900 border border-yellow-500/30 text-yellow-400 font-mono text-xs font-bold shadow-sm">
              <Coins className="w-3.5 h-3.5" />
              <span>{userTokens} FIT</span>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-xl bg-gray-800/90 hover:bg-gray-700 text-gray-300 hover:text-white transition-all border border-gray-700 shadow-md"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {errorMsg && (
          <div className="mx-6 mt-3 p-3 rounded-xl bg-red-500/20 border border-red-500/40 text-red-300 text-xs font-semibold">
            ⚠️ {errorMsg}
          </div>
        )}

        {/* Content */}
        <div className="overflow-y-auto flex-1 p-5 sm:p-6 space-y-6 overscroll-contain custom-scrollbar text-left">
          {/* Section 1: Free Default Avatars */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="text-xs font-bold text-gray-300 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                <span>Базовые Аватарки (Бесплатно)</span>
              </div>
              <span className="text-[11px] text-emerald-400 font-semibold">Доступны всегда</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {DEFAULT_AVATARS.map((avatar) => {
                const isActive = activeAvatarId === avatar.id;

                return (
                  <div
                    key={avatar.id}
                    onClick={() => handleEquip(avatar.id)}
                    className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex flex-col items-center text-center relative group ${
                      isActive
                        ? 'bg-blue-600/20 border-blue-500 shadow-lg glow-blue ring-2 ring-blue-400/40'
                        : 'bg-gray-900/60 hover:bg-gray-800/80 border-gray-800 hover:border-gray-700'
                    }`}
                  >
                    {isActive && (
                      <div className="absolute top-2 right-2 p-1 rounded-full bg-blue-500 text-white shadow-md">
                        <Check className="w-3 h-3" />
                      </div>
                    )}

                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-blue-600 flex items-center justify-center text-3xl mb-2 shadow-md group-hover:scale-105 transition-transform">
                      {avatar.icon}
                    </div>

                    <div className="font-extrabold text-sm text-white mb-0.5">{avatar.name}</div>
                    <div className="text-[11px] text-gray-400 mb-2.5">{avatar.description}</div>

                    <button
                      type="button"
                      disabled={isActive}
                      className={`w-full py-1.5 rounded-xl text-xs font-bold transition-all ${
                        isActive
                          ? 'bg-blue-500 text-white shadow-sm'
                          : 'bg-gray-800 text-gray-300 hover:text-white hover:bg-gray-700'
                      }`}
                    >
                      {isActive ? 'Выбран' : 'Надеть'}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Section 2: Premium Shop Avatars */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="text-xs font-bold text-gray-300 uppercase tracking-wider flex items-center gap-1.5">
                <ShoppingBag className="w-3.5 h-3.5 text-purple-400" />
                <span>Премиум Коллекция (За Токены)</span>
              </div>
              <span className="text-[11px] text-purple-400 font-semibold">Эксклюзивные арты</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {SHOP_AVATARS.map((avatar) => {
                const isOwned = inventory.includes(avatar.id);
                const isActive = activeAvatarId === avatar.id;
                const canAfford = userTokens >= avatar.price;
                const isLoading = loadingAvatarId === avatar.id;

                return (
                  <div
                    key={avatar.id}
                    className={`p-3.5 rounded-2xl border transition-all flex flex-col items-center text-center relative ${
                      isActive
                        ? 'bg-purple-600/20 border-purple-500 shadow-lg glow-purple ring-2 ring-purple-400/40'
                        : isOwned
                        ? 'bg-gray-900/60 hover:bg-gray-800/80 border-gray-800'
                        : 'bg-gray-900/40 border-gray-800/60'
                    }`}
                  >
                    {isActive && (
                      <div className="absolute top-2 right-2 p-1 rounded-full bg-purple-500 text-white shadow-md z-10">
                        <Check className="w-3 h-3" />
                      </div>
                    )}

                    {!isOwned && (
                      <div className="absolute top-2 right-2 p-1 rounded-full bg-gray-800/90 text-yellow-400 border border-yellow-500/40 shadow-sm z-10">
                        <Lock className="w-3 h-3" />
                      </div>
                    )}

                    <div className="relative w-16 h-16 rounded-2xl overflow-hidden mb-2 border border-purple-500/40 shadow-md">
                      <img
                        src={avatar.imageSrc}
                        alt={avatar.name}
                        className={`w-full h-full object-cover transition-transform ${
                          !isOwned ? 'grayscale-40 brightness-90' : 'group-hover:scale-105'
                        }`}
                      />
                    </div>

                    <div className="font-extrabold text-sm text-white mb-0.5">{avatar.name}</div>
                    <div className="text-[11px] text-gray-400 mb-2.5">{avatar.description}</div>

                    {isOwned ? (
                      <button
                        type="button"
                        onClick={() => handleEquip(avatar.id)}
                        disabled={isActive || isLoading}
                        className={`w-full py-1.5 rounded-xl text-xs font-bold transition-all ${
                          isActive
                            ? 'bg-purple-600 text-white shadow-sm'
                            : 'bg-gray-800 text-gray-300 hover:text-white hover:bg-gray-700 cursor-pointer'
                        }`}
                      >
                        {isLoading ? 'Сохранение...' : isActive ? 'Выбран' : 'Надеть'}
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleBuyAndEquip(avatar)}
                        disabled={!canAfford || isLoading}
                        className={`w-full py-1.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 shadow-sm ${
                          canAfford
                            ? 'bg-amber-500 hover:bg-amber-400 text-gray-950 glow-yellow cursor-pointer'
                            : 'bg-gray-800/60 text-gray-500 border border-gray-700/40 cursor-not-allowed'
                        }`}
                      >
                        {isLoading ? (
                          'Покупка...'
                        ) : (
                          <>
                            <Coins className="w-3.5 h-3.5" />
                            <span>Купить: {avatar.price} FIT</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

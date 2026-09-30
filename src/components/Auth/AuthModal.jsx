import React, { useState } from 'react';
import { authService } from '../../services/api/authService';
import { Dumbbell, Sparkles, LogIn, UserPlus, AlertCircle } from 'lucide-react';

export function AuthModal({ onAuthSuccess }) {
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (isRegisterMode) {
      if (!username.trim()) {
        setError('Укажите ваше имя');
        setLoading(false);
        return;
      }
      const { user, error: regErr } = await authService.register(email, username, password);
      setLoading(false);
      if (user) {
        onAuthSuccess(user);
      } else {
        setError(regErr || 'Ошибка регистрации');
      }
    } else {
      const { user, error: loginErr } = await authService.login(email, password);
      setLoading(false);
      if (user) {
        onAuthSuccess(user);
      } else {
        setError(loginErr || 'Неверный email или пароль');
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-2xl animate-fade-in select-none">
      <div className="w-full max-w-md glass-panel rounded-3xl p-8 border border-blue-500/40 text-center shadow-2xl glow-blue">
        {/* Brand Header */}
        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-xl glow-blue">
          <Dumbbell className="w-8 h-8" />
        </div>

        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs font-semibold mb-3">
          <Sparkles className="w-3.5 h-3.5 text-yellow-400" /> Умный AI Тренер с SQL Базой
        </div>

        <h2 className="text-2xl font-extrabold text-white mb-1">
          {isRegisterMode ? 'Создать Аккаунт' : 'Авторизация в FIT.AI'}
        </h2>
        <p className="text-xs text-gray-400 mb-6">
          {isRegisterMode ? 'Заполните данные для начала тренировок' : 'Введите данные для входа в ваш профиль'}
        </p>

        {/* Mode Switcher Tabs */}
        <div className="flex bg-gray-900/80 p-1 rounded-xl border border-gray-800 mb-6">
          <button
            type="button"
            onClick={() => { setIsRegisterMode(false); setError(''); }}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
              !isRegisterMode ? 'bg-blue-600 text-white shadow-md' : 'text-gray-400 hover:text-white'
            }`}
          >
            Войти
          </button>
          <button
            type="button"
            onClick={() => { setIsRegisterMode(true); setError(''); }}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
              isRegisterMode ? 'bg-blue-600 text-white shadow-md' : 'text-gray-400 hover:text-white'
            }`}
          >
            Регистрация
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-500/20 border border-red-500/40 text-red-300 text-xs font-semibold text-left flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <div>{error}</div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-left">
          {isRegisterMode && (
            <div>
              <label className="block text-xs font-bold text-gray-300 mb-1.5 uppercase">Ваше Имя</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Алекс"
                required={isRegisterMode}
                className="w-full px-4 py-3 rounded-xl bg-gray-900 border border-gray-700 text-white focus:outline-none focus:border-blue-500 text-sm"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-gray-300 mb-1.5 uppercase">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="alex@fit.ai"
              required
              className="w-full px-4 py-3 rounded-xl bg-gray-900 border border-gray-700 text-white focus:outline-none focus:border-blue-500 text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-300 mb-1.5 uppercase">Пароль</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              minLength={4}
              className="w-full px-4 py-3 rounded-xl bg-gray-900 border border-gray-700 text-white focus:outline-none focus:border-blue-500 text-sm"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-500 to-blue-600 hover:from-blue-500 hover:to-indigo-400 text-white font-extrabold text-sm tracking-wide shadow-xl glow-blue transition-all flex items-center justify-center gap-2 mt-2 cursor-pointer disabled:opacity-50"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : isRegisterMode ? (
              <>
                <UserPlus className="w-4 h-4" /> Зарегистрироваться
              </>
            ) : (
              <>
                <LogIn className="w-4 h-4" /> Войти в аккаунт
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

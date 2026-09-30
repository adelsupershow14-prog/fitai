import React, { useEffect, useState } from 'react';
import { Timer, FastForward, Play } from 'lucide-react';
import { voiceService } from '../../services/audio/voiceService';

export function RestTimer({ duration = 30, onComplete }) {
  const [timeLeft, setTimeLeft] = useState(duration);

  useEffect(() => {
    if (timeLeft <= 0) {
      voiceService.playRestCompleteChime();
      voiceService.speak('Отдых окончен! Приготовьтесь к следующему подходу.', true);
      onComplete();
      return;
    }

    const interval = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [timeLeft, onComplete]);

  const progressPct = ((duration - timeLeft) / duration) * 100;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xl animate-fade-in">
      <div className="w-full max-w-md glass-panel rounded-3xl p-8 border border-blue-500/30 text-center shadow-2xl glow-blue">
        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-blue-500/20 border border-blue-500/40 flex items-center justify-center text-blue-400">
          <Timer className="w-8 h-8 animate-pulse" />
        </div>

        <h3 className="text-xl font-bold text-white mb-1">Отдых между подходами</h3>
        <p className="text-sm text-gray-400 mb-6">Восстановите дыхание перед следующей серией</p>

        {/* Big Countdown Number */}
        <div className="text-6xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-300 to-purple-400 font-mono mb-6">
          00:{timeLeft < 10 ? `0${timeLeft}` : timeLeft}
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-gray-800 rounded-full h-3 mb-8 overflow-hidden border border-gray-700">
          <div
            className="bg-gradient-to-r from-blue-500 to-purple-500 h-full transition-all duration-1000 ease-linear rounded-full"
            style={{ width: `${progressPct}%` }}
          />
        </div>

        <button
          onClick={onComplete}
          className="w-full py-3.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold transition-all flex items-center justify-center gap-2 shadow-lg glow-blue"
        >
          <FastForward className="w-5 h-5" /> Пропустить отдых
        </button>
      </div>
    </div>
  );
}

import React, { useEffect, useState, useRef } from 'react';
import { voiceService } from '../../services/audio/voiceService';
import {
  Play,
  SkipForward,
  Volume2,
  VolumeX,
  AlertTriangle,
  Camera,
  Compass,
  Sparkles,
} from 'lucide-react';

const EXERCISE_INSTRUCTIONS = {
  squats: {
    id: 'squats',
    name: 'Классические приседания',
    icon: '🏋️‍♂️',
    targetMuscles: 'Квадрицепсы, ягодицы, кор',
    position: 'Боком или под углом 45° к камере, расстояние 2–2.5 метра',
    spokenText:
      'Классические приседания. Встаньте боком к камере на расстоянии двух метров. Поставьте ноги на ширине плеч. Опускайтесь до угла девяносто градусов, сохраняя ровную спину. Не сводите колени внутрь. Начинаем!',
    steps: [
      {
        title: 'Исходное положение',
        desc: 'Стопы на ширине плеч, носки слегка развернуты наружу, грудь раскрыта.',
      },
      {
        title: 'Глубина приседа (Колени 90°)',
        desc: 'Отводите таз назад и плавно сгибайте колени до прямого угла 90°. Упор на пятки.',
      },
      {
        title: 'Прямая спина',
        desc: 'Держите корпус ровным (угол спины более 145°), не сутультесь и не округляйте поясницу.',
      },
      {
        title: 'Колени наружу',
        desc: 'Следите, чтобы колени двигались строго по направлению носков и не заваливались внутрь.',
      },
    ],
    donts: [
      'Не отрывайте пятки от пола',
      'Не сводите колени внутрь при подъеме',
      'Не округляйте грудной отдел позвоночника',
    ],
  },
  plank: {
    id: 'plank',
    name: 'Планка (Статика)',
    icon: '⏱️',
    targetMuscles: 'Мышцы кора, пресс, плечевой пояс',
    position: 'Строго боком к камере в полный рост, расстояние 2–2.5 метра',
    spokenText:
      'Упражнение планка. Примите горизонтальный упор боком к камере. Держите тело в одну прямую линию от пяток до макушки. Напрягите пресс. Таймер считает только секунды чистого удержания. Начинаем!',
    steps: [
      {
        title: 'Упор лежа',
        desc: 'Займите упор на предплечьях или прямых руках. Локти строго под плечевыми суставами.',
      },
      {
        title: 'Прямая линия корпуса',
        desc: 'Плечо, таз и голеностоп должны образовывать абсолютно ровную линию (угол 160–180°).',
      },
      {
        title: 'Мышечный замок',
        desc: 'Напрягите пресс и ягодицы, подтяните живот к позвоночнику. Дышите размеренно.',
      },
      {
        title: 'Положение шеи',
        desc: 'Взгляд направлен в пол перед собой, шея продолжает естественную линию позвоночника.',
      },
    ],
    donts: [
      'Не прогибайте поясницу вниз (таймер встанет на паузу)',
      'Не задирайте таз домиком вверх',
      'Не задерживайте дыхание во время удержания',
    ],
  },
  pushups: {
    id: 'pushups',
    name: 'Классические отжимания',
    icon: '🤸‍♂️',
    targetMuscles: 'Грудные мышцы, трицепсы, передние дельты',
    position: 'Боком к камере, упор лежа в полный рост, расстояние 2–2.5 метра',
    spokenText:
      'Классические отжимания. Займите упор лежа боком к камере. Опускайтесь до прямого угла в локтях, сохраняя жесткую планку тела. Начинаем!',
    steps: [
      {
        title: 'Постановка рук',
        desc: 'Ладони чуть шире плеч на уровне груди, пальцы направлены вперед.',
      },
      {
        title: 'Жесткий корпус',
        desc: 'Тело вытянуто в струну от пяток до затылка. Пресс в постоянном напряжении.',
      },
      {
        title: 'Угол локтей 45–70°',
        desc: 'При опускании держите локти под углом к телу, не расставляйте их перпендикулярно.',
      },
      {
        title: 'Полная глубина (90°)',
        desc: 'Опускайтесь до прямого угла в локтевых суставах (касание грудью нижней точки).',
      },
    ],
    donts: [
      'Не провисайте в тазу и пояснице',
      'Не делайте короткие полуповторы',
      'Не задирайте голову назад',
    ],
  },
  jumping_jacks: {
    id: 'jumping_jacks',
    name: 'Jumping Jacks (Прыжки)',
    icon: '⚡',
    targetMuscles: 'Кардио, выносливость, икры, дельты',
    position: 'Лицом к камере в полный рост, расстояние 2.5–3.0 метра',
    spokenText:
      'Прыжки джампинг джек. Встаньте лицом к камере. В прыжке синхронно разводите ноги шире плеч и соединяйте руки над головой. Держите энергичный темп. Начинаем!',
    steps: [
      {
        title: 'Исходное положение',
        desc: 'Стопы вместе, руки свободно опущены вдоль тела по бокам.',
      },
      {
        title: 'Синхронный прыжок',
        desc: 'В прыжке одновременно разведите ноги шире плеч и поднимите руки через стороны.',
      },
      {
        title: 'Руки над головой',
        desc: 'Ладони соединяются или сводятся прямо над макушкой (угол в плечах более 135°).',
      },
      {
        title: 'Мягкое приземление',
        desc: 'Приземляйтесь мягко на носки с чуть подпружиненными коленями, сохраняя темп.',
      },
    ],
    donts: [
      'Не поднимайте руки только наполовину до уровня плеч',
      'Не делайте слишком узкий шаг ногами',
      'Не приземляйтесь жестко на прямые колени',
    ],
  },
  arm_raises: {
    id: 'arm_raises',
    name: 'Подъемы рук для осанки',
    icon: '🧘',
    targetMuscles: 'Мышцы верхней части спины, ромбовидные, трапеции, дельты',
    position: 'Лицом или полубоком к камере, расстояние 2 метра',
    spokenText:
      'Подъемы рук для осанки. Встаньте прямо. Плавно поднимайте прямые руки через стороны строго над головой, сводя лопатки. Не прогибайте поясницу. Начинаем!',
    steps: [
      {
        title: 'Вертикальная стойка',
        desc: 'Встаньте прямо, макушкой тянитесь вверх, плечи опущены, живот слегка подтянут.',
      },
      {
        title: 'Плавный подъем прямых рук',
        desc: 'Через стороны поднимайте прямые руки вверх до полного вертикального вытягивания над головой.',
      },
      {
        title: 'Сведение лопаток',
        desc: 'В верхней точке акцентируйте раскрытие грудного отдела и сведение лопаток.',
      },
      {
        title: 'Нейтральная поясница',
        desc: 'Держите мышцы пресса в тонусе — не компенсируйте подъем рук прогибом назад в пояснице.',
      },
    ],
    donts: [
      'Не сгибайте руки в локтевых суставах',
      'Не прогибайте поясницу и не запрокидывайте корпус назад',
      'Не делайте резких рывковых движений',
    ],
  },
};

export function ExerciseInstructionModal({
  exerciseId = 'squats',
  isOpen = false,
  onStart,
  isVoiceEnabled = true,
  onToggleVoice,
}) {
  const info = EXERCISE_INSTRUCTIONS[exerciseId] || EXERCISE_INSTRUCTIONS.squats;
  const [isSpeakingNow, setIsSpeakingNow] = useState(false);
  const isStartedRef = useRef(false);

  const handleStart = () => {
    if (isStartedRef.current) return;
    isStartedRef.current = true;
    voiceService.stop();
    setIsSpeakingNow(false);
    if (onStart) onStart();
  };

  useEffect(() => {
    isStartedRef.current = false;

    if (isOpen) {
      if (isVoiceEnabled && info.spokenText) {
        setIsSpeakingNow(true);
        // Automatically start exercise when voice speech ends (onend)
        voiceService.speak(info.spokenText, true, () => {
          setIsSpeakingNow(false);
          handleStart();
        });
      } else {
        setIsSpeakingNow(false);
      }
    } else {
      voiceService.stop();
      setIsSpeakingNow(false);
    }

    return () => {
      voiceService.stop();
      setIsSpeakingNow(false);
    };
  }, [isOpen, exerciseId, isVoiceEnabled, info.spokenText]);

  if (!isOpen) return null;

  const handleToggleVoiceClick = () => {
    if (isVoiceEnabled) {
      voiceService.stop();
      setIsSpeakingNow(false);
    }
    if (onToggleVoice) {
      onToggleVoice();
    }
  };

  const handleSkip = () => {
    handleStart();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-xl animate-fade-in overflow-y-auto">
      <div className="w-full max-w-2xl glass-panel rounded-3xl p-5 sm:p-8 border border-blue-500/30 shadow-2xl relative text-left my-auto max-h-[92vh] flex flex-col bg-gray-950/95">
        {/* Top Header */}
        <div className="flex items-center justify-between pb-4 border-b border-gray-800/80 shrink-0">
          <div className="flex items-center gap-3">
            <span className="text-3xl sm:text-4xl p-2 rounded-2xl bg-blue-500/10 border border-blue-500/30">
              {info.icon}
            </span>
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-400 text-[11px] font-semibold mb-0.5">
                <Sparkles className="w-3 h-3" /> Инструкция по технике AI
              </div>
              <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
                {info.name}
              </h2>
            </div>
          </div>

          {/* Voice status banner */}
          <div className="hidden sm:flex items-center gap-2">
            {isVoiceEnabled ? (
              <span className="text-xs px-2.5 py-1 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-semibold flex items-center gap-1.5">
                <Volume2 className={`w-3.5 h-3.5 ${isSpeakingNow ? 'animate-pulse text-emerald-300' : ''}`} />
                {isSpeakingNow ? 'Озвучивание...' : 'Голос активен'}
              </span>
            ) : (
              <span className="text-xs px-2.5 py-1 rounded-xl bg-gray-800 border border-gray-700 text-gray-400 font-semibold flex items-center gap-1.5">
                <VolumeX className="w-3.5 h-3.5" /> Без звука
              </span>
            )}
          </div>
        </div>

        {/* Scrollable Instruction Body */}
        <div className="overflow-y-auto flex-1 pr-1 sm:pr-2 py-4 space-y-4 text-sm text-gray-300 custom-scrollbar">
          {/* Active Voice Prompt Indicator */}
          {isVoiceEnabled && isSpeakingNow && (
            <div className="p-3 rounded-2xl bg-indigo-950/40 border border-indigo-500/30 flex items-center gap-3 text-xs text-indigo-200 shadow-sm animate-pulse-fast">
              <div className="w-2.5 h-2.5 rounded-full bg-indigo-400 animate-ping shrink-0" />
              <span>
                Идет голосовой инструктаж. Упражнение <strong>начнется автоматически</strong> сразу после окончания речи!
              </span>
            </div>
          )}

          {/* Camera Setup Badge */}
          <div className="p-3.5 rounded-2xl bg-blue-950/40 border border-blue-500/30 flex items-start gap-3">
            <Camera className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-blue-300">
                Камера и дистанция
              </div>
              <p className="text-xs text-gray-300 mt-0.5 leading-relaxed">{info.position}</p>
            </div>
          </div>

          {/* Steps Checklist */}
          <div>
            <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Compass className="w-3.5 h-3.5 text-blue-400" /> Ключевые точки техники:
            </div>
            <div className="grid grid-cols-1 gap-2.5">
              {info.steps.map((st, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-xl bg-gray-900/70 border border-gray-800/80 flex items-start gap-3"
                >
                  <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                    {idx + 1}
                  </span>
                  <div>
                    <h4 className="font-bold text-white text-xs sm:text-sm">{st.title}</h4>
                    <p className="text-xs text-gray-400 mt-0.5 leading-relaxed">{st.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Common Errors & Warnings */}
          <div className="p-3.5 rounded-2xl bg-red-950/30 border border-red-500/30">
            <div className="text-xs font-bold text-red-300 uppercase tracking-wider flex items-center gap-1.5 mb-2">
              <AlertTriangle className="w-4 h-4 text-red-400" /> Ошибки, которые фиксирует AI:
            </div>
            <ul className="space-y-1 text-xs text-gray-300 pl-1">
              {info.donts.map((d, idx) => (
                <li key={idx} className="flex items-center gap-2">
                  <span className="text-red-400 font-bold shrink-0">✕</span>
                  <span>{d}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Footer Actions (Voice Toggle + Skip + Start) */}
        <div className="pt-4 border-t border-gray-800/80 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            {/* Voice Toggle Button in Modal */}
            <button
              onClick={handleToggleVoiceClick}
              className={`flex-1 sm:flex-initial px-4 py-3 rounded-2xl border font-bold text-xs flex items-center justify-center gap-2 transition-all ${
                isVoiceEnabled
                  ? 'bg-emerald-500/20 border-emerald-500/60 text-emerald-300 shadow-sm'
                  : 'bg-gray-900 border-gray-700 text-gray-400 hover:text-white'
              }`}
              title="Переключить озвучку инструкции"
            >
              {isVoiceEnabled ? (
                <>
                  <Volume2 className="w-4 h-4 text-emerald-400" />
                  <span>Озвучка: ВКЛ</span>
                </>
              ) : (
                <>
                  <VolumeX className="w-4 h-4 text-gray-400" />
                  <span>Озвучка: ВЫКЛ</span>
                </>
              )}
            </button>

            {/* Skip Button */}
            <button
              onClick={handleSkip}
              className="flex-1 sm:flex-initial px-5 py-3 rounded-2xl bg-gray-900 hover:bg-gray-800 text-gray-300 hover:text-white font-bold text-xs transition-all border border-gray-700 flex items-center justify-center gap-1.5"
            >
              <SkipForward className="w-4 h-4 text-gray-400" /> Пропустить
            </button>
          </div>

          {/* Immediate Start Exercise Button */}
          <button
            onClick={handleStart}
            className="w-full sm:w-auto px-7 py-3 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-600 hover:from-blue-500 hover:to-indigo-500 text-white font-extrabold text-xs sm:text-sm tracking-wide shadow-xl glow-blue transition-all flex items-center justify-center gap-2"
          >
            <Play className="w-4 h-4 fill-white" /> Начать упражнение
          </button>
        </div>
      </div>
    </div>
  );
}

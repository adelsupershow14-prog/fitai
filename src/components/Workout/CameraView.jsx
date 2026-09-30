import React, { useEffect, useRef, useState } from 'react';
import { PoseCanvas } from './PoseCanvas';
import { createExerciseDetector, EXERCISE_DETECTOR_CONFIG } from '../../services/pose';
import { voiceService } from '../../services/audio/voiceService';
import {
  Camera,
  CameraOff,
  Volume2,
  VolumeX,
  AlertTriangle,
  ShieldCheck,
  Flame,
  Maximize,
  Minimize,
  AlertCircle,
  Sparkles,
} from 'lucide-react';

export function CameraView({
  exerciseId,
  targetGoal,
  onRepCountUpdate,
  isPaused,
  isVoiceEnabled,
  onToggleVoice,
  isFullscreen = false,
  onToggleFullscreen,
}) {
  const videoRef = useRef(null);
  const containerRef = useRef(null);

  const [landmarks, setLandmarks] = useState([]);
  const [feedback, setFeedback] = useState({ message: 'Загрузка ИИ-модели...', status: 'info', errorJoints: [] });
  const [metricLabel, setMetricLabel] = useState('Угол сустава');
  const [metricValue, setMetricValue] = useState(180);
  const [metricUnit, setMetricUnit] = useState('°');
  const [holdSeconds, setHoldSeconds] = useState(0);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  const [dimensions, setDimensions] = useState({ width: 640, height: 480 });

  const detectorRef = useRef(null);
  const cameraEngineRef = useRef(null);
  const lastSpokenMessageRef = useRef('');
  const lastSpeakTimeRef = useRef(0);

  // Initialize or re-create detector when exercise changes
  useEffect(() => {
    detectorRef.current = createExerciseDetector(exerciseId);
    if (detectorRef.current && detectorRef.current.setTargetSeconds && targetGoal) {
      detectorRef.current.setTargetSeconds(targetGoal);
    }
    const config = EXERCISE_DETECTOR_CONFIG[exerciseId];
    if (config) {
      setMetricLabel(config.metricTitle || 'Метрика');
    }
  }, [exerciseId, targetGoal]);

  useEffect(() => {
    let isMounted = true;

    async function setupPoseEngine() {
      try {
        setFeedback({ message: 'Инициализация веб-камеры и MediaPipe...', status: 'info', errorJoints: [] });

        if (!window.Pose) {
          await loadScript('https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js');
          await loadScript('https://cdn.jsdelivr.net/npm/@mediapipe/pose/pose.js');
        }

        if (!isMounted) return;

        const pose = new window.Pose({
          locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`,
        });

        pose.setOptions({
          modelComplexity: 1,
          smoothLandmarks: true,
          enableSegmentation: false,
          minDetectionConfidence: 0.5,
          minTrackingConfidence: 0.5,
        });

        pose.onResults((results) => {
          if (!isMounted || isPaused) return;

          if (results.poseLandmarks) {
            setLandmarks(results.poseLandmarks);

            if (detectorRef.current) {
              const res = detectorRef.current.process(results.poseLandmarks);

              if (res.metricName) setMetricLabel(res.metricName);
              if (res.currentMetric !== undefined) setMetricValue(res.currentMetric);
              if (res.metricUnit) setMetricUnit(res.metricUnit);

              if (res.isHold) {
                setHoldSeconds(res.holdSeconds || 0);
                onRepCountUpdate(res.isPerfectRep, res.holdSeconds, true);
              }

              setFeedback(res.feedback);

              // Voice audio cue with throttling to avoid spamming speech
              const now = Date.now();
              if (
                res.feedback?.message &&
                isVoiceEnabled &&
                res.feedback.message !== lastSpokenMessageRef.current &&
                now - lastSpeakTimeRef.current > 3500
              ) {
                lastSpokenMessageRef.current = res.feedback.message;
                lastSpeakTimeRef.current = now;
                voiceService.speak(res.feedback.message);
              }

              if (res.isRepCompleted) {
                voiceService.playRepChime(res.isPerfectRep);
                onRepCountUpdate(res.isPerfectRep, res.isHold ? res.holdSeconds : null, res.isHold);
              }
            }
          }
        });

        if (videoRef.current) {
          const camera = new window.Camera(videoRef.current, {
            onFrame: async () => {
              if (videoRef.current && pose) {
                await pose.send({ image: videoRef.current });
              }
            },
            width: 640,
            height: 480,
          });

          cameraEngineRef.current = camera;
          await camera.start();
          if (isMounted) setIsCameraActive(true);
        }
      } catch (err) {
        console.error('Camera/MediaPipe startup error:', err);
        if (isMounted) {
          setCameraError('Не удалось получить доступ к веб-камере. Пожалуйста, разрешите доступ в браузере.');
          setFeedback({ message: 'Ошибка камеры', status: 'error', errorJoints: [] });
        }
      }
    }

    setupPoseEngine();

    return () => {
      isMounted = false;
      if (cameraEngineRef.current) {
        try { cameraEngineRef.current.stop(); } catch (e) {}
      }
    };
  }, [exerciseId, isPaused, isVoiceEnabled]);

  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight,
        });
      }
    };
    updateSize();
    const timer = setTimeout(updateSize, 120);
    window.addEventListener('resize', updateSize);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', updateSize);
    };
  }, [isFullscreen]);

  const currentExerciseConfig = EXERCISE_DETECTOR_CONFIG[exerciseId] || EXERCISE_DETECTOR_CONFIG.squats;
  const isHoldExercise = currentExerciseConfig.type === 'hold';

  return (
    <div
      ref={containerRef}
      className={`relative w-full ${
        isFullscreen
          ? 'h-full min-h-screen rounded-none border-0'
          : 'aspect-video max-h-[520px] rounded-3xl border border-blue-500/20'
      } overflow-hidden glass-panel shadow-2xl bg-gray-950 flex items-center justify-center transition-all duration-300`}
    >
      {/* Video Feed */}
      <video
        ref={videoRef}
        className="w-full h-full object-cover transform -scale-x-100"
        playsInline
        muted
      />

      {/* Overlay Skeleton Canvas */}
      <PoseCanvas
        landmarks={landmarks}
        feedback={feedback}
        width={dimensions.width}
        height={dimensions.height}
      />

      {/* Real-time Angle & Metric Badge */}
      <div
        className={`absolute z-20 flex flex-wrap items-center gap-2 transition-all duration-300 ${
          isFullscreen
            ? 'top-6 left-1/2 -translate-x-1/2'
            : 'top-4 left-4'
        }`}
      >
        <div className="px-3.5 py-1.5 rounded-xl bg-gray-900/85 backdrop-blur-md border border-gray-700/80 text-xs font-mono font-bold text-blue-400 flex items-center gap-2 shadow-lg">
          <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
          <span>{currentExerciseConfig.icon} {metricLabel}: {metricValue}{metricUnit}</span>
        </div>

        {isHoldExercise && (
          <div className="px-3 py-1.5 rounded-xl bg-amber-500/20 backdrop-blur-md border border-amber-500/40 text-xs font-mono font-bold text-amber-300 flex items-center gap-1.5 shadow-lg">
            <Flame className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
            <span>Удержание: {holdSeconds} / {targetGoal || currentExerciseConfig.defaultSeconds}с</span>
          </div>
        )}
      </div>

      {/* Top Right Controls Toolbar (Voice toggle & Fullscreen button with Glassmorphism) */}
      <div
        className={`absolute z-20 flex items-center gap-2 transition-all duration-300 ${
          isFullscreen ? 'top-6 right-6' : 'top-4 right-4'
        }`}
      >
        {/* Voice Assistant Toggle */}
        <button
          onClick={onToggleVoice}
          className={`px-3 py-2 rounded-lg backdrop-blur-md border text-xs font-bold flex items-center gap-1.5 transition-all shadow-lg active:scale-95 ${
            isVoiceEnabled
              ? 'bg-emerald-500/25 border-emerald-500/50 text-emerald-300 hover:bg-emerald-500/35 glow-green'
              : 'backdrop-blur-md bg-white/20 hover:bg-white/30 border-white/20 text-white'
          }`}
          title={isVoiceEnabled ? 'Голосовой тренер: Включен' : 'Голосовой тренер: Выключен'}
        >
          {isVoiceEnabled ? (
            <Volume2 className="w-4 h-4 text-emerald-300 animate-pulse" />
          ) : (
            <VolumeX className="w-4 h-4 text-gray-200" />
          )}
          <span className="hidden sm:inline">{isVoiceEnabled ? 'Голос' : 'Без звука'}</span>
        </button>

        {/* Fullscreen Button with Glassmorphism */}
        {onToggleFullscreen && (
          <button
            onClick={onToggleFullscreen}
            className="backdrop-blur-md bg-white/20 hover:bg-white/30 text-white p-2 rounded-lg transition border border-white/20 flex items-center justify-center shadow-lg active:scale-95 group"
            title={isFullscreen ? 'Выйти из полноэкранного режима (Esc)' : 'На весь экран'}
          >
            {isFullscreen ? (
              <Minimize className="w-5 h-5 transition-transform group-hover:scale-110" />
            ) : (
              <Maximize className="w-5 h-5 transition-transform group-hover:scale-110" />
            )}
          </button>
        )}
      </div>

      {/* Floating Bottom-Center Recommendation Toast (Animated status toast) */}
      <div
        key={feedback.message + feedback.status}
        className={`absolute z-30 pointer-events-none transition-all duration-300 left-1/2 -translate-x-1/2 animate-toast-enter ${
          isFullscreen ? 'bottom-8' : 'bottom-4 sm:bottom-6'
        } w-auto max-w-[92%] sm:max-w-md md:max-w-lg`}
      >
        <div
          className={`px-4 sm:px-5 py-3 rounded-2xl backdrop-blur-xl border transition-all duration-300 flex items-center gap-3.5 shadow-2xl ${
            feedback.status === 'error'
              ? 'bg-red-950/85 border-red-500/90 text-red-100 shadow-[0_0_30px_rgba(239,68,68,0.5)] ring-1 ring-red-400/50 animate-error-glow'
              : feedback.status === 'warning'
              ? 'bg-yellow-950/85 border-yellow-500/80 text-yellow-100 shadow-[0_0_25px_rgba(234,179,8,0.4)] ring-1 ring-yellow-400/40'
              : feedback.status === 'good'
              ? 'bg-emerald-950/85 border-emerald-500/80 text-emerald-100 shadow-[0_0_25px_rgba(16,185,129,0.4)] ring-1 ring-emerald-400/40 glow-green'
              : 'bg-gray-900/85 border-gray-700/80 text-gray-200 shadow-xl'
          }`}
        >
          {/* Status Icon */}
          <div className="shrink-0">
            {feedback.status === 'error' ? (
              <div className="p-2 rounded-xl bg-red-500/20 text-red-400 ring-1 ring-red-500/40">
                <AlertTriangle className="w-5 h-5 sm:w-6 sm:h-6 animate-bounce" />
              </div>
            ) : feedback.status === 'warning' ? (
              <div className="p-2 rounded-xl bg-yellow-500/20 text-yellow-400 ring-1 ring-yellow-500/40">
                <AlertCircle className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
            ) : feedback.status === 'good' ? (
              <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 ring-1 ring-emerald-500/40">
                <ShieldCheck className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
            ) : (
              <div className="p-2 rounded-xl bg-blue-500/20 text-blue-400 ring-1 ring-blue-500/40">
                <Sparkles className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
            )}
          </div>

          {/* Message Content */}
          <div className="flex-1 min-w-0">
            <div className="text-[10px] sm:text-[11px] uppercase font-bold tracking-wider opacity-90 flex items-center gap-1.5 mb-0.5">
              <span
                className={`inline-block w-2 h-2 rounded-full ${
                  feedback.status === 'error'
                    ? 'bg-red-400 animate-ping'
                    : feedback.status === 'warning'
                    ? 'bg-yellow-400 animate-pulse'
                    : feedback.status === 'good'
                    ? 'bg-emerald-400'
                    : 'bg-blue-400'
                }`}
              />
              <span
                className={
                  feedback.status === 'error'
                    ? 'text-red-300 font-extrabold'
                    : feedback.status === 'warning'
                    ? 'text-yellow-300 font-extrabold'
                    : feedback.status === 'good'
                    ? 'text-emerald-300 font-extrabold'
                    : 'text-blue-300 font-semibold'
                }
              >
                {feedback.status === 'error'
                  ? 'Режим Ошибка — Коррекция'
                  : feedback.status === 'warning'
                  ? 'Контроль Техники'
                  : feedback.status === 'good'
                  ? 'Техника Идеальна'
                  : 'AI Анализ Движения'}
              </span>
            </div>
            <div className="text-xs sm:text-sm font-extrabold leading-snug line-clamp-2">
              {feedback.message}
            </div>
          </div>
        </div>
      </div>

      {/* Camera Access Error Message */}
      {cameraError && (
        <div className="absolute inset-0 z-30 bg-black/90 flex flex-col items-center justify-center p-6 text-center">
          <CameraOff className="w-12 h-12 text-red-500 mb-3" />
          <h3 className="text-lg font-bold text-white mb-1">Доступ к веб-камере не получен</h3>
          <p className="text-sm text-gray-400 max-w-md">{cameraError}</p>
        </div>
      )}
    </div>
  );
}

function loadScript(src) {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) {
      resolve();
      return;
    }
    const script = document.createElement('script');
    script.src = src;
    script.onload = () => resolve();
    script.onerror = (err) => reject(err);
    document.head.appendChild(script);
  });
}

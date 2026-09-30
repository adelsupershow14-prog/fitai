import React, { useState, useEffect, useMemo, useRef } from 'react';
import { authService } from './services/api/authService';
import { dbService } from './services/api/dbService';
import { AuthModal } from './components/Auth/AuthModal';
import { OnboardingModal } from './components/Onboarding/OnboardingModal';
import { EditPlanModal } from './components/Onboarding/EditPlanModal';
import { Header } from './components/Common/Header';
import { CameraView } from './components/Workout/CameraView';
import { RepCounterDisplay } from './components/Workout/RepCounterDisplay';
import { RestTimer } from './components/Workout/RestTimer';
import { ExerciseInstructionModal } from './components/Workout/ExerciseInstructionModal';
import { ShopModal } from './components/Shop/ShopModal';
import { ProfileModal } from './components/Profile/ProfileModal';
import { LeaderboardModal } from './components/Leaderboard/LeaderboardModal';
import { WelcomeWorkoutModal } from './components/Workout/WelcomeWorkoutModal';
import { voiceService } from './services/audio/voiceService';
import { EXERCISE_DETECTOR_CONFIG } from './services/pose';
import { generateWeeklyPlan } from './services/workoutPlan/planMatrix';
import confetti from 'canvas-confetti';
import {
  Trophy,
  Flame,
  Coins,
  ArrowRight,
  Target,
  Sparkles,
  HelpCircle,
  X,
  Play,
  Calendar,
  CheckCircle2,
  Clock,
  ChevronRight,
  Coffee,
} from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState('workout'); // 'workout' | 'shop'
  const [userProfile, setUserProfile] = useState(null);
  const [loadingAuth, setLoadingAuth] = useState(true);

  // Modals state
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showOnboardingModal, setShowOnboardingModal] = useState(false);
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);
  const [isWorkoutStarted, setIsWorkoutStarted] = useState(false);
  const [showEditPlanModal, setShowEditPlanModal] = useState(false);
  const [showProfileOverlay, setShowProfileOverlay] = useState(false);
  const [showLeaderboardModal, setShowLeaderboardModal] = useState(false);
  const [showInstructionModal, setShowInstructionModal] = useState(false);
  const [hasSeenInstruction, setHasSeenInstruction] = useState({});

  const [isVoiceEnabled, setIsVoiceEnabled] = useState(true);

  // Workout state
  const [selectedExercise, setSelectedExercise] = useState('squats');
  const [currentReps, setCurrentReps] = useState(0);
  const [perfectReps, setPerfectReps] = useState(0);
  const [currentSet, setCurrentSet] = useState(1);
  const [isResting, setIsResting] = useState(false);
  const [workoutResultModal, setWorkoutResultModal] = useState(null);

  const workoutStageRef = useRef(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const isTransitioningRef = useRef(false);

  // Fullscreen change listener to sync state with Escape key and browser changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      const activeFs = !!(
        document.fullscreenElement ||
        document.webkitFullscreenElement ||
        document.mozFullScreenElement ||
        document.msFullscreenElement
      );
      setIsFullscreen(activeFs);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    document.addEventListener('MSFullscreenChange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
      document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
    };
  }, []);

  const handleToggleFullscreen = async () => {
    try {
      const isCurrentlyFs = !!(
        document.fullscreenElement ||
        document.webkitFullscreenElement ||
        document.mozFullScreenElement ||
        document.msFullscreenElement
      );

      if (!isCurrentlyFs) {
        const el = workoutStageRef.current;
        if (el) {
          if (el.requestFullscreen) {
            await el.requestFullscreen();
          } else if (el.webkitRequestFullscreen) {
            await el.webkitRequestFullscreen();
          } else if (el.msRequestFullscreen) {
            await el.msRequestFullscreen();
          }
        }
      } else {
        if (document.exitFullscreen) {
          await document.exitFullscreen();
        } else if (document.webkitExitFullscreen) {
          await document.webkitExitFullscreen();
        } else if (document.msExitFullscreen) {
          await document.msExitFullscreen();
        }
      }
    } catch (err) {
      console.error('Fullscreen toggle error:', err);
    }
  };

  // 1. Compute user's active personal plan exercises
  const planExercises = useMemo(() => {
    const scheduleExercises = userProfile?.workoutPlan?.schedule?.[0]?.exercises;
    if (scheduleExercises && scheduleExercises.length > 0) {
      return scheduleExercises;
    }
    const goal = userProfile?.goal || 'muscle';
    const fallbackPlan = generateWeeklyPlan(goal, userProfile?.level || 'intermediate', 3);
    return fallbackPlan?.schedule?.[0]?.exercises || [];
  }, [userProfile]);

  // Ensure current exercise is part of the user's personal plan
  useEffect(() => {
    if (planExercises.length > 0) {
      const exists = planExercises.some((e) => e.id === selectedExercise);
      if (!exists) {
        setSelectedExercise(planExercises[0].id);
        setCurrentReps(0);
        setPerfectReps(0);
        setCurrentSet(1);
      }
    }
  }, [planExercises, selectedExercise]);

  // Check if instruction modal should be shown for the current exercise
  useEffect(() => {
    if (
      isWorkoutStarted &&
      !showWelcomeModal &&
      activeTab === 'workout' &&
      !showAuthModal &&
      !showOnboardingModal &&
      !showEditPlanModal &&
      !showProfileOverlay &&
      !isResting &&
      !workoutResultModal
    ) {
      if (!hasSeenInstruction[selectedExercise]) {
        setShowInstructionModal(true);
      }
    }
  }, [
    isWorkoutStarted,
    showWelcomeModal,
    selectedExercise,
    activeTab,
    showAuthModal,
    showOnboardingModal,
    showEditPlanModal,
    showProfileOverlay,
    isResting,
    workoutResultModal,
    hasSeenInstruction,
  ]);

  // Dynamic configuration based on selected exercise & user plan
  const currentConfig = EXERCISE_DETECTOR_CONFIG[selectedExercise] || EXERCISE_DETECTOR_CONFIG.squats;
  const isHold = currentConfig.type === 'hold';

  // Find if current exercise is present in today's active plan
  const planExerciseItem = planExercises.find((e) => e.id === selectedExercise);

  const levelMult =
    userProfile?.level === 'beginner' ? 0.85 : userProfile?.level === 'advanced' ? 1.6 : 1.2;

  const targetReps =
    planExerciseItem?.targetReps ||
    (isHold
      ? Math.round((currentConfig.defaultSeconds || 35) * (levelMult < 1 ? 0.8 : levelMult > 1.3 ? 1.5 : 1.2))
      : Math.round((currentConfig.defaultReps || 12) * levelMult));

  const targetSets =
    planExerciseItem?.targetSets ||
    (userProfile?.level === 'beginner' ? 2 : userProfile?.level === 'advanced' ? 4 : 3);

  const restDuration =
    planExerciseItem?.restTime ||
    (userProfile?.workoutPlan?.restSeconds || (userProfile?.goal === 'loss' ? 15 : 30));

  // Handler to start workout from Welcome modal or Start dashboard
  const handleStartWorkout = (workoutDay) => {
    setShowWelcomeModal(false);
    setIsWorkoutStarted(true);

    const exercises = workoutDay?.exercises || planExercises;
    if (exercises && exercises.length > 0) {
      setSelectedExercise(exercises[0].id);
    }
    handleResetCounter();
    setCurrentSet(1);

    // Sequential step: pop instruction modal with voice
    setShowInstructionModal(true);
  };

  // Load user session on startup from SQL Backend
  useEffect(() => {
    async function loadSession() {
      setLoadingAuth(true);
      const profile = await authService.getMe();
      setLoadingAuth(false);

      if (profile) {
        setUserProfile(profile);
        setIsVoiceEnabled(profile.is_voice_enabled === 1);
        voiceService.setVoiceEnabled(profile.is_voice_enabled === 1);

        if (!profile.is_onboarded) {
          setShowOnboardingModal(true);
        } else {
          setShowWelcomeModal(true);
        }
      } else {
        setUserProfile(null);
        setShowAuthModal(true);
      }
    }
    loadSession();
  }, []);

  // Voice Toggle Button Handler
  const handleToggleVoice = async () => {
    const nextState = !isVoiceEnabled;
    setIsVoiceEnabled(nextState);
    voiceService.setVoiceEnabled(nextState);
    await dbService.toggleVoiceSetting(nextState);
  };

  const handleRepCountUpdate = (isPerfect, holdSeconds = null, isHoldParam = false) => {
    if (isTransitioningRef.current) return;

    if (isHoldParam && holdSeconds !== null) {
      setCurrentReps(holdSeconds);
      if (isPerfect) setPerfectReps(holdSeconds);
    } else {
      setCurrentReps((prev) => prev + 1);
      if (isPerfect) setPerfectReps((prev) => prev + 1);
    }
  };

  const handleResetCounter = () => {
    setCurrentReps(0);
    setPerfectReps(0);
  };

  // 2. AUTOMATIC TRANSITION WHEN TARGET REPS/HOLD TIME REACHED
  useEffect(() => {
    if (
      currentReps >= targetReps &&
      targetReps > 0 &&
      !isResting &&
      !workoutResultModal &&
      !showInstructionModal &&
      !showAuthModal &&
      !isTransitioningRef.current
    ) {
      isTransitioningRef.current = true;

      // Celebrate success!
      confetti({ particleCount: 70, spread: 65, origin: { y: 0.6 } });
      voiceService.playRepChime(true);

      const exerciseName = currentConfig.name;
      const finishedReps = currentReps;
      const finishedPerfect = perfectReps;

      // Record set completion in SQL database
      dbService.recordWorkoutCompletion(exerciseName, finishedReps, finishedPerfect).then(async (result) => {
        const updated = await authService.getMe();
        if (updated) setUserProfile(updated);
      });

      // Transition logic
      if (currentSet < targetSets) {
        // Advance to next set
        voiceService.speak('Цель подхода выполнена! Отдохните перед следующим подходом.');
        setTimeout(() => {
          setCurrentSet((prev) => prev + 1);
          handleResetCounter();
          setIsResting(true);
          isTransitioningRef.current = false;
        }, 600);
      } else {
        // Exercise completed! Advance to next exercise in plan or finish workout
        const currentIdx = planExercises.findIndex((e) => e.id === selectedExercise);
        if (currentIdx !== -1 && currentIdx < planExercises.length - 1) {
          const nextEx = planExercises[currentIdx + 1];
          voiceService.speak('Упражнение полностью завершено! Переходим к следующему упражнению плана.');
          setTimeout(() => {
            setSelectedExercise(nextEx.id);
            setCurrentSet(1);
            handleResetCounter();
            setIsResting(true);
            setShowInstructionModal(true);
            isTransitioningRef.current = false;
          }, 800);
        } else {
          // Entire daily workout finished!
          voiceService.speak('Поздравляем! Тренировка успешно завершена. Отличная работа!');
          setTimeout(() => {
            setWorkoutResultModal({
              exerciseName: currentConfig.name,
              repsCount: finishedReps,
              perfectReps: finishedPerfect,
              tokensEarned: 100,
              accuracyPct: 100,
              streak: userProfile?.streak || 1,
            });
            handleResetCounter();
            setCurrentSet(1);
            isTransitioningRef.current = false;
          }, 800);
        }
      }
    }
  }, [
    currentReps,
    targetReps,
    currentSet,
    targetSets,
    isResting,
    workoutResultModal,
    showInstructionModal,
    showAuthModal,
    selectedExercise,
    planExercises,
    currentConfig.name,
    perfectReps,
    userProfile?.streak,
  ]);

  // Finish Set Early Button Handler (Закончить подход раньше времени)
  const handleFinishEarly = async () => {
    if (isTransitioningRef.current) return;
    isTransitioningRef.current = true;

    const finishedReps = currentReps;
    const finishedPerfect = perfectReps;

    if (finishedReps > 0) {
      confetti({ particleCount: 40, spread: 50, origin: { y: 0.6 } });
      const exerciseName = currentConfig.name;
      await dbService.recordWorkoutCompletion(exerciseName, finishedReps, finishedPerfect);
      const updated = await authService.getMe();
      if (updated) setUserProfile(updated);
    }

    if (currentSet < targetSets) {
      voiceService.speak('Подход завершен досрочно. Отдохните.');
      setCurrentSet((prev) => prev + 1);
      handleResetCounter();
      setIsResting(true);
      isTransitioningRef.current = false;
    } else {
      const currentIdx = planExercises.findIndex((e) => e.id === selectedExercise);
      if (currentIdx !== -1 && currentIdx < planExercises.length - 1) {
        const nextEx = planExercises[currentIdx + 1];
        voiceService.speak('Переходим к следующему упражнению программы.');
        setSelectedExercise(nextEx.id);
        setCurrentSet(1);
        handleResetCounter();
        setIsResting(true);
        setShowInstructionModal(true);
        isTransitioningRef.current = false;
      } else {
        setWorkoutResultModal({
          exerciseName: currentConfig.name,
          repsCount: finishedReps,
          perfectReps: finishedPerfect,
          tokensEarned: 40,
          accuracyPct: 100,
          streak: userProfile?.streak || 1,
        });
        handleResetCounter();
        setCurrentSet(1);
        isTransitioningRef.current = false;
      }
    }
  };

  const handleCloseResultModal = () => {
    setWorkoutResultModal(null);
    handleResetCounter();
    setCurrentSet(1);
    setIsWorkoutStarted(false);
    setShowWelcomeModal(true);
  };

  const handleLogout = async () => {
    await authService.logout();
    setShowProfileOverlay(false);
    setUserProfile(null);
    setIsWorkoutStarted(false);
    setShowWelcomeModal(false);
    setShowAuthModal(true);
  };

  const handleStartInstruction = () => {
    setHasSeenInstruction((prev) => ({ ...prev, [selectedExercise]: true }));
    setShowInstructionModal(false);
  };

  if (loadingAuth) {
    return (
      <div className="min-h-screen bg-[#0B0F19] text-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-semibold text-gray-400">Подключение к SQL базе данных...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0B0F19] text-gray-100 flex flex-col font-sans pb-12">
      {/* Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        userProfile={userProfile}
        onOpenProfileModal={() => setShowProfileOverlay(true)}
        onOpenLeaderboardModal={() => setShowLeaderboardModal(true)}
      />

      {/* Global Leaderboard Modal */}
      <LeaderboardModal
        isOpen={showLeaderboardModal}
        onClose={() => setShowLeaderboardModal(false)}
        currentUserId={userProfile?.id}
      />

      {/* Welcome & Weekly Workout Plan Modal */}
      <WelcomeWorkoutModal
        isOpen={showWelcomeModal}
        onClose={() => setShowWelcomeModal(false)}
        userProfile={userProfile}
        onStartWorkout={handleStartWorkout}
      />

      {/* Forced Registration / Login Modal if not authenticated */}
      {showAuthModal && (
        <AuthModal
          onAuthSuccess={async (profile) => {
            setShowAuthModal(false);
            setUserProfile(profile);
            if (!profile?.is_onboarded) {
              setShowOnboardingModal(true);
            } else {
              setShowWelcomeModal(true);
            }
          }}
        />
      )}

      {/* Initial Registration Onboarding Wizard */}
      {showOnboardingModal && !showAuthModal && (
        <OnboardingModal
          currentProfile={userProfile}
          onComplete={async () => {
            const updated = await authService.getMe();
            if (updated) setUserProfile(updated);
            setShowOnboardingModal(false);
            setShowWelcomeModal(true);
          }}
        />
      )}

      {/* Single-Page Edit Plan Modal */}
      {showEditPlanModal && (
        <EditPlanModal
          currentProfile={userProfile}
          onClose={() => setShowEditPlanModal(false)}
          onPlanUpdated={async () => {
            const updated = await authService.getMe();
            if (updated) setUserProfile(updated);
          }}
        />
      )}


      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 lg:px-8">
        {activeTab === 'workout' && (
          <div className="space-y-6">
            {/* Header & Goal Banner */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 font-semibold flex items-center gap-1">
                    <Sparkles className="w-3 h-3" /> Программа:{' '}
                    {userProfile?.workoutPlan?.goal ||
                      (userProfile?.goal === 'loss'
                        ? 'Сбросить вес (Кардио)'
                        : userProfile?.goal === 'posture'
                        ? 'Улучшить осанку'
                        : 'Накачать ноги & Сила')}
                  </span>
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 font-semibold">
                    {userProfile?.level === 'beginner'
                      ? 'Новичок'
                      : userProfile?.level === 'advanced'
                      ? 'Продвинутый'
                      : 'Любитель'}
                  </span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
                  <span>{currentConfig.icon}</span>
                  <span>{currentConfig.name} с AI Контролем</span>
                </h1>
                <p className="text-xs sm:text-sm text-gray-400 mt-1">
                  Цель:{' '}
                  <span className="text-white font-bold">
                    {targetReps} {isHold ? 'секунд удержания' : 'повторений'}
                  </span>{' '}
                  в {targetSets} подходах • AI анализирует технику в реальном времени
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => setShowWelcomeModal(true)}
                  className="px-3.5 py-2 rounded-xl bg-indigo-900/40 hover:bg-indigo-800/50 text-indigo-300 hover:text-white text-xs font-bold transition-all border border-indigo-500/30 flex items-center gap-1.5 shadow-sm cursor-pointer"
                  title="Открыть недельный план тренировок"
                >
                  <Calendar className="w-4 h-4 text-indigo-400" /> План на неделю
                </button>

                {isWorkoutStarted && (
                  <button
                    onClick={() => {
                      setIsWorkoutStarted(false);
                      setShowWelcomeModal(true);
                    }}
                    className="px-3.5 py-2 rounded-xl bg-red-950/40 hover:bg-red-900/50 text-red-300 hover:text-white text-xs font-bold transition-all border border-red-500/30 flex items-center gap-1.5 shadow-sm cursor-pointer"
                    title="Завершить тренировку и вернуться к плану"
                  >
                    <X className="w-4 h-4 text-red-400" /> Завершить
                  </button>
                )}

                <button
                  onClick={() => setShowInstructionModal(true)}
                  className="px-3 py-2 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white text-xs font-bold transition-all border border-gray-700 flex items-center gap-1.5 shadow-sm cursor-pointer"
                  title="Посмотреть инструкцию по технике"
                >
                  <HelpCircle className="w-4 h-4 text-blue-400" /> Инструкция
                </button>

                <button
                  onClick={() => setShowEditPlanModal(true)}
                  className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all shadow-md glow-blue flex items-center gap-1.5 cursor-pointer"
                >
                  <Target className="w-3.5 h-3.5" /> Настроить Цель & План
                </button>
              </div>
            </div>

            {/* Quick Plan Exercises Bar (Only personal plan exercises!) */}
            {planExercises && planExercises.length > 0 && isWorkoutStarted && (
              <div className="flex flex-wrap items-center gap-2 p-2.5 rounded-2xl bg-gray-900/60 border border-gray-800 text-xs">
                <span className="text-gray-400 font-semibold px-2">Упражнения дня:</span>
                {planExercises.map((item, idx) => {
                  const isCur = selectedExercise === item.id;
                  const config = EXERCISE_DETECTOR_CONFIG[item.id] || {};
                  const icon = item.icon || config.icon || '⚡';
                  const name = item.name || config.name || item.id;
                  const typeLabel = item.type === 'hold' ? 'с' : 'повт.';

                  return (
                    <button
                      key={idx}
                      onClick={() => {
                        setSelectedExercise(item.id);
                        handleResetCounter();
                        setCurrentSet(1);
                      }}
                      className={`px-3 py-1.5 rounded-xl font-bold transition-all flex items-center gap-1.5 border cursor-pointer ${
                        isCur
                          ? 'bg-blue-600/30 border-blue-500 text-blue-300 shadow-sm'
                          : 'bg-gray-800/60 border-gray-700/60 text-gray-400 hover:text-white'
                      }`}
                    >
                      <span>{icon}</span>
                      <span>{name}</span>
                      <span className="text-[10px] text-gray-500 font-mono">
                        ({item.targetReps || config.defaultReps} {typeLabel})
                      </span>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Stage: If workout is NOT started, show the pre-workout Start Card. If started, show CameraView & Controls */}
            {!isWorkoutStarted ? (
              <div className="glass-panel rounded-3xl p-6 sm:p-10 border border-blue-500/30 shadow-2xl space-y-6 bg-gradient-to-b from-gray-950/90 via-gray-900/90 to-indigo-950/40 text-left relative overflow-hidden">
                <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 relative z-10">
                  <div>
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs font-semibold mb-2">
                      <Sparkles className="w-3.5 h-3.5" /> Тренировка готова к старту
                    </div>
                    <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                      Готовы начать тренировку?
                    </h2>
                    <p className="text-sm text-gray-400 mt-1 max-w-xl">
                      Камера включится автоматически только после прослушивания инструкций к первому упражнению. Расположитесь в 2–2.5 метрах от камеры.
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    <button
                      onClick={() => setShowWelcomeModal(true)}
                      className="px-4 py-3 rounded-2xl bg-gray-900/80 hover:bg-gray-800 text-gray-300 hover:text-white text-xs font-bold transition-all border border-gray-700 flex items-center gap-2 shadow-sm cursor-pointer"
                    >
                      <Calendar className="w-4 h-4 text-blue-400" />
                      <span>План на неделю</span>
                    </button>

                    <button
                      onClick={() => handleStartWorkout()}
                      className="px-8 py-3.5 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-black text-base transition-all shadow-xl glow-blue flex items-center gap-2.5 cursor-pointer transform hover:scale-[1.02] active:scale-[0.98]"
                    >
                      <Play className="w-5 h-5 fill-white" />
                      <span>Начать тренировку</span>
                    </button>
                  </div>
                </div>

                {/* Planned exercises cards for today */}
                <div className="space-y-3 relative z-10 pt-4 border-t border-gray-800/80">
                  <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-gray-400 px-2">
                    <span>Упражнения на сегодня ({planExercises.length})</span>
                    <span>Режим AI-контроля</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {planExercises.map((item, idx) => {
                      const cfg = EXERCISE_DETECTOR_CONFIG[item.id] || {};
                      const isHold = item.type === 'hold' || cfg.type === 'hold';
                      const unit = isHold ? 'сек удержания' : 'повторений';
                      const icon = item.icon || cfg.icon || '⚡';
                      const name = item.name || cfg.name || item.id;

                      return (
                        <div
                          key={idx}
                          className="p-4 rounded-2xl bg-gray-900/70 border border-gray-800 flex items-start gap-3.5 hover:border-gray-700 transition-colors"
                        >
                          <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-2xl shrink-0">
                            {icon}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="font-extrabold text-sm text-white truncate">{name}</div>
                            <div className="text-xs text-blue-400 font-bold font-mono mt-0.5">
                              {item.targetReps || cfg.defaultReps || 12} {unit}
                            </div>
                            <div className="text-[11px] text-gray-400 mt-1 flex items-center gap-2">
                              <span>{item.targetSets || 3} подхода</span>
                              <span>•</span>
                              <span>Отдых {item.restTime || 25}с</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            ) : (
              /* Live Workout Stage Container (supports native browser Fullscreen) */
              <div
                ref={workoutStageRef}
                className={
                  isFullscreen
                    ? 'fixed inset-0 z-50 w-screen h-screen bg-black overflow-hidden flex items-center justify-center p-0 m-0'
                    : 'relative w-full'
                }
              >
                <div
                  className={
                    isFullscreen
                      ? 'relative w-full h-full flex items-center justify-center'
                      : 'grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch'
                  }
                >
                  {/* Camera View */}
                  <div className={isFullscreen ? 'w-full h-full relative' : 'lg:col-span-2'}>
                    <CameraView
                      exerciseId={selectedExercise}
                      targetGoal={targetReps}
                      onRepCountUpdate={handleRepCountUpdate}
                      isPaused={
                        isResting ||
                        !isWorkoutStarted ||
                        !!workoutResultModal ||
                        showAuthModal ||
                        showOnboardingModal ||
                        showEditPlanModal ||
                        showInstructionModal ||
                        showProfileOverlay
                      }
                      isVoiceEnabled={isVoiceEnabled}
                      onToggleVoice={handleToggleVoice}
                      isFullscreen={isFullscreen}
                      onToggleFullscreen={handleToggleFullscreen}
                    />
                  </div>

                  {/* Adaptive Control Panel: Right in compact, Left overlay in Fullscreen */}
                  <div
                    className={
                      isFullscreen
                        ? 'absolute top-6 left-6 z-40 w-80 sm:w-96 max-h-[calc(100vh-3rem)] overflow-y-auto custom-scrollbar backdrop-blur-md bg-black/40 border border-white/20 text-white p-4 rounded-2xl shadow-2xl transition-all duration-300'
                        : 'lg:col-span-1'
                    }
                  >
                    <RepCounterDisplay
                      exerciseId={selectedExercise}
                      exerciseName={currentConfig.name}
                      currentReps={currentReps}
                      targetReps={targetReps}
                      isHold={isHold}
                      currentSet={currentSet}
                      targetSets={targetSets}
                      perfectReps={perfectReps}
                      planExercises={planExercises}
                      onReset={handleResetCounter}
                      onFinishEarly={handleFinishEarly}
                      onShowInstruction={() => setShowInstructionModal(true)}
                      onSwitchExercise={(ex) => {
                        setSelectedExercise(ex);
                        handleResetCounter();
                        setCurrentSet(1);
                      }}
                      isFullscreen={isFullscreen}
                    />
                  </div>
                </div>
              </div>
            )}

              {/* Exercise Instruction Modal before each new exercise */}
              <ExerciseInstructionModal
                exerciseId={selectedExercise}
                isOpen={showInstructionModal}
                isVoiceEnabled={isVoiceEnabled}
                onToggleVoice={handleToggleVoice}
                onStart={handleStartInstruction}
              />

              {/* Rest Timer Modal with Automatic Progression */}
              {isResting && (
                <RestTimer
                  duration={restDuration}
                  onComplete={() => {
                    setIsResting(false);
                  }}
                />
              )}

              {/* Workout Result Celebration Modal */}
              {workoutResultModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xl">
                  <div className="w-full max-w-md glass-panel rounded-3xl p-8 border border-emerald-500/40 text-center shadow-2xl glow-green animate-fade-in">
                    <div className="w-20 h-20 mx-auto mb-4 rounded-3xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-white shadow-xl glow-green">
                      <Trophy className="w-10 h-10 animate-bounce text-yellow-300" />
                    </div>

                    <h3 className="text-2xl font-extrabold text-white mb-1">Отличный подход!</h3>
                    <p className="text-xs text-emerald-400 font-semibold mb-6">
                      Подход успешно сохранен в вашей SQL базе данных
                    </p>

                    <div className="grid grid-cols-2 gap-3 mb-6">
                      <div className="p-4 rounded-2xl bg-gray-900/80 border border-gray-800 text-center">
                        <div className="text-xs text-gray-400 font-bold mb-1 flex items-center justify-center gap-1">
                          <Coins className="w-4 h-4 text-yellow-400" /> Награда
                        </div>
                        <div className="text-2xl font-extrabold text-yellow-400 font-mono">
                          +{workoutResultModal.tokensEarned} FIT
                        </div>
                      </div>

                      <div className="p-4 rounded-2xl bg-gray-900/80 border border-gray-800 text-center">
                        <div className="text-xs text-gray-400 font-bold mb-1 flex items-center justify-center gap-1">
                          <Flame className="w-4 h-4 text-orange-500" /> Стрик
                        </div>
                        <div className="text-2xl font-extrabold text-orange-400 font-mono">
                          {workoutResultModal.streak} дн
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={handleCloseResultModal}
                      className="w-full py-4 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-sm tracking-wide transition-all shadow-lg glow-green flex items-center justify-center gap-2"
                    >
                      Продолжить <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

        {activeTab === 'shop' && (
          <ShopModal userProfile={userProfile} onProfileUpdate={setUserProfile} />
        )}
      </main>

      {/* Profile Overlay Modal (Fixed Scroll Issue with Sticky Close Bar) */}
      {showProfileOverlay && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-xl animate-fade-in"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowProfileOverlay(false);
          }}
        >
          <div className="relative w-full max-w-4xl max-h-[92vh] flex flex-col glass-panel rounded-3xl border border-indigo-500/30 shadow-2xl bg-gray-950/95 overflow-hidden">
            {/* Sticky Header with Persistent Close Button */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800/80 bg-gray-950/90 backdrop-blur-md shrink-0 z-30">
              <div className="flex items-center gap-2">
                <span className="text-xl">👤</span>
                <span className="text-base font-extrabold text-white">Профиль Атлета</span>
              </div>
              <button
                onClick={() => setShowProfileOverlay(false)}
                className="px-3.5 py-1.5 rounded-xl bg-gray-800/90 hover:bg-gray-700 text-gray-300 hover:text-white text-xs font-bold transition-all border border-gray-700 flex items-center gap-1.5 shadow-md"
              >
                <X className="w-4 h-4" /> Закрыть
              </button>
            </div>

            {/* Scrollable Container (Smooth up & down scrolling with overscroll-contain) */}
            <div className="overflow-y-auto flex-1 p-5 sm:p-7 space-y-6 overscroll-contain custom-scrollbar">
              <ProfileModal
                userProfile={userProfile}
                onOpenEditPlan={() => {
                  setShowProfileOverlay(false);
                  setShowEditPlanModal(true);
                }}
                onLogout={handleLogout}
                onProfileUpdated={(updated) => setUserProfile(updated)}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

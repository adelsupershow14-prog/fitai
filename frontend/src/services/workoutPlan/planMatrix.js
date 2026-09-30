// Workout Matrix & Exercise Catalog matching FastAPI backend logic

export const GOALS = {
  loss: {
    label: 'Сбросить вес (Кардио)',
    icon: '🔥',
    description: 'Jumping Jacks, быстрые приседания, планка. Высокий темп, меньше пауз.',
  },
  muscle: {
    label: 'Накачать ноги & Сила',
    icon: '💪',
    description: 'Классические приседания с глубоким седом, отжимания. Жесткий контроль глубины.',
  },
  posture: {
    label: 'Улучшить осанку',
    icon: '🧘',
    description: 'Планка, подъемы рук для осанки, легкие приседания с ровной спиной.',
  },
};

export const LEVELS = {
  beginner: { label: 'Новичок', sets: 2, repsMult: 0.85, holdMult: 0.8, rest: 35 },
  intermediate: { label: 'Любитель', sets: 3, repsMult: 1.2, holdMult: 1.2, rest: 25 },
  advanced: { label: 'Продвинутый', sets: 4, repsMult: 1.6, holdMult: 1.6, rest: 20 },
};

export const EXERCISES = {
  squats: {
    id: 'squats',
    name: 'Классические приседания',
    shortName: 'Приседания',
    type: 'reps',
    description: 'Контроль угла коленей (до 90°) и ровной спины',
    baseReps: 12,
    icon: '🏋️‍♂️',
  },
  plank: {
    id: 'plank',
    name: 'Планка (Статика)',
    shortName: 'Планка',
    type: 'hold',
    description: 'Трекинг времени удержания и ровной линии корпуса',
    baseReps: 35, // seconds
    icon: '⏱️',
  },
  pushups: {
    id: 'pushups',
    name: 'Классические отжимания',
    shortName: 'Отжимания',
    type: 'reps',
    description: 'Контроль сгибания локтей и прямой линии тела',
    baseReps: 10,
    icon: '🤸‍♂️',
  },
  jumping_jacks: {
    id: 'jumping_jacks',
    name: 'Jumping Jacks (Прыжки)',
    shortName: 'Jumping Jacks',
    type: 'reps',
    description: 'Динамический подсчет синхронного разведения рук и ног',
    baseReps: 25,
    icon: '⚡',
  },
  arm_raises: {
    id: 'arm_raises',
    name: 'Подъемы рук для осанки',
    shortName: 'Подъемы рук',
    type: 'reps',
    description: 'Контроль подъема рук вверх без прогиба в пояснице',
    baseReps: 12,
    icon: '🧘',
  },
};

/**
 * Client-side fallback generator matching backend logic
 */
export const generateWeeklyPlan = (goal, level, frequency) => {
  const normGoal = (goal === 'loss' || goal === 'cardio') ? 'loss' : (goal === 'posture' ? 'posture' : 'muscle');
  const levelConfig = LEVELS[level] || LEVELS.intermediate;
  const goalConfig = GOALS[normGoal] || GOALS.muscle;
  const daysCount = parseInt(frequency) || 3;

  const schedule = [];

  for (let i = 1; i <= daysCount; i++) {
    let dayTitle = `День ${i}: Тренировка`;
    let exercises = [];

    if (normGoal === 'loss') {
      // Weight loss / Cardio
      const jjReps = Math.round(EXERCISES.jumping_jacks.baseReps * levelConfig.repsMult * 1.2);
      const fastSquatsReps = Math.round(EXERCISES.squats.baseReps * levelConfig.repsMult * 1.1);
      const plankSec = Math.round(EXERCISES.plank.baseReps * levelConfig.holdMult);

      if (i % 3 === 1) {
        dayTitle = `День ${i}: Кардио-интенсив (Jumping Jacks & Быстрые приседания)`;
        exercises = [
          { ...EXERCISES.jumping_jacks, targetReps: jjReps, targetSets: levelConfig.sets, restTime: 15, completed: false },
          { ...EXERCISES.squats, targetReps: fastSquatsReps, targetSets: levelConfig.sets, restTime: 15, completed: false },
        ];
      } else if (i % 3 === 2) {
        dayTitle = `День ${i}: Жиросжигание & Кор (Планка & Прыжки)`;
        exercises = [
          { ...EXERCISES.plank, targetReps: plankSec, targetSets: levelConfig.sets, restTime: 20, completed: false },
          { ...EXERCISES.jumping_jacks, targetReps: jjReps, targetSets: levelConfig.sets, restTime: 15, completed: false },
        ];
      } else {
        dayTitle = `День ${i}: HIIT Фулбоди (Прыжки + Приседания + Планка)`;
        exercises = [
          { ...EXERCISES.jumping_jacks, targetReps: jjReps, targetSets: levelConfig.sets, restTime: 15, completed: false },
          { ...EXERCISES.squats, targetReps: fastSquatsReps, targetSets: levelConfig.sets, restTime: 15, completed: false },
          { ...EXERCISES.plank, targetReps: plankSec, targetSets: levelConfig.sets, restTime: 20, completed: false },
        ];
      }
    } else if (normGoal === 'muscle') {
      // Muscle / Legs
      const squatReps = Math.round(EXERCISES.squats.baseReps * levelConfig.repsMult);
      const pushupReps = Math.round(EXERCISES.pushups.baseReps * levelConfig.repsMult);
      const plankSec = Math.round(EXERCISES.plank.baseReps * levelConfig.holdMult);

      if (i % 3 === 1) {
        dayTitle = `День ${i}: Сила ног (Классические приседания с глубоким седом)`;
        exercises = [
          { ...EXERCISES.squats, targetReps: squatReps, targetSets: levelConfig.sets, restTime: 45, completed: false },
          { ...EXERCISES.plank, targetReps: plankSec, targetSets: levelConfig.sets, restTime: 40, completed: false },
        ];
      } else if (i % 3 === 2) {
        dayTitle = `День ${i}: Верх тела & Сила (Отжимания)`;
        exercises = [
          { ...EXERCISES.pushups, targetReps: pushupReps, targetSets: levelConfig.sets, restTime: 45, completed: false },
          { ...EXERCISES.plank, targetReps: plankSec, targetSets: levelConfig.sets, restTime: 40, completed: false },
        ];
      } else {
        dayTitle = `День ${i}: Силовой Фулбоди (Приседания + Отжимания)`;
        exercises = [
          { ...EXERCISES.squats, targetReps: squatReps, targetSets: levelConfig.sets, restTime: 45, completed: false },
          { ...EXERCISES.pushups, targetReps: pushupReps, targetSets: levelConfig.sets, restTime: 45, completed: false },
        ];
      }
    } else {
      // Posture
      const armReps = Math.round(EXERCISES.arm_raises.baseReps * levelConfig.repsMult);
      const lightSquatsReps = Math.round(EXERCISES.squats.baseReps * levelConfig.repsMult * 0.85);
      const plankSec = Math.round(EXERCISES.plank.baseReps * levelConfig.holdMult);

      if (i % 3 === 1) {
        dayTitle = `День ${i}: Кор & Раскрытие плеч (Планка + Подъемы рук)`;
        exercises = [
          { ...EXERCISES.plank, targetReps: plankSec, targetSets: levelConfig.sets, restTime: 30, completed: false },
          { ...EXERCISES.arm_raises, targetReps: armReps, targetSets: levelConfig.sets, restTime: 25, completed: false },
        ];
      } else if (i % 3 === 2) {
        dayTitle = `День ${i}: Ровная спина & Баланс (Подъемы рук + Приседания)`;
        exercises = [
          { ...EXERCISES.arm_raises, targetReps: armReps, targetSets: levelConfig.sets, restTime: 25, completed: false },
          { ...EXERCISES.squats, targetReps: lightSquatsReps, targetSets: levelConfig.sets, restTime: 30, completed: false },
        ];
      } else {
        dayTitle = `День ${i}: Комплекс идеальной осанки (Планка + Подъемы рук + Приседания)`;
        exercises = [
          { ...EXERCISES.plank, targetReps: plankSec, targetSets: levelConfig.sets, restTime: 30, completed: false },
          { ...EXERCISES.arm_raises, targetReps: armReps, targetSets: levelConfig.sets, restTime: 25, completed: false },
          { ...EXERCISES.squats, targetReps: lightSquatsReps, targetSets: levelConfig.sets, restTime: 30, completed: false },
        ];
      }
    }

    schedule.push({
      dayNumber: i,
      dayTitle,
      exercises,
    });
  }

  return {
    goal: goalConfig.label,
    goalKey: normGoal,
    level: levelConfig.label,
    levelKey: level,
    frequency: `${daysCount} дня в неделю`,
    schedule,
  };
};

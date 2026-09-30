import { SquatDetector } from './squatDetector.js';
import { PushupDetector } from './pushupDetector.js';
import { PlankDetector } from './plankDetector.js';
import { JumpingJackDetector } from './jumpingJackDetector.js';
import { ArmRaiseDetector } from './armRaiseDetector.js';

export { SquatDetector, PushupDetector, PlankDetector, JumpingJackDetector, ArmRaiseDetector };

export const EXERCISE_DETECTOR_CONFIG = {
  squats: {
    id: 'squats',
    name: 'Классические приседания',
    shortName: 'Приседания',
    icon: '🏋️‍♂️',
    type: 'reps',
    defaultReps: 12,
    metricTitle: 'Угол коленей',
    errorModeTips: [
      { rule: 'Угол коленей <= 90°', desc: 'Глубокий присед на пятки' },
      { rule: 'Ровная спина >= 145°', desc: 'Не округляйте грудь' },
      { rule: 'Ширина коленей', desc: 'Колени не сводятся внутрь' },
    ],
  },
  plank: {
    id: 'plank',
    name: 'Планка (Статика)',
    shortName: 'Планка',
    icon: '⏱️',
    type: 'hold',
    defaultSeconds: 35,
    metricTitle: 'Линия корпуса',
    errorModeTips: [
      { rule: 'Прямая линия >= 160°', desc: 'Плечо - таз - пятки в одну струну' },
      { rule: 'Без прогиба поясницы', desc: 'Подтягивайте живот к позвоночнику' },
      { rule: 'Без задирания таза', desc: 'Не поднимайте таз домиком' },
    ],
  },
  pushups: {
    id: 'pushups',
    name: 'Классические отжимания',
    shortName: 'Отжимания',
    icon: '🤸‍♂️',
    type: 'reps',
    defaultReps: 10,
    metricTitle: 'Угол локтей',
    errorModeTips: [
      { rule: 'Сгибание локтей <= 90°', desc: 'Касание грудью нижней точки' },
      { rule: 'Жесткий корпус >= 155°', desc: 'Без провисания живота' },
      { rule: 'Локти под 45-75°', desc: 'Безопасная траектория плеч' },
    ],
  },
  jumping_jacks: {
    id: 'jumping_jacks',
    name: 'Jumping Jacks (Прыжки)',
    shortName: 'Jumping Jacks',
    icon: '⚡',
    type: 'reps',
    defaultReps: 25,
    metricTitle: 'Разведение рук',
    errorModeTips: [
      { rule: 'Руки над головой >= 135°', desc: 'Касание/сведение ладоней вверху' },
      { rule: 'Широкие прыжки', desc: 'Ноги шире плеч при прыжке' },
      { rule: 'Синхронность', desc: 'Одновременный взмах рук и ног' },
    ],
  },
  arm_raises: {
    id: 'arm_raises',
    name: 'Подъемы рук для осанки',
    shortName: 'Подъемы рук',
    icon: '🧘',
    type: 'reps',
    defaultReps: 12,
    metricTitle: 'Подъем рук',
    errorModeTips: [
      { rule: 'Вертикальный подъем >= 155°', desc: 'Руки строго над головой' },
      { rule: 'Нейтральная спина', desc: 'Без прогиба и запрокидывания назад' },
      { rule: 'Прямые локти >= 150°', desc: 'Не сгибайте руки в локтях' },
    ],
  },
};

export function createExerciseDetector(exerciseId) {
  switch (exerciseId) {
    case 'plank':
      return new PlankDetector();
    case 'pushups':
      return new PushupDetector();
    case 'jumping_jacks':
      return new JumpingJackDetector();
    case 'arm_raises':
      return new ArmRaiseDetector();
    case 'squats':
    default:
      return new SquatDetector();
  }
}

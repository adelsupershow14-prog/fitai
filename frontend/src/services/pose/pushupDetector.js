import { calculateAngle, smoothValue } from './mathUtils.js';

export class PushupDetector {
  constructor() {
    this.state = 'HIGH_PLANK'; // 'HIGH_PLANK' | 'LOW_PLANK'
    this.minElbowAngleInRep = 180;
    this.smoothedElbowAngle = null;
    this.smoothedBodyAngle = null;
    this.feedback = {
      message: 'Займите упор лежа перед камерой',
      status: 'info',
      errorJoints: [],
    };
  }

  reset() {
    this.state = 'HIGH_PLANK';
    this.minElbowAngleInRep = 180;
    this.smoothedElbowAngle = null;
    this.smoothedBodyAngle = null;
    this.feedback = { message: 'Начните отжимания', status: 'info', errorJoints: [] };
  }

  process(landmarks) {
    if (!landmarks || landmarks.length < 29) {
      return { isRepCompleted: false, isPerfectRep: true, feedback: { message: 'Тело не видно полностью', status: 'warning', errorJoints: [] } };
    }

    const lShoulder = landmarks[11];
    const rShoulder = landmarks[12];
    const lElbow = landmarks[13];
    const rElbow = landmarks[14];
    const lWrist = landmarks[15];
    const rWrist = landmarks[16];
    const lHip = landmarks[23];
    const rHip = landmarks[24];
    const lAnkle = landmarks[27];
    const rAnkle = landmarks[28];

    const leftVis = (lShoulder.visibility + lElbow.visibility + lWrist.visibility) / 3;
    const rightVis = (rShoulder.visibility + rElbow.visibility + rWrist.visibility) / 3;
    const useLeft = leftVis >= rightVis;

    const shoulder = useLeft ? lShoulder : rShoulder;
    const elbow = useLeft ? lElbow : rElbow;
    const wrist = useLeft ? lWrist : rWrist;
    const hip = useLeft ? lHip : rHip;
    const ankle = useLeft ? lAnkle : rAnkle;

    // Calculate Elbow Angle: Shoulder - Elbow - Wrist
    const rawElbow = calculateAngle(shoulder, elbow, wrist);
    this.smoothedElbowAngle = smoothValue(this.smoothedElbowAngle, rawElbow);

    // Calculate Body Line: Shoulder - Hip - Ankle
    const rawBody = calculateAngle(shoulder, hip, ankle);
    this.smoothedBodyAngle = smoothValue(this.smoothedBodyAngle, rawBody);

    let isRepCompleted = false;
    let isPerfectRep = true;
    const currentElbow = Math.round(this.smoothedElbowAngle);
    const currentBody = Math.round(this.smoothedBodyAngle);

    const errorJoints = [];

    // Check Body Sagging Error
    if (currentBody < 155) {
      errorJoints.push(useLeft ? 23 : 24); // Highlight Hip
      this.feedback = {
        message: '🚨 Не прогибайте поясницу! Держите планку',
        status: 'error',
        errorJoints,
      };
      isPerfectRep = false;
    }

    // State Machine
    if (this.state === 'HIGH_PLANK') {
      if (currentElbow < 135) {
        this.state = 'LOW_PLANK';
        this.minElbowAngleInRep = currentElbow;
        if (currentBody >= 155) {
          this.feedback = { message: 'Опускайтесь ниже до касания грудью', status: 'good', errorJoints: [] };
        }
      } else {
        if (currentBody >= 155) {
          this.feedback = { message: 'Упор лежа принят. Начните отжимание', status: 'info', errorJoints: [] };
        }
      }
    } else if (this.state === 'LOW_PLANK') {
      if (currentElbow < this.minElbowAngleInRep) {
        this.minElbowAngleInRep = currentElbow;
      }

      if (currentElbow > 150) {
        this.state = 'HIGH_PLANK';
        isRepCompleted = true;

        if (this.minElbowAngleInRep > 105) {
          this.feedback = {
            message: '⚠️ Опуститесь ниже! Сгибайте локти до 90°',
            status: 'warning',
            errorJoints: [useLeft ? 13 : 14],
          };
          isPerfectRep = false;
        } else {
          this.feedback = {
            message: '🎉 Отличное отжимание! Полная амплитуда',
            status: 'good',
            errorJoints: [],
          };
        }
      } else {
        if (currentElbow <= 90 && currentBody >= 155) {
          this.feedback = { message: '🔥 Нижняя точка достигнута! Выжимайте вверх', status: 'good', errorJoints: [] };
        }
      }
    }

    return {
      isRepCompleted,
      isPerfectRep,
      metricName: 'Угол локтей',
      currentMetric: currentElbow,
      metricUnit: '°',
      elbowAngle: currentElbow,
      bodyAngle: currentBody,
      feedback: this.feedback,
    };
  }
}

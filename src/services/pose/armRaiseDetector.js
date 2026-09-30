import { calculateAngle, smoothValue } from './mathUtils.js';

export class ArmRaiseDetector {
  constructor() {
    this.state = 'DOWN'; // 'DOWN' | 'TOP'
    this.smoothedArmAngle = null;
    this.smoothedBackAngle = null;
    this.maxArmAngleInRep = 0;
    this.hadPostureErrorInRep = false;
    this.feedback = {
      message: 'Встаньте ровно, опустите руки вдоль тела',
      status: 'info',
      errorJoints: [],
    };
  }

  reset() {
    this.state = 'DOWN';
    this.smoothedArmAngle = null;
    this.smoothedBackAngle = null;
    this.maxArmAngleInRep = 0;
    this.hadPostureErrorInRep = false;
    this.feedback = {
      message: 'Начните плавные подъемы рук вверх',
      status: 'info',
      errorJoints: [],
    };
  }

  process(landmarks) {
    if (!landmarks || landmarks.length < 29) {
      return {
        isRepCompleted: false,
        isPerfectRep: true,
        metricName: 'Подъем рук',
        currentMetric: 0,
        metricUnit: '°',
        feedback: { message: 'Тело не видно полностью в кадре', status: 'warning', errorJoints: [] },
      };
    }

    const lShoulder = landmarks[11];
    const rShoulder = landmarks[12];
    const lElbow = landmarks[13];
    const rElbow = landmarks[14];
    const lWrist = landmarks[15];
    const rWrist = landmarks[16];
    const lHip = landmarks[23];
    const rHip = landmarks[24];
    const lKnee = landmarks[25];
    const rKnee = landmarks[26];

    // Pick side with highest visibility for back angle
    const leftVis = (lShoulder.visibility + lHip.visibility + lKnee.visibility) / 3;
    const rightVis = (rShoulder.visibility + rHip.visibility + rKnee.visibility) / 3;
    const useLeft = leftVis >= rightVis;

    const shoulder = useLeft ? lShoulder : rShoulder;
    const hip = useLeft ? lHip : rHip;
    const knee = useLeft ? lKnee : rKnee;

    // Calculate Arm Elevation Angles (Hip - Shoulder - Wrist)
    const lArmAngle = calculateAngle(lHip, lShoulder, lWrist);
    const rArmAngle = calculateAngle(rHip, rShoulder, rWrist);
    const rawAvgArmAngle = (lArmAngle + rArmAngle) / 2;
    this.smoothedArmAngle = smoothValue(this.smoothedArmAngle, rawAvgArmAngle, 0.4);
    const currentArm = Math.round(this.smoothedArmAngle);

    // Calculate Elbow Extension: Shoulder - Elbow - Wrist (must be straight ~160-180°)
    const lElbowAngle = calculateAngle(lShoulder, lElbow, lWrist);
    const rElbowAngle = calculateAngle(rShoulder, rElbow, rWrist);

    // Calculate Back / Spine Angle: Shoulder - Hip - Knee
    const rawBackAngle = calculateAngle(shoulder, hip, knee);
    this.smoothedBackAngle = smoothValue(this.smoothedBackAngle, rawBackAngle, 0.35);
    const currentBack = Math.round(this.smoothedBackAngle);

    let isRepCompleted = false;
    let isPerfectRep = true;
    const errorJoints = [];

    // Check 1: Lumbar Arching / Hyperextension error when lifting arms
    const isBackArching = currentBack < 152;
    // Check 2: Bent elbows error
    const areElbowsBent = currentArm > 75 && (lElbowAngle < 145 || rElbowAngle < 145);

    if (isBackArching && currentArm > 80) {
      errorJoints.push(useLeft ? 23 : 24);
      this.feedback = {
        message: '🚨 Не прогибайте поясницу! Держите пресс в тонусе',
        status: 'error',
        errorJoints,
      };
      this.hadPostureErrorInRep = true;
      isPerfectRep = false;
    } else if (areElbowsBent) {
      errorJoints.push(13, 14);
      this.feedback = {
        message: '⚠️ Держите руки прямыми в локтях!',
        status: 'warning',
        errorJoints,
      };
      this.hadPostureErrorInRep = true;
      isPerfectRep = false;
    }

    // State Machine
    if (this.state === 'DOWN') {
      if (currentArm > 145) {
        this.state = 'TOP';
        this.maxArmAngleInRep = currentArm;
        if (!isBackArching && !areElbowsBent) {
          this.feedback = {
            message: '🔥 Отличный подъем над головой! Плавно опускайте',
            status: 'good',
            errorJoints: [],
          };
        }
      } else {
        if (!isBackArching && !areElbowsBent) {
          this.feedback = {
            message: 'Плавно поднимайте прямые руки через стороны вверх',
            status: 'info',
            errorJoints: [],
          };
        }
      }
    } else if (this.state === 'TOP') {
      if (currentArm > this.maxArmAngleInRep) {
        this.maxArmAngleInRep = currentArm;
      }

      // Returned down
      if (currentArm < 50) {
        this.state = 'DOWN';
        isRepCompleted = true;

        if (this.maxArmAngleInRep < 140) {
          this.feedback = {
            message: '⚠️ Неполный подъем! Поднимайте руки строго над головой',
            status: 'warning',
            errorJoints: [15, 16],
          };
          isPerfectRep = false;
        } else if (this.hadPostureErrorInRep) {
          this.feedback = {
            message: 'Повтор засчитан. Следите за поясницей и локтями',
            status: 'warning',
            errorJoints: [],
          };
          isPerfectRep = false;
        } else {
          this.feedback = {
            message: '🎉 Идеальный подъем! Лопатки сведены, осанка ровная',
            status: 'good',
            errorJoints: [],
          };
          isPerfectRep = true;
        }

        // Reset rep flags
        this.maxArmAngleInRep = 0;
        this.hadPostureErrorInRep = false;
      }
    }

    return {
      isRepCompleted,
      isPerfectRep,
      metricName: 'Подъем рук',
      currentMetric: currentArm,
      metricUnit: '°',
      armAngle: currentArm,
      backAngle: currentBack,
      feedback: this.feedback,
    };
  }
}

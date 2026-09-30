import { calculateAngle, calculateDistance, smoothValue } from './mathUtils.js';

export class JumpingJackDetector {
  constructor() {
    this.state = 'CLOSED'; // 'CLOSED' | 'OPEN'
    this.smoothedArmAngle = null;
    this.smoothedSpreadRatio = null;
    this.reachedFullOpen = false;
    this.hadErrorInRep = false;
    this.feedback = {
      message: 'Встаньте прямо, руки по швам',
      status: 'info',
      errorJoints: [],
    };
  }

  reset() {
    this.state = 'CLOSED';
    this.smoothedArmAngle = null;
    this.smoothedSpreadRatio = null;
    this.reachedFullOpen = false;
    this.hadErrorInRep = false;
    this.feedback = {
      message: 'Начните прыжки Jumping Jacks',
      status: 'info',
      errorJoints: [],
    };
  }

  process(landmarks) {
    if (!landmarks || landmarks.length < 29) {
      return {
        isRepCompleted: false,
        isPerfectRep: true,
        metricName: 'Разведение рук',
        currentMetric: 0,
        metricUnit: '°',
        feedback: { message: 'Тело не видно полностью в кадре', status: 'warning', errorJoints: [] },
      };
    }

    const lShoulder = landmarks[11];
    const rShoulder = landmarks[12];
    const lWrist = landmarks[15];
    const rWrist = landmarks[16];
    const lHip = landmarks[23];
    const rHip = landmarks[24];
    const lAnkle = landmarks[27];
    const rAnkle = landmarks[28];

    // Calculate arm abduction angles (Hip - Shoulder - Wrist)
    const lArmAngle = calculateAngle(lHip, lShoulder, lWrist);
    const rArmAngle = calculateAngle(rHip, rShoulder, rWrist);
    const rawAvgArmAngle = (lArmAngle + rArmAngle) / 2;
    this.smoothedArmAngle = smoothValue(this.smoothedArmAngle, rawAvgArmAngle, 0.45);
    const currentArmAngle = Math.round(this.smoothedArmAngle);

    // Calculate Leg Spread ratio: Ankle distance / Hip distance
    const hipDist = calculateDistance(lHip, rHip) || 0.2;
    const ankleDist = calculateDistance(lAnkle, rAnkle);
    const rawSpreadRatio = ankleDist / hipDist;
    this.smoothedSpreadRatio = smoothValue(this.smoothedSpreadRatio, rawSpreadRatio, 0.45);
    const currentSpread = this.smoothedSpreadRatio;

    // Hands above shoulders indicator
    const handsOverhead = lWrist.y < lShoulder.y && rWrist.y < rShoulder.y;

    const errorJoints = [];
    let isRepCompleted = false;
    let isPerfectRep = true;

    // Check Asymmetry between left and right arms
    const isAsymmetric = Math.abs(lArmAngle - rArmAngle) > 42;

    // Error: Jumping wide but arms not raised
    if (currentSpread > 1.6 && currentArmAngle < 115) {
      errorJoints.push(11, 12, 15, 16);
      this.feedback = {
        message: '⚠️ Поднимайте руки выше головы!',
        status: 'warning',
        errorJoints,
      };
      this.hadErrorInRep = true;
    }
    // Error: Arms raised but legs didn't jump wide
    else if (currentArmAngle > 135 && currentSpread < 1.35) {
      errorJoints.push(27, 28);
      this.feedback = {
        message: '⚠️ Прыгайте шире! Разводите ноги в стороны',
        status: 'warning',
        errorJoints,
      };
      this.hadErrorInRep = true;
    }
    // Error: Desynchronized arms
    else if (isAsymmetric && currentArmAngle > 70) {
      errorJoints.push(15, 16);
      this.feedback = {
        message: '⚠️ Синхронизируйте подъем обеих рук!',
        status: 'warning',
        errorJoints,
      };
      this.hadErrorInRep = true;
    }

    // State Machine
    if (this.state === 'CLOSED') {
      // Transition to OPEN when both hands go up and legs spread
      if (currentArmAngle > 125 && currentSpread > 1.5 && handsOverhead) {
        this.state = 'OPEN';
        this.reachedFullOpen = true;
        if (errorJoints.length === 0) {
          this.feedback = {
            message: '🔥 Отличное раскрытие! Соединяйте руки и ноги обратно',
            status: 'good',
            errorJoints: [],
          };
        }
      } else {
        if (errorJoints.length === 0) {
          this.feedback = {
            message: 'Прыжок с разведением рук и ног',
            status: 'info',
            errorJoints: [],
          };
        }
      }
    } else if (this.state === 'OPEN') {
      // Transition back to CLOSED to finish the repetition
      if (currentArmAngle < 55 && currentSpread < 1.35) {
        this.state = 'CLOSED';
        isRepCompleted = true;
        isPerfectRep = !this.hadErrorInRep && this.reachedFullOpen;

        if (isPerfectRep) {
          this.feedback = {
            message: '⚡ Отличный прыжок! Держите высокий темп',
            status: 'good',
            errorJoints: [],
          };
        } else {
          this.feedback = {
            message: 'Повтор засчитан. Соблюдайте амплитуду!',
            status: 'warning',
            errorJoints: [],
          };
        }

        // Reset rep flags
        this.reachedFullOpen = false;
        this.hadErrorInRep = false;
      }
    }

    return {
      isRepCompleted,
      isPerfectRep,
      metricName: 'Разведение рук',
      currentMetric: currentArmAngle,
      metricUnit: '°',
      spreadRatio: Number(currentSpread.toFixed(2)),
      feedback: this.feedback,
    };
  }
}

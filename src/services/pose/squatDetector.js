import { calculateAngle, calculateDistance, smoothValue } from './mathUtils.js';

export class SquatDetector {
  constructor() {
    this.state = 'STANDING'; // 'STANDING' | 'SQUATTING'
    this.minKneeAngleInRep = 180;
    this.smoothedKneeAngle = null;
    this.smoothedBackAngle = null;
    this.feedback = {
      message: 'Встаньте ровно перед камерой',
      status: 'info', // 'good' | 'warning' | 'error' | 'info'
      errorJoints: [], // Array of landmark indices to highlight red on canvas
    };
  }

  reset() {
    this.state = 'STANDING';
    this.minKneeAngleInRep = 180;
    this.smoothedKneeAngle = null;
    this.smoothedBackAngle = null;
    this.feedback = { message: 'Начните приседания', status: 'info', errorJoints: [] };
  }

  process(landmarks) {
    if (!landmarks || landmarks.length < 29) {
      return { isRepCompleted: false, isPerfectRep: true, feedback: { message: 'Тело не видно полностью', status: 'warning', errorJoints: [] } };
    }

    // MediaPipe Indices:
    // 11: L Shoulder, 12: R Shoulder
    // 23: L Hip, 24: R Hip
    // 25: L Knee, 26: R Knee
    // 27: L Ankle, 28: R Ankle

    const lShoulder = landmarks[11];
    const rShoulder = landmarks[12];
    const lHip = landmarks[23];
    const rHip = landmarks[24];
    const lKnee = landmarks[25];
    const rKnee = landmarks[26];
    const lAnkle = landmarks[27];
    const rAnkle = landmarks[28];

    // Pick side with highest visibility
    const leftVisibility = (lHip.visibility + lKnee.visibility + lAnkle.visibility) / 3;
    const rightVisibility = (rHip.visibility + rKnee.visibility + rAnkle.visibility) / 3;

    const useLeft = leftVisibility >= rightVisibility;
    const shoulder = useLeft ? lShoulder : rShoulder;
    const hip = useLeft ? lHip : rHip;
    const knee = useLeft ? lKnee : rKnee;
    const ankle = useLeft ? lAnkle : rAnkle;

    // Calculate Knee angle: Hip - Knee - Ankle
    const rawKneeAngle = calculateAngle(hip, knee, ankle);
    this.smoothedKneeAngle = smoothValue(this.smoothedKneeAngle, rawKneeAngle);

    // Calculate Back angle: Shoulder - Hip - Knee
    const rawBackAngle = calculateAngle(shoulder, hip, knee);
    this.smoothedBackAngle = smoothValue(this.smoothedBackAngle, rawBackAngle);

    // Check Knee Valgus (knees collapsing inward relative to ankles)
    const kneeDistance = calculateDistance(lKnee, rKnee);
    const ankleDistance = calculateDistance(lAnkle, rAnkle);
    const isValgus = ankleDistance > 0.1 && kneeDistance < ankleDistance * 0.75;

    let isRepCompleted = false;
    let isPerfectRep = true;
    const currentKnee = Math.round(this.smoothedKneeAngle);
    const currentBack = Math.round(this.smoothedBackAngle);

    const errorJoints = [];

    // Check Back posture error
    if (currentBack < 145) {
      errorJoints.push(useLeft ? 11 : 12, useLeft ? 23 : 24);
      this.feedback = {
        message: '🚨 Спина округлилась! Выпрямите грудь',
        status: 'error',
        errorJoints,
      };
      isPerfectRep = false;
    } else if (isValgus) {
      errorJoints.push(25, 26);
      this.feedback = {
        message: '⚠️ Разведите колени в стороны!',
        status: 'warning',
        errorJoints,
      };
      isPerfectRep = false;
    }

    // State Machine
    if (this.state === 'STANDING') {
      if (currentKnee < 140) {
        this.state = 'SQUATTING';
        this.minKneeAngleInRep = currentKnee;
        if (currentBack >= 145 && !isValgus) {
          this.feedback = { message: 'Отличный спуск... Сядьте до 90°', status: 'good', errorJoints: [] };
        }
      } else {
        if (currentBack >= 145 && !isValgus) {
          this.feedback = { message: 'Готов к приседанию. Плавно опускайтесь', status: 'info', errorJoints: [] };
        }
      }
    } else if (this.state === 'SQUATTING') {
      if (currentKnee < this.minKneeAngleInRep) {
        this.minKneeAngleInRep = currentKnee;
      }

      // User is standing back up
      if (currentKnee > 155) {
        this.state = 'STANDING';
        isRepCompleted = true;

        // Verify squat depth
        if (this.minKneeAngleInRep > 105) {
          this.feedback = {
            message: '⚠️ Слишком мелкий присед! Сядьте глубже на пятки',
            status: 'warning',
            errorJoints: [useLeft ? 25 : 26],
          };
          isPerfectRep = false;
        } else {
          this.feedback = {
            message: '🎉 Идеальное повторение! Четкий присед',
            status: 'good',
            errorJoints: [],
          };
        }
      } else {
        // Feedback during squat depth
        if (currentKnee <= 95 && currentBack >= 145 && !isValgus) {
          errorJoints.length = 0;
          this.feedback = { message: '🔥 Отличная глубина! Поднимайтесь', status: 'good', errorJoints: [] };
        }
      }
    }

    return {
      isRepCompleted,
      isPerfectRep,
      metricName: 'Угол коленей',
      currentMetric: currentKnee,
      metricUnit: '°',
      kneeAngle: currentKnee,
      backAngle: currentBack,
      feedback: this.feedback,
    };
  }
}

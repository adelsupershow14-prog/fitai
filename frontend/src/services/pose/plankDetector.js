import { calculateAngle, smoothValue } from './mathUtils.js';

export class PlankDetector {
  constructor() {
    this.smoothedBodyAngle = null;
    this.accumulatedSeconds = 0;
    this.lastFrameTime = null;
    this.isActivePlank = false;
    this.targetSeconds = 30;
    this.targetReached = false;
    this.feedback = {
      message: 'Займите упор в планке перед камерой',
      status: 'info',
      errorJoints: [],
    };
  }

  setTargetSeconds(seconds) {
    if (seconds && seconds > 0) {
      this.targetSeconds = seconds;
    }
  }

  reset() {
    this.smoothedBodyAngle = null;
    this.accumulatedSeconds = 0;
    this.lastFrameTime = null;
    this.isActivePlank = false;
    this.targetReached = false;
    this.feedback = {
      message: 'Займите упор в планке перед камерой',
      status: 'info',
      errorJoints: [],
    };
  }

  process(landmarks) {
    const now = performance.now();
    const dt = this.lastFrameTime ? (now - this.lastFrameTime) / 1000 : 0;
    this.lastFrameTime = now;

    if (!landmarks || landmarks.length < 29) {
      return {
        isRepCompleted: false,
        isPerfectRep: true,
        isHold: true,
        holdSeconds: Math.floor(this.accumulatedSeconds),
        targetSeconds: this.targetSeconds,
        metricName: 'Линия корпуса',
        currentMetric: 0,
        metricUnit: '°',
        feedback: { message: 'Тело не видно полностью в кадре', status: 'warning', errorJoints: [] },
      };
    }

    // MediaPipe Landmarks:
    // 11/12: Shoulders, 23/24: Hips, 25/26: Knees, 27/28: Ankles
    const lShoulder = landmarks[11];
    const rShoulder = landmarks[12];
    const lHip = landmarks[23];
    const rHip = landmarks[24];
    const lAnkle = landmarks[27];
    const rAnkle = landmarks[28];

    const leftVis = (lShoulder.visibility + lHip.visibility + lAnkle.visibility) / 3;
    const rightVis = (rShoulder.visibility + rHip.visibility + rAnkle.visibility) / 3;
    const useLeft = leftVis >= rightVis;

    const shoulder = useLeft ? lShoulder : rShoulder;
    const hip = useLeft ? lHip : rHip;
    const ankle = useLeft ? lAnkle : rAnkle;

    // Check if user is in horizontal orientation (plank pose vs standing)
    // In plank, x distance between shoulder and ankle is significant and user is largely horizontal
    const deltaX = Math.abs(shoulder.x - ankle.x);
    const deltaY = Math.abs(shoulder.y - ankle.y);
    const isHorizontal = deltaX > 0.22 && deltaX > deltaY * 0.7;

    if (!isHorizontal) {
      this.isActivePlank = false;
      return {
        isRepCompleted: false,
        isPerfectRep: true,
        isHold: true,
        holdSeconds: Math.floor(this.accumulatedSeconds),
        targetSeconds: this.targetSeconds,
        metricName: 'Линия корпуса',
        currentMetric: 0,
        metricUnit: '°',
        feedback: {
          message: 'Примите горизонтальный упор лежа (планку)',
          status: 'info',
          errorJoints: [],
        },
      };
    }

    // Calculate Body Line angle: Shoulder - Hip - Ankle
    const rawBodyAngle = calculateAngle(shoulder, hip, ankle);
    this.smoothedBodyAngle = smoothValue(this.smoothedBodyAngle, rawBodyAngle, 0.3);
    const currentBody = Math.round(this.smoothedBodyAngle);

    // Calculate hip vertical displacement relative to shoulder-ankle line
    // Midpoint Y on the line connecting shoulder and ankle at hip's X position
    const t = (hip.x - shoulder.x) / ((ankle.x - shoulder.x) || 0.001);
    const expectedHipY = shoulder.y + t * (ankle.y - shoulder.y);
    const hipOffset = hip.y - expectedHipY; // > 0 means hips are lower (sagging), < 0 means hips are higher (piking)

    const errorJoints = [];
    let isCorrectForm = false;
    let isPerfect = true;

    // 1. Error check: Hip Sagging (таз провисает в пояснице)
    if (currentBody < 155 && hipOffset > 0.035) {
      errorJoints.push(useLeft ? 23 : 24);
      this.feedback = {
        message: '🚨 Не прогибайте поясницу! Поднимите таз в линию',
        status: 'error',
        errorJoints,
      };
      isPerfect = false;
      this.isActivePlank = false;
    }
    // 2. Error check: Hip Piking (таз поднят слишком высоко "домиком")
    else if (currentBody < 155 && hipOffset < -0.04) {
      errorJoints.push(useLeft ? 23 : 24);
      this.feedback = {
        message: '⚠️ Не задирайте таз! Опустите тело в ровную линию',
        status: 'warning',
        errorJoints,
      };
      isPerfect = false;
      this.isActivePlank = false;
    }
    // 3. Good form: Straight line (158° - 180°)
    else if (currentBody >= 155) {
      isCorrectForm = true;
      this.isActivePlank = true;
      this.feedback = {
        message: '🔥 Идеальная планка! Линия плечо-таз-пятки ровная',
        status: 'good',
        errorJoints: [],
      };
    } else {
      this.feedback = {
        message: 'Удерживайте ровное положение тела',
        status: 'info',
        errorJoints: [],
      };
    }

    // Accumulate hold time only while maintaining correct form
    let justReachedTarget = false;
    if (isCorrectForm && dt > 0 && dt < 1.0) {
      const prevSec = Math.floor(this.accumulatedSeconds);
      this.accumulatedSeconds += dt;
      const newSec = Math.floor(this.accumulatedSeconds);

      if (newSec >= this.targetSeconds && !this.targetReached) {
        this.targetReached = true;
        justReachedTarget = true;
      }
    }

    return {
      isRepCompleted: justReachedTarget,
      isPerfectRep: isPerfect,
      isHold: true,
      holdSeconds: Math.floor(this.accumulatedSeconds),
      targetSeconds: this.targetSeconds,
      metricName: 'Линия корпуса',
      currentMetric: currentBody,
      metricUnit: '°',
      bodyAngle: currentBody,
      feedback: this.feedback,
    };
  }
}

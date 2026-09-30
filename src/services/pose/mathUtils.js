// Mathematics utility for Pose landmark angle calculations and smoothing

/**
 * Calculates angle in degrees at joint vertex P2 formed by (P1 - P2 - P3)
 * @param {{x: number, y: number}} p1 First landmark (e.g. Hip)
 * @param {{x: number, y: number}} p2 Joint vertex landmark (e.g. Knee)
 * @param {{x: number, y: number}} p3 Third landmark (e.g. Ankle)
 * @returns {number} Angle in degrees (0 to 180)
 */
export function calculateAngle(p1, p2, p3) {
  if (!p1 || !p2 || !p3) return 0;

  const radians = Math.atan2(p3.y - p2.y, p3.x - p2.x) - Math.atan2(p1.y - p2.y, p1.x - p2.x);
  let angle = Math.abs((radians * 180.0) / Math.PI);

  if (angle > 180.0) {
    angle = 360.0 - angle;
  }

  return Math.round(angle);
}

/**
 * Calculates 2D Euclidean distance between two landmarks
 */
export function calculateDistance(p1, p2) {
  if (!p1 || !p2) return 0;
  const dx = p1.x - p2.x;
  const dy = p1.y - p2.y;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Exponential Moving Average for smoothing angle jitter across frames
 */
export function smoothValue(prevValue, newValue, alpha = 0.35) {
  if (prevValue === null || prevValue === undefined) return newValue;
  return prevValue + alpha * (newValue - prevValue);
}

/**
 * Midpoint between two landmarks
 */
export function calculateMidpoint(p1, p2) {
  if (!p1 || !p2) return { x: 0, y: 0 };
  return {
    x: (p1.x + p2.x) / 2,
    y: (p1.y + p2.y) / 2,
  };
}

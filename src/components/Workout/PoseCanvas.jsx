import React, { useEffect, useRef } from 'react';

// MediaPipe skeleton connection pairs
const SKELETON_CONNECTIONS = [
  [11, 12], // Shoulders
  [11, 13], [13, 15], // Left Arm
  [12, 14], [14, 16], // Right Arm
  [11, 23], [12, 24], // Torso
  [23, 24], // Hips
  [23, 25], [25, 27], // Left Leg
  [24, 26], [26, 28], // Right Leg
];

export function PoseCanvas({ landmarks, feedback, width = 640, height = 480 }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, width, height);

    if (!landmarks || landmarks.length === 0) return;

    const errorJoints = feedback?.errorJoints || [];
    const isErrorState = feedback?.status === 'error';
    const isWarningState = feedback?.status === 'warning';

    // Base joint color
    const defaultJointColor = isErrorState ? '#EF4444' : isWarningState ? '#F59E0B' : '#10B981';
    const defaultLineColor = isErrorState ? 'rgba(239, 68, 68, 0.7)' : 'rgba(16, 185, 129, 0.7)';

    // Draw Skeleton Lines
    SKELETON_CONNECTIONS.forEach(([i1, i2]) => {
      const p1 = landmarks[i1];
      const p2 = landmarks[i2];

      if (p1 && p2 && p1.visibility > 0.4 && p2.visibility > 0.4) {
        const x1 = p1.x * width;
        const y1 = p1.y * height;
        const x2 = p2.x * width;
        const y2 = p2.y * height;

        const isLineError = errorJoints.includes(i1) || errorJoints.includes(i2);

        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.lineWidth = isLineError ? 6 : 4;
        ctx.strokeStyle = isLineError ? '#EF4444' : defaultLineColor;
        ctx.stroke();
      }
    });

    // Draw Keypoint Circles
    landmarks.forEach((landmark, index) => {
      if (landmark && landmark.visibility > 0.4) {
        // Only draw key torso & limb joints to avoid cluttering face
        if (index >= 11 && index <= 28) {
          const x = landmark.x * width;
          const y = landmark.y * height;

          const isJointError = errorJoints.includes(index);

          ctx.beginPath();
          ctx.arc(x, y, isJointError ? 8 : 6, 0, 2 * Math.PI);
          ctx.fillStyle = isJointError ? '#EF4444' : defaultJointColor;
          ctx.shadowColor = isJointError ? '#EF4444' : defaultJointColor;
          ctx.shadowBlur = 12;
          ctx.fill();

          // Outer pulsing ring for error joints
          if (isJointError) {
            ctx.beginPath();
            ctx.arc(x, y, 12, 0, 2 * Math.PI);
            ctx.strokeStyle = 'rgba(239, 68, 68, 0.8)';
            ctx.lineWidth = 2;
            ctx.stroke();
          }

          ctx.shadowBlur = 0; // Reset shadow
        }
      }
    });
  }, [landmarks, feedback, width, height]);

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      className="absolute top-0 left-0 w-full h-full pointer-events-none z-10 transform -scale-x-100"
    />
  );
}

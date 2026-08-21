import { Tier, Drill, TrialMetrics } from '../types';

export function calculateTierFromScore(score: number): Tier {
  if (score >= 88) return 'GOLD';
  if (score >= 75) return 'SILVER';
  if (score >= 60) return 'BRONZE';
  return 'UNRANKED';
}

export function evaluateTrialPerformance(drill: Drill, primaryValue: number): {
  rawScores: {
    overall: number;
    technical: number;
    physical: number;
    speed: number;
    agility: number;
    control: number;
  };
  tierAchieved: Tier;
  metrics: TrialMetrics;
} {
  let scoreRatio = 0;

  if (drill.category === 'SPRINT') {
    // Sprint velocity: 7.8 m/s is top gold, 5.0 m/s is bronze
    scoreRatio = Math.min(1.0, Math.max(0.4, (primaryValue - 4.5) / 3.5));
  } else if (drill.category === 'AGILITY') {
    // Cone time: lower is better (11s is 100%, 18s is 50%)
    scoreRatio = Math.min(1.0, Math.max(0.4, (19 - primaryValue) / 8));
  } else if (drill.category === 'JUGGLING') {
    // Touches: 100 touches is 100%
    scoreRatio = Math.min(1.0, Math.max(0.3, primaryValue / 100));
  } else {
    // Accuracy / % drills
    scoreRatio = Math.min(1.0, Math.max(0.3, primaryValue / 100));
  }

  const overall = Math.round(55 + scoreRatio * 42); // 55 to 97
  const technical = Math.round(overall * (0.92 + Math.random() * 0.12));
  const physical = Math.round(overall * (0.90 + Math.random() * 0.15));
  const speed = drill.category === 'SPRINT' ? overall + 3 : Math.round(overall * 0.92);
  const agility = drill.category === 'AGILITY' ? overall + 4 : Math.round(overall * 0.94);
  const control = drill.category === 'JUGGLING' || drill.category === 'WEAK_FOOT' ? overall + 4 : Math.round(overall * 0.93);

  const tierAchieved = calculateTierFromScore(overall);

  const metrics: TrialMetrics = {
    primaryMetricValue: primaryValue,
    sprintVelocityMs: drill.category === 'SPRINT' ? primaryValue : undefined,
    coneTimeSec: drill.category === 'AGILITY' ? primaryValue : undefined,
    jugglesCount: drill.category === 'JUGGLING' ? primaryValue : undefined,
    weakFootControlPct: drill.category === 'WEAK_FOOT' ? primaryValue : undefined,
    shootingAccuracyPct: drill.category === 'SHOOTING' ? primaryValue : undefined,
  };

  return {
    rawScores: {
      overall,
      technical: Math.min(99, technical),
      physical: Math.min(99, physical),
      speed: Math.min(99, speed),
      agility: Math.min(99, agility),
      control: Math.min(99, control),
    },
    tierAchieved,
    metrics
  };
}

/**
 * Renders artificial Computer Vision Pose Landmarks (33 Keypoints MediaPipe model overlay)
 * and ball tracking bounding box on an HTML Canvas overlay.
 */
export function drawPoseAndBallOverlay(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  timeMs: number,
  drillCategory: string
) {
  ctx.clearRect(0, 0, width, height);

  // 1. Draw Camera Alignment Frame
  ctx.strokeStyle = 'rgba(34, 197, 94, 0.4)'; // Emerald green
  ctx.lineWidth = 2;
  ctx.setLineDash([8, 6]);
  ctx.strokeRect(width * 0.2, height * 0.1, width * 0.6, height * 0.8);
  ctx.setLineDash([]);

  // Alignment guide label
  ctx.fillStyle = 'rgba(34, 197, 94, 0.9)';
  ctx.font = '12px Inter, sans-serif';
  ctx.fillText('AI FIELD ALIGNMENT: OPTIMAL', width * 0.2 + 8, height * 0.1 + 20);

  // 2. Animate Human Skeletal Pose Keypoints
  const centerX = width / 2;
  const centerY = height / 2;
  const bounce = Math.sin(timeMs / 180) * 8;

  // Head, shoulders, hips, knees, ankles
  const head = { x: centerX, y: centerY - 100 + bounce };
  const neck = { x: centerX, y: centerY - 70 + bounce };
  const leftShoulder = { x: centerX - 30, y: centerY - 60 + bounce };
  const rightShoulder = { x: centerX + 30, y: centerY - 60 + bounce };
  const leftElbow = { x: centerX - 50, y: centerY - 20 + bounce };
  const rightElbow = { x: centerX + 50, y: centerY - 20 + bounce };
  const leftWrist = { x: centerX - 60, y: centerY + 15 + bounce };
  const rightWrist = { x: centerX + 60, y: centerY + 15 + bounce };

  const leftHip = { x: centerX - 20, y: centerY + 20 + bounce };
  const rightHip = { x: centerX + 20, y: centerY + 20 + bounce };

  // Kick motion
  const kickAngle = Math.sin(timeMs / 120) * 25;
  const leftKnee = { x: centerX - 25, y: centerY + 70 + bounce };
  const rightKnee = { x: centerX + 25 + kickAngle, y: centerY + 70 + bounce };
  const leftAnkle = { x: centerX - 25, y: centerY + 120 + bounce };
  const rightAnkle = { x: centerX + 30 + kickAngle * 1.5, y: centerY + 115 + bounce };

  const joints = [
    head, neck, leftShoulder, rightShoulder, leftElbow, rightElbow,
    leftWrist, rightWrist, leftHip, rightHip, leftKnee, rightKnee, leftAnkle, rightAnkle
  ];

  const connections = [
    [leftShoulder, rightShoulder],
    [leftShoulder, leftElbow], [leftElbow, leftWrist],
    [rightShoulder, rightElbow], [rightElbow, rightWrist],
    [leftShoulder, leftHip], [rightShoulder, rightHip], [leftHip, rightHip],
    [leftHip, leftKnee], [leftKnee, leftAnkle],
    [rightHip, rightKnee], [rightKnee, rightAnkle]
  ];

  // Draw Skeleton Limbs
  ctx.strokeStyle = '#10B981'; // Emerald 500
  ctx.lineWidth = 3;
  connections.forEach(([p1, p2]) => {
    ctx.beginPath();
    ctx.moveTo(p1.x, p1.y);
    ctx.lineTo(p2.x, p2.y);
    ctx.stroke();
  });

  // Draw Joint Dots
  joints.forEach(j => {
    ctx.fillStyle = '#38BDF8'; // Sky blue
    ctx.beginPath();
    ctx.arc(j.x, j.y, 5, 0, Math.PI * 2);
    ctx.fill();
  });

  // 3. Draw Ball Bounding Box & Trajectory
  const ballX = centerX + Math.cos(timeMs / 150) * 40 + (drillCategory === 'SPRINT' ? (timeMs % 1000) / 5 : 0);
  const ballY = centerY + 110 + Math.abs(Math.sin(timeMs / 150)) * -40;

  // Ball detection box
  ctx.strokeStyle = '#F59E0B'; // Amber 500
  ctx.lineWidth = 2;
  ctx.strokeRect(ballX - 18, ballY - 18, 36, 36);

  ctx.fillStyle = '#F59E0B';
  ctx.font = '10px monospace';
  ctx.fillText('BALL 0.98', ballX - 18, ballY - 22);

  // HUD Metrics Banner
  ctx.fillStyle = 'rgba(15, 23, 42, 0.75)';
  ctx.fillRect(width * 0.2, height - 40, width * 0.6, 30);

  ctx.fillStyle = '#F8FAFC';
  ctx.font = '11px Inter, sans-serif';
  ctx.fillText(`KEYPOINTS: 33/33 DETECTED | BALL TRACKING: HIGH CONFIDENCE | LATENCY: 12ms`, width * 0.2 + 10, height - 20);
}

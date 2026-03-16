import { Trial, SessionSummary, ModuleType, DifficultyMode } from '../types/game';

export function calculateAccuracy(trials: Trial[]): number {
  if (trials.length === 0) return 0;
  const correct = trials.filter((t) => t.isCorrect).length;
  return correct / trials.length;
}

export function calculateMedianRt(trials: Trial[]): number {
  if (trials.length === 0) return 0;
  const rts = trials.map((t) => t.rtMs).sort((a, b) => a - b);
  const mid = Math.floor(rts.length / 2);
  if (rts.length % 2 === 0) {
    return (rts[mid - 1] + rts[mid]) / 2;
  }
  return rts[mid];
}

export function calculateP90Rt(trials: Trial[]): number {
  if (trials.length === 0) return 0;
  const rts = trials.map((t) => t.rtMs).sort((a, b) => a - b);
  const idx = Math.ceil(rts.length * 0.9) - 1;
  return rts[Math.min(idx, rts.length - 1)];
}

export function calculateStreakMax(trials: Trial[]): number {
  let max = 0;
  let current = 0;
  for (const t of trials) {
    if (t.isCorrect) {
      current++;
      max = Math.max(max, current);
    } else {
      current = 0;
    }
  }
  return max;
}

export function calculateFatigueIndex(trials: Trial[]): number {
  if (trials.length < 4) return 0;

  const rts = trials.map((t) => t.rtMs);
  const n = rts.length;
  const indices = Array.from({ length: n }, (_, i) => i);

  const meanI = indices.reduce((s, v) => s + v, 0) / n;
  const meanR = rts.reduce((s, v) => s + v, 0) / n;

  let cov = 0;
  let varI = 0;
  for (let i = 0; i < n; i++) {
    cov += (indices[i] - meanI) * (rts[i] - meanR);
    varI += (indices[i] - meanI) ** 2;
  }

  if (varI === 0) return 0;

  const slope = cov / varI;
  const bRef = meanR * 0.1;

  return Math.max(-1, Math.min(1, slope / bRef));
}

export function buildSessionSummary(
  trials: Trial[],
  moduleId: ModuleType,
  difficulty: number,
  startedAt: number,
  difficultyMode: DifficultyMode = 'adaptive'
): SessionSummary {
  const endedAt = Date.now();
  return {
    id: `${moduleId}-${startedAt}-${endedAt}`,
    moduleId,
    difficulty,
    difficultyMode,
    trials,
    startedAt,
    endedAt,
    accuracy: calculateAccuracy(trials),
    medianRt: calculateMedianRt(trials),
    p90Rt: calculateP90Rt(trials),
    streakMax: calculateStreakMax(trials),
    fatigueIndex: calculateFatigueIndex(trials),
  };
}

export function formatMs(ms: number): string {
  if (ms < 1000) return `${Math.round(ms)}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

export function formatAccuracy(accuracy: number): string {
  return `${Math.round(accuracy * 100)}%`;
}

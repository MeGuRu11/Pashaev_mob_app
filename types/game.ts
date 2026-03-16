export interface Point {
  x: number;
  y: number;
}

export interface Shape {
  vertices: Point[];
  innerLines: [Point, Point][];
  seed: number;
}

export type ModuleType = 'find-exact' | 'restore-horizon';
export type DifficultyMode = 'fixed' | 'adaptive';

export interface Trial {
  index: number;
  isCorrect: boolean;
  rtMs: number;
  errorType?: 'wrong' | 'timeout';
}

export interface SessionSummary {
  id: string;
  moduleId: ModuleType;
  difficulty: number;
  difficultyMode: DifficultyMode;
  trials: Trial[];
  startedAt: number;
  endedAt: number;
  accuracy: number;
  medianRt: number;
  p90Rt: number;
  streakMax: number;
  fatigueIndex: number;
}

export interface UserProgress {
  moduleId: ModuleType;
  totalSessions: number;
  currentDifficulty: number;
  difficultyMode: DifficultyMode;
  selectedDifficulty: number;
  bestAccuracy: number;
  bestStreak: number;
  avgReactionTime: number;
  lastPlayedAt: number;
  recentAccuracies: number[];
}

export interface BaseDifficultyConfig {
  level: number;
  gridSize: number;
  verticesMin: number;
  verticesMax: number;
  mutationStrength: number;
  timeLimit: number;
  trialsCount: number;
}

export interface FindExactDifficultyConfig extends BaseDifficultyConfig {
  nearMissCount: number;
  nearMissStrengthMultiplier: number;
}

export interface HorizonDifficultyConfig extends BaseDifficultyConfig {
  minTransformSteps: number;
  maxMoves: number;
}

export interface HorizonTransform {
  rotation: number;
  mirrorX: boolean;
  mirrorY: boolean;
}

export interface HorizonPattern {
  grid: number[][];
  size: number;
}

export interface GameState {
  currentTrial: number;
  totalTrials: number;
  score: number;
  streak: number;
  timeRemaining: number;
  isActive: boolean;
}

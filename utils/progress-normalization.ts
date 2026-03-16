import { DifficultyMode, ModuleType, UserProgress } from '../types/game';

const MAX_DIFFICULTY = 5;

const MODULES: ModuleType[] = ['find-exact', 'restore-horizon'];

export const DEFAULT_PROGRESS: Record<ModuleType, UserProgress> = {
  'find-exact': {
    moduleId: 'find-exact',
    totalSessions: 0,
    currentDifficulty: 1,
    difficultyMode: 'adaptive',
    selectedDifficulty: 1,
    bestAccuracy: 0,
    bestStreak: 0,
    avgReactionTime: 0,
    lastPlayedAt: 0,
    recentAccuracies: [],
  },
  'restore-horizon': {
    moduleId: 'restore-horizon',
    totalSessions: 0,
    currentDifficulty: 1,
    difficultyMode: 'adaptive',
    selectedDifficulty: 1,
    bestAccuracy: 0,
    bestStreak: 0,
    avgReactionTime: 0,
    lastPlayedAt: 0,
    recentAccuracies: [],
  },
};

export function clampDifficulty(value: number): number {
  if (!Number.isFinite(value)) return 1;
  return Math.max(1, Math.min(MAX_DIFFICULTY, Math.round(value)));
}

function parseDifficultyMode(value: unknown): DifficultyMode {
  return value === 'fixed' ? 'fixed' : 'adaptive';
}

function parseNumber(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function parseAccuracies(value: unknown): number[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is number => typeof item === 'number' && Number.isFinite(item))
    .slice(0, 10);
}

function normalizeModuleProgress(
  moduleId: ModuleType,
  raw: unknown
): UserProgress {
  const defaults = DEFAULT_PROGRESS[moduleId];
  const source = (raw && typeof raw === 'object' ? raw : {}) as Partial<UserProgress>;

  const currentDifficulty = clampDifficulty(
    parseNumber(source.currentDifficulty, defaults.currentDifficulty)
  );
  const selectedDifficulty = clampDifficulty(
    parseNumber(source.selectedDifficulty, source.currentDifficulty ?? currentDifficulty)
  );

  return {
    moduleId,
    totalSessions: Math.max(0, Math.round(parseNumber(source.totalSessions, defaults.totalSessions))),
    currentDifficulty,
    difficultyMode: parseDifficultyMode(source.difficultyMode),
    selectedDifficulty,
    bestAccuracy: Math.max(0, Math.min(1, parseNumber(source.bestAccuracy, defaults.bestAccuracy))),
    bestStreak: Math.max(0, Math.round(parseNumber(source.bestStreak, defaults.bestStreak))),
    avgReactionTime: Math.max(0, parseNumber(source.avgReactionTime, defaults.avgReactionTime)),
    lastPlayedAt: Math.max(0, parseNumber(source.lastPlayedAt, defaults.lastPlayedAt)),
    recentAccuracies: parseAccuracies(source.recentAccuracies),
  };
}

export function normalizeProgressRecord(
  raw: unknown
): Record<ModuleType, UserProgress> {
  const source = (raw && typeof raw === 'object' ? raw : {}) as Partial<Record<ModuleType, unknown>>;

  return MODULES.reduce((acc, moduleId) => {
    acc[moduleId] = normalizeModuleProgress(moduleId, source[moduleId]);
    return acc;
  }, {} as Record<ModuleType, UserProgress>);
}

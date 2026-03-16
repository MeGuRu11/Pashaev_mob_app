import { ADAPTIVE_RULES } from '../constants/game';
import { Trial, DifficultyMode } from '../types/game';
import { calculateAccuracy, calculateFatigueIndex } from './scoring';

export type DifficultyAction = 'promote' | 'demote' | 'maintain';

export function evaluateDifficulty(
  trials: Trial[],
  currentLevel: number,
  maxLevel: number
): { action: DifficultyAction; newLevel: number; reason: string } {
  if (trials.length < 4) {
    return { action: 'maintain', newLevel: currentLevel, reason: 'Not enough data' };
  }

  const accuracy = calculateAccuracy(trials);
  const fatigue = calculateFatigueIndex(trials);
  const lastTrials = trials.slice(-5);

  let consecutiveCorrect = 0;
  for (let i = lastTrials.length - 1; i >= 0; i--) {
    if (lastTrials[i].isCorrect) consecutiveCorrect++;
    else break;
  }

  let consecutiveErrors = 0;
  for (let i = lastTrials.length - 1; i >= 0; i--) {
    if (!lastTrials[i].isCorrect) consecutiveErrors++;
    else break;
  }

  if (fatigue > ADAPTIVE_RULES.fatigueThreshold) {
    const newLevel = Math.max(1, currentLevel - 1);
    return { action: 'demote', newLevel, reason: 'High fatigue detected' };
  }

  if (consecutiveErrors >= ADAPTIVE_RULES.demoteErrorThreshold) {
    const newLevel = Math.max(1, currentLevel - 1);
    return { action: 'demote', newLevel, reason: 'Consecutive errors' };
  }

  if (
    consecutiveCorrect >= ADAPTIVE_RULES.promoteStreakThreshold &&
    accuracy >= ADAPTIVE_RULES.targetAccuracy
  ) {
    const newLevel = Math.min(maxLevel, currentLevel + 1);
    if (newLevel > currentLevel) {
      return { action: 'promote', newLevel, reason: 'Strong performance' };
    }
  }

  return { action: 'maintain', newLevel: currentLevel, reason: 'Steady state' };
}

export function resolveDifficultyAfterSession(
  mode: DifficultyMode,
  trials: Trial[],
  currentLevel: number,
  maxLevel: number
): { action: DifficultyAction; newLevel: number; reason: string } {
  if (mode === 'fixed') {
    return {
      action: 'maintain',
      newLevel: currentLevel,
      reason: 'Fixed mode',
    };
  }

  return evaluateDifficulty(trials, currentLevel, maxLevel);
}

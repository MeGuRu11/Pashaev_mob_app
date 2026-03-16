import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeProgressRecord } from '../utils/progress-normalization';

test('migrates old progress records with default mode and selected difficulty', () => {
  const legacy = {
    'find-exact': {
      moduleId: 'find-exact',
      totalSessions: 3,
      currentDifficulty: 4,
      bestAccuracy: 0.9,
      bestStreak: 5,
      avgReactionTime: 280,
      lastPlayedAt: 1234,
      recentAccuracies: [0.9, 0.8],
    },
  };

  const normalized = normalizeProgressRecord(legacy);

  assert.equal(normalized['find-exact'].difficultyMode, 'adaptive');
  assert.equal(normalized['find-exact'].selectedDifficulty, 4);
  assert.equal(normalized['restore-horizon'].difficultyMode, 'adaptive');
  assert.equal(normalized['restore-horizon'].selectedDifficulty, 1);
});

test('normalization clamps and sanitizes invalid values', () => {
  const normalized = normalizeProgressRecord({
    'find-exact': {
      currentDifficulty: 99,
      selectedDifficulty: -3,
      bestAccuracy: 5,
      bestStreak: -10,
      avgReactionTime: -7,
      recentAccuracies: [0.4, 'bad', Infinity, 0.7],
      difficultyMode: 'fixed',
    },
  });

  assert.equal(normalized['find-exact'].currentDifficulty, 5);
  assert.equal(normalized['find-exact'].selectedDifficulty, 1);
  assert.equal(normalized['find-exact'].bestAccuracy, 1);
  assert.equal(normalized['find-exact'].bestStreak, 0);
  assert.equal(normalized['find-exact'].avgReactionTime, 0);
  assert.deepEqual(normalized['find-exact'].recentAccuracies, [0.4, 0.7]);
  assert.equal(normalized['find-exact'].difficultyMode, 'fixed');
});

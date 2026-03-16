import test from 'node:test';
import assert from 'node:assert/strict';
import type { Trial } from '../types/game';
import { evaluateDifficulty, resolveDifficultyAfterSession } from '../utils/adaptive-difficulty';

function makeTrial(index: number, isCorrect: boolean, rtMs: number): Trial {
  return { index, isCorrect, rtMs };
}

test('maintains level when there are not enough trials', () => {
  const trials = [
    makeTrial(0, true, 100),
    makeTrial(1, true, 120),
    makeTrial(2, false, 130),
  ];
  const result = evaluateDifficulty(trials, 3, 5);
  assert.equal(result.action, 'maintain');
  assert.equal(result.newLevel, 3);
});

test('demotes level on high fatigue', () => {
  const trials = [100, 160, 240, 320, 420].map((rt, i) => makeTrial(i, true, rt));
  const result = evaluateDifficulty(trials, 4, 5);
  assert.equal(result.action, 'demote');
  assert.equal(result.newLevel, 3);
});

test('demotes level on consecutive errors', () => {
  const trials = [
    makeTrial(0, true, 120),
    makeTrial(1, true, 120),
    makeTrial(2, false, 120),
    makeTrial(3, false, 120),
  ];
  const result = evaluateDifficulty(trials, 2, 5);
  assert.equal(result.action, 'demote');
  assert.equal(result.newLevel, 1);
});

test('promotes level on strong recent performance', () => {
  const trials = [
    makeTrial(0, true, 120),
    makeTrial(1, true, 120),
    makeTrial(2, false, 120),
    makeTrial(3, true, 120),
    makeTrial(4, true, 120),
    makeTrial(5, true, 120),
  ];
  const result = evaluateDifficulty(trials, 2, 5);
  assert.equal(result.action, 'promote');
  assert.equal(result.newLevel, 3);
});

test('keeps level steady when no threshold is met', () => {
  const trials = [
    makeTrial(0, true, 150),
    makeTrial(1, false, 150),
    makeTrial(2, true, 150),
    makeTrial(3, false, 150),
    makeTrial(4, true, 150),
  ];
  const result = evaluateDifficulty(trials, 3, 5);
  assert.equal(result.action, 'maintain');
  assert.equal(result.newLevel, 3);
});

test('does not promote above max level', () => {
  const trials = [
    makeTrial(0, true, 100),
    makeTrial(1, true, 100),
    makeTrial(2, true, 100),
    makeTrial(3, true, 100),
    makeTrial(4, true, 100),
  ];
  const result = evaluateDifficulty(trials, 5, 5);
  assert.equal(result.action, 'maintain');
  assert.equal(result.newLevel, 5);
});

test('fixed mode keeps selected level unchanged', () => {
  const trials = [
    makeTrial(0, true, 100),
    makeTrial(1, true, 100),
    makeTrial(2, true, 100),
    makeTrial(3, true, 100),
    makeTrial(4, true, 100),
  ];

  const result = resolveDifficultyAfterSession('fixed', trials, 3, 5);
  assert.equal(result.action, 'maintain');
  assert.equal(result.newLevel, 3);
  assert.equal(result.reason, 'Fixed mode');
});

test('adaptive mode delegates to adaptive rules', () => {
  const trials = [
    makeTrial(0, true, 120),
    makeTrial(1, true, 120),
    makeTrial(2, false, 120),
    makeTrial(3, true, 120),
    makeTrial(4, true, 120),
    makeTrial(5, true, 120),
  ];

  const direct = evaluateDifficulty(trials, 2, 5);
  const adaptive = resolveDifficultyAfterSession('adaptive', trials, 2, 5);
  assert.equal(adaptive.action, direct.action);
  assert.equal(adaptive.newLevel, direct.newLevel);
  assert.equal(adaptive.reason, direct.reason);
});

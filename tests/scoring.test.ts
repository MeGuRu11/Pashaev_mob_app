import test from 'node:test';
import assert from 'node:assert/strict';
import type { Trial } from '../types/game';
import {
  buildSessionSummary,
  calculateAccuracy,
  calculateFatigueIndex,
  calculateMedianRt,
  calculateP90Rt,
  calculateStreakMax,
  formatAccuracy,
  formatMs,
} from '../utils/scoring';

function makeTrial(index: number, isCorrect: boolean, rtMs: number): Trial {
  return { index, isCorrect, rtMs };
}

test('calculateAccuracy returns expected fraction', () => {
  assert.equal(calculateAccuracy([]), 0);
  assert.equal(
    calculateAccuracy([
      makeTrial(0, true, 100),
      makeTrial(1, false, 100),
      makeTrial(2, true, 100),
    ]),
    2 / 3
  );
});

test('calculateMedianRt handles odd and even lengths', () => {
  assert.equal(
    calculateMedianRt([
      makeTrial(0, true, 300),
      makeTrial(1, true, 100),
      makeTrial(2, true, 200),
    ]),
    200
  );

  assert.equal(
    calculateMedianRt([
      makeTrial(0, true, 100),
      makeTrial(1, true, 300),
      makeTrial(2, true, 200),
      makeTrial(3, true, 400),
    ]),
    250
  );
});

test('calculateP90Rt selects 90th percentile element', () => {
  const trials = [100, 200, 300, 400, 500].map((rt, i) => makeTrial(i, true, rt));
  assert.equal(calculateP90Rt(trials), 500);
});

test('calculateStreakMax returns longest correct streak', () => {
  const trials = [
    makeTrial(0, true, 100),
    makeTrial(1, true, 100),
    makeTrial(2, false, 100),
    makeTrial(3, true, 100),
    makeTrial(4, true, 100),
    makeTrial(5, true, 100),
  ];
  assert.equal(calculateStreakMax(trials), 3);
});

test('calculateFatigueIndex detects slowdown and speedup', () => {
  const slowdown = [100, 160, 220, 280, 340].map((rt, i) => makeTrial(i, true, rt));
  const speedup = [340, 280, 220, 160, 100].map((rt, i) => makeTrial(i, true, rt));

  assert.ok(calculateFatigueIndex(slowdown) > 0.5);
  assert.ok(calculateFatigueIndex(speedup) < -0.5);
});

test('buildSessionSummary aggregates metrics', () => {
  const startedAt = Date.now() - 5000;
  const trials = [
    makeTrial(0, true, 100),
    makeTrial(1, false, 200),
    makeTrial(2, true, 300),
  ];

  const summary = buildSessionSummary(trials, 'find-exact', 2, startedAt);

  assert.equal(summary.moduleId, 'find-exact');
  assert.equal(summary.difficulty, 2);
  assert.equal(summary.difficultyMode, 'adaptive');
  assert.equal(summary.startedAt, startedAt);
  assert.equal(summary.accuracy, 2 / 3);
  assert.equal(summary.medianRt, 200);
  assert.equal(summary.p90Rt, 300);
  assert.equal(summary.streakMax, 1);
  assert.ok(summary.endedAt >= startedAt);
});

test('buildSessionSummary stores explicit difficulty mode', () => {
  const trials = [
    makeTrial(0, true, 100),
    makeTrial(1, true, 120),
    makeTrial(2, false, 130),
  ];

  const summary = buildSessionSummary(trials, 'restore-horizon', 4, Date.now() - 2000, 'fixed');
  assert.equal(summary.difficultyMode, 'fixed');
});

test('format helpers return readable values', () => {
  assert.equal(formatMs(999), '999ms');
  assert.equal(formatMs(1234), '1.2s');
  assert.equal(formatAccuracy(0.845), '85%');
});

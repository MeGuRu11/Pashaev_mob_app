import test from 'node:test';
import assert from 'node:assert/strict';
import {
  generateHorizonPattern,
  generateHorizonTransform,
  getMinMovesToIdentity,
} from '../utils/horizon-generator';

test('generateHorizonTransform respects minTransformSteps when feasible', () => {
  for (let seed = 1; seed <= 20; seed++) {
    const transform = generateHorizonTransform(seed, 3, 2);
    const minMoves = getMinMovesToIdentity(transform);
    assert.ok(minMoves >= 2);
  }
});

test('falls back to hardest available transform when minTransformSteps is too high', () => {
  const transform = generateHorizonTransform(42, 1, 5);
  const minMoves = getMinMovesToIdentity(transform);

  // Difficulty 1 only allows rotations, where the hardest state is 2 moves.
  assert.equal(minMoves, 2);
});

test('generateHorizonTransform respects maxTransformSteps when provided', () => {
  for (let seed = 1; seed <= 30; seed++) {
    const transform = generateHorizonTransform(seed, 5, 1, 4);
    const minMoves = getMinMovesToIdentity(transform);
    assert.ok(minMoves <= 4);
  }
});

test('horizon marker spawns in varying cells and is not fixed at top-left', () => {
  const markerPositions = new Set<string>();

  for (let seed = 1; seed <= 20; seed++) {
    const pattern = generateHorizonPattern(seed, 4);
    let markerCount = 0;
    let markerPosition = '';

    for (let row = 0; row < pattern.size; row++) {
      for (let col = 0; col < pattern.size; col++) {
        if (pattern.grid[row][col] === 6) {
          markerCount++;
          markerPosition = `${row},${col}`;
        }
      }
    }

    assert.equal(markerCount, 1);
    markerPositions.add(markerPosition);
  }

  assert.ok(markerPositions.size > 1);
  assert.ok([...markerPositions].some((pos) => pos !== '0,0'));
});

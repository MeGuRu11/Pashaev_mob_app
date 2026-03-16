import test from 'node:test';
import assert from 'node:assert/strict';
import { generateTrialShapes } from '../utils/shape-generator';

test('generateTrialShapes applies near-miss count and strength', () => {
  const mutationStrength = 0.2;
  const nearMissMultiplier = 0.5;
  const result = generateTrialShapes(
    12345,
    3,
    5,
    6,
    mutationStrength,
    100,
    2,
    nearMissMultiplier
  );

  assert.equal(result.options.length, 9);
  assert.equal(result.nearMissIndices.length, 2);
  assert.equal(new Set(result.nearMissIndices).size, 2);
  assert.equal(result.nearMissIndices.includes(result.correctIndex), false);

  const nearMissStrength = mutationStrength * nearMissMultiplier;

  result.optionStrengths.forEach((value, index) => {
    if (index === result.correctIndex) {
      assert.equal(value, null);
      assert.equal(result.optionKinds[index], 'correct');
      return;
    }

    assert.ok(value !== null);
    if (result.nearMissIndices.includes(index)) {
      assert.ok(Math.abs(value - nearMissStrength) < 1e-9);
      assert.equal(result.optionKinds[index], 'near-miss');
      return;
    }

    assert.ok(value >= mutationStrength * 1.1);
    assert.ok(value <= mutationStrength * 1.45);
    assert.ok(
      result.optionKinds[index] === 'mutated-reference' ||
        result.optionKinds[index] === 'alt-shape'
    );
  });
});

test('nearMissCount is capped by available distractor slots', () => {
  const result = generateTrialShapes(77, 2, 4, 5, 0.15, 80, 10, 0.4);
  // 2x2 grid => 4 options, one is correct => max 3 near-miss slots.
  assert.equal(result.nearMissIndices.length, 3);
  assert.equal(result.nearMissIndices.includes(result.correctIndex), false);
});

test('generator introduces distractor variability across trials', () => {
  let sawAltShape = false;
  let sawMutatedReference = false;

  for (let seed = 1; seed <= 40; seed++) {
    const result = generateTrialShapes(seed, 3, 5, 6, 0.18, 100, 1, 0.6);
    if (result.optionKinds.includes('alt-shape')) {
      sawAltShape = true;
    }
    if (result.optionKinds.includes('mutated-reference')) {
      sawMutatedReference = true;
    }
  }

  assert.equal(sawAltShape, true);
  assert.equal(sawMutatedReference, true);
});

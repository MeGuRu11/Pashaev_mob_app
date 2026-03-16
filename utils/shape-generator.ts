import { Point, Shape } from '../types/game';
import { createRandom, randomInt, shuffle } from './seed-random';

const ALT_SHAPE_PROBABILITY = 0.25;

export function generateShape(
  seed: number,
  verticesMin: number,
  verticesMax: number,
  size: number
): Shape {
  const rng = createRandom(seed);
  const verticesCount = randomInt(rng, verticesMin, verticesMax);
  const vertices: Point[] = [];
  const angleStep = (2 * Math.PI) / verticesCount;
  const center = size / 2;
  const baseRadius = size * 0.35;

  for (let i = 0; i < verticesCount; i++) {
    const angle = angleStep * i + (rng() - 0.5) * angleStep * 0.3;
    const radius = baseRadius * (0.75 + rng() * 0.5);
    vertices.push({
      x: center + Math.cos(angle) * radius,
      y: center + Math.sin(angle) * radius,
    });
  }

  const innerLines: [Point, Point][] = [];
  const lineCount = Math.max(1, Math.floor(rng() * 3));
  for (let l = 0; l < lineCount; l++) {
    const a = Math.floor(rng() * verticesCount);
    const offset = 2 + Math.floor(rng() * Math.max(1, verticesCount - 3));
    const b = (a + offset) % verticesCount;
    if (a !== b) {
      innerLines.push([vertices[a], vertices[b]]);
    }
  }

  return { vertices, innerLines, seed };
}

export function mutateShape(
  shape: Shape,
  strength: number,
  mutateSeed: number,
  size: number
): Shape {
  const rng = createRandom(mutateSeed);
  const center = size / 2;

  let avgRadius = 0;
  for (const v of shape.vertices) {
    avgRadius += Math.sqrt((v.x - center) ** 2 + (v.y - center) ** 2);
  }
  avgRadius /= shape.vertices.length;

  const displacement = strength * avgRadius;

  const newVertices = shape.vertices.map((v) => ({
    x: v.x + (rng() - 0.5) * 2 * displacement,
    y: v.y + (rng() - 0.5) * 2 * displacement,
  }));

  const newInnerLines: [Point, Point][] = shape.innerLines.map(([a, b]) => {
    const aIdx = shape.vertices.findIndex(
      (v) => Math.abs(v.x - a.x) < 0.01 && Math.abs(v.y - a.y) < 0.01
    );
    const bIdx = shape.vertices.findIndex(
      (v) => Math.abs(v.x - b.x) < 0.01 && Math.abs(v.y - b.y) < 0.01
    );
    return [
      aIdx >= 0 ? newVertices[aIdx] : a,
      bIdx >= 0 ? newVertices[bIdx] : b,
    ];
  });

  return {
    vertices: newVertices,
    innerLines: newInnerLines,
    seed: mutateSeed,
  };
}

export function generateTrialShapes(
  seed: number,
  gridSize: number,
  verticesMin: number,
  verticesMax: number,
  mutationStrength: number,
  shapeSize: number,
  nearMissCount: number = 0,
  nearMissStrengthMultiplier: number = 0.5
): {
  reference: Shape;
  options: Shape[];
  correctIndex: number;
  nearMissIndices: number[];
  optionStrengths: (number | null)[];
  optionKinds: ('correct' | 'near-miss' | 'mutated-reference' | 'alt-shape')[];
} {
  const rng = createRandom(seed);
  const totalOptions = gridSize * gridSize;

  const refShape = generateShape(
    Math.floor(rng() * 2147483647),
    verticesMin,
    verticesMax,
    shapeSize
  );

  const correctIndex = Math.floor(rng() * totalOptions);
  const availableIndices = Array.from({ length: totalOptions }, (_, i) => i).filter(
    (index) => index !== correctIndex
  );
  const shuffled = shuffle(availableIndices, rng);
  const nearMissIndices = shuffled.slice(
    0,
    Math.min(nearMissCount, availableIndices.length)
  );
  const nearMissSet = new Set(nearMissIndices);

  const options: Shape[] = [];
  const optionStrengths: (number | null)[] = [];
  const optionKinds: ('correct' | 'near-miss' | 'mutated-reference' | 'alt-shape')[] = [];
  for (let i = 0; i < totalOptions; i++) {
    if (i === correctIndex) {
      options.push({ ...refShape });
      optionStrengths.push(null);
      optionKinds.push('correct');
    } else {
      if (nearMissSet.has(i)) {
        const mutSeed = Math.floor(rng() * 2147483647);
        const strength = mutationStrength * nearMissStrengthMultiplier;
        options.push(mutateShape(refShape, strength, mutSeed, shapeSize));
        optionStrengths.push(strength);
        optionKinds.push('near-miss');
      } else {
        const boostedStrength = mutationStrength * (1.1 + rng() * 0.35);
        const useAltShape = rng() < ALT_SHAPE_PROBABILITY;

        if (useAltShape) {
          const altBaseSeed = Math.floor(rng() * 2147483647);
          const altMutateSeed = Math.floor(rng() * 2147483647);
          const altBaseShape = generateShape(altBaseSeed, verticesMin, verticesMax, shapeSize);
          options.push(mutateShape(altBaseShape, boostedStrength, altMutateSeed, shapeSize));
          optionKinds.push('alt-shape');
        } else {
          const mutSeed = Math.floor(rng() * 2147483647);
          options.push(mutateShape(refShape, boostedStrength, mutSeed, shapeSize));
          optionKinds.push('mutated-reference');
        }

        optionStrengths.push(boostedStrength);
      }
    }
  }

  return {
    reference: refShape,
    options,
    correctIndex,
    nearMissIndices,
    optionStrengths,
    optionKinds,
  };
}

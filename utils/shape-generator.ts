import { Point, Shape } from '../types/game';
import { createRandom, randomInt, shuffle } from './seed-random';

const ALT_SHAPE_PROBABILITY = 0.25;
const MIN_ORGAN_VERTICES = 8;
const MAX_ORGAN_VERTICES = 22;
const SHAPE_MARGIN_RATIO = 0.08;

type NormalizedPoint = Point;

interface OrganTemplate {
  contour: NormalizedPoint[];
  lineAnchors: [number, number][];
}

const ORGAN_TEMPLATES: OrganTemplate[] = [
  {
    // Heart-like silhouette.
    contour: [
      { x: 0.5, y: 0.88 },
      { x: 0.38, y: 0.74 },
      { x: 0.24, y: 0.62 },
      { x: 0.18, y: 0.48 },
      { x: 0.24, y: 0.34 },
      { x: 0.36, y: 0.27 },
      { x: 0.47, y: 0.32 },
      { x: 0.5, y: 0.39 },
      { x: 0.53, y: 0.32 },
      { x: 0.64, y: 0.27 },
      { x: 0.76, y: 0.34 },
      { x: 0.82, y: 0.48 },
      { x: 0.76, y: 0.62 },
      { x: 0.62, y: 0.74 },
    ],
    lineAnchors: [
      [0.1, 0.56],
      [0.24, 0.77],
    ],
  },
  {
    // Kidney-like contour.
    contour: [
      { x: 0.63, y: 0.14 },
      { x: 0.74, y: 0.2 },
      { x: 0.81, y: 0.32 },
      { x: 0.82, y: 0.47 },
      { x: 0.77, y: 0.62 },
      { x: 0.69, y: 0.75 },
      { x: 0.57, y: 0.84 },
      { x: 0.44, y: 0.86 },
      { x: 0.34, y: 0.79 },
      { x: 0.28, y: 0.67 },
      { x: 0.28, y: 0.54 },
      { x: 0.32, y: 0.44 },
      { x: 0.39, y: 0.37 },
      { x: 0.43, y: 0.31 },
      { x: 0.41, y: 0.24 },
      { x: 0.35, y: 0.19 },
      { x: 0.46, y: 0.14 },
    ],
    lineAnchors: [
      [0.08, 0.45],
      [0.18, 0.6],
    ],
  },
  {
    // Liver-like contour.
    contour: [
      { x: 0.13, y: 0.55 },
      { x: 0.2, y: 0.45 },
      { x: 0.32, y: 0.36 },
      { x: 0.46, y: 0.31 },
      { x: 0.62, y: 0.31 },
      { x: 0.78, y: 0.35 },
      { x: 0.87, y: 0.44 },
      { x: 0.86, y: 0.56 },
      { x: 0.77, y: 0.67 },
      { x: 0.62, y: 0.74 },
      { x: 0.46, y: 0.76 },
      { x: 0.3, y: 0.73 },
      { x: 0.18, y: 0.66 },
    ],
    lineAnchors: [
      [0.06, 0.37],
      [0.28, 0.76],
    ],
  },
  {
    // Lung-like contour.
    contour: [
      { x: 0.54, y: 0.14 },
      { x: 0.68, y: 0.2 },
      { x: 0.77, y: 0.34 },
      { x: 0.8, y: 0.48 },
      { x: 0.78, y: 0.64 },
      { x: 0.7, y: 0.77 },
      { x: 0.58, y: 0.86 },
      { x: 0.46, y: 0.84 },
      { x: 0.36, y: 0.74 },
      { x: 0.3, y: 0.61 },
      { x: 0.28, y: 0.47 },
      { x: 0.31, y: 0.34 },
      { x: 0.39, y: 0.22 },
    ],
    lineAnchors: [
      [0.15, 0.58],
      [0.34, 0.79],
    ],
  },
  {
    // Brain-like contour.
    contour: [
      { x: 0.21, y: 0.46 },
      { x: 0.24, y: 0.35 },
      { x: 0.33, y: 0.26 },
      { x: 0.44, y: 0.22 },
      { x: 0.56, y: 0.24 },
      { x: 0.67, y: 0.2 },
      { x: 0.77, y: 0.25 },
      { x: 0.84, y: 0.34 },
      { x: 0.86, y: 0.45 },
      { x: 0.83, y: 0.56 },
      { x: 0.75, y: 0.66 },
      { x: 0.64, y: 0.72 },
      { x: 0.52, y: 0.75 },
      { x: 0.4, y: 0.73 },
      { x: 0.3, y: 0.66 },
      { x: 0.23, y: 0.57 },
    ],
    lineAnchors: [
      [0.1, 0.4],
      [0.23, 0.56],
      [0.48, 0.76],
    ],
  },
  {
    // Pancreas-like elongated contour.
    contour: [
      { x: 0.15, y: 0.57 },
      { x: 0.24, y: 0.48 },
      { x: 0.35, y: 0.42 },
      { x: 0.49, y: 0.39 },
      { x: 0.63, y: 0.41 },
      { x: 0.75, y: 0.46 },
      { x: 0.84, y: 0.54 },
      { x: 0.8, y: 0.63 },
      { x: 0.67, y: 0.67 },
      { x: 0.53, y: 0.69 },
      { x: 0.39, y: 0.67 },
      { x: 0.27, y: 0.63 },
    ],
    lineAnchors: [
      [0.1, 0.6],
      [0.25, 0.82],
    ],
  },
];

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function distance(a: Point, b: Point): number {
  return Math.hypot(b.x - a.x, b.y - a.y);
}

function resampleClosedContour(points: NormalizedPoint[], targetCount: number): NormalizedPoint[] {
  if (points.length === 0 || targetCount <= 0) return [];
  if (points.length === 1) {
    return Array.from({ length: targetCount }, () => ({ ...points[0] }));
  }

  const cumulative: number[] = [0];
  for (let i = 0; i < points.length; i++) {
    const a = points[i];
    const b = points[(i + 1) % points.length];
    cumulative.push(cumulative[i] + distance(a, b));
  }

  const totalLength = cumulative[cumulative.length - 1];
  if (totalLength <= 0) {
    return Array.from({ length: targetCount }, () => ({ ...points[0] }));
  }

  const result: NormalizedPoint[] = [];
  let segmentIndex = 0;
  for (let i = 0; i < targetCount; i++) {
    const targetDistance = (i / targetCount) * totalLength;
    while (
      segmentIndex + 1 < cumulative.length - 1 &&
      cumulative[segmentIndex + 1] < targetDistance
    ) {
      segmentIndex++;
    }

    const segmentStart = points[segmentIndex];
    const segmentEnd = points[(segmentIndex + 1) % points.length];
    const segmentLength = Math.max(
      1e-6,
      cumulative[segmentIndex + 1] - cumulative[segmentIndex]
    );
    const t = (targetDistance - cumulative[segmentIndex]) / segmentLength;
    result.push({
      x: segmentStart.x + (segmentEnd.x - segmentStart.x) * t,
      y: segmentStart.y + (segmentEnd.y - segmentStart.y) * t,
    });
  }

  return result;
}

function perturbContour(points: NormalizedPoint[], rng: () => number): NormalizedPoint[] {
  const stretchX = 0.9 + rng() * 0.22;
  const stretchY = 0.9 + rng() * 0.22;
  const noiseAmplitude = 0.025;

  return points.map((p) => ({
    x: clamp((p.x - 0.5) * stretchX + 0.5 + (rng() - 0.5) * 2 * noiseAmplitude, 0.05, 0.95),
    y: clamp((p.y - 0.5) * stretchY + 0.5 + (rng() - 0.5) * 2 * noiseAmplitude, 0.05, 0.95),
  }));
}

function smoothContour(points: NormalizedPoint[]): NormalizedPoint[] {
  if (points.length < 3) return [...points];

  return points.map((point, index) => {
    const prev = points[(index - 1 + points.length) % points.length];
    const next = points[(index + 1) % points.length];
    return {
      x: clamp(prev.x * 0.2 + point.x * 0.6 + next.x * 0.2, 0.04, 0.96),
      y: clamp(prev.y * 0.2 + point.y * 0.6 + next.y * 0.2, 0.04, 0.96),
    };
  });
}

function fitContourToCanvas(
  points: NormalizedPoint[],
  size: number,
  rng: () => number
): Point[] {
  let minX = Number.POSITIVE_INFINITY;
  let minY = Number.POSITIVE_INFINITY;
  let maxX = Number.NEGATIVE_INFINITY;
  let maxY = Number.NEGATIVE_INFINITY;

  for (const point of points) {
    minX = Math.min(minX, point.x);
    minY = Math.min(minY, point.y);
    maxX = Math.max(maxX, point.x);
    maxY = Math.max(maxY, point.y);
  }

  const width = Math.max(1e-6, maxX - minX);
  const height = Math.max(1e-6, maxY - minY);
  const targetSpan = size * (0.72 + rng() * 0.06);
  const scale = targetSpan / Math.max(width, height);

  const centerX = (minX + maxX) / 2;
  const centerY = (minY + maxY) / 2;
  const offsetX = size / 2 - centerX * scale + (rng() - 0.5) * size * 0.03;
  const offsetY = size / 2 - centerY * scale + (rng() - 0.5) * size * 0.03;
  const margin = size * SHAPE_MARGIN_RATIO;

  return points.map((point) => ({
    x: clamp(point.x * scale + offsetX, margin, size - margin),
    y: clamp(point.y * scale + offsetY, margin, size - margin),
  }));
}

function anchorToVertexIndex(anchor: number, verticesCount: number): number {
  const normalizedAnchor = anchor - Math.floor(anchor);
  return Math.floor(normalizedAnchor * verticesCount) % verticesCount;
}

function buildInnerLines(
  vertices: Point[],
  lineAnchors: [number, number][],
  rng: () => number
): [Point, Point][] {
  if (vertices.length < 4 || lineAnchors.length === 0) return [];

  const shuffledAnchors = shuffle([...lineAnchors], rng);
  const maxLines = Math.min(3, shuffledAnchors.length);
  const desiredLineCount = randomInt(rng, 1, maxLines);

  const lines: [Point, Point][] = [];
  const usedPairs = new Set<string>();

  for (const [fromAnchor, toAnchor] of shuffledAnchors) {
    if (lines.length >= desiredLineCount) break;

    let a = anchorToVertexIndex(fromAnchor, vertices.length);
    let b = anchorToVertexIndex(toAnchor, vertices.length);
    if (a === b) {
      b = (a + Math.floor(vertices.length / 2)) % vertices.length;
    }

    const distanceByIndex = Math.abs(a - b);
    if (distanceByIndex < 2 || distanceByIndex > vertices.length - 2) {
      continue;
    }

    const key = a < b ? `${a}-${b}` : `${b}-${a}`;
    if (usedPairs.has(key)) continue;
    usedPairs.add(key);
    lines.push([vertices[a], vertices[b]]);
  }

  if (lines.length === 0) {
    const a = randomInt(rng, 0, vertices.length - 1);
    const b = (a + Math.max(2, Math.floor(vertices.length / 3))) % vertices.length;
    lines.push([vertices[a], vertices[b]]);
  }

  return lines;
}

export function generateShape(
  seed: number,
  verticesMin: number,
  verticesMax: number,
  size: number
): Shape {
  const rng = createRandom(seed);
  const requestedVertices = randomInt(rng, verticesMin, verticesMax);
  const targetVertices = Math.round(
    clamp(requestedVertices + 4, MIN_ORGAN_VERTICES, MAX_ORGAN_VERTICES)
  );
  const template = ORGAN_TEMPLATES[Math.floor(rng() * ORGAN_TEMPLATES.length)];

  const resampled = resampleClosedContour(template.contour, targetVertices);
  const perturbed = perturbContour(resampled, rng);
  const smoothed = smoothContour(perturbed);
  const vertices = fitContourToCanvas(smoothed, size, rng);
  const innerLines = buildInnerLines(vertices, template.lineAnchors, rng);

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
  const margin = size * SHAPE_MARGIN_RATIO;

  const newVertices = shape.vertices.map((v) => ({
    x: clamp(v.x + (rng() - 0.5) * 2 * displacement, margin, size - margin),
    y: clamp(v.y + (rng() - 0.5) * 2 * displacement, margin, size - margin),
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

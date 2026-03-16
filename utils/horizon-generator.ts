import { HorizonPattern, HorizonTransform } from '../types/game';
import { createRandom } from './seed-random';

export type HorizonAction = 'rotateLeft' | 'rotateRight' | 'flipX' | 'flipY';

const HORIZON_ACTIONS: HorizonAction[] = ['rotateLeft', 'rotateRight', 'flipX', 'flipY'];

export function generateHorizonPattern(seed: number, size: number): HorizonPattern {
  const rng = createRandom(seed);
  const grid: number[][] = [];

  for (let r = 0; r < size; r++) {
    const row: number[] = [];
    for (let c = 0; c < size; c++) {
      row.push(Math.floor(rng() * 5) + 1);
    }
    grid.push(row);
  }

  const markerRow = Math.floor(rng() * size);
  const markerCol = Math.floor(rng() * size);
  grid[markerRow][markerCol] = 6;

  return { grid, size };
}

export function generateHorizonTransform(
  seed: number,
  difficulty: number,
  minTransformSteps: number = 1,
  maxTransformSteps: number = Number.POSITIVE_INFINITY
): HorizonTransform {
  const rng = createRandom(seed);
  const rotations = [0, 90, 180, 270];
  const mirrorXOptions = difficulty >= 2 ? [false, true] : [false];
  const mirrorYOptions = difficulty >= 3 ? [false, true] : [false];

  const candidates: HorizonTransform[] = [];
  for (const rotation of rotations) {
    for (const mirrorX of mirrorXOptions) {
      for (const mirrorY of mirrorYOptions) {
        const transform = { rotation, mirrorX, mirrorY };
        if (!isTransformIdentity(transform)) {
          candidates.push(transform);
        }
      }
    }
  }

  const withSteps = candidates.map((transform) => ({
    transform,
    minMoves: getMinMovesToIdentity(transform),
  }));

  const eligible = withSteps.filter(
    (item) => item.minMoves >= minTransformSteps && item.minMoves <= maxTransformSteps
  );

  let pool = eligible;
  if (pool.length === 0) {
    const withinMax = withSteps.filter((item) => item.minMoves <= maxTransformSteps);
    if (withinMax.length > 0) {
      const fallbackMaxMoves = withinMax.reduce(
        (max, item) => Math.max(max, item.minMoves),
        0
      );
      pool = withinMax.filter((item) => item.minMoves === fallbackMaxMoves);
    } else {
      const fallbackMaxMoves = withSteps.reduce(
        (max, item) => Math.max(max, item.minMoves),
        0
      );
      pool = withSteps.filter((item) => item.minMoves === fallbackMaxMoves);
    }
  }

  const selected = pool[Math.floor(rng() * pool.length)];
  return selected.transform;
}

export function applyTransform(
  pattern: HorizonPattern,
  transform: HorizonTransform
): number[][] {
  let grid = pattern.grid.map((row) => [...row]);

  const rotCount = (((transform.rotation % 360) + 360) % 360) / 90;
  for (let r = 0; r < rotCount; r++) {
    grid = applyGridAction(grid, 'rotateRight');
  }

  if (transform.mirrorX) {
    grid = applyGridAction(grid, 'flipX');
  }

  if (transform.mirrorY) {
    grid = applyGridAction(grid, 'flipY');
  }

  return grid;
}

export function applyGridAction(grid: number[][], action: HorizonAction): number[][] {
  switch (action) {
    case 'rotateLeft':
      return rotateGridLeft(grid);
    case 'rotateRight':
      return rotateGridRight(grid);
    case 'flipX':
      return grid.map((row) => [...row].reverse());
    case 'flipY':
      return [...grid].reverse().map((row) => [...row]);
  }
}

export function areGridsEqual(a: number[][], b: number[][]): boolean {
  if (a.length !== b.length) return false;

  for (let r = 0; r < a.length; r++) {
    if (a[r].length !== b[r].length) return false;
    for (let c = 0; c < a[r].length; c++) {
      if (a[r][c] !== b[r][c]) return false;
    }
  }

  return true;
}

export function isTransformIdentity(transform: HorizonTransform): boolean {
  return transform.rotation === 0 && !transform.mirrorX && !transform.mirrorY;
}

export function getMinMovesToIdentity(initialTransform: HorizonTransform): number {
  if (isTransformIdentity(initialTransform)) return 0;

  const size = 3;
  const targetGrid = createIndexedGrid(size);
  const initialGrid = applyTransform(
    {
      grid: targetGrid,
      size,
    },
    initialTransform
  );

  return getMinMovesBetweenGrids(initialGrid, targetGrid);
}

function rotateGridRight(grid: number[][]): number[][] {
  const n = grid.length;
  const result: number[][] = Array.from({ length: n }, () => Array(n).fill(0));
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      result[c][n - 1 - r] = grid[r][c];
    }
  }
  return result;
}

function rotateGridLeft(grid: number[][]): number[][] {
  const n = grid.length;
  const result: number[][] = Array.from({ length: n }, () => Array(n).fill(0));
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      result[n - 1 - c][r] = grid[r][c];
    }
  }
  return result;
}

function getMinMovesBetweenGrids(initialGrid: number[][], targetGrid: number[][]): number {
  if (areGridsEqual(initialGrid, targetGrid)) return 0;

  const queue: { grid: number[][]; distance: number }[] = [
    { grid: initialGrid.map((row) => [...row]), distance: 0 },
  ];
  const visited = new Set<string>([serializeGrid(initialGrid)]);

  while (queue.length > 0) {
    const current = queue.shift();
    if (!current) break;

    for (const action of HORIZON_ACTIONS) {
      const nextGrid = applyGridAction(current.grid, action);
      const key = serializeGrid(nextGrid);
      if (visited.has(key)) continue;

      if (areGridsEqual(nextGrid, targetGrid)) {
        return current.distance + 1;
      }

      visited.add(key);
      queue.push({ grid: nextGrid, distance: current.distance + 1 });
    }
  }

  return Infinity;
}

function serializeGrid(grid: number[][]): string {
  return grid.map((row) => row.join(',')).join('|');
}

function createIndexedGrid(size: number): number[][] {
  let value = 0;
  const grid: number[][] = [];

  for (let r = 0; r < size; r++) {
    const row: number[] = [];
    for (let c = 0; c < size; c++) {
      row.push(value++);
    }
    grid.push(row);
  }

  return grid;
}

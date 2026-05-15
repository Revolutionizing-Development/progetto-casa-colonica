import type { CostRange } from '../types';

// Intersection of two ranges (null if they don't overlap)
export function intersect(a: CostRange, b: CostRange): CostRange | null {
  const low = Math.max(a.low, b.low);
  const high = Math.min(a.high, b.high);
  if (high < low) return null;
  return { low, high };
}

// Intersection of three ranges (null if they don't all overlap)
export function intersectThree(
  a: CostRange,
  b: CostRange,
  c: CostRange,
): CostRange | null {
  const ab = intersect(a, b);
  if (!ab) return null;
  return intersect(ab, c);
}

// Union (widened range covering all provided ranges)
export function widen(...ranges: CostRange[]): CostRange {
  const low = Math.min(...ranges.map((r) => r.low));
  const high = Math.max(...ranges.map((r) => r.high));
  return { low, high };
}

// Midpoint of a range as a point estimate
export function midpoint(r: CostRange): number {
  return Math.round((r.low + r.high) / 2);
}

// Given 3 agent ranges, determine the consensus range:
// - HIGH: all 3 intersect → use the intersection
// - MEDIUM: 2 of 3 intersect by >70% → use the majority pair intersection
// - LOW: no pair intersects by >50% → widen all 3
export function computeConsensusRange(
  a: CostRange,
  b: CostRange,
  c: CostRange,
): { range: CostRange; confidence: 'high' | 'medium' | 'low'; outlier?: 'a' | 'b' | 'c' } {
  const threeWay = intersectThree(a, b, c);
  if (threeWay) {
    return { range: threeWay, confidence: 'high' };
  }

  // Check pairwise overlaps
  const abOverlap = intersect(a, b);
  const acOverlap = intersect(a, c);
  const bcOverlap = intersect(b, c);

  // Fraction overlap for soft threshold check
  const abFraction = Math.max(
    overlapFraction(a, b),
    overlapFraction(b, a),
  );
  const acFraction = Math.max(
    overlapFraction(a, c),
    overlapFraction(c, a),
  );
  const bcFraction = Math.max(
    overlapFraction(b, c),
    overlapFraction(c, b),
  );

  const MEDIUM_THRESHOLD = 0.5; // 50% overlap qualifies as MEDIUM

  if (bcOverlap && bcFraction >= MEDIUM_THRESHOLD) {
    return { range: bcOverlap, confidence: 'medium', outlier: 'a' };
  }
  if (acOverlap && acFraction >= MEDIUM_THRESHOLD) {
    return { range: acOverlap, confidence: 'medium', outlier: 'b' };
  }
  if (abOverlap && abFraction >= MEDIUM_THRESHOLD) {
    return { range: abOverlap, confidence: 'medium', outlier: 'c' };
  }

  // No meaningful pairwise overlap → LOW confidence, widen everything
  return { range: widen(a, b, c), confidence: 'low' };
}

// Helper re-export so consensus.ts is self-contained
function overlapFraction(a: CostRange, b: CostRange): number {
  const overlapLow = Math.max(a.low, b.low);
  const overlapHigh = Math.min(a.high, b.high);
  if (overlapHigh <= overlapLow) return 0;
  const overlapSpan = overlapHigh - overlapLow;
  const denominator = Math.max(a.high - a.low, b.high - b.low, 1);
  return overlapSpan / denominator;
}

import { describe, it, expect } from 'vitest';
import { intersect, intersectThree, widen, midpoint, computeConsensusRange } from '../synthesis/consensus';

describe('intersect', () => {
  it('returns the overlap of two overlapping ranges', () => {
    expect(intersect({ low: 100, high: 200 }, { low: 150, high: 300 })).toEqual({
      low: 150,
      high: 200,
    });
  });

  it('returns null for non-overlapping ranges', () => {
    expect(intersect({ low: 100, high: 200 }, { low: 250, high: 350 })).toBeNull();
  });

  it('handles touching ranges (shares single point)', () => {
    // 100-200 and 200-300 share only 200 — considered touching, not overlapping
    expect(intersect({ low: 100, high: 200 }, { low: 200, high: 300 })).toEqual({
      low: 200,
      high: 200,
    });
  });
});

describe('intersectThree', () => {
  it('returns intersection when all three overlap', () => {
    const result = intersectThree(
      { low: 100, high: 300 },
      { low: 150, high: 350 },
      { low: 120, high: 280 },
    );
    expect(result).toEqual({ low: 150, high: 280 });
  });

  it('returns null when two overlap but third does not', () => {
    const result = intersectThree(
      { low: 100, high: 200 },
      { low: 150, high: 250 },
      { low: 300, high: 400 },
    );
    expect(result).toBeNull();
  });
});

describe('widen', () => {
  it('covers all provided ranges', () => {
    const result = widen(
      { low: 100, high: 200 },
      { low: 50, high: 150 },
      { low: 180, high: 300 },
    );
    expect(result).toEqual({ low: 50, high: 300 });
  });

  it('handles a single range', () => {
    expect(widen({ low: 100, high: 200 })).toEqual({ low: 100, high: 200 });
  });
});

describe('midpoint', () => {
  it('returns the midpoint', () => {
    expect(midpoint({ low: 100, high: 200 })).toBe(150);
  });

  it('rounds correctly', () => {
    expect(midpoint({ low: 100, high: 201 })).toBe(151);
  });
});

describe('computeConsensusRange', () => {
  it('returns HIGH confidence when all three ranges intersect', () => {
    const result = computeConsensusRange(
      { low: 10000, high: 15000 },
      { low: 11000, high: 16000 },
      { low: 12000, high: 17000 },
    );
    expect(result.confidence).toBe('high');
    expect(result.range.low).toBe(12000);
    expect(result.range.high).toBe(15000);
  });

  it('returns MEDIUM confidence when 2 of 3 overlap, identifies outlier', () => {
    const result = computeConsensusRange(
      { low: 10000, high: 15000 }, // claude
      { low: 11000, high: 16000 }, // openai — overlaps with claude
      { low: 40000, high: 60000 }, // gemini — outlier
    );
    expect(result.confidence).toBe('medium');
    expect(result.outlier).toBe('c'); // gemini is 'c'
  });

  it('returns LOW confidence when no pair overlaps meaningfully', () => {
    const result = computeConsensusRange(
      { low: 5000, high: 8000 },
      { low: 20000, high: 25000 },
      { low: 45000, high: 55000 },
    );
    expect(result.confidence).toBe('low');
    // Widened range should cover all three
    expect(result.range.low).toBe(5000);
    expect(result.range.high).toBe(55000);
  });
});

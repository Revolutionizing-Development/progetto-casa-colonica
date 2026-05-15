import { describe, it, expect } from 'vitest';
import { overlapFraction, rangesOverlap, buildTriples } from '../synthesis/comparator';
import type { AgentOutput } from '../types';

describe('overlapFraction', () => {
  it('returns 1 for identical ranges', () => {
    expect(overlapFraction({ low: 100, high: 200 }, { low: 100, high: 200 })).toBe(1);
  });

  it('returns 0 for non-overlapping ranges', () => {
    expect(overlapFraction({ low: 100, high: 200 }, { low: 300, high: 400 })).toBe(0);
  });

  it('returns 0.5 for 50% overlap', () => {
    // A = 100-200, B = 150-250 → overlap = 150-200 = 50, span = max(100, 100) = 100
    const result = overlapFraction({ low: 100, high: 200 }, { low: 150, high: 250 });
    expect(result).toBeCloseTo(0.5, 2);
  });

  it('handles point estimates (low === high)', () => {
    // Both point estimates at 150 — full overlap
    const result = overlapFraction({ low: 150, high: 150 }, { low: 150, high: 150 });
    expect(result).toBe(1);
  });

  it('returns 0 for adjacent but non-overlapping ranges', () => {
    expect(overlapFraction({ low: 100, high: 200 }, { low: 200, high: 300 })).toBe(0);
  });
});

describe('rangesOverlap', () => {
  it('returns true when overlap exceeds threshold', () => {
    expect(rangesOverlap({ low: 100, high: 200 }, { low: 130, high: 230 }, 0.5)).toBe(true);
  });

  it('returns false when overlap is below threshold', () => {
    expect(rangesOverlap({ low: 100, high: 200 }, { low: 190, high: 290 }, 0.7)).toBe(false);
  });
});

describe('buildTriples', () => {
  function makeOutput(items: Array<{ key: string; low: number; high: number }>): AgentOutput {
    return {
      aiAnalysis: {
        conditionAssessment: {
          structural: 3,
          roof: 3,
          walls: 3,
          systems: 2,
          interior: 2,
          overall: 3,
          narrative: 'test',
        },
        conditionCategory: 'major_renovation',
        estimatedAcquisitionPrice: { low: 200000, high: 250000 },
        locationAnalysis: {
          proximityToTown: 'test',
          touristFlow: 'test',
          accessibility: 'test',
          views: 'test',
          narrative: 'test',
        },
        riskFactors: [],
        opportunities: [],
        guestSeparationFeasibility: { feasible: true, requiresStructuralWork: false, notes: '' },
        summaryNarrative: 'test',
        confidenceLevel: 'estimated',
      },
      renovationScenario: {
        scenarioType: 'basic',
        phases: [
          {
            phaseNumber: 1,
            name: 'Phase 1',
            estimatedMonths: '1-6',
            totalCost: { low: 0, high: 0 },
            lineItems: items.map((i) => ({
              key: i.key,
              description: i.key,
              category: 'structural' as const,
              materialsCost: { low: Math.round(i.low * 0.4), high: Math.round(i.high * 0.4) },
              laborCost: { low: Math.round(i.low * 0.6), high: Math.round(i.high * 0.6) },
              totalCost: { low: i.low, high: i.high },
              diyEligible: false,
            })),
          },
        ],
        farmFeatures: [],
        totalRenovationCost: { low: 0, high: 0 },
        contingencyPercent: 20,
        contingencyAmount: { low: 0, high: 0 },
      },
    };
  }

  it('returns triples for keys present in all 3 agents', () => {
    const c = makeOutput([{ key: 'roof', low: 10000, high: 15000 }]);
    const o = makeOutput([{ key: 'roof', low: 11000, high: 16000 }]);
    const g = makeOutput([{ key: 'roof', low: 9000, high: 14000 }]);

    const triples = buildTriples(c, o, g);
    expect(triples).toHaveLength(1);
    expect(triples[0].key).toBe('roof');
    expect(triples[0].claude).toEqual({ low: 10000, high: 15000 });
    expect(triples[0].openai).toEqual({ low: 11000, high: 16000 });
    expect(triples[0].gemini).toEqual({ low: 9000, high: 14000 });
  });

  it('includes keys present in only 2 agents', () => {
    const c = makeOutput([{ key: 'roof', low: 10000, high: 15000 }]);
    const o = makeOutput([{ key: 'roof', low: 11000, high: 16000 }, { key: 'walls', low: 5000, high: 8000 }]);
    const g = makeOutput([{ key: 'roof', low: 9000, high: 14000 }]);

    const triples = buildTriples(c, o, g);
    // roof: all 3, walls: only openai → excluded (need at least 2)
    const keys = triples.map((t) => t.key);
    expect(keys).toContain('roof');
    // 'walls' appears in only 1 agent — excluded
    expect(keys).not.toContain('walls');
  });
});

import { describe, it, expect } from 'vitest';
import { assessConfidence, computeDivergenceReport } from '../synthesis/confidence';
import type { LineItemTriple } from '../synthesis/comparator';

function makeTriple(
  claude: [number, number],
  openai: [number, number],
  gemini: [number, number],
  key = 'test_item',
): LineItemTriple {
  return {
    key,
    description: key,
    claude: { low: claude[0], high: claude[1] },
    openai: { low: openai[0], high: openai[1] },
    gemini: { low: gemini[0], high: gemini[1] },
  };
}

describe('assessConfidence', () => {
  it('assigns high confidence when all 3 ranges overlap', () => {
    const assessment = assessConfidence(
      makeTriple([10000, 15000], [11000, 16000], [12000, 17000]),
    );
    expect(assessment.confidence).toBe('high');
    expect(assessment.consensusRange.low).toBe(12000);
    expect(assessment.consensusRange.high).toBe(15000);
  });

  it('assigns medium confidence when 2 of 3 overlap', () => {
    const assessment = assessConfidence(
      makeTriple([10000, 15000], [12000, 17000], [50000, 70000]),
    );
    expect(assessment.confidence).toBe('medium');
    expect(assessment.outlier).toBe('c');
  });

  it('assigns low confidence when no pair overlaps meaningfully', () => {
    const assessment = assessConfidence(
      makeTriple([5000, 8000], [20000, 25000], [50000, 65000]),
    );
    expect(assessment.confidence).toBe('low');
  });
});

describe('computeDivergenceReport', () => {
  it('correctly counts confidence levels', () => {
    const assessments = [
      { triple: makeTriple([10, 20], [11, 21], [12, 22], 'a'), confidence: 'high' as const, consensusRange: { low: 12, high: 20 } },
      { triple: makeTriple([10, 20], [11, 21], [12, 22], 'b'), confidence: 'high' as const, consensusRange: { low: 12, high: 20 } },
      { triple: makeTriple([10, 20], [40, 60], [12, 22], 'c'), confidence: 'medium' as const, consensusRange: { low: 12, high: 20 }, outlier: 'b' as const },
      { triple: makeTriple([5, 8], [20, 25], [50, 65], 'd'), confidence: 'low' as const, consensusRange: { low: 5, high: 65 } },
    ];

    const report = computeDivergenceReport(assessments);
    expect(report.totalItemsCompared).toBe(4);
    expect(report.highConfidence).toBe(2);
    expect(report.mediumConfidence).toBe(1);
    expect(report.lowConfidence).toBe(1);
    // Score: (2*100 + 1*50) / (4*100) * 100 = 62.5
    expect(report.overallConfidenceScore).toBe(63);
  });

  it('returns 0 score for empty assessments', () => {
    const report = computeDivergenceReport([]);
    expect(report.overallConfidenceScore).toBe(0);
    expect(report.totalItemsCompared).toBe(0);
  });

  it('returns 100 score when all items are high confidence', () => {
    const assessments = [
      { triple: makeTriple([10, 20], [11, 21], [12, 22], 'a'), confidence: 'high' as const, consensusRange: { low: 12, high: 20 } },
      { triple: makeTriple([10, 20], [11, 21], [12, 22], 'b'), confidence: 'high' as const, consensusRange: { low: 12, high: 20 } },
    ];
    const report = computeDivergenceReport(assessments);
    expect(report.overallConfidenceScore).toBe(100);
  });
});

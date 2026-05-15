import type { LineItemTriple } from './comparator';
import type { LineItemConfidence, DivergenceReport } from '../types';
import { computeConsensusRange } from './consensus';

export interface LineItemAssessment {
  triple: LineItemTriple;
  confidence: LineItemConfidence;
  consensusRange: { low: number; high: number };
  outlier?: 'a' | 'b' | 'c';
}

export function assessConfidence(triple: LineItemTriple): LineItemAssessment {
  const { range, confidence, outlier } = computeConsensusRange(
    triple.claude,
    triple.openai,
    triple.gemini,
  );

  return {
    triple,
    confidence,
    consensusRange: range,
    outlier,
  };
}

export function assessAll(triples: LineItemTriple[]): LineItemAssessment[] {
  return triples.map(assessConfidence);
}

export function computeDivergenceReport(
  assessments: LineItemAssessment[],
): Omit<DivergenceReport, 'flaggedItems'> {
  const high = assessments.filter((a) => a.confidence === 'high').length;
  const medium = assessments.filter((a) => a.confidence === 'medium').length;
  const low = assessments.filter((a) => a.confidence === 'low').length;
  const total = assessments.length;

  // Score: high=100pts, medium=50pts, low=0pts
  const rawScore = total > 0 ? ((high * 100 + medium * 50) / (total * 100)) * 100 : 0;
  const overallConfidenceScore = Math.round(rawScore);

  return {
    totalItemsCompared: total,
    highConfidence: high,
    mediumConfidence: medium,
    lowConfidence: low,
    overallConfidenceScore,
  };
}

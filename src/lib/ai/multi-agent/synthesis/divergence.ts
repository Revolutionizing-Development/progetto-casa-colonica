import type { LineItemAssessment } from './confidence';
import type { FlaggedItem, AgentComparison, CostRange, LineItemConfidence } from '../types';

export interface ItemComparison {
  lineItemKey: string;
  description: string;
  confidence: LineItemConfidence;
  agentEstimates: AgentComparison;
  consensusEstimate: CostRange;
  divergenceReason?: string;
  recommendation?: string;
}

// Build the flaggedItems array for MEDIUM and LOW confidence items.
// The divergenceReason and recommendation are pre-populated with structural
// hints; the synthesizer.ts replaces them with Claude's reasoning.
export function buildFlaggedItems(
  assessments: LineItemAssessment[],
): FlaggedItem[] {
  return assessments
    .filter((a) => a.confidence !== 'high')
    .map((a) => {
      const outlierLabel =
        a.outlier === 'a' ? 'Claude' : a.outlier === 'b' ? 'GPT-4o' : 'Gemini';

      const divergenceReason =
        a.confidence === 'medium'
          ? `${outlierLabel} produced a significantly different estimate. The two agreeing agents share overlapping ranges while ${outlierLabel}'s estimate falls outside that overlap. This may reflect different assumptions about scope, finish quality, or labor rates.`
          : `All three agents produced non-overlapping estimates for this line item, indicating genuine uncertainty. Possible causes: scope ambiguity, significant regional price variation, or unknown site conditions.`;

      const recommendation =
        a.confidence === 'medium'
          ? `Obtain at least one local contractor quote to validate the majority estimate. The outlier assumption may still be correct if local conditions differ.`
          : `This item has HIGH divergence — do NOT rely on the consensus range. Obtain at least two independent contractor quotes before budgeting.`;

      return {
        lineItemKey: a.triple.key,
        description: a.triple.description,
        confidence: a.confidence,
        agentEstimates: {
          claude: a.triple.claude,
          openai: a.triple.openai,
          gemini: a.triple.gemini,
        },
        consensusEstimate: a.consensusRange,
        divergenceReason,
        recommendation,
      };
    });
}

// Build comparison data for ALL line items — proves agent alignment by showing
// per-agent estimates even when agents agree.
export function buildAllItemComparisons(
  assessments: LineItemAssessment[],
): ItemComparison[] {
  return assessments.map((a) => {
    const base: ItemComparison = {
      lineItemKey: a.triple.key,
      description: a.triple.description,
      confidence: a.confidence,
      agentEstimates: {
        claude: a.triple.claude,
        openai: a.triple.openai,
        gemini: a.triple.gemini,
      },
      consensusEstimate: a.consensusRange,
    };

    if (a.confidence !== 'high') {
      const outlierLabel =
        a.outlier === 'a' ? 'Claude' : a.outlier === 'b' ? 'GPT-4o' : 'Gemini';
      base.divergenceReason =
        a.confidence === 'medium'
          ? `${outlierLabel} produced a significantly different estimate.`
          : `All three agents produced non-overlapping estimates.`;
      base.recommendation =
        a.confidence === 'medium'
          ? `Obtain a local contractor quote to validate.`
          : `HIGH divergence — obtain at least two contractor quotes.`;
    }

    return base;
  });
}

import type { CostRange, AgentOutput, AgentLineItem } from '../types';

export interface LineItemTriple {
  key: string;
  description: string;
  claude: CostRange;
  openai: CostRange;
  gemini: CostRange;
}

// Returns the fraction of range B that overlaps with range A.
// Both ranges are [low, high]. Result is 0–1.
export function overlapFraction(a: CostRange, b: CostRange): number {
  const overlapLow = Math.max(a.low, b.low);
  const overlapHigh = Math.min(a.high, b.high);

  // Identical point estimates count as full overlap
  const aSpan = a.high - a.low;
  const bSpan = b.high - b.low;
  if (aSpan === 0 && bSpan === 0 && a.low === b.low) return 1;

  if (overlapHigh < overlapLow) return 0;
  const overlapSpan = overlapHigh - overlapLow;

  // Avoid division by zero for point estimates
  const denominator = Math.max(aSpan, bSpan, 1);
  return overlapSpan / denominator;
}

// True if range A and range B overlap by at least `threshold` (0–1)
export function rangesOverlap(a: CostRange, b: CostRange, threshold: number): boolean {
  return overlapFraction(a, b) >= threshold;
}

// Extract a flat map of key → lineItem from an agent output across all phases
export function extractLineItems(output: AgentOutput): Map<string, AgentLineItem> {
  const map = new Map<string, AgentLineItem>();
  for (const phase of output.renovationScenario.phases) {
    for (const item of phase.lineItems) {
      map.set(item.key, item);
    }
  }
  return map;
}

// Build a list of LineItemTriples for all keys that appear in at least 2 agents
export function buildTriples(
  claudeOutput: AgentOutput,
  openaiOutput: AgentOutput,
  geminiOutput: AgentOutput,
): LineItemTriple[] {
  const claudeMap = extractLineItems(claudeOutput);
  const openaiMap = extractLineItems(openaiOutput);
  const geminiMap = extractLineItems(geminiOutput);

  const allKeys = new Set([
    ...Array.from(claudeMap.keys()),
    ...Array.from(openaiMap.keys()),
    ...Array.from(geminiMap.keys()),
  ]);

  const triples: LineItemTriple[] = [];

  for (const key of Array.from(allKeys)) {
    const claudeItem = claudeMap.get(key);
    const openaiItem = openaiMap.get(key);
    const geminiItem = geminiMap.get(key);

    // Need at least 2 agents to compare
    const available = [claudeItem, openaiItem, geminiItem].filter(Boolean);
    if (available.length < 2) continue;

    // Use a zero-range placeholder for missing agents
    const zero: CostRange = { low: 0, high: 0 };
    const first = available[0]!;

    triples.push({
      key,
      description: claudeItem?.description ?? openaiItem?.description ?? geminiItem?.description ?? key,
      claude: claudeItem?.totalCost ?? zero,
      openai: openaiItem?.totalCost ?? zero,
      gemini: geminiItem?.totalCost ?? zero,
    });
  }

  return triples;
}

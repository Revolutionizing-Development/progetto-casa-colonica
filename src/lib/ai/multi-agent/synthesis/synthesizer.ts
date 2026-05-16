import Anthropic from '@anthropic-ai/sdk';
import { ConsensusOutputSchema } from '../schema/consensus-output';
import { buildTriples } from './comparator';
import { assessAll, computeDivergenceReport } from './confidence';
import { buildFlaggedItems, buildAllItemComparisons } from './divergence';
import type { ItemComparison } from './divergence';
import { runComplianceCheck } from './compliance';
import { parseJsonFromText } from '../agents/base-agent';
import type {
  AgentOutput,
  PropertyInput,
  ConsensusOutput,
  AgentUsage,
  LineItem,
  AgentLineItem,
  Phase,
  AgentPhase,
  RenovationScenario,
  AgentRenovationScenario,
  FarmFeature,
} from '../types';

export interface SynthesisResult {
  output: ConsensusOutput;
  usage: AgentUsage;
  allItemComparisons: ItemComparison[];
}

// Build the synthesis prompt that Claude uses to reason about disagreements
function buildSynthesisPrompt(
  claudeOutput: AgentOutput,
  openaiOutput: AgentOutput,
  geminiOutput: AgentOutput,
  property: PropertyInput,
  preComputedJson: string,
): string {
  return `You are reviewing three independent Italian farmhouse renovation cost estimates for the same property.

Your task is to produce a consensus RenovationScenario and a DivergenceReport.

## Property Summary
${property.commune}, ${property.province}, ${property.region}
${property.buildingAreaSqm}sqm building, condition: ${property.conditionCategory}
Intended use: ${property.searchCriteria.intendedUse}
${property.searchCriteria.numberOfAirbnbUnits > 0 ? `Airbnb units: ${property.searchCriteria.numberOfAirbnbUnits}` : ''}

## Agent Estimates

### Agent 1 — Claude
${JSON.stringify(claudeOutput.renovationScenario, null, 2)}

### Agent 2 — GPT-4o
${JSON.stringify(openaiOutput.renovationScenario, null, 2)}

### Agent 3 — Gemini
${JSON.stringify(geminiOutput.renovationScenario, null, 2)}

## Pre-computed Statistical Analysis
${preComputedJson}

## Your Task

Using the statistical analysis above as guidance, produce the final consensus JSON.

For each line item across all three scenarios:
- If all 3 agents are within 15% of each other: HIGH confidence, use their intersection
- If 2 agree but 1 is a clear outlier: MEDIUM confidence, use the majority range, explain WHY the outlier diverged (different scope assumption? material quality? regional rate?)
- If all 3 disagree significantly (>30% spread): LOW confidence, widen the range, explain what information would resolve the disagreement

For MEDIUM and LOW items, write a specific divergenceReason that names:
- What each agent assumed differently
- Which assumption is most plausible given this property's data
- What a contractor quote would clarify

Also verify constitutional compliance:
- contingencyPercent must be 15-25% (add if missing)
- Electrical, gas, structural, seismic, and plumbing items must have diyEligible: false
- If the scenario has Airbnb apartments, guest separation costs must be present as airbnb_fitout line items
  (independent entrances, sound insulation min 60dB, separate terraces, privacy landscaping)

Use the SAME aiAnalysis from the Claude agent (most detailed for property assessment).

Respond ONLY with a JSON object matching this exact structure (no markdown, no preamble):

{
  "renovationScenario": {
    "scenarioType": "<type>",
    "phases": [
      {
        "phaseNumber": <int>,
        "name": "<string>",
        "estimatedMonths": "<string>",
        "totalCost": { "low": <int>, "high": <int> },
        "lineItems": [
          {
            "key": "<snake_case>",
            "description": "<string>",
            "category": "<category>",
            "materialsCost": { "low": <int>, "high": <int> },
            "laborCost": { "low": <int>, "high": <int> },
            "totalCost": { "low": <int>, "high": <int> },
            "diyEligible": <boolean>,
            "diyIneligibleReason": "<string, only if false>",
            "confidenceLevel": "<high|medium|low>",
            "agentEstimates": { "claude": {...}, "openai": {...}, "gemini": {...} },
            "divergenceNote": "<string, only for medium/low>"
          }
        ]
      }
    ],
    "farmFeatures": [ ... ],
    "totalRenovationCost": { "low": <int>, "high": <int> },
    "contingencyPercent": <15-25>,
    "contingencyAmount": { "low": <int>, "high": <int> }
  },
  "divergenceReport": {
    "totalItemsCompared": <int>,
    "highConfidence": <int>,
    "mediumConfidence": <int>,
    "lowConfidence": <int>,
    "flaggedItems": [
      {
        "lineItemKey": "<string>",
        "description": "<string>",
        "confidence": "<medium|low>",
        "agentEstimates": { "claude": {...}, "openai": {...}, "gemini": {...} },
        "consensusEstimate": { "low": <int>, "high": <int> },
        "divergenceReason": "<specific explanation>",
        "recommendation": "<what buyer should do>"
      }
    ],
    "overallConfidenceScore": <0-100>
  },
  "aiAnalysis": <use Claude agent's aiAnalysis, set confidenceLevel to "estimated_consensus">
}`;
}

// Convert agent line items to consensus line items using pre-computed assessments
function buildFallbackConsensusScenario(
  outputs: AgentOutput[],
  property: PropertyInput,
): RenovationScenario {
  // Use the most common scenarioType
  const primaryOutput = outputs[0];
  const { phases, farmFeatures, scenarioType, contingencyPercent, contingencyAmount, totalRenovationCost } =
    primaryOutput.renovationScenario;

  const consensusPhases: Phase[] = phases.map((phase) => ({
    ...phase,
    lineItems: phase.lineItems.map((item): LineItem => ({
      ...item,
      confidenceLevel: 'medium',
    })),
  }));

  return {
    scenarioType,
    phases: consensusPhases,
    farmFeatures,
    totalRenovationCost,
    contingencyPercent,
    contingencyAmount,
  };
}

export async function runSynthesis(
  client: Anthropic,
  outputs: AgentOutput[],
  property: PropertyInput,
): Promise<SynthesisResult> {
  if (outputs.length === 0) {
    throw new Error('Synthesis requires at least one agent output');
  }

  // With only 1 agent, return single-agent result with 'estimated' confidence
  if (outputs.length === 1) {
    const solo = outputs[0];
    const singleScenario = buildFallbackConsensusScenario([solo], property);
    return {
      output: {
        renovationScenario: singleScenario,
        divergenceReport: {
          totalItemsCompared: 0,
          highConfidence: 0,
          mediumConfidence: 0,
          lowConfidence: 0,
          flaggedItems: [],
          overallConfidenceScore: 0,
        },
        aiAnalysis: {
          ...solo.aiAnalysis,
          confidenceLevel: 'estimated',
        },
      },
      usage: { inputTokens: 0, outputTokens: 0 },
      allItemComparisons: [],
    };
  }

  // Run compliance on all agent scenarios before synthesis
  const complianceResults = outputs.map((o) => runComplianceCheck(o.renovationScenario, property));
  const cleanOutputs = outputs.map((o, i) => ({
    ...o,
    renovationScenario: complianceResults[i].scenario,
  }));

  // Pre-compute statistical analysis for context
  const [c, o2, g] = cleanOutputs;
  const triples = buildTriples(c, o2 ?? c, g ?? o2 ?? c);
  const assessments = assessAll(triples);
  const reportStats = computeDivergenceReport(assessments);
  const flagged = buildFlaggedItems(assessments);
  const allComparisons = buildAllItemComparisons(assessments);

  const preComputedSummary = JSON.stringify(
    {
      stats: reportStats,
      flaggedItems: flagged.slice(0, 20), // limit prompt size
    },
    null,
    2,
  );

  const prompt = buildSynthesisPrompt(
    cleanOutputs[0],
    cleanOutputs[1] ?? cleanOutputs[0],
    cleanOutputs[2] ?? cleanOutputs[1] ?? cleanOutputs[0],
    property,
    preComputedSummary,
  );

  const response = await client.messages.create({
    model: 'claude-opus-4-7',
    max_tokens: 8192,
    messages: [{ role: 'user', content: prompt }],
  });

  const textBlock = response.content.find((b) => b.type === 'text');
  if (!textBlock || textBlock.type !== 'text') {
    throw new Error('Synthesis returned no text content');
  }

  let parsed: unknown;
  try {
    parsed = parseJsonFromText(textBlock.text);
  } catch {
    throw new Error(`Synthesis response was not valid JSON: ${textBlock.text.slice(0, 200)}`);
  }

  // Validate against consensus schema
  const validated = ConsensusOutputSchema.safeParse(parsed);
  if (!validated.success) {
    // Fall back to pre-computed consensus if Claude's output doesn't validate
    const fallbackScenario = buildFallbackConsensusScenario(cleanOutputs, property);
    const fallbackOutput: ConsensusOutput = {
      renovationScenario: fallbackScenario,
      divergenceReport: { ...reportStats, flaggedItems: flagged },
      aiAnalysis: {
        ...cleanOutputs[0].aiAnalysis,
        confidenceLevel: 'estimated_consensus',
      },
    };
    return {
      output: fallbackOutput,
      usage: {
        inputTokens: response.usage.input_tokens,
        outputTokens: response.usage.output_tokens,
      },
      allItemComparisons: allComparisons,
    };
  }

  // Enforce confidenceLevel = 'estimated_consensus' on aiAnalysis
  const result = validated.data as ConsensusOutput;
  result.aiAnalysis.confidenceLevel = 'estimated_consensus';

  return {
    output: result,
    usage: {
      inputTokens: response.usage.input_tokens,
      outputTokens: response.usage.output_tokens,
    },
    allItemComparisons: allComparisons,
  };
}

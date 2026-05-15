import { z } from 'zod';
import {
  CostRangeSchema,
  RenovationCategorySchema,
  ConfidenceLevelSchema,
  ScenarioTypeSchema,
  AIAnalysisSchema,
  FarmFeatureSchema,
} from './agent-output';

// ─── Consensus-level line items (adds confidence + agent comparison) ────────

const AgentComparisonSchema = z.object({
  claude: CostRangeSchema,
  openai: CostRangeSchema,
  gemini: CostRangeSchema,
});

const LineItemConfidenceSchema = z.enum(['high', 'medium', 'low']);

export const LineItemSchema = z.object({
  key: z.string().min(1).regex(/^[a-z0-9_]+$/),
  description: z.string().min(1),
  category: RenovationCategorySchema,
  materialsCost: CostRangeSchema,
  laborCost: CostRangeSchema,
  totalCost: CostRangeSchema,
  diyEligible: z.boolean(),
  diyIneligibleReason: z.string().optional(),
  confidenceLevel: LineItemConfidenceSchema,
  agentEstimates: AgentComparisonSchema.optional(),
  divergenceNote: z.string().optional(),
});

export const PhaseSchema = z.object({
  phaseNumber: z.number().int().positive(),
  name: z.string().min(1),
  estimatedMonths: z.string().min(1),
  totalCost: CostRangeSchema,
  lineItems: z.array(LineItemSchema).min(1),
});

export const RenovationScenarioSchema = z.object({
  scenarioType: ScenarioTypeSchema,
  phases: z.array(PhaseSchema).min(1),
  farmFeatures: z.array(FarmFeatureSchema),
  totalRenovationCost: CostRangeSchema,
  contingencyPercent: z.number().min(15).max(25),
  contingencyAmount: CostRangeSchema,
});

// ─── Divergence report ──────────────────────────────────────────────────────

const FlaggedItemSchema = z.object({
  lineItemKey: z.string().min(1),
  description: z.string().min(1),
  confidence: LineItemConfidenceSchema,
  agentEstimates: AgentComparisonSchema,
  consensusEstimate: CostRangeSchema,
  divergenceReason: z.string().min(1),
  recommendation: z.string().min(1),
});

export const DivergenceReportSchema = z.object({
  totalItemsCompared: z.number().int().nonnegative(),
  highConfidence: z.number().int().nonnegative(),
  mediumConfidence: z.number().int().nonnegative(),
  lowConfidence: z.number().int().nonnegative(),
  flaggedItems: z.array(FlaggedItemSchema),
  overallConfidenceScore: z.number().min(0).max(100),
});

// ─── Full consensus output ──────────────────────────────────────────────────

export const ConsensusOutputSchema = z.object({
  renovationScenario: RenovationScenarioSchema,
  divergenceReport: DivergenceReportSchema,
  aiAnalysis: AIAnalysisSchema,
});

export type ConsensusOutputSchema = z.infer<typeof ConsensusOutputSchema>;

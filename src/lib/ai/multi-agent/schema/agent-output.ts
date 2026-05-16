import { z } from 'zod';

// ─── Shared primitives ──────────────────────────────────────────────────────

export const CostRangeSchema = z.object({
  low: z.number().int().nonnegative(),
  high: z.number().int().nonnegative(),
});

export const ConditionRatingSchema = z.union([
  z.literal(1),
  z.literal(2),
  z.literal(3),
  z.literal(4),
  z.literal(5),
]);

export const RenovationCategorySchema = z.enum([
  'structural',
  'envelope',
  'systems',
  'finishes',
  'airbnb_fitout',
  'outdoor',
  'energy',
  'professional',
  'contingency',
]);

export const ConfidenceLevelSchema = z.enum([
  'estimated',
  'estimated_consensus',
  'quoted',
  'confirmed',
  'actual',
]);

export const ScenarioTypeSchema = z.enum([
  'basic',
  'lifestyle',
  'high_end',
  'custom',
]);

// ─── AIAnalysis ──────────────────────────────────────────────────────────────

export const AIAnalysisSchema = z.object({
  conditionAssessment: z.object({
    structural: ConditionRatingSchema,
    roof: ConditionRatingSchema,
    walls: ConditionRatingSchema,
    systems: ConditionRatingSchema,
    interior: ConditionRatingSchema,
    overall: ConditionRatingSchema,
    narrative: z.string().min(1),
  }),
  conditionCategory: z.string().min(1),
  estimatedAcquisitionPrice: CostRangeSchema,
  locationAnalysis: z.object({
    proximityToTown: z.string().min(1),
    touristFlow: z.string().min(1),
    accessibility: z.string().min(1),
    views: z.string().min(1),
    narrative: z.string().min(1),
  }),
  riskFactors: z.array(z.string()),
  opportunities: z.array(z.string()),
  guestSeparationFeasibility: z.object({
    feasible: z.boolean(),
    requiresStructuralWork: z.boolean(),
    notes: z.string(),
  }),
  summaryNarrative: z.string().min(1),
  confidenceLevel: ConfidenceLevelSchema,
});

// ─── Agent-level line items (no consensus fields) ──────────────────────────

export const AgentLineItemSchema = z.object({
  key: z.string().min(1).regex(/^[a-z0-9_]+$/, 'key must be snake_case'),
  description: z.string().min(1),
  category: RenovationCategorySchema,
  materialsCost: CostRangeSchema,
  laborCost: CostRangeSchema,
  totalCost: CostRangeSchema,
  diyEligible: z.boolean(),
  diyIneligibleReason: z.string().optional(),
});

export const AgentPhaseSchema = z.object({
  phaseNumber: z.number().int().positive(),
  name: z.string().min(1),
  estimatedMonths: z.string().min(1),
  totalCost: CostRangeSchema,
  lineItems: z.array(AgentLineItemSchema).min(1),
});

export const FarmFeatureSchema = z.object({
  type: z.string().min(1),
  included: z.boolean(),
  setupCost: CostRangeSchema,
  annualOngoingCost: CostRangeSchema,
  diyEligible: z.boolean(),
  description: z.string().min(1),
});

export const AgentRenovationScenarioSchema = z.object({
  scenarioType: ScenarioTypeSchema,
  phases: z.array(AgentPhaseSchema).min(1),
  farmFeatures: z.array(FarmFeatureSchema),
  totalRenovationCost: CostRangeSchema,
  contingencyPercent: z.number().min(15).max(25),
  contingencyAmount: CostRangeSchema,
});

// ─── Full agent output ──────────────────────────────────────────────────────

export const AgentOutputSchema = z.object({
  aiAnalysis: AIAnalysisSchema,
  renovationScenario: AgentRenovationScenarioSchema,
});

export type AgentOutputSchema = z.infer<typeof AgentOutputSchema>;

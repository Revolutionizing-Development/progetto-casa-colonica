// Mirrors the main app's types exactly. Do not modify without updating the main app.

export interface CostRange {
  low: number;  // euros, integer
  high: number; // euros, integer
}

export interface AgentComparison {
  claude: CostRange;
  openai: CostRange;
  gemini: CostRange;
}

export type ConfidenceLevel =
  | 'estimated'
  | 'estimated_consensus'
  | 'quoted'
  | 'confirmed'
  | 'actual';

export type LineItemConfidence = 'high' | 'medium' | 'low';

export type ConditionRating = 1 | 2 | 3 | 4 | 5;

export type ScenarioType = 'basic' | 'lifestyle' | 'high_end' | 'custom';

export type RenovationCategory =
  | 'structural'
  | 'envelope'
  | 'systems'
  | 'finishes'
  | 'airbnb_fitout'
  | 'outdoor'
  | 'energy'
  | 'professional'
  | 'contingency';

// ─── Input ─────────────────────────────────────────────────────────────────

export interface PropertyInput {
  commune: string;
  province: string;
  region: string;
  askingPrice: number;
  buildingAreaSqm: number;
  landAreaSqm: number;
  numberOfFloors: number;
  constructionType: string;
  energyClass: string;
  energyConsumption?: number;
  conditionCategory: string;
  description: string;
  photos: Array<{
    type: string;
    url: string;
  }>;
  searchCriteria: {
    intendedUse: string;
    numberOfAirbnbUnits: number;
    ownerResidenceSqm?: number;
    farmFeatures: string[];
  };
}

// ─── Agent-level output (pre-synthesis) ────────────────────────────────────

// Line items as produced by a single agent — without consensus fields.
export interface AgentLineItem {
  key: string;
  description: string;
  category: RenovationCategory;
  materialsCost: CostRange;
  laborCost: CostRange;
  totalCost: CostRange;
  diyEligible: boolean;
  diyIneligibleReason?: string;
}

export interface AgentPhase {
  phaseNumber: number;
  name: string;
  estimatedMonths: string;
  totalCost: CostRange;
  lineItems: AgentLineItem[];
}

export interface FarmFeature {
  type: string;
  included: boolean;
  setupCost: CostRange;
  annualOngoingCost: CostRange;
  diyEligible: boolean;
  description: string;
}

export interface AgentRenovationScenario {
  scenarioType: ScenarioType;
  phases: AgentPhase[];
  farmFeatures: FarmFeature[];
  totalRenovationCost: CostRange;
  contingencyPercent: number;
  contingencyAmount: CostRange;
}

export interface AIAnalysis {
  conditionAssessment: {
    structural: ConditionRating;
    roof: ConditionRating;
    walls: ConditionRating;
    systems: ConditionRating;
    interior: ConditionRating;
    overall: ConditionRating;
    narrative: string;
  };
  conditionCategory: string;
  estimatedAcquisitionPrice: CostRange;
  locationAnalysis: {
    proximityToTown: string;
    touristFlow: string;
    accessibility: string;
    views: string;
    narrative: string;
  };
  riskFactors: string[];
  opportunities: string[];
  guestSeparationFeasibility: {
    feasible: boolean;
    requiresStructuralWork: boolean;
    notes: string;
  };
  summaryNarrative: string;
  confidenceLevel: ConfidenceLevel;
}

// Full agent output (AIAnalysis + single-agent renovation scenario)
export interface AgentOutput {
  aiAnalysis: AIAnalysis;
  renovationScenario: AgentRenovationScenario;
}

// ─── Final (post-synthesis) types — match main app exactly ─────────────────

export interface LineItem {
  key: string;
  description: string;
  category: RenovationCategory;
  materialsCost: CostRange;
  laborCost: CostRange;
  totalCost: CostRange;
  diyEligible: boolean;
  diyIneligibleReason?: string;
  confidenceLevel: LineItemConfidence;
  agentEstimates?: AgentComparison;
  divergenceNote?: string;
}

export interface Phase {
  phaseNumber: number;
  name: string;
  estimatedMonths: string;
  totalCost: CostRange;
  lineItems: LineItem[];
}

export interface RenovationScenario {
  scenarioType: ScenarioType;
  phases: Phase[];
  farmFeatures: FarmFeature[];
  totalRenovationCost: CostRange;
  contingencyPercent: number;
  contingencyAmount: CostRange;
}

// ─── Divergence report ──────────────────────────────────────────────────────

export interface FlaggedItem {
  lineItemKey: string;
  description: string;
  confidence: LineItemConfidence;
  agentEstimates: AgentComparison;
  consensusEstimate: CostRange;
  divergenceReason: string;
  recommendation: string;
}

export interface DivergenceReport {
  totalItemsCompared: number;
  highConfidence: number;
  mediumConfidence: number;
  lowConfidence: number;
  flaggedItems: FlaggedItem[];
  overallConfidenceScore: number;
}

// ─── Consensus output ───────────────────────────────────────────────────────

export interface ConsensusOutput {
  renovationScenario: RenovationScenario;
  divergenceReport: DivergenceReport;
  aiAnalysis: AIAnalysis;
}

// ─── Module return type (includes token usage for Aditus reporting) ─────────

export interface AgentUsage {
  inputTokens: number;
  outputTokens: number;
}

export interface EstimationUsage {
  claude: AgentUsage;
  openai: AgentUsage;
  gemini: AgentUsage;
  synthesis: AgentUsage;
  total: AgentUsage;
}

export interface ItemComparison {
  lineItemKey: string;
  description: string;
  confidence: LineItemConfidence;
  agentEstimates: AgentComparison;
  consensusEstimate: CostRange;
  divergenceReason?: string;
  recommendation?: string;
}

export interface EstimationResult<T> {
  result: T;
  usage: EstimationUsage;
  allItemComparisons?: ItemComparison[];
}

// ─── Estimation engine interface (for strategy pattern in main app) ─────────

export interface EstimationEngine {
  estimate(
    property: PropertyInput,
    scenarioType: ScenarioType,
  ): Promise<EstimationResult<ConsensusOutput>>;
}

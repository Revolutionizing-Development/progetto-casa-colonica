import Anthropic from '@anthropic-ai/sdk';
import OpenAI from 'openai';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { runClaudeAgent } from './agents/claude-agent';
import { runOpenAIAgent } from './agents/openai-agent';
import { runGeminiAgent } from './agents/gemini-agent';
import { runSynthesis } from './synthesis/synthesizer';
import { PropertyInputSchema } from './schema/property-input';
import type {
  PropertyInput,
  ScenarioType,
  AgentOutput,
  AgentUsage,
  EstimationResult,
  ConsensusOutput,
  EstimationEngine,
} from './types';

export interface MultiAgentEstimatorConfig {
  anthropic: Anthropic;
  openai: OpenAI;
  google: GoogleGenerativeAI;
}

interface SettledAgent {
  name: 'claude' | 'openai' | 'gemini';
  output: AgentOutput;
  usage: AgentUsage;
}

const ZERO_USAGE: AgentUsage = { inputTokens: 0, outputTokens: 0 };

export class MultiAgentEstimator implements EstimationEngine {
  private readonly anthropic: Anthropic;
  private readonly openai: OpenAI;
  private readonly google: GoogleGenerativeAI;

  constructor(config: MultiAgentEstimatorConfig) {
    this.anthropic = config.anthropic;
    this.openai = config.openai;
    this.google = config.google;
  }

  async estimate(
    property: PropertyInput,
    scenarioType: ScenarioType,
  ): Promise<EstimationResult<ConsensusOutput>> {
    // Validate input
    const validated = PropertyInputSchema.safeParse(property);
    if (!validated.success) {
      throw new Error(
        `Invalid property input: ${validated.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ')}`,
      );
    }

    // Run all three agents in parallel
    const [claudeResult, openaiResult, geminiResult] = await Promise.allSettled([
      runClaudeAgent(this.anthropic, property, scenarioType),
      runOpenAIAgent(this.openai, property, scenarioType),
      runGeminiAgent(this.google, property, scenarioType),
    ]);

    // Collect successful agent outputs
    const settled: SettledAgent[] = [];
    let claudeUsage = ZERO_USAGE;
    let openaiUsage = ZERO_USAGE;
    let geminiUsage = ZERO_USAGE;

    if (claudeResult.status === 'fulfilled') {
      claudeUsage = claudeResult.value.usage;
      settled.push({ name: 'claude', output: claudeResult.value.output, usage: claudeUsage });
    } else {
      console.error('[MultiAgentEstimator] Claude agent failed:', claudeResult.reason);
    }

    if (openaiResult.status === 'fulfilled') {
      openaiUsage = openaiResult.value.usage;
      settled.push({ name: 'openai', output: openaiResult.value.output, usage: openaiUsage });
    } else {
      console.error('[MultiAgentEstimator] OpenAI agent failed:', openaiResult.reason);
    }

    if (geminiResult.status === 'fulfilled') {
      geminiUsage = geminiResult.value.usage;
      settled.push({ name: 'gemini', output: geminiResult.value.output, usage: geminiUsage });
    } else {
      console.error('[MultiAgentEstimator] Gemini agent failed:', geminiResult.reason);
    }

    if (settled.length === 0) {
      throw new Error('All three agents failed — cannot produce an estimate');
    }

    // Run synthesis (Claude is the synthesis host)
    const agentOutputs = settled.map((s) => s.output);
    const synthesis = await runSynthesis(this.anthropic, agentOutputs, property);
    const synthesisUsage = synthesis.usage;

    // Compute total usage
    const total: AgentUsage = {
      inputTokens:
        claudeUsage.inputTokens +
        openaiUsage.inputTokens +
        geminiUsage.inputTokens +
        synthesisUsage.inputTokens,
      outputTokens:
        claudeUsage.outputTokens +
        openaiUsage.outputTokens +
        geminiUsage.outputTokens +
        synthesisUsage.outputTokens,
    };

    return {
      result: synthesis.output,
      usage: {
        claude: claudeUsage,
        openai: openaiUsage,
        gemini: geminiUsage,
        synthesis: synthesisUsage,
        total,
      },
    };
  }
}

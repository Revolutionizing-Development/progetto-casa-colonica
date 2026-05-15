import Anthropic from '@anthropic-ai/sdk';
import {
  buildSystemPrompt,
  buildUserPrompt,
  parseJsonFromText,
  validateAgentOutput,
} from './base-agent';
import type { PropertyInput, ScenarioType, AgentOutput, AgentUsage } from '../types';

export interface ClaudeAgentResult {
  output: AgentOutput;
  usage: AgentUsage;
}

export async function runClaudeAgent(
  client: Anthropic,
  property: PropertyInput,
  scenarioType: ScenarioType,
): Promise<ClaudeAgentResult> {
  const response = await client.messages.create({
    model: 'claude-opus-4-7',
    max_tokens: 8192,
    system: buildSystemPrompt(),
    messages: [
      {
        role: 'user',
        content: buildUserPrompt(property, scenarioType),
      },
    ],
  });

  const textBlock = response.content.find((b) => b.type === 'text');
  if (!textBlock || textBlock.type !== 'text') {
    throw new Error('Claude agent returned no text content');
  }

  const raw = parseJsonFromText(textBlock.text);
  const output = validateAgentOutput(raw);

  const usage: AgentUsage = {
    inputTokens: response.usage.input_tokens,
    outputTokens: response.usage.output_tokens,
  };

  return { output, usage };
}

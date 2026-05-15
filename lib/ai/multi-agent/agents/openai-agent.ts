import OpenAI from 'openai';
import {
  buildSystemPrompt,
  buildUserPrompt,
  parseJsonFromText,
  validateAgentOutput,
} from './base-agent';
import type { PropertyInput, ScenarioType, AgentOutput, AgentUsage } from '../types';

export interface OpenAIAgentResult {
  output: AgentOutput;
  usage: AgentUsage;
}

export async function runOpenAIAgent(
  client: OpenAI,
  property: PropertyInput,
  scenarioType: ScenarioType,
): Promise<OpenAIAgentResult> {
  const response = await client.chat.completions.create({
    model: 'gpt-4o',
    max_tokens: 8192,
    response_format: { type: 'json_object' },
    messages: [
      {
        role: 'system',
        content: buildSystemPrompt(),
      },
      {
        role: 'user',
        content: buildUserPrompt(property, scenarioType),
      },
    ],
  });

  const choice = response.choices[0];
  if (!choice?.message?.content) {
    throw new Error('OpenAI agent returned no content');
  }

  const raw = parseJsonFromText(choice.message.content);
  const output = validateAgentOutput(raw);

  const usage: AgentUsage = {
    inputTokens: response.usage?.prompt_tokens ?? 0,
    outputTokens: response.usage?.completion_tokens ?? 0,
  };

  return { output, usage };
}

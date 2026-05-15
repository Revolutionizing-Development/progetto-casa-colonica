import { GoogleGenerativeAI } from '@google/generative-ai';
import {
  buildSystemPrompt,
  buildUserPrompt,
  parseJsonFromText,
  validateAgentOutput,
} from './base-agent';
import type { PropertyInput, ScenarioType, AgentOutput, AgentUsage } from '../types';

export interface GeminiAgentResult {
  output: AgentOutput;
  usage: AgentUsage;
}

export async function runGeminiAgent(
  client: GoogleGenerativeAI,
  property: PropertyInput,
  scenarioType: ScenarioType,
): Promise<GeminiAgentResult> {
  const model = client.getGenerativeModel({
    model: 'gemini-2.0-flash',
    systemInstruction: buildSystemPrompt(),
    generationConfig: {
      responseMimeType: 'application/json',
      maxOutputTokens: 8192,
    },
  });

  const result = await model.generateContent(buildUserPrompt(property, scenarioType));
  const response = result.response;

  const text = response.text();
  if (!text) {
    throw new Error('Gemini agent returned no text content');
  }

  const raw = parseJsonFromText(text);
  const output = validateAgentOutput(raw);

  // Gemini returns token counts in usageMetadata
  const meta = response.usageMetadata;
  const usage: AgentUsage = {
    inputTokens: meta?.promptTokenCount ?? 0,
    outputTokens: meta?.candidatesTokenCount ?? 0,
  };

  return { output, usage };
}

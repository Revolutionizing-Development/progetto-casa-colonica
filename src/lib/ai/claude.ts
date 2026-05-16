import Anthropic from '@anthropic-ai/sdk';

let _client: Anthropic | null = null;

export function getAnthropicClient(): Anthropic {
  if (!_client) {
    if (!process.env.ANTHROPIC_API_KEY) {
      throw new Error('ANTHROPIC_API_KEY is not set');
    }
    _client = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
      timeout: 180_000, // 3 min — analysis with large tool schema can take 60-90s
      maxRetries: 0,
    });
  }
  return _client;
}

export const ANALYSIS_MODEL = 'claude-sonnet-4-6';

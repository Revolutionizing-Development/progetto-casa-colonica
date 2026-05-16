import { NextResponse } from 'next/server';
import { getAnthropicClient } from '@/lib/ai/claude';

export const maxDuration = 30;

export async function GET() {
  const client = getAnthropicClient();

  // List available models
  let modelIds: string[] = [];
  try {
    const list = await client.models.list();
    modelIds = list.data.map((m: { id: string }) => m.id);
  } catch (err) {
    modelIds = [`list failed: ${(err as Error).message}`];
  }

  // Test the sonnet model specifically
  let sonnetResult: Record<string, unknown> = {};
  try {
    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 10,
      messages: [{ role: 'user', content: 'Reply with just: ok' }],
    });
    const text = response.content[0].type === 'text' ? response.content[0].text : '?';
    sonnetResult = { ok: true, reply: text };
  } catch (err) {
    const e = err as Error & { status?: number };
    sonnetResult = { ok: false, error: e.message, name: e.name, status: e.status };
  }

  return NextResponse.json({ availableModels: modelIds, sonnetTest: sonnetResult });
}

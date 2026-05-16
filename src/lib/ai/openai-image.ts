import OpenAI, { toFile } from 'openai';

let _client: OpenAI | null = null;

export function getOpenAIClient(): OpenAI {
  if (!_client) {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY is not set');
    }
    _client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
      timeout: 300_000,
      maxRetries: 2,
    });
  }
  return _client;
}

export const IMAGE_MODEL = 'gpt-image-1' as const;
export const IMAGE_SIZE = '1536x1024' as const;
export const IMAGE_QUALITY = 'high' as const;

export async function fetchImageForEdit(url: string): Promise<File> {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Failed to fetch source image: ${response.status}`);
  const buffer = Buffer.from(await response.arrayBuffer());
  return toFile(buffer, 'source.png', { type: 'image/png' });
}

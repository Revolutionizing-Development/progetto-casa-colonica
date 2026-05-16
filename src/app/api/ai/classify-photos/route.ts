import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getAnthropicClient, ANALYSIS_MODEL } from '@/lib/ai/claude';
import type Anthropic from '@anthropic-ai/sdk';
import type { PhotoCategory } from '@/types/photo';

type ImageMediaType = 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp';

function toMediaType(mime: string): ImageMediaType {
  const map: Record<string, ImageMediaType> = {
    'image/jpeg': 'image/jpeg',
    'image/jpg': 'image/jpeg',
    'image/png': 'image/png',
    'image/webp': 'image/webp',
    'image/gif': 'image/gif',
  };
  return map[mime] ?? 'image/jpeg';
}

export const maxDuration = 120;

const CLASSIFY_TOOL = {
  name: 'classify_photos',
  description: 'Classify property photos by what they show',
  input_schema: {
    type: 'object' as const,
    properties: {
      classifications: {
        type: 'array' as const,
        items: {
          type: 'object' as const,
          properties: {
            index: { type: 'number' as const, description: 'Zero-based index of the image in the order provided' },
            category: {
              type: 'string' as const,
              enum: [
                'aerial', 'exterior_front', 'exterior_rear', 'courtyard',
                'interior_living', 'interior_kitchen', 'interior_bedroom', 'interior_bathroom',
                'land', 'outbuilding', 'roof', 'detail',
              ],
              description: 'The category that best describes what this photo shows',
            },
            confidence: {
              type: 'string' as const,
              enum: ['high', 'medium', 'low'],
            },
          },
          required: ['index', 'category', 'confidence'],
        },
      },
    },
    required: ['classifications'],
  },
};

export interface ClassifyResult {
  index: number;
  category: PhotoCategory;
  confidence: 'high' | 'medium' | 'low';
}

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const formData = await req.formData();
    const files = formData.getAll('photos') as File[];

    if (files.length === 0) {
      return NextResponse.json({ error: 'No photos provided' }, { status: 400 });
    }

    if (files.length > 30) {
      return NextResponse.json({ error: 'Maximum 30 photos per batch' }, { status: 400 });
    }

    const imageBlocks: Anthropic.ImageBlockParam[] = [];

    for (const file of files) {
      const buffer = Buffer.from(await file.arrayBuffer());
      imageBlocks.push({
        type: 'image',
        source: {
          type: 'base64',
          media_type: toMediaType(file.type),
          data: buffer.toString('base64'),
        },
      });
    }

    const content: Anthropic.ContentBlockParam[] = [];

    content.push({
      type: 'text',
      text: `You are classifying ${files.length} photos of an Italian rural farmhouse property listing. For each photo, determine what it shows.\n\nCategories:\n- aerial: drone or satellite view looking down at the property\n- exterior_front: front facade of the main building\n- exterior_rear: rear/back of the main building\n- courtyard: internal courtyard or patio area\n- interior_living: living room, sitting room, main hall\n- interior_kitchen: kitchen\n- interior_bedroom: bedroom\n- interior_bathroom: bathroom\n- land: surrounding land, fields, garden overview, olive grove, vineyard\n- outbuilding: barn, annex, stable, fienile, dependance\n- roof: roof close-up or damage view\n- detail: architectural detail, door, window, fireplace, staircase, floor, ceiling\n\nIf a photo shows the building from outside, prefer exterior_front (if you see the entrance/main facade) or exterior_rear (if it's the back/garden side). If unsure which side, use exterior_front.\n\nThe photos follow in order (index 0 through ${files.length - 1}):`,
    });

    for (const block of imageBlocks) {
      content.push(block);
    }

    const client = getAnthropicClient();
    const response = await client.messages.create({
      model: ANALYSIS_MODEL,
      max_tokens: 2000,
      tools: [CLASSIFY_TOOL],
      tool_choice: { type: 'tool', name: 'classify_photos' },
      messages: [{ role: 'user', content }],
    });

    const toolBlock = response.content.find((b) => b.type === 'tool_use');
    if (!toolBlock || toolBlock.type !== 'tool_use') {
      return NextResponse.json({ error: 'AI could not classify the photos' }, { status: 500 });
    }

    const result = toolBlock.input as { classifications: ClassifyResult[] };
    return NextResponse.json({ classifications: result.classifications });
  } catch (err) {
    const msg = (err as Error).message;
    console.error('[classify-photos] error:', msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

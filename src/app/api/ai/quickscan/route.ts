import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createAdminClient } from '@/lib/supabase/server';
import { getAnthropicClient, QUICKSCAN_MODEL } from '@/lib/ai/claude';
import {
  buildQuickScanPrompt,
  QUICKSCAN_TOOL_SCHEMA,
  type QuickScanResult,
} from '@/lib/ai/prompts/quickscan';
import type { PropertyRow } from '@/app/actions/properties';
import type { ProjectType } from '@/types/project';
import type Anthropic from '@anthropic-ai/sdk';

export const maxDuration = 60; // QuickScan should complete in <15s

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    let body: { propertyId?: string };
    try { body = await req.json(); } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const { propertyId } = body;
    if (!propertyId) return NextResponse.json({ error: 'propertyId is required' }, { status: 400 });

    const supabase = createAdminClient();

    // Verify ownership
    const { data: property, error: propErr } = await supabase
      .from('properties').select('*').eq('id', propertyId).eq('user_id', userId).single();
    if (propErr || !property) return NextResponse.json({ error: 'Property not found' }, { status: 404 });

    const prop = property as PropertyRow;

    // Load project type
    const { data: project } = await supabase
      .from('projects').select('project_type').eq('id', prop.project_id).single();
    const projectType: ProjectType = (project?.project_type as ProjectType) ?? 'farmstead_hosting';

    // Build prompt and call Haiku
    const prompt = buildQuickScanPrompt(prop, projectType);
    const anthropic = getAnthropicClient();

    let toolInput: Record<string, unknown>;

    try {
      const response = await anthropic.messages.create({
        model: QUICKSCAN_MODEL,
        max_tokens: 1024,
        tools: [QUICKSCAN_TOOL_SCHEMA as Anthropic.Tool],
        tool_choice: { type: 'tool', name: 'quickscan_property' },
        messages: [{ role: 'user', content: prompt }],
      });

      console.log(
        '[ai/quickscan] model:', QUICKSCAN_MODEL,
        'stop_reason:', response.stop_reason,
        'tokens:', response.usage.input_tokens, '/', response.usage.output_tokens,
      );

      const toolBlock = response.content.find((b) => b.type === 'tool_use');
      if (!toolBlock || toolBlock.type !== 'tool_use')
        return NextResponse.json({ error: 'AI did not return tool output' }, { status: 500 });

      toolInput = toolBlock.input as Record<string, unknown>;
    } catch (err) {
      return NextResponse.json({ error: `QuickScan failed: ${(err as Error).message}` }, { status: 500 });
    }

    // Build result with timestamp
    const quickscan: QuickScanResult = {
      verdict: toolInput.verdict as QuickScanResult['verdict'],
      verdict_reason: toolInput.verdict_reason as string,
      observations: toolInput.observations as string[],
      renovation_tier: toolInput.renovation_tier as QuickScanResult['renovation_tier'],
      price_assessment: toolInput.price_assessment as QuickScanResult['price_assessment'],
      deal_breakers: toolInput.deal_breakers as string[],
      recommended_next: toolInput.recommended_next as QuickScanResult['recommended_next'],
      scanned_at: new Date().toISOString(),
    };

    // Save to property
    const { error: saveErr } = await supabase
      .from('properties')
      .update({ quickscan })
      .eq('id', propertyId)
      .eq('user_id', userId);

    if (saveErr) return NextResponse.json({ error: saveErr.message }, { status: 500 });

    return NextResponse.json({ quickscan });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[ai/quickscan] Unhandled error:', msg);
    return NextResponse.json({ error: `QuickScan failed: ${msg}` }, { status: 500 });
  }
}

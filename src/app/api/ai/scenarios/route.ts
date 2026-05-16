import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createAdminClient } from '@/lib/supabase/server';
import { getAnthropicClient, ANALYSIS_MODEL } from '@/lib/ai/claude';
import { buildScenariosPrompt, SCENARIO_TOOL_SCHEMA } from '@/lib/ai/prompts/generate-scenarios';
import type Anthropic from '@anthropic-ai/sdk';
import type { PropertyRow } from '@/app/actions/properties';
import type { AIAnalysisRow } from '@/app/actions/ai';
import type { RenovationScenario } from '@/types/renovation';
import type { ProjectType } from '@/types/project';

export const maxDuration = 300;

async function generateOneScenario(
  anthropic: ReturnType<typeof getAnthropicClient>,
  property: PropertyRow,
  analysis: AIAnalysisRow | null,
  scenarioType: 'basic' | 'lifestyle',
  projectType: ProjectType = 'farmstead_hosting',
): Promise<Record<string, unknown>> {
  const prompt = buildScenariosPrompt(property, analysis, scenarioType, projectType);

  const stream = anthropic.messages.stream({
    model: ANALYSIS_MODEL,
    max_tokens: 8192,
    tools: [SCENARIO_TOOL_SCHEMA as Anthropic.Tool],
    tool_choice: { type: 'tool', name: 'generate_renovation_scenario' },
    messages: [{ role: 'user', content: prompt }],
  });

  const response = await stream.finalMessage();
  const { stop_reason, usage } = response;
  console.log(`[ai/scenarios/${scenarioType}] stop_reason:${stop_reason} tokens:${usage.input_tokens}/${usage.output_tokens}`);

  if (stop_reason === 'max_tokens') {
    throw new Error(`Token limit hit generating ${scenarioType} scenario — output truncated`);
  }

  const toolBlock = response.content.find((b) => b.type === 'tool_use');
  if (!toolBlock || toolBlock.type !== 'tool_use') {
    throw new Error(`Claude did not return tool output for ${scenarioType} scenario`);
  }

  return toolBlock.input as Record<string, unknown>;
}

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

    const { data: property, error: propError } = await supabase
      .from('properties').select('*').eq('id', propertyId).eq('user_id', userId).single();

    if (propError || !property) {
      return NextResponse.json({ error: 'Property not found' }, { status: 404 });
    }

    const { data: analysis } = await supabase
      .from('ai_analyses').select('*').eq('property_id', propertyId)
      .order('created_at', { ascending: false }).limit(1).maybeSingle();

    const typedProperty = property as PropertyRow;
    const typedAnalysis = analysis as AIAnalysisRow | null;
    const anthropic = getAnthropicClient();

    // Load project type
    const { data: proj } = await supabase
      .from('projects').select('project_type').eq('id', typedProperty.project_id).single();
    const projectType: ProjectType = (proj?.project_type as ProjectType) ?? 'farmstead_hosting';

    // Generate Basic and Lifestyle sequentially — each call ~4096 tokens max
    let basicInput: Record<string, unknown>;
    let lifestyleInput: Record<string, unknown>;

    try {
      basicInput = await generateOneScenario(anthropic, typedProperty, typedAnalysis, 'basic', projectType);
    } catch (err) {
      return NextResponse.json({ error: `Basic scenario: ${(err as Error).message}` }, { status: 500 });
    }

    try {
      lifestyleInput = await generateOneScenario(anthropic, typedProperty, typedAnalysis, 'lifestyle', projectType);
    } catch (err) {
      return NextResponse.json({ error: `Lifestyle scenario: ${(err as Error).message}` }, { status: 500 });
    }

    const inserted: RenovationScenario[] = [];

    for (const s of [basicInput, lifestyleInput]) {
      const scenarioType = s.type as string;

      // Determine next version for this property+type
      const { data: latestVersion } = await supabase
        .from('renovation_scenarios')
        .select('version')
        .eq('property_id', propertyId)
        .eq('type', scenarioType)
        .eq('generated_by_ai', true)
        .order('version', { ascending: false })
        .limit(1)
        .maybeSingle();

      const nextVersion = (latestVersion?.version ?? 0) + 1;

      // Deactivate previous versions of this type
      await supabase
        .from('renovation_scenarios')
        .update({ is_active: false })
        .eq('property_id', propertyId)
        .eq('type', scenarioType)
        .eq('generated_by_ai', true);

      const { data: saved, error: saveError } = await supabase
        .from('renovation_scenarios')
        .insert({
          property_id: propertyId,
          user_id: userId,
          type: s.type,
          name: s.name,
          name_it: s.name_it,
          phases: s.phases ?? [],
          farm_features: s.farm_features ?? [],
          outbuilding_conversions: s.outbuilding_conversions ?? [],
          renovation_total_min: s.renovation_total_min,
          renovation_total_max: s.renovation_total_max,
          renovation_duration_months: s.renovation_duration_months,
          contingency_pct: s.contingency_pct ?? 0.20,
          contingency_amount: s.contingency_amount ?? 0,
          guest_separation_included: s.guest_separation_included ?? false,
          confidence_level: 'estimated',
          generated_by_ai: true,
          version: nextVersion,
          is_active: true,
        })
        .select().single();

      if (saveError) {
        console.error('[ai/scenarios] DB error:', saveError.message);
        return NextResponse.json({ error: saveError.message }, { status: 500 });
      }

      inserted.push(saved as RenovationScenario);
    }

    console.log('[ai/scenarios] saved', inserted.length, 'scenarios');
    return NextResponse.json({ scenarios: inserted });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[ai/scenarios] Unhandled error:', msg);
    return NextResponse.json({ error: `Scenario generation failed: ${msg}` }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createAdminClient } from '@/lib/supabase/server';
import { getAnthropicClient, ANALYSIS_MODEL } from '@/lib/ai/claude';
import { buildScoringPrompt, buildScoreToolSchema } from '@/lib/ai/prompts/score-property';
import { weightKeysForType, scoringDefaultsForType } from '@/lib/scoring-criteria';
import type { ProjectType } from '@/types/project';
import type { PropertyRow } from '@/app/actions/properties';
import type { AIAnalysisRow, RegulatoryAssessmentRow } from '@/app/actions/ai';
import type { RenovationScenario } from '@/types/renovation';
import type Anthropic from '@anthropic-ai/sdk';

export const maxDuration = 120;

function computeOverallRating(
  score: number,
  hasRedFlag: boolean,
): 'strong_candidate' | 'promising' | 'marginal' | 'not_recommended' {
  let tier: 'strong_candidate' | 'promising' | 'marginal' | 'not_recommended';
  if (score >= 75) tier = 'strong_candidate';
  else if (score >= 55) tier = 'promising';
  else if (score >= 35) tier = 'marginal';
  else tier = 'not_recommended';

  if (!hasRedFlag) return tier;
  // Downgrade by one tier for red flag
  const tiers: Array<typeof tier> = ['strong_candidate', 'promising', 'marginal', 'not_recommended'];
  const idx = tiers.indexOf(tier);
  return tiers[Math.min(idx + 1, 3)];
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

    // Load property (verifies ownership)
    const { data: property, error: propErr } = await supabase
      .from('properties').select('*').eq('id', propertyId).eq('user_id', userId).single();
    if (propErr || !property) return NextResponse.json({ error: 'Property not found' }, { status: 404 });

    const prop = property as PropertyRow;

    // Load project type
    const { data: project } = await supabase
      .from('projects').select('project_type').eq('id', prop.project_id).single();
    const projectType: ProjectType = (project?.project_type as ProjectType) ?? 'farmstead_hosting';
    const activeWeightKeys = weightKeysForType(projectType);
    const activeDefaults = scoringDefaultsForType(projectType);

    // Load supporting data in parallel
    const [analysisRes, regulatoryRes, scenariosRes, weightsRes] = await Promise.all([
      supabase.from('ai_analyses').select('*').eq('property_id', propertyId)
        .order('created_at', { ascending: false }).limit(1).maybeSingle(),
      supabase.from('regulatory_assessments').select('*').eq('property_id', propertyId)
        .order('created_at', { ascending: false }).limit(1).maybeSingle(),
      supabase.from('renovation_scenarios').select('*').eq('property_id', propertyId),
      supabase.from('scoring_weights').select('*').eq('project_id', prop.project_id)
        .eq('user_id', userId).maybeSingle(),
    ]);

    const analysis = analysisRes.data as AIAnalysisRow | null;
    const regulatory = regulatoryRes.data as RegulatoryAssessmentRow | null;
    const scenarios = (scenariosRes.data ?? []) as RenovationScenario[];

    // Build weight map — fall back to defaults if no weights saved
    const weightsRow = weightsRes.data;
    const weights = Object.fromEntries(
      activeWeightKeys.map((k) => [k, weightsRow ? (weightsRow as Record<string, number>)[k] : activeDefaults[k]]),
    ) as Record<string, number>;

    const prompt = buildScoringPrompt(prop, analysis, regulatory, scenarios, weights, projectType, activeWeightKeys);
    const scoreToolSchema = buildScoreToolSchema(activeWeightKeys);
    const anthropic = getAnthropicClient();

    let toolInput: Record<string, unknown>;
    try {
      const stream = anthropic.messages.stream({
        model: ANALYSIS_MODEL,
        max_tokens: 4096,
        tools: [scoreToolSchema as Anthropic.Tool],
        tool_choice: { type: 'tool', name: 'score_property' },
        messages: [{ role: 'user', content: prompt }],
      });
      const response = await stream.finalMessage();
      console.log('[ai/score] stop_reason:', response.stop_reason, 'tokens:', response.usage.input_tokens, '/', response.usage.output_tokens);
      const toolBlock = response.content.find((b) => b.type === 'tool_use');
      if (!toolBlock || toolBlock.type !== 'tool_use')
        return NextResponse.json({ error: 'Claude did not return tool output' }, { status: 500 });
      toolInput = toolBlock.input as Record<string, unknown>;
    } catch (err) {
      const errObj = err as Error;
      return NextResponse.json({ error: `Scoring failed: ${errObj.message}` }, { status: 500 });
    }

    const rawScores = toolInput.scores as Record<string, { raw_score: number; notes: string }>;
    if (!rawScores) return NextResponse.json({ error: 'Malformed AI response' }, { status: 500 });

    const hasRedFlag = regulatory?.overall_risk === 'red';

    // Build CriterionScore objects and compute total
    let totalWeighted = 0;
    const scores: Record<string, unknown> = {};
    for (const k of activeWeightKeys) {
      const s = rawScores[k];
      if (!s) continue;
      const weight = weights[k];
      const raw = Math.min(10, Math.max(0, s.raw_score));
      const weighted = raw * weight;
      totalWeighted += weighted;
      scores[k] = {
        criterion: k,
        weight,
        raw_score: raw,
        weighted_score: weighted,
        confidence_level: analysis ? 'estimated' : 'estimated',
        notes: s.notes,
      };
    }

    // total_weighted_score: convert 0–10 to 0–100
    const totalScore = Math.round(totalWeighted * 10);
    const overallRating = computeOverallRating(totalScore, hasRedFlag);

    // Replace existing scoring result
    await supabase.from('scoring_results').delete()
      .eq('property_id', propertyId).eq('user_id', userId);

    const { data: saved, error: saveErr } = await supabase
      .from('scoring_results')
      .insert({
        property_id: propertyId,
        project_id: prop.project_id,
        user_id: userId,
        scores,
        total_weighted_score: totalScore,
        overall_rating: overallRating,
        red_flag_override: hasRedFlag,
        red_flag_reason: hasRedFlag ? 'One or more regulatory categories flagged red' : null,
      })
      .select().single();

    if (saveErr) return NextResponse.json({ error: saveErr.message }, { status: 500 });

    return NextResponse.json({ scoring: saved });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[ai/score] Unhandled error:', msg);
    return NextResponse.json({ error: `Scoring failed: ${msg}` }, { status: 500 });
  }
}

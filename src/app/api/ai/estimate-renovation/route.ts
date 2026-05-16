import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createAdminClient } from '@/lib/supabase/server';
import { getAnthropicClient } from '@/lib/ai/claude';
import { getOpenAIClient } from '@/lib/ai/openai-image';
import { getGeminiClient } from '@/lib/ai/gemini';
import { MultiAgentEstimator } from '@/lib/ai/multi-agent';
import { mapPropertyToInput } from '@/lib/ai/property-mapper';
import type { PropertyRow } from '@/app/actions/properties';
import type { ScenarioType, ConsensusOutput } from '@/lib/ai/multi-agent';

export const maxDuration = 300;

const VALID_TYPES: ScenarioType[] = ['basic', 'lifestyle'];

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    let body: { propertyId?: string; scenarioType?: string };
    try { body = await req.json(); } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const { propertyId, scenarioType } = body;
    if (!propertyId) return NextResponse.json({ error: 'propertyId is required' }, { status: 400 });
    if (!scenarioType || !VALID_TYPES.includes(scenarioType as ScenarioType)) {
      return NextResponse.json({ error: `scenarioType must be one of: ${VALID_TYPES.join(', ')}` }, { status: 400 });
    }

    const supabase = createAdminClient();

    // Verify ownership
    const { data: property, error: propError } = await supabase
      .from('properties').select('*').eq('id', propertyId).eq('user_id', userId).single();

    if (propError || !property) {
      return NextResponse.json({ error: 'Property not found' }, { status: 404 });
    }

    const typedProperty = property as PropertyRow;

    // Load photos for the property
    const { data: photos } = await supabase
      .from('property_photos')
      .select('id, property_id, url, category')
      .eq('property_id', propertyId);

    // Map DB row to PropertyInput
    const propertyInput = mapPropertyToInput(typedProperty, photos ?? []);
    const type = scenarioType as ScenarioType;

    console.log(`[ai/estimate-renovation] starting multi-agent estimation for ${propertyId} (${type})`);

    // Create estimator with all three AI clients
    const estimator = new MultiAgentEstimator({
      anthropic: getAnthropicClient(),
      openai: getOpenAIClient(),
      google: getGeminiClient(),
    });

    const { result, usage, allItemComparisons } = await estimator.estimate(propertyInput, type);

    console.log(`[ai/estimate-renovation] estimation complete. Confidence: ${result.divergenceReport.overallConfidenceScore}/100. Tokens: ${usage.total.inputTokens}/${usage.total.outputTokens}`);

    // Determine next version number for this property+type
    const { data: latestVersion } = await supabase
      .from('renovation_scenarios')
      .select('version')
      .eq('property_id', propertyId)
      .eq('type', type)
      .eq('generated_by_ai', true)
      .order('version', { ascending: false })
      .limit(1)
      .maybeSingle();

    const nextVersion = (latestVersion?.version ?? 0) + 1;

    // Deactivate previous versions
    await supabase
      .from('renovation_scenarios')
      .update({ is_active: false })
      .eq('property_id', propertyId)
      .eq('type', type)
      .eq('generated_by_ai', true);

    // Map consensus output to DB schema and insert as new active version
    const scenario = mapConsensusToDbRow(result, typedProperty, userId, type);

    const { data: saved, error: saveError } = await supabase
      .from('renovation_scenarios')
      .insert({ ...scenario, version: nextVersion, is_active: true })
      .select()
      .single();

    if (saveError) {
      console.error('[ai/estimate-renovation] DB save error:', saveError.message);
      return NextResponse.json({ error: saveError.message }, { status: 500 });
    }

    console.log(`[ai/estimate-renovation] saved scenario ${saved.id}`);

    return NextResponse.json({
      scenario: saved,
      divergenceReport: result.divergenceReport,
      aiAnalysis: result.aiAnalysis,
      allItemComparisons: allItemComparisons ?? [],
      usage: {
        claude: usage.claude,
        openai: usage.openai,
        gemini: usage.gemini,
        synthesis: usage.synthesis,
        total: usage.total,
      },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[ai/estimate-renovation] error:', msg);
    return NextResponse.json({ error: `Multi-agent estimation failed: ${msg}` }, { status: 500 });
  }
}

function mapConsensusToDbRow(
  consensus: ConsensusOutput,
  property: PropertyRow,
  userId: string,
  scenarioType: ScenarioType,
) {
  const s = consensus.renovationScenario;
  const nameMap: Record<ScenarioType, { en: string; it: string }> = {
    basic: { en: 'Basic Renovation (Multi-Agent)', it: 'Ristrutturazione Base (Multi-Agente)' },
    lifestyle: { en: 'Lifestyle Renovation (Multi-Agent)', it: 'Ristrutturazione Lifestyle (Multi-Agente)' },
    high_end: { en: 'High-End Renovation (Multi-Agent)', it: 'Ristrutturazione Premium (Multi-Agente)' },
    custom: { en: 'Custom Renovation (Multi-Agent)', it: 'Ristrutturazione Personalizzata (Multi-Agente)' },
  };

  // Map multi-agent phases to app's phase format
  const phases = s.phases.map((p, idx) => ({
    phase_number: p.phaseNumber,
    name: p.name,
    name_it: p.name,
    description: `${p.name} — estimated ${p.estimatedMonths}`,
    duration_months: parseMonths(p.estimatedMonths),
    start_month: idx === 0 ? 0 : s.phases.slice(0, idx).reduce((sum, prev) => sum + parseMonths(prev.estimatedMonths), 0),
    line_items: p.lineItems.map((li) => ({
      key: li.key,
      description: li.description,
      phase_number: p.phaseNumber,
      is_regulated: !li.diyEligible,
      diy_level: li.diyEligible ? 'partial' as const : 'none' as const,
      contractor_cost_min: li.totalCost.low,
      contractor_cost_max: li.totalCost.high,
      diy_cost_min: li.diyEligible ? li.materialsCost.low : li.totalCost.low,
      diy_cost_max: li.diyEligible ? li.materialsCost.high : li.totalCost.high,
      contingency_pct: s.contingencyPercent / 100,
      confidence_level: mapConfidence(li.confidenceLevel),
      notes: li.divergenceNote ?? undefined,
    })),
    total_min: p.totalCost.low,
    total_max: p.totalCost.high,
    is_energy_work: p.lineItems.some((li) => li.category === 'energy'),
    enea_required: p.lineItems.some((li) => li.category === 'energy'),
  }));

  // Map farm features
  const farmFeatures = s.farmFeatures.map((f) => ({
    type: f.type,
    enabled: f.included,
    setup_cost_min: f.setupCost.low,
    setup_cost_max: f.setupCost.high,
    annual_operating_cost_min: f.annualOngoingCost.low,
    annual_operating_cost_max: f.annualOngoingCost.high,
    notes: f.description,
  }));

  const totalDuration = phases.reduce((sum, p) => sum + p.duration_months, 0);

  return {
    property_id: property.id,
    user_id: userId,
    type: scenarioType,
    name: nameMap[scenarioType].en,
    name_it: nameMap[scenarioType].it,
    phases,
    farm_features: farmFeatures,
    outbuilding_conversions: [],
    renovation_total_min: s.totalRenovationCost.low,
    renovation_total_max: s.totalRenovationCost.high,
    renovation_duration_months: totalDuration,
    contingency_pct: s.contingencyPercent / 100,
    contingency_amount: s.contingencyAmount.low,
    guest_separation_included: consensus.aiAnalysis.guestSeparationFeasibility.feasible,
    confidence_level: 'estimated' as const,
    generated_by_ai: true,
    divergence_report: consensus.divergenceReport,
    confidence_score: consensus.divergenceReport.overallConfidenceScore,
  };
}

function parseMonths(s: string): number {
  const match = s.match(/(\d+)/);
  return match ? parseInt(match[1], 10) : 3;
}

function mapConfidence(level: 'high' | 'medium' | 'low'): string {
  return level === 'high' ? 'estimated_consensus' : 'estimated';
}

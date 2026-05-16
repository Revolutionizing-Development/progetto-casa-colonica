import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createAdminClient } from '@/lib/supabase/server';
import { getAnthropicClient, ANALYSIS_MODEL } from '@/lib/ai/claude';
import {
  buildAnalysisPrompt,
  computeContextualFacts,
  ANALYSIS_TOOL_SCHEMA,
} from '@/lib/ai/prompts/analyze-property';
import type { PropertyRow } from '@/app/actions/properties';
import type { ProjectType } from '@/types/project';

// Allow up to 5 minutes — Claude with a large tool schema takes 60-120s
export const maxDuration = 300;

export async function POST(req: NextRequest) {
  try {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let body: { propertyId?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { propertyId } = body;
  if (!propertyId) return NextResponse.json({ error: 'propertyId is required' }, { status: 400 });

  const supabase = createAdminClient();

  // Verify ownership
  const { data: property, error: propError } = await supabase
    .from('properties')
    .select('*')
    .eq('id', propertyId)
    .eq('user_id', userId)
    .single();

  if (propError || !property) {
    return NextResponse.json({ error: 'Property not found' }, { status: 404 });
  }

  const typedProperty = property as PropertyRow;

  // Load project type
  const { data: project } = await supabase
    .from('projects').select('project_type').eq('id', typedProperty.project_id).single();
  const projectType: ProjectType = (project?.project_type as ProjectType) ?? 'farmstead_hosting';

  // Build prompt and call Claude
  const prompt = buildAnalysisPrompt(typedProperty, projectType);
  console.log('[ai/analyze] prompt built, length:', prompt.length);
  const anthropic = getAnthropicClient();
  console.log('[ai/analyze] calling Claude model:', ANALYSIS_MODEL);

  let toolInput: Record<string, unknown>;
  let inputTokens = 0;
  let outputTokens = 0;

  try {
    // Use streaming so the TCP connection stays alive during the 60-90s generation.
    // Without streaming, an idle-looking connection gets reset by routers/firewalls.
    const stream = anthropic.messages.stream({
      model: ANALYSIS_MODEL,
      max_tokens: 8192,
      tools: [ANALYSIS_TOOL_SCHEMA],
      tool_choice: { type: 'tool', name: 'analyze_italian_property' },
      messages: [{ role: 'user', content: prompt }],
    });

    const response = await stream.finalMessage();

    inputTokens = response.usage.input_tokens;
    outputTokens = response.usage.output_tokens;
    console.log('[ai/analyze] stop_reason:', response.stop_reason, 'tokens in/out:', inputTokens, outputTokens);

    const toolBlock = response.content.find((b) => b.type === 'tool_use');
    if (!toolBlock || toolBlock.type !== 'tool_use') {
      console.error('[ai/analyze] no tool_use block, content types:', response.content.map((b) => b.type));
      return NextResponse.json({ error: 'Claude did not return tool output' }, { status: 500 });
    }

    toolInput = toolBlock.input as Record<string, unknown>;
    console.log('[ai/analyze] tool input keys:', Object.keys(toolInput));
    console.log('[ai/analyze] raw tool input (first 500):', JSON.stringify(toolInput).slice(0, 500));
  } catch (err) {
    const errObj = err as Error & { status?: number; error?: unknown };
    console.error('[ai/analyze] Claude API error:', {
      name: errObj.name,
      message: errObj.message,
      status: errObj.status,
      cause: errObj.cause,
    });
    return NextResponse.json(
      { error: `AI analysis failed: ${errObj.message}`, detail: errObj.name },
      { status: 500 },
    );
  }

  const analysisInput = toolInput.analysis as Record<string, unknown>;
  const regulatoryInput = toolInput.regulatory as Record<string, unknown>;

  if (!analysisInput || !regulatoryInput) {
    return NextResponse.json({ error: 'Malformed AI response' }, { status: 500 });
  }

  // Pre-computed facts (authoritative)
  const { seismicZone, wildBoarRisk, boarFencingCostEstimate, landAlerts } =
    computeContextualFacts(typedProperty);

  console.log('[ai/analyze] tool input keys:', Object.keys(toolInput));
  // Delete existing rows before inserting fresh ones (re-analysis support)
  await supabase.from('ai_analyses').delete().eq('property_id', propertyId);
  await supabase.from('regulatory_assessments').delete().eq('property_id', propertyId);
  console.log('[ai/analyze] old rows deleted, inserting fresh analysis...');

  // Save AI analysis
  const { data: savedAnalysis, error: analysisError } = await supabase
    .from('ai_analyses')
    .insert({
      property_id: propertyId,
      user_id: userId,
      structural_condition_score: analysisInput.structural_condition_score,
      structural_notes: analysisInput.structural_notes,
      roof_condition: analysisInput.roof_condition,
      systems_condition: analysisInput.systems_condition,
      guest_separation_feasible: analysisInput.guest_separation_feasible,
      guest_separation_notes: analysisInput.guest_separation_notes,
      guest_separation_cost_min: analysisInput.guest_separation_cost_min ?? 0,
      guest_separation_cost_max: analysisInput.guest_separation_cost_max ?? 0,
      voltage_concerns: analysisInput.voltage_concerns ?? [],
      renovation_complexity: analysisInput.renovation_complexity,
      key_risks: analysisInput.key_risks ?? [],
      key_opportunities: analysisInput.key_opportunities ?? [],
      raw_response: JSON.stringify(toolInput),
      confidence_level: 'estimated',
    })
    .select()
    .single();

  if (analysisError) {
    console.error('[ai/analyze] DB error (ai_analyses):', analysisError.message, analysisError.details, analysisError.hint);
    return NextResponse.json({ error: analysisError.message }, { status: 500 });
  }
  console.log('[ai/analyze] ai_analyses saved, inserting regulatory...');

  // Save regulatory assessment (seismic_zone and wild boar from pre-computed facts)
  const { data: savedRegulatory, error: regulatoryError } = await supabase
    .from('regulatory_assessments')
    .insert({
      property_id: propertyId,
      user_id: userId,
      str_zoning: regulatoryInput.str_zoning,
      str_zoning_notes: regulatoryInput.str_zoning_notes,
      change_of_use: regulatoryInput.change_of_use,
      change_of_use_notes: regulatoryInput.change_of_use_notes,
      building_permits: regulatoryInput.building_permits,
      building_permits_notes: regulatoryInput.building_permits_notes,
      landscape_protection: regulatoryInput.landscape_protection,
      landscape_protection_notes: regulatoryInput.landscape_protection_notes,
      seismic_zone: seismicZone,
      seismic_risk: regulatoryInput.seismic_risk,
      animals_permitted: regulatoryInput.animals_permitted,
      animals_notes: regulatoryInput.animals_notes,
      septic_water: regulatoryInput.septic_water,
      septic_water_notes: regulatoryInput.septic_water_notes,
      fire_safety: regulatoryInput.fire_safety,
      fire_safety_notes: regulatoryInput.fire_safety_notes,
      business_classification: regulatoryInput.business_classification,
      business_classification_notes: regulatoryInput.business_classification_notes,
      tax_regime_risk: regulatoryInput.tax_regime_risk,
      tax_regime_notes: regulatoryInput.tax_regime_notes,
      overall_risk: regulatoryInput.overall_risk,
      agriturismo_eligible: regulatoryInput.agriturismo_eligible ?? false,
      agriturismo_path_notes: regulatoryInput.agriturismo_path_notes,
      land_threshold_alerts: landAlerts,
      wild_boar_risk: wildBoarRisk,
      boar_fencing_cost_estimate: boarFencingCostEstimate,
    })
    .select()
    .single();

  if (regulatoryError) {
    console.error('[ai/analyze] DB error (regulatory_assessments):', regulatoryError);
    return NextResponse.json({ error: regulatoryError.message }, { status: 500 });
  }

  // Advance pipeline stage to 'analyzing' if still at 'scouted'
  if (typedProperty.pipeline_stage === 'scouted') {
    await supabase
      .from('properties')
      .update({ pipeline_stage: 'analyzing' })
      .eq('id', propertyId)
      .eq('user_id', userId);
  }

  return NextResponse.json({
    analysis: savedAnalysis,
    regulatory: savedRegulatory,
    usage: { inputTokens, outputTokens },
  });

  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[ai/analyze] Unhandled error:', msg);
    return NextResponse.json({ error: `Analysis failed: ${msg}` }, { status: 500 });
  }
}

'use server';

import { withAccess } from '@/lib/access';
import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { STAGE_ORDER } from '@/lib/pipeline-stages';
import type { PipelineStage, PipelineEvent } from '@/lib/pipeline-stages';
export type { PipelineStage, PipelineEvent } from '@/lib/pipeline-stages';

export async function advancePipelineStage(
  propertyId: string,
  overrideReason?: string,
): Promise<{ success: boolean; error?: string; newStage?: string }> {
  const uid = await withAccess('property:advance-pipeline');
  const supabase = createClient();

  const { data: property } = await supabase
    .from('properties')
    .select('id, pipeline_stage')
    .eq('id', propertyId)
    .eq('user_id', uid)
    .single();

  if (!property) return { success: false, error: 'Property not found' };

  const currentIndex = STAGE_ORDER.indexOf(property.pipeline_stage as PipelineStage);
  if (currentIndex === -1) return { success: false, error: 'Unknown stage' };
  if (currentIndex >= STAGE_ORDER.length - 1) return { success: false, error: 'Already at final stage' };

  const fromStage = STAGE_ORDER[currentIndex];
  const toStage = STAGE_ORDER[currentIndex + 1];

  // scouted → analyzing is triggered only by running AI analysis
  if (fromStage === 'scouted') {
    return { success: false, error: 'Run AI analysis to advance from Scouted — the stage updates automatically.' };
  }

  // analyzing → shortlisted requires AI analysis to exist (overrideable)
  if (fromStage === 'analyzing' && !overrideReason) {
    const { data: analysis } = await supabase
      .from('ai_analyses')
      .select('id')
      .eq('property_id', propertyId)
      .limit(1)
      .maybeSingle();

    if (!analysis) {
      return { success: false, error: 'Complete AI analysis before shortlisting (or use override).' };
    }
  }

  await supabase
    .from('properties')
    .update({ pipeline_stage: toStage })
    .eq('id', propertyId)
    .eq('user_id', uid);

  await supabase.from('pipeline_events').insert({
    property_id: propertyId,
    user_id: uid,
    from_stage: fromStage,
    to_stage: toStage,
    triggered_by: 'user',
    gate_overridden: !!overrideReason,
    gate_override_reason: overrideReason || null,
  });

  revalidatePath('/', 'layout');
  return { success: true, newStage: toStage };
}

export async function retreatPipelineStage(
  propertyId: string,
  reason: string,
): Promise<{ success: boolean; error?: string; newStage?: string }> {
  if (!reason.trim()) return { success: false, error: 'Reason is required to go back a stage.' };

  const uid = await withAccess('property:advance-pipeline');
  const supabase = createClient();

  const { data: property } = await supabase
    .from('properties')
    .select('id, pipeline_stage')
    .eq('id', propertyId)
    .eq('user_id', uid)
    .single();

  if (!property) return { success: false, error: 'Property not found' };

  const currentIndex = STAGE_ORDER.indexOf(property.pipeline_stage as PipelineStage);
  if (currentIndex <= 0) return { success: false, error: 'Already at first stage' };

  const fromStage = STAGE_ORDER[currentIndex];
  const toStage = STAGE_ORDER[currentIndex - 1];

  await supabase
    .from('properties')
    .update({ pipeline_stage: toStage })
    .eq('id', propertyId)
    .eq('user_id', uid);

  await supabase.from('pipeline_events').insert({
    property_id: propertyId,
    user_id: uid,
    from_stage: fromStage,
    to_stage: toStage,
    triggered_by: 'user',
    gate_overridden: false,
    gate_override_reason: reason,
    notes: 'Stage retreated',
  });

  revalidatePath('/', 'layout');
  return { success: true, newStage: toStage };
}

export async function getPipelineHistory(propertyId: string): Promise<PipelineEvent[]> {
  await withAccess('property:read');
  const supabase = createClient();

  const { data } = await supabase
    .from('pipeline_events')
    .select('*')
    .eq('property_id', propertyId)
    .order('created_at', { ascending: false });

  return (data ?? []) as PipelineEvent[];
}

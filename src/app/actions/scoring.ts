'use server';

import { withAccess } from '@/lib/access';
import { createClient } from '@/lib/supabase/server';
import type { ScoringResult } from '@/types/scoring';

export async function getScoring(
  propertyId: string,
  projectId: string,
): Promise<ScoringResult | null> {
  await withAccess('property:read');
  const supabase = createClient();

  const { data } = await supabase
    .from('scoring_results')
    .select('*')
    .eq('property_id', propertyId)
    .eq('project_id', projectId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  return data as ScoringResult | null;
}

export async function getScoringsByProject(
  projectId: string,
): Promise<ScoringResult[]> {
  await withAccess('project:read');
  const supabase = createClient();

  const { data } = await supabase
    .from('scoring_results')
    .select('*')
    .eq('project_id', projectId)
    .order('total_weighted_score', { ascending: false });

  return (data ?? []) as ScoringResult[];
}

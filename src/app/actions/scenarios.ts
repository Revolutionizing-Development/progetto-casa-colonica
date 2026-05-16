'use server';

import { withAccess } from '@/lib/access';
import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import type { RenovationScenario } from '@/types/renovation';
import type { ScopeToggles, PhaseAssignments, DIYToggles } from '@/types/cost-config';

export async function getScenarios(propertyId: string): Promise<RenovationScenario[]> {
  await withAccess('property:read');
  const supabase = createClient();

  const { data } = await supabase
    .from('renovation_scenarios')
    .select('*')
    .eq('property_id', propertyId)
    .eq('is_active', true)
    .order('type', { ascending: true });

  return (data ?? []) as RenovationScenario[];
}

export async function getScenarioHistory(
  propertyId: string,
  scenarioType: string,
): Promise<RenovationScenario[]> {
  await withAccess('property:read');
  const supabase = createClient();

  const { data } = await supabase
    .from('renovation_scenarios')
    .select('*')
    .eq('property_id', propertyId)
    .eq('type', scenarioType)
    .eq('generated_by_ai', true)
    .order('version', { ascending: false });

  return (data ?? []) as RenovationScenario[];
}

export async function deleteScenario(
  scenarioId: string,
): Promise<{ success: boolean; error?: string }> {
  const uid = await withAccess('property:update');
  const supabase = createClient();

  const { error } = await supabase
    .from('renovation_scenarios')
    .delete()
    .eq('id', scenarioId)
    .eq('user_id', uid);

  if (error) return { success: false, error: error.message };

  revalidatePath('/', 'layout');
  return { success: true };
}

export async function updateScopeToggles(
  scenarioId: string,
  scopeToggles: ScopeToggles,
): Promise<{ success: boolean; error?: string }> {
  const uid = await withAccess('property:update');
  const supabase = createClient();

  const { error } = await supabase
    .from('renovation_scenarios')
    .update({ scope_toggles: scopeToggles, updated_at: new Date().toISOString() })
    .eq('id', scenarioId)
    .eq('user_id', uid);

  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function updatePhaseAssignments(
  scenarioId: string,
  phaseAssignments: PhaseAssignments,
): Promise<{ success: boolean; error?: string }> {
  const uid = await withAccess('property:update');
  const supabase = createClient();

  const { error } = await supabase
    .from('renovation_scenarios')
    .update({ phase_assignments: phaseAssignments, updated_at: new Date().toISOString() })
    .eq('id', scenarioId)
    .eq('user_id', uid);

  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function getDIYProfile(
  projectId: string,
): Promise<DIYToggles> {
  const uid = await withAccess('property:read');
  const supabase = createClient();

  const { data } = await supabase
    .from('diy_profiles')
    .select('enabled_items')
    .eq('project_id', projectId)
    .eq('user_id', uid)
    .maybeSingle();

  return (data?.enabled_items ?? {}) as DIYToggles;
}

export async function updateDIYProfile(
  projectId: string,
  enabledItems: DIYToggles,
): Promise<{ success: boolean; error?: string }> {
  const uid = await withAccess('property:update');
  const supabase = createClient();

  const { error } = await supabase
    .from('diy_profiles')
    .upsert(
      {
        project_id: projectId,
        user_id: uid,
        enabled_items: enabledItems,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'project_id,user_id' },
    );

  if (error) return { success: false, error: error.message };
  return { success: true };
}

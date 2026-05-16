'use server';

import { withAccess } from '@/lib/access';
import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { WEIGHT_KEYS, HOMESTEAD_WEIGHT_KEYS } from '@/lib/scoring-criteria';
import type { WeightKey } from '@/lib/scoring-criteria';
import type { ProjectType } from '@/types/project';
export type { WeightKey } from '@/lib/scoring-criteria';

function buildWeightsSchema(keys: readonly string[]) {
  return z
    .object(
      Object.fromEntries(
        keys.map((k) => [k, z.coerce.number().min(0).max(100)]),
      ) as Record<string, z.ZodNumber>,
    )
    .refine(
      (data) => Math.abs(Object.values(data).reduce((a, b) => a + b, 0) - 100) < 0.1,
      { message: 'Weights must sum to exactly 100%' },
    );
}

export type ScoringWeightsRow = Record<WeightKey, number> & {
  id: string;
  project_id: string;
  user_id: string;
  created_at: string;
  updated_at: string;
};

export type ActionResult<T = true> =
  | { data: T; error?: never }
  | { data?: never; error: string };

export async function getScoringWeights(projectId: string): Promise<ScoringWeightsRow | null> {
  const uid = await withAccess('project:read');
  const supabase = createClient();

  const { data } = await supabase
    .from('scoring_weights')
    .select('*')
    .eq('project_id', projectId)
    .eq('user_id', uid)
    .single();

  return data as ScoringWeightsRow | null;
}

export async function upsertScoringWeights(
  projectId: string,
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const uid = await withAccess('project:update');

  const supabase = createClient();
  const { data: proj } = await supabase
    .from('projects').select('project_type').eq('id', projectId).eq('user_id', uid).single();
  const projectType: ProjectType = (proj?.project_type as ProjectType) ?? 'farmstead_hosting';
  const activeKeys = projectType === 'private_homestead' ? HOMESTEAD_WEIGHT_KEYS : WEIGHT_KEYS;
  const schema = buildWeightsSchema(activeKeys);

  const raw = Object.fromEntries(activeKeys.map((k) => [k, formData.get(k)]));
  const parsed = schema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  // Store as decimals (0.12) not percentages (12)
  const decimals = Object.fromEntries(
    Object.entries(parsed.data).map(([k, v]) => [k, v / 100]),
  ) as Record<string, number>;

  const { data: existing } = await supabase
    .from('scoring_weights')
    .select('id')
    .eq('project_id', projectId)
    .eq('user_id', uid)
    .single();

  const payload = { ...decimals, project_id: projectId, user_id: uid };

  const { error } = existing
    ? await supabase.from('scoring_weights').update(payload).eq('id', existing.id)
    : await supabase.from('scoring_weights').insert(payload);

  if (error) return { error: error.message };

  revalidatePath('/', 'layout');
  return { data: true };
}

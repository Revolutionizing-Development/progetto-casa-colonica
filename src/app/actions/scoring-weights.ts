'use server';

import { withAccess } from '@/lib/access';
import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { SCORING_DEFAULTS } from '@/config/defaults';

export const WEIGHT_KEYS = [
  'purchase_price',
  'all_in_cost',
  'structural_condition',
  'airbnb_potential',
  'regulatory_risk',
  'lifestyle_fit',
  'location_quality',
  'land_characteristics',
  'outbuilding_potential',
  'negotiation_margin',
  'exit_value',
] as const;

export type WeightKey = (typeof WEIGHT_KEYS)[number];

const WeightsSchema = z
  .object(
    Object.fromEntries(
      WEIGHT_KEYS.map((k) => [k, z.coerce.number().min(0).max(100)]),
    ) as Record<WeightKey, z.ZodNumber>,
  )
  .refine(
    (data) => Math.abs(Object.values(data).reduce((a, b) => a + b, 0) - 100) < 0.1,
    { message: 'Weights must sum to exactly 100%' },
  );

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

export function defaultWeightsPct(): Record<WeightKey, number> {
  return Object.fromEntries(
    WEIGHT_KEYS.map((k) => [k, Math.round(SCORING_DEFAULTS[k] * 100)]),
  ) as Record<WeightKey, number>;
}

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

  const raw = Object.fromEntries(WEIGHT_KEYS.map((k) => [k, formData.get(k)]));
  const parsed = WeightsSchema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  // Store as decimals (0.12) not percentages (12)
  const decimals = Object.fromEntries(
    Object.entries(parsed.data).map(([k, v]) => [k, v / 100]),
  ) as Record<WeightKey, number>;

  const supabase = createClient();

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

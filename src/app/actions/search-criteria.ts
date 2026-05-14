'use server';

import { withAccess } from '@/lib/access';
import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

const SearchCriteriaSchema = z.object({
  min_sqm_house: z.coerce.number().int().min(0).optional(),
  max_sqm_house: z.coerce.number().int().min(0).optional(),
  min_sqm_land: z.coerce.number().int().min(0).optional(),
  max_purchase_price: z.coerce.number().int().min(0).default(0),
  max_all_in_cost: z.coerce.number().int().min(0).default(0),
  regions: z.array(z.string()).default([]),
  must_have_olive_grove: z.boolean().default(false),
  must_allow_animals: z.boolean().default(false),
  must_have_outbuildings: z.boolean().default(false),
  requires_agriturismo_eligible: z.boolean().default(false),
});

export type SearchCriteriaRow = z.infer<typeof SearchCriteriaSchema> & {
  id: string;
  project_id: string;
  user_id: string;
  created_at: string;
  updated_at: string;
};

export type ActionResult<T = true> =
  | { data: T; error?: never }
  | { data?: never; error: string };

export async function getSearchCriteria(projectId: string): Promise<SearchCriteriaRow | null> {
  const uid = await withAccess('project:read');
  const supabase = createClient();

  const { data } = await supabase
    .from('search_criteria')
    .select('*')
    .eq('project_id', projectId)
    .eq('user_id', uid)
    .single();

  return data as SearchCriteriaRow | null;
}

export async function upsertSearchCriteria(
  projectId: string,
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const uid = await withAccess('project:update');

  const parsed = SearchCriteriaSchema.safeParse({
    min_sqm_house: formData.get('min_sqm_house') || undefined,
    max_sqm_house: formData.get('max_sqm_house') || undefined,
    min_sqm_land: formData.get('min_sqm_land') || undefined,
    max_purchase_price: formData.get('max_purchase_price') || 0,
    max_all_in_cost: formData.get('max_all_in_cost') || 0,
    regions: formData.getAll('regions'),
    must_have_olive_grove: formData.has('must_have_olive_grove'),
    must_allow_animals: formData.has('must_allow_animals'),
    must_have_outbuildings: formData.has('must_have_outbuildings'),
    requires_agriturismo_eligible: formData.has('requires_agriturismo_eligible'),
  });

  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const supabase = createClient();

  // Check if row exists
  const { data: existing } = await supabase
    .from('search_criteria')
    .select('id')
    .eq('project_id', projectId)
    .eq('user_id', uid)
    .single();

  const payload = { ...parsed.data, project_id: projectId, user_id: uid };

  const { error } = existing
    ? await supabase.from('search_criteria').update(payload).eq('id', existing.id)
    : await supabase.from('search_criteria').insert(payload);

  if (error) return { error: error.message };

  revalidatePath('/', 'layout');
  return { data: true };
}

'use server';

import { withAccess } from '@/lib/access';
import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

const EnergyClassEnum = z.enum(['A4', 'A3', 'A2', 'A1', 'B', 'C', 'D', 'E', 'F', 'G']);

const PropertyInputSchema = z.object({
  project_id: z.string().uuid(),
  name: z.string().min(1, 'Property name is required').max(200),
  listing_url: z.string().url().optional().or(z.literal('')),
  listing_source: z.string().max(50).optional(),
  listed_price: z.coerce.number().int().min(0),
  sqm_house: z.coerce.number().int().min(0),
  sqm_land: z.coerce.number().int().min(0),
  num_bedrooms: z.coerce.number().int().min(0).optional().nullable(),
  num_bathrooms: z.coerce.number().int().min(0).optional().nullable(),
  year_built: z.coerce.number().int().min(1000).max(2100).optional().nullable(),
  energy_class: EnergyClassEnum.optional().nullable(),
  has_olive_grove: z.boolean().optional(),
  olive_tree_count: z.coerce.number().int().min(0).optional().nullable(),
  has_vineyard: z.boolean().optional(),
  has_outbuildings: z.boolean().optional(),
  outbuilding_sqm: z.coerce.number().int().min(0).optional().nullable(),
  has_pool: z.boolean().optional(),
  has_pizza_oven: z.boolean().optional(),
  commune: z.string().max(100).optional(),
  province: z.string().max(100).optional(),
  region: z.string().max(100).optional(),
  lat: z.coerce.number().optional().nullable(),
  lng: z.coerce.number().optional().nullable(),
  listing_description: z.string().max(10000).optional(),
  notes: z.string().max(5000).optional(),
});

export type PropertyInput = z.infer<typeof PropertyInputSchema>;

export type PropertyRow = {
  id: string;
  project_id: string;
  user_id: string;
  name: string;
  pipeline_stage: string;
  listed_price: number;
  sqm_house: number;
  sqm_land: number;
  land_ha: number;
  num_bedrooms: number | null;
  num_bathrooms: number | null;
  year_built: number | null;
  energy_class: string | null;
  commune: string;
  province: string;
  region: string;
  lat: number | null;
  lng: number | null;
  has_olive_grove: boolean;
  olive_tree_count: number | null;
  has_vineyard: boolean;
  has_outbuildings: boolean;
  outbuilding_sqm: number | null;
  has_pool: boolean;
  has_pizza_oven: boolean;
  listing_url: string | null;
  listing_source: string | null;
  listing_description: string | null;
  notes: string | null;
  location_intelligence: import('@/types/location-intelligence').LocationIntelligence | null;
  quickscan: import('@/lib/ai/prompts/quickscan').QuickScanResult | null;
  created_at: string;
  updated_at: string;
};

export type ActionResult<T> = { data: T; error?: never } | { data?: never; error: string };

export async function createProperty(
  input: PropertyInput,
): Promise<ActionResult<PropertyRow>> {
  const uid = await withAccess('property:create');
  const supabase = createClient();

  const parsed = PropertyInputSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const d = parsed.data;

  const { data: row, error } = await supabase
    .from('properties')
    .insert({
      project_id: d.project_id,
      user_id: uid,
      name: d.name,
      listing_url: d.listing_url || null,
      listing_source: d.listing_source || null,
      listed_price: d.listed_price,
      sqm_house: d.sqm_house,
      sqm_land: d.sqm_land,
      num_bedrooms: d.num_bedrooms ?? null,
      num_bathrooms: d.num_bathrooms ?? null,
      year_built: d.year_built ?? null,
      energy_class: d.energy_class ?? null,
      has_olive_grove: d.has_olive_grove ?? false,
      olive_tree_count: d.olive_tree_count ?? null,
      has_vineyard: d.has_vineyard ?? false,
      has_outbuildings: d.has_outbuildings ?? false,
      outbuilding_sqm: d.outbuilding_sqm ?? null,
      has_pool: d.has_pool ?? false,
      has_pizza_oven: d.has_pizza_oven ?? false,
      commune: d.commune ?? '',
      province: d.province ?? '',
      region: d.region ?? '',
      lat: d.lat ?? null,
      lng: d.lng ?? null,
      listing_description: d.listing_description || null,
      notes: d.notes || null,
    })
    .select()
    .single();

  if (error) return { error: error.message };

  revalidatePath('/', 'layout');
  return { data: row as PropertyRow };
}

export async function getProperties(projectId: string): Promise<PropertyRow[]> {
  const uid = await withAccess('property:read');
  const supabase = createClient();

  const { data, error } = await supabase
    .from('properties')
    .select(
      'id, project_id, user_id, name, pipeline_stage, listed_price, sqm_house, sqm_land, land_ha, ' +
        'num_bedrooms, num_bathrooms, year_built, energy_class, commune, province, region, lat, lng, ' +
        'has_olive_grove, olive_tree_count, has_vineyard, has_outbuildings, outbuilding_sqm, ' +
        'has_pool, has_pizza_oven, listing_url, listing_source, listing_description, notes, location_intelligence, quickscan, created_at, updated_at',
    )
    .eq('project_id', projectId)
    .eq('user_id', uid)
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  return ((data ?? []) as unknown) as PropertyRow[];
}

export async function getProperty(id: string): Promise<PropertyRow | null> {
  const uid = await withAccess('property:read');
  const supabase = createClient();

  const { data, error } = await supabase
    .from('properties')
    .select('*')
    .eq('id', id)
    .eq('user_id', uid)
    .single();

  if (error) return null;
  return data as PropertyRow;
}

export async function deleteProperty(id: string): Promise<ActionResult<void>> {
  const uid = await withAccess('property:delete');
  const supabase = createClient();

  const { error } = await supabase
    .from('properties')
    .delete()
    .eq('id', id)
    .eq('user_id', uid);

  if (error) return { error: error.message };
  revalidatePath('/', 'layout');
  return { data: undefined };
}

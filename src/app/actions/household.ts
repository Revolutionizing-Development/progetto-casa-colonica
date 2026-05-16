'use server';

import { withAccess } from '@/lib/access';
import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import type { HouseholdProfile } from '@/types/household';
import { HOUSEHOLD_DEFAULTS } from '@/types/household';

export async function getHouseholdProfile(): Promise<HouseholdProfile> {
  const uid = await withAccess('household:read');
  const supabase = createClient();

  const { data, error } = await supabase
    .from('household_profiles')
    .select('*')
    .eq('user_id', uid)
    .single();

  if (error || !data) {
    return {
      id: '',
      user_id: uid,
      ...HOUSEHOLD_DEFAULTS,
      created_at: '',
      updated_at: '',
    };
  }

  return data as HouseholdProfile;
}

export async function updateHouseholdProfile(
  updates: Partial<Omit<HouseholdProfile, 'id' | 'user_id' | 'created_at' | 'updated_at'>>,
): Promise<HouseholdProfile> {
  const uid = await withAccess('household:update');
  const supabase = createClient();

  const { data, error } = await supabase
    .from('household_profiles')
    .upsert(
      {
        user_id: uid,
        ...updates,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id' },
    )
    .select('*')
    .single();

  if (error) throw new Error(error.message);

  revalidatePath('/', 'layout');
  return data as HouseholdProfile;
}

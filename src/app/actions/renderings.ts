'use server';

import { withAccess } from '@/lib/access';
import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import type { Rendering } from '@/types/rendering';

export async function getRenderings(propertyId: string): Promise<Rendering[]> {
  await withAccess('property:read');
  const supabase = createClient();

  const { data } = await supabase
    .from('renderings')
    .select('*')
    .eq('property_id', propertyId)
    .order('created_at', { ascending: false });

  return (data ?? []) as Rendering[];
}

export async function deleteRendering(renderingId: string): Promise<{ error?: string }> {
  const uid = await withAccess('property:update');
  const supabase = createClient();

  const { error } = await supabase
    .from('renderings')
    .delete()
    .eq('id', renderingId)
    .eq('user_id', uid);

  if (error) return { error: error.message };
  revalidatePath('/', 'layout');
  return {};
}

'use server';

import { withAccess } from '@/lib/access';
import { createClient } from '@/lib/supabase/server';

export interface PropertyPhoto {
  id: string;
  property_id: string;
  url: string;
  category: string;
  created_at: string;
}

export async function getPhotos(propertyId: string): Promise<PropertyPhoto[]> {
  await withAccess('property:read');
  const supabase = createClient();

  const { data } = await supabase
    .from('property_photos')
    .select('id, property_id, url, category, created_at')
    .eq('property_id', propertyId)
    .order('created_at', { ascending: false });

  return (data ?? []) as PropertyPhoto[];
}

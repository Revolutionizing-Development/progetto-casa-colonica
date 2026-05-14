import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createClient } from '@/lib/supabase/server';

const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/heic'];
const MAX_SIZE_BYTES = 20 * 1024 * 1024; // 20 MB

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ error: 'Invalid form data' }, { status: 400 });
  }

  const file = formData.get('file') as File | null;
  const propertyId = formData.get('propertyId') as string | null;
  const category = formData.get('category') as string | null;

  if (!file || !propertyId || !category) {
    return NextResponse.json({ error: 'file, propertyId and category are required' }, { status: 400 });
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json({ error: 'Only JPEG, PNG, WebP, and HEIC images are allowed' }, { status: 400 });
  }

  if (file.size > MAX_SIZE_BYTES) {
    return NextResponse.json({ error: 'File too large — maximum 20 MB' }, { status: 400 });
  }

  const supabase = createClient();

  // Verify the property belongs to the authenticated user
  const { data: property } = await supabase
    .from('properties')
    .select('id')
    .eq('id', propertyId)
    .eq('user_id', userId)
    .single();

  if (!property) {
    return NextResponse.json({ error: 'Property not found' }, { status: 404 });
  }

  const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
  const filename = `${userId}/${propertyId}/${category}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

  const bytes = await file.arrayBuffer();

  const { error: storageError } = await supabase.storage
    .from('property-photos')
    .upload(filename, bytes, { contentType: file.type, upsert: false });

  if (storageError) {
    return NextResponse.json({ error: storageError.message }, { status: 500 });
  }

  const { data: urlData } = supabase.storage.from('property-photos').getPublicUrl(filename);

  const { data: photo, error: dbError } = await supabase
    .from('property_photos')
    .insert({
      property_id: propertyId,
      user_id: userId,
      url: urlData.publicUrl,
      category,
    })
    .select('id, url')
    .single();

  if (dbError) {
    return NextResponse.json({ error: dbError.message }, { status: 500 });
  }

  return NextResponse.json({ id: photo.id, url: photo.url });
}

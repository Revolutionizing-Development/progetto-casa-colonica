import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createAdminClient } from '@/lib/supabase/server';
import { getOpenAIClient, IMAGE_MODEL, IMAGE_SIZE, IMAGE_QUALITY, fetchImageForEdit } from '@/lib/ai/openai-image';
import { buildEditPrompt } from '@/lib/ai/prompts/generate-rendering';
import type { RenovationScenario } from '@/types/renovation';
import type { RenderingType } from '@/types/rendering';

export const maxDuration = 300;

const VALID_TYPES: RenderingType[] = [
  'exterior_front', 'exterior_rear', 'courtyard',
  'interior_living', 'interior_kitchen', 'interior_airbnb', 'aerial',
];

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    let body: {
      propertyId?: string;
      scenarioId?: string;
      type?: string;
      sourcePhotoUrl?: string;
      additionalInstructions?: string;
    };
    try { body = await req.json(); } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const { propertyId, scenarioId, type, sourcePhotoUrl, additionalInstructions } = body;
    if (!propertyId) return NextResponse.json({ error: 'propertyId is required' }, { status: 400 });
    if (!scenarioId) return NextResponse.json({ error: 'scenarioId is required — per N6, renderings require a renovation plan' }, { status: 400 });
    if (!sourcePhotoUrl) return NextResponse.json({ error: 'sourcePhotoUrl is required — per N6, the original photo is the canvas' }, { status: 400 });
    if (!type || !VALID_TYPES.includes(type as RenderingType)) {
      return NextResponse.json({ error: `type must be one of: ${VALID_TYPES.join(', ')}` }, { status: 400 });
    }

    const supabase = createAdminClient();

    const { data: property } = await supabase
      .from('properties').select('*').eq('id', propertyId).eq('user_id', userId).single();

    if (!property) return NextResponse.json({ error: 'Property not found' }, { status: 404 });

    const { data: scenario } = await supabase
      .from('renovation_scenarios').select('*').eq('id', scenarioId).eq('property_id', propertyId).single();

    if (!scenario) return NextResponse.json({ error: 'Scenario not found' }, { status: 404 });

    const scen = scenario as RenovationScenario;
    const renderingType = type as RenderingType;

    const prompt = buildEditPrompt(scen, renderingType, additionalInstructions);
    console.log(`[ai/renderings] editing ${renderingType} for property ${propertyId}`);
    console.log(`[ai/renderings] prompt length: ${prompt.length} chars`);

    let sourceImage: File;
    try {
      console.log(`[ai/renderings] fetching source photo from: ${sourcePhotoUrl}`);
      sourceImage = await fetchImageForEdit(sourcePhotoUrl);
      console.log(`[ai/renderings] source photo fetched: ${sourceImage.size} bytes`);
    } catch (fetchErr) {
      const msg = (fetchErr as Error).message;
      console.error(`[ai/renderings] source photo fetch failed: ${msg}`);
      return NextResponse.json({ error: `Failed to fetch source photo: ${msg}` }, { status: 502 });
    }

    const openai = getOpenAIClient();

    let response;
    try {
      // N6: ALWAYS images.edit(), NEVER images.generate()
      response = await openai.images.edit({
        model: IMAGE_MODEL,
        image: sourceImage,
        prompt,
        n: 1,
        size: IMAGE_SIZE,
        quality: IMAGE_QUALITY,
        input_fidelity: 'high',
      });
    } catch (aiErr) {
      const msg = (aiErr as Error).message;
      console.error(`[ai/renderings] OpenAI API error: ${msg}`);
      const status = msg.includes('timeout') || msg.includes('ECONNREFUSED') ? 504 : 502;
      return NextResponse.json({ error: `OpenAI image edit failed: ${msg}` }, { status });
    }

    const imageData = response.data?.[0];
    if (!imageData) {
      return NextResponse.json({ error: 'No image returned from OpenAI' }, { status: 502 });
    }

    const timestamp = Date.now();
    const storagePath = `renderings/${propertyId}/${scenarioId}/${renderingType}-${timestamp}.png`;

    let imageUrl: string;

    if (imageData.b64_json) {
      const buffer = Buffer.from(imageData.b64_json, 'base64');
      console.log(`[ai/renderings] uploading ${buffer.length} bytes to storage`);
      const { error: uploadError } = await supabase.storage
        .from('property-photos')
        .upload(storagePath, buffer, { contentType: 'image/png', upsert: true });

      if (uploadError) {
        console.error('[ai/renderings] Storage upload error:', uploadError.message);
        return NextResponse.json({ error: `Storage upload failed: ${uploadError.message}` }, { status: 500 });
      }

      const { data: publicUrl } = supabase.storage.from('property-photos').getPublicUrl(storagePath);
      imageUrl = publicUrl.publicUrl;
    } else if (imageData.url) {
      imageUrl = imageData.url;
    } else {
      return NextResponse.json({ error: 'No image data in OpenAI response' }, { status: 502 });
    }

    const { data: saved, error: saveError } = await supabase
      .from('renderings')
      .insert({
        property_id: propertyId,
        scenario_id: scenarioId,
        user_id: userId,
        type: renderingType,
        view: 'after' as const,
        prompt_used: prompt,
        image_url: imageUrl,
        source_photo_url: sourcePhotoUrl,
        model: IMAGE_MODEL,
        width: 0,
        height: 0,
        is_inpainted: true,
      })
      .select()
      .single();

    if (saveError) {
      console.error('[ai/renderings] DB save error:', saveError.message);
      return NextResponse.json({ error: saveError.message }, { status: 500 });
    }

    console.log(`[ai/renderings] saved inpainted rendering ${saved.id}`);
    return NextResponse.json({ data: saved });
  } catch (err) {
    const message = (err as Error).message;
    console.error('[ai/renderings] unexpected error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

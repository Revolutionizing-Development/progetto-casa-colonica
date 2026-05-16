import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createAdminClient } from '@/lib/supabase/server';
import { getAnthropicClient, ANALYSIS_MODEL } from '@/lib/ai/claude';
import {
  buildLocationIntelligencePrompt,
  LOCATION_INTELLIGENCE_TOOL_SCHEMA,
} from '@/lib/ai/prompts/location-intelligence';
import type { PropertyRow } from '@/app/actions/properties';
import type { ProjectType } from '@/types/project';
import type { LocationIntelligence, DistanceCard, TransportHub } from '@/types/location-intelligence';
import type Anthropic from '@anthropic-ai/sdk';

export const maxDuration = 300;

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

/** POI categories for basic services (non-transport) */
const SERVICE_CATEGORIES: { category: string; mapbox_query: string }[] = [
  { category: 'supermarket', mapbox_query: 'supermarket' },
  { category: 'bakery', mapbox_query: 'bakery' },
  { category: 'pharmacy', mapbox_query: 'pharmacy' },
  { category: 'hospital', mapbox_query: 'hospital' },
  { category: 'veterinarian', mapbox_query: 'veterinarian' },
];

async function fetchNearestPOI(
  lng: number,
  lat: number,
  query: string,
): Promise<{ name: string; lng: number; lat: number } | null> {
  if (!MAPBOX_TOKEN) return null;
  const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?proximity=${lng},${lat}&limit=1&types=poi&access_token=${MAPBOX_TOKEN}`;
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) return null;
    const data = await res.json();
    const feature = data.features?.[0];
    if (!feature) return null;
    return {
      name: feature.text || feature.place_name || query,
      lng: feature.center[0],
      lat: feature.center[1],
    };
  } catch {
    return null;
  }
}

async function fetchDriveDistance(
  fromLng: number,
  fromLat: number,
  toLng: number,
  toLat: number,
): Promise<{ minutes: number; km: number } | null> {
  if (!MAPBOX_TOKEN) return null;
  const url = `https://api.mapbox.com/directions/v5/mapbox/driving/${fromLng},${fromLat};${toLng},${toLat}?access_token=${MAPBOX_TOKEN}`;
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) return null;
    const data = await res.json();
    const route = data.routes?.[0];
    if (!route) return null;
    return {
      minutes: Math.round(route.duration / 60),
      km: Math.round(route.distance / 100) / 10,
    };
  } catch {
    return null;
  }
}

/** Verify and refine AI-provided transport hub coordinates using Mapbox driving distance */
async function refineTransportHub(
  propLng: number,
  propLat: number,
  hub: TransportHub,
): Promise<TransportHub> {
  // Try to get actual drive distance from Mapbox to refine AI estimates
  const drive = await fetchDriveDistance(propLng, propLat, hub.lng, hub.lat);
  if (drive) {
    return {
      ...hub,
      drive_minutes: drive.minutes,
      distance_km: drive.km,
    };
  }
  return hub;
}

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    let body: { propertyId?: string };
    try { body = await req.json(); } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const { propertyId } = body;
    if (!propertyId) return NextResponse.json({ error: 'propertyId is required' }, { status: 400 });

    const supabase = createAdminClient();

    const { data: property, error: propErr } = await supabase
      .from('properties').select('*').eq('id', propertyId).eq('user_id', userId).single();
    if (propErr || !property) return NextResponse.json({ error: 'Property not found' }, { status: 404 });

    const prop = property as PropertyRow;

    const { data: project } = await supabase
      .from('projects').select('project_type').eq('id', prop.project_id).single();
    const projectType: ProjectType = (project?.project_type as ProjectType) ?? 'farmstead_hosting';

    // Step 1: AI regulatory + community + transport hub analysis
    const prompt = buildLocationIntelligencePrompt(prop, projectType);
    const anthropic = getAnthropicClient();

    let aiResult: {
      regulatory_checklist: LocationIntelligence['regulatory_checklist'];
      community: LocationIntelligence['community'];
      transport_hubs: TransportHub[];
    };

    try {
      const stream = anthropic.messages.stream({
        model: ANALYSIS_MODEL,
        max_tokens: 4096,
        tools: [LOCATION_INTELLIGENCE_TOOL_SCHEMA as Anthropic.Tool],
        tool_choice: { type: 'tool', name: 'location_intelligence' },
        messages: [{ role: 'user', content: prompt }],
      });
      const response = await stream.finalMessage();
      console.log('[ai/location-intelligence] stop_reason:', response.stop_reason, 'tokens:', response.usage.input_tokens, '/', response.usage.output_tokens);

      const toolBlock = response.content.find((b) => b.type === 'tool_use');
      if (!toolBlock || toolBlock.type !== 'tool_use')
        return NextResponse.json({ error: 'AI did not return tool output' }, { status: 500 });

      aiResult = toolBlock.input as typeof aiResult;
    } catch (err) {
      return NextResponse.json({ error: `AI analysis failed: ${(err as Error).message}` }, { status: 500 });
    }

    // Step 2: Service distance cards via Mapbox (non-transport POIs)
    const distances: DistanceCard[] = [];

    if (prop.lat != null && prop.lng != null && MAPBOX_TOKEN) {
      const poiResults = await Promise.all(
        SERVICE_CATEGORIES.map(async ({ category, mapbox_query }) => {
          const poi = await fetchNearestPOI(prop.lng!, prop.lat!, mapbox_query);
          if (!poi) return null;
          const drive = await fetchDriveDistance(prop.lng!, prop.lat!, poi.lng, poi.lat);
          if (!drive) return null;
          return {
            category,
            name: poi.name,
            drive_minutes: drive.minutes,
            distance_km: drive.km,
            lng: poi.lng,
            lat: poi.lat,
          } satisfies DistanceCard;
        }),
      );
      for (const r of poiResults) {
        if (r) distances.push(r);
      }
    }

    // Step 3: Refine transport hub drive times using Mapbox
    let transportHubs: TransportHub[] = aiResult.transport_hubs ?? [];

    if (prop.lat != null && prop.lng != null && MAPBOX_TOKEN) {
      transportHubs = await Promise.all(
        transportHubs.map((hub) => refineTransportHub(prop.lng!, prop.lat!, hub)),
      );
    }

    // Step 4: Build and save
    const intelligence: LocationIntelligence = {
      generated_at: new Date().toISOString(),
      regulatory_checklist: aiResult.regulatory_checklist ?? [],
      distances,
      transport_hubs: transportHubs,
      community: aiResult.community,
      isochrone_minutes: [10, 20, 30],
    };

    const { error: saveErr } = await supabase
      .from('properties')
      .update({ location_intelligence: intelligence })
      .eq('id', propertyId)
      .eq('user_id', userId);

    if (saveErr) return NextResponse.json({ error: saveErr.message }, { status: 500 });

    return NextResponse.json({ locationIntelligence: intelligence });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[ai/location-intelligence] Unhandled error:', msg);
    return NextResponse.json({ error: `Location intelligence failed: ${msg}` }, { status: 500 });
  }
}

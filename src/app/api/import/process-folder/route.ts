import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createAdminClient } from '@/lib/supabase/server';
import { getAnthropicClient, ANALYSIS_MODEL } from '@/lib/ai/claude';
import type Anthropic from '@anthropic-ai/sdk';
import fs from 'fs/promises';
import path from 'path';
import type { PhotoCategory } from '@/types/photo';

type ImageMediaType = 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp';

function toMediaType(mime: string): ImageMediaType {
  const map: Record<string, ImageMediaType> = {
    'image/jpeg': 'image/jpeg',
    'image/jpg': 'image/jpeg',
    'image/png': 'image/png',
    'image/webp': 'image/webp',
    'image/gif': 'image/gif',
  };
  return map[mime] ?? 'image/jpeg';
}

export const maxDuration = 300;

const IMAGE_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp', '.heic', '.heif']);
const LISTING_EXTENSIONS = new Set(['.mhtml', '.mht', '.html', '.htm']);

const CLASSIFY_TOOL = {
  name: 'classify_photos',
  description: 'Classify property photos by what they show',
  input_schema: {
    type: 'object' as const,
    properties: {
      classifications: {
        type: 'array' as const,
        items: {
          type: 'object' as const,
          properties: {
            index: { type: 'number' as const },
            category: {
              type: 'string' as const,
              enum: [
                'aerial', 'exterior_front', 'exterior_rear', 'courtyard',
                'interior_living', 'interior_kitchen', 'interior_bedroom', 'interior_bathroom',
                'land', 'outbuilding', 'roof', 'detail',
              ],
            },
          },
          required: ['index', 'category'],
        },
      },
    },
    required: ['classifications'],
  },
};

const PARSE_TOOL = {
  name: 'extract_listing_data',
  description: 'Extract structured property data from an Italian real estate listing page',
  input_schema: {
    type: 'object' as const,
    properties: {
      name: { type: 'string' as const },
      listing_url: { type: 'string' as const },
      listing_source: { type: 'string' as const },
      listed_price: { type: 'number' as const },
      commune: { type: 'string' as const },
      province: { type: 'string' as const },
      region: { type: 'string' as const },
      sqm_house: { type: 'number' as const },
      sqm_land: { type: 'number' as const },
      num_bedrooms: { type: 'number' as const },
      num_bathrooms: { type: 'number' as const },
      year_built: { type: 'number' as const },
      energy_class: { type: 'string' as const },
      has_olive_grove: { type: 'boolean' as const },
      olive_tree_count: { type: 'number' as const },
      has_vineyard: { type: 'boolean' as const },
      has_outbuildings: { type: 'boolean' as const },
      outbuilding_sqm: { type: 'number' as const },
      has_pool: { type: 'boolean' as const },
      has_pizza_oven: { type: 'boolean' as const },
      listing_description: { type: 'string' as const },
    },
    required: ['name', 'commune', 'province', 'region'],
  },
};

function parseMhtml(raw: string): string {
  const boundaryLine = raw.match(/\bboundary="([^"]+)"/i) ?? raw.match(/\bboundary=(\S+)/i);
  if (!boundaryLine) return raw;
  const boundary = '--' + boundaryLine[1];
  let cursor = 0;
  while (cursor < raw.length) {
    const bIdx = raw.indexOf(boundary, cursor);
    if (bIdx === -1) break;
    const crlfBlank = raw.indexOf('\r\n\r\n', bIdx);
    const lfBlank = raw.indexOf('\n\n', bIdx);
    let headersEnd: number;
    let sepLen: number;
    if (crlfBlank !== -1 && (lfBlank === -1 || crlfBlank <= lfBlank)) {
      headersEnd = crlfBlank; sepLen = 4;
    } else if (lfBlank !== -1) {
      headersEnd = lfBlank; sepLen = 2;
    } else break;
    const headers = raw.slice(bIdx, headersEnd);
    if (/Content-Type:\s*text\/html/i.test(headers)) {
      const isQP = /Content-Transfer-Encoding:\s*quoted-printable/i.test(headers);
      const bodyStart = headersEnd + sepLen;
      const nextBoundary = raw.indexOf('\n' + boundary, bodyStart);
      const bodyEnd = nextBoundary !== -1 ? Math.min(nextBoundary, bodyStart + 300_000) : bodyStart + 300_000;
      const body = raw.slice(bodyStart, bodyEnd);
      if (!isQP) return body;
      const joined = body.replace(/=\r?\n/g, '');
      const bytes: number[] = [];
      let i = 0;
      while (i < joined.length) {
        if (joined[i] === '=' && i + 2 < joined.length && /[0-9A-Fa-f]{2}/.test(joined.slice(i + 1, i + 3))) {
          bytes.push(parseInt(joined.slice(i + 1, i + 3), 16));
          i += 3;
        } else {
          bytes.push(joined.charCodeAt(i) < 128 ? joined.charCodeAt(i) : 63);
          i++;
        }
      }
      try {
        return new TextDecoder('utf-8', { fatal: false }).decode(new Uint8Array(bytes));
      } catch {
        return bytes.map((b) => String.fromCharCode(b)).join('');
      }
    }
    cursor = bIdx + boundary.length;
  }
  return raw;
}

function htmlToText(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(?:p|div|li|dt|dd|h[1-6])>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ').replace(/&#(\d+);/g, (_, n) => String.fromCharCode(+n))
    .replace(/[ \t]+/g, ' ').replace(/\n{3,}/g, '\n\n').trim();
}

function mimeTypeForExt(ext: string): string {
  const map: Record<string, string> = {
    '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png',
    '.webp': 'image/webp', '.heic': 'image/heic', '.heif': 'image/heif',
  };
  return map[ext] || 'image/jpeg';
}

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { folderPath, projectId } = (await req.json()) as { folderPath?: string; projectId?: string };
    if (!folderPath) return NextResponse.json({ error: 'folderPath is required' }, { status: 400 });
    if (!projectId) return NextResponse.json({ error: 'projectId is required' }, { status: 400 });

    const resolved = path.resolve(folderPath);
    const entries = await fs.readdir(resolved, { withFileTypes: true });

    const imageFiles: { name: string; fullPath: string; ext: string }[] = [];
    let listingFile: { name: string; fullPath: string; ext: string } | null = null;

    for (const entry of entries) {
      if (!entry.isFile()) continue;
      const ext = path.extname(entry.name).toLowerCase();
      const fullPath = path.join(resolved, entry.name);
      if (IMAGE_EXTENSIONS.has(ext)) {
        imageFiles.push({ name: entry.name, fullPath, ext });
      } else if (LISTING_EXTENSIONS.has(ext) && !listingFile) {
        listingFile = { name: entry.name, fullPath, ext };
      }
    }

    const client = getAnthropicClient();
    const supabase = createAdminClient();

    // ── Step 1: Parse listing file ──────────────────────────────────────────
    let listingData: Record<string, unknown> = {};
    if (listingFile) {
      console.log(`[import] parsing listing: ${listingFile.name}`);
      const raw = await fs.readFile(listingFile.fullPath, 'utf-8');
      const snapshotUrl = raw.match(/Snapshot-Content-Location:\s*(\S+)/)?.[1] ?? '';
      const isMhtml = listingFile.ext === '.mhtml' || listingFile.ext === '.mht' ||
        raw.startsWith('From: ') || raw.includes('MIME-Version:');
      const html = isMhtml ? parseMhtml(raw) : raw;
      const text = htmlToText(html).slice(0, 8000);

      if (text.length >= 50) {
        const parseResponse = await client.messages.create({
          model: ANALYSIS_MODEL,
          max_tokens: 1500,
          tools: [PARSE_TOOL],
          tool_choice: { type: 'tool', name: 'extract_listing_data' },
          messages: [{
            role: 'user',
            content: `You are parsing an Italian real estate listing page. Extract all available property data accurately. For land area, convert hectares to m² (1 ha = 10000 m²).\n\nListing URL: ${snapshotUrl || '(not found)'}\n\nPage text:\n${text}`,
          }],
        });
        const toolBlock = parseResponse.content.find((b) => b.type === 'tool_use');
        if (toolBlock && toolBlock.type === 'tool_use') {
          listingData = toolBlock.input as Record<string, unknown>;
        }
      }
    }

    // ── Step 2: Classify photos with Claude Vision ──────────────────────────
    let classifications: { index: number; category: PhotoCategory }[] = [];
    if (imageFiles.length > 0) {
      console.log(`[import] classifying ${imageFiles.length} photos`);

      const imageBlocks: Anthropic.ImageBlockParam[] = [];

      for (const img of imageFiles) {
        const buffer = await fs.readFile(img.fullPath);
        imageBlocks.push({
          type: 'image',
          source: {
            type: 'base64',
            media_type: toMediaType(mimeTypeForExt(img.ext)),
            data: buffer.toString('base64'),
          },
        });
      }

      const content: Anthropic.ContentBlockParam[] = [];
      content.push({
        type: 'text',
        text: `Classify these ${imageFiles.length} photos of an Italian rural farmhouse property listing. Categories: aerial (drone/satellite), exterior_front (main facade), exterior_rear (back/garden side), courtyard (internal courtyard), interior_living (living/sitting room), interior_kitchen, interior_bedroom, interior_bathroom, land (fields/garden/olive grove), outbuilding (barn/annex), roof (roof close-up), detail (architectural detail/door/window/fireplace). Photos in order (index 0-${imageFiles.length - 1}):`,
      });
      for (const block of imageBlocks) {
        content.push(block);
      }

      const classifyResponse = await client.messages.create({
        model: ANALYSIS_MODEL,
        max_tokens: 2000,
        tools: [CLASSIFY_TOOL],
        tool_choice: { type: 'tool', name: 'classify_photos' },
        messages: [{ role: 'user', content }],
      });

      const classifyBlock = classifyResponse.content.find((b) => b.type === 'tool_use');
      if (classifyBlock && classifyBlock.type === 'tool_use') {
        const result = classifyBlock.input as { classifications: typeof classifications };
        classifications = result.classifications;
      }
    }

    // ── Step 3: Create property in DB ───────────────────────────────────────
    console.log(`[import] creating property: ${listingData.name || 'Imported Property'}`);

    const { data: property, error: propError } = await supabase
      .from('properties')
      .insert({
        project_id: projectId,
        user_id: userId,
        name: String(listingData.name || 'Imported Property'),
        pipeline_stage: 'scouted',
        listing_url: listingData.listing_url ? String(listingData.listing_url) : null,
        listing_source: listingData.listing_source ? String(listingData.listing_source) : null,
        listed_price: Number(listingData.listed_price) || 0,
        sqm_house: Number(listingData.sqm_house) || 0,
        sqm_land: Number(listingData.sqm_land) || 0,
        num_bedrooms: listingData.num_bedrooms != null ? Number(listingData.num_bedrooms) : null,
        num_bathrooms: listingData.num_bathrooms != null ? Number(listingData.num_bathrooms) : null,
        energy_class: listingData.energy_class ? String(listingData.energy_class) : null,
        has_olive_grove: Boolean(listingData.has_olive_grove),
        olive_tree_count: listingData.olive_tree_count != null ? Number(listingData.olive_tree_count) : null,
        has_vineyard: Boolean(listingData.has_vineyard),
        has_outbuildings: Boolean(listingData.has_outbuildings),
        outbuilding_sqm: listingData.outbuilding_sqm != null ? Number(listingData.outbuilding_sqm) : null,
        has_pool: Boolean(listingData.has_pool),
        has_pizza_oven: Boolean(listingData.has_pizza_oven),
        commune: listingData.commune ? String(listingData.commune) : null,
        province: listingData.province ? String(listingData.province) : null,
        region: listingData.region ? String(listingData.region) : null,
        listing_description: listingData.listing_description ? String(listingData.listing_description) : null,
      })
      .select('id')
      .single();

    if (propError || !property) {
      console.error('[import] property create error:', propError?.message);
      return NextResponse.json({ error: propError?.message ?? 'Failed to create property' }, { status: 500 });
    }

    const propertyId = property.id;

    // ── Step 4: Upload photos to storage + DB ───────────────────────────────
    const uploadedPhotos: { id: string; url: string; category: string; name: string }[] = [];

    for (let i = 0; i < imageFiles.length; i++) {
      const img = imageFiles[i];
      const category = classifications.find((c) => c.index === i)?.category ?? 'exterior_front';
      const buffer = await fs.readFile(img.fullPath);
      const ext = img.ext.replace('.', '');
      const storagePath = `${userId}/${propertyId}/${category}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from('property-photos')
        .upload(storagePath, buffer, {
          contentType: mimeTypeForExt(img.ext),
          upsert: false,
        });

      if (uploadError) {
        console.error(`[import] photo upload error (${img.name}):`, uploadError.message);
        continue;
      }

      const { data: urlData } = supabase.storage.from('property-photos').getPublicUrl(storagePath);

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

      if (!dbError && photo) {
        uploadedPhotos.push({ id: photo.id, url: photo.url, category, name: img.name });
      }
    }

    console.log(`[import] done — property ${propertyId}, ${uploadedPhotos.length} photos uploaded`);

    return NextResponse.json({
      propertyId,
      propertyName: String(listingData.name || 'Imported Property'),
      listingParsed: !!listingFile,
      photos: uploadedPhotos,
    });
  } catch (err) {
    const msg = (err as Error).message;
    console.error('[import/process-folder] error:', msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

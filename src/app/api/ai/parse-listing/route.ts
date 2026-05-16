import { NextRequest } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getAnthropicClient, ANALYSIS_MODEL } from '@/lib/ai/claude';

export const maxDuration = 120; // listing parse is faster but still needs headroom

const PARSE_TOOL = {
  name: 'extract_listing_data',
  description: 'Extract structured property data from an Italian real estate listing page',
  input_schema: {
    type: 'object' as const,
    properties: {
      name: {
        type: 'string',
        description: 'Short descriptive name for the property, e.g. "Casale Giano" or "Farmhouse Torrita di Siena"',
      },
      listing_url: { type: 'string', description: 'Original listing URL' },
      listing_source: {
        type: 'string',
        description: 'Source: Immobiliare.it | Idealista | Gate-Away | Grimaldi | Direct | Agent | Other',
      },
      listed_price: { type: 'number', description: 'Listed price in euros as integer, e.g. 260000' },
      commune: { type: 'string', description: 'Italian commune/town name' },
      province: { type: 'string', description: 'Province full name (e.g. Siena, not SI)' },
      region: { type: 'string', description: 'Region in English (e.g. Tuscany, Umbria, Lazio)' },
      sqm_house: { type: 'number', description: 'House/building area in m²' },
      sqm_land: {
        type: 'number',
        description: 'Land area in m² — convert hectares × 10000 (e.g. 2ha = 20000)',
      },
      num_bedrooms: { type: 'number' },
      num_bathrooms: { type: 'number' },
      year_built: { type: 'number', description: 'Construction year if mentioned, else omit' },
      energy_class: {
        type: 'string',
        description: 'APE energy class: A4, A3, A2, A1, B, C, D, E, F, or G. Omit if not stated.',
      },
      has_olive_grove: { type: 'boolean' },
      olive_tree_count: { type: 'number', description: 'Number of olive trees if mentioned' },
      has_vineyard: { type: 'boolean' },
      has_outbuildings: { type: 'boolean', description: 'Any annex, barn, outbuilding, dependance' },
      outbuilding_sqm: { type: 'number', description: 'Total outbuilding area in m²' },
      has_pool: { type: 'boolean' },
      has_pizza_oven: { type: 'boolean' },
      listing_description: {
        type: 'string',
        description: 'Full description text from the listing (copy verbatim, do not summarise)',
      },
    },
    required: ['name', 'commune', 'province', 'region'],
  },
};

// Efficient MHTML parser — uses indexOf (O(n)), no regex backtracking on large files.
function parseMhtml(raw: string): string {
  // Find the MIME boundary string
  const boundaryLine = raw.match(/\bboundary="([^"]+)"/i) ?? raw.match(/\bboundary=(\S+)/i);
  if (!boundaryLine) {
    // Not MHTML — plain HTML saved with wrong extension
    return raw;
  }
  const boundary = '--' + boundaryLine[1];

  let cursor = 0;
  while (cursor < raw.length) {
    const bIdx = raw.indexOf(boundary, cursor);
    if (bIdx === -1) break;

    // Find the blank line that ends this part's headers.
    // Headers end at the first \r\n\r\n or \n\n after the boundary.
    const crlfBlank = raw.indexOf('\r\n\r\n', bIdx);
    const lfBlank   = raw.indexOf('\n\n',   bIdx);

    let headersEnd: number;
    let sepLen: number;
    if (crlfBlank !== -1 && (lfBlank === -1 || crlfBlank <= lfBlank)) {
      headersEnd = crlfBlank; sepLen = 4;
    } else if (lfBlank !== -1) {
      headersEnd = lfBlank; sepLen = 2;
    } else {
      break;
    }

    const headers = raw.slice(bIdx, headersEnd);

    if (/Content-Type:\s*text\/html/i.test(headers)) {
      const isQP = /Content-Transfer-Encoding:\s*quoted-printable/i.test(headers);
      const bodyStart = headersEnd + sepLen;

      // Find next boundary to know where body ends; cap at 300 KB either way
      const nextBoundary = raw.indexOf('\n' + boundary, bodyStart);
      const bodyEnd = nextBoundary !== -1
        ? Math.min(nextBoundary, bodyStart + 300_000)
        : bodyStart + 300_000;

      const body = raw.slice(bodyStart, bodyEnd);
      return isQP ? decodeQP(body) : body;
    }

    cursor = bIdx + boundary.length;
  }

  // No text/html part found — treat as plain HTML
  return raw;
}

// Proper quoted-printable decode that reconstructs UTF-8 bytes correctly.
function decodeQP(s: string): string {
  // Step 1: remove soft line breaks (= at end of line)
  const joined = s.replace(/=\r?\n/g, '');

  // Step 2: collect bytes — QP escapes become real bytes; plain chars stay as-is
  const bytes: number[] = [];
  let i = 0;
  while (i < joined.length) {
    if (joined[i] === '=' && i + 2 < joined.length && /[0-9A-Fa-f]{2}/.test(joined.slice(i + 1, i + 3))) {
      bytes.push(parseInt(joined.slice(i + 1, i + 3), 16));
      i += 3;
    } else {
      const code = joined.charCodeAt(i);
      bytes.push(code < 128 ? code : 63); // replace high surrogates with '?'
      i++;
    }
  }

  // Step 3: decode the byte array as UTF-8
  try {
    return new TextDecoder('utf-8', { fatal: false }).decode(new Uint8Array(bytes));
  } catch {
    return bytes.map((b) => String.fromCharCode(b)).join('');
  }
}

function htmlToText(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(?:p|div|li|dt|dd|h[1-6])>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ')
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(+n))
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    let file: File | null = null;
    try {
      const form = await req.formData();
      file = form.get('file') as File | null;
    } catch {
      return Response.json({ error: 'Invalid form data' }, { status: 400 });
    }
    if (!file) return Response.json({ error: 'No file uploaded' }, { status: 400 });

    const ext = file.name.slice(file.name.lastIndexOf('.')).toLowerCase();
    if (!['.mhtml', '.mht', '.html', '.htm'].includes(ext)) {
      return Response.json(
        { error: 'Please upload an .mhtml or .html file saved from the listing page' },
        { status: 400 },
      );
    }
    if (file.size > 20 * 1024 * 1024) {
      return Response.json({ error: 'File too large (max 20 MB)' }, { status: 400 });
    }

    const raw = await file.text();
    const snapshotUrl = raw.match(/Snapshot-Content-Location:\s*(\S+)/)?.[1] ?? '';
    const isMhtml = ext === '.mhtml' || ext === '.mht' || raw.startsWith('From: ') || raw.includes('MIME-Version:');
    const html = isMhtml ? parseMhtml(raw) : raw;
    const text = htmlToText(html).slice(0, 8000);

    if (text.length < 50) {
      return Response.json(
        { error: 'Could not extract text from the file — try saving the page again or entering details manually' },
        { status: 400 },
      );
    }

    const client = getAnthropicClient();
    const response = await client.messages.create({
      model: ANALYSIS_MODEL,
      max_tokens: 1500,
      tools: [PARSE_TOOL],
      tool_choice: { type: 'tool', name: 'extract_listing_data' },
      messages: [
        {
          role: 'user',
          content: `You are parsing an Italian real estate listing page. Extract all available property data accurately. For land area, convert hectares to m² (1 ha = 10000 m²). For listing_source detect the website name from the URL or page content.\n\nListing URL: ${snapshotUrl || '(not found)'}\n\nPage text:\n${text}`,
        },
      ],
    });

    const toolBlock = response.content.find((b) => b.type === 'tool_use');
    if (!toolBlock || toolBlock.type !== 'tool_use') {
      return Response.json(
        { error: 'AI could not parse the listing — try entering details manually' },
        { status: 500 },
      );
    }

    const e = toolBlock.input as Record<string, unknown>;

    const prefill = {
      name: String(e.name ?? ''),
      listing_url: e.listing_url ? String(e.listing_url) : snapshotUrl,
      listing_source: String(e.listing_source ?? ''),
      listed_price: e.listed_price != null ? String(e.listed_price) : '',
      commune: String(e.commune ?? ''),
      province: String(e.province ?? ''),
      region: String(e.region ?? ''),
      lat: '',
      lng: '',
      sqm_house: e.sqm_house != null ? String(e.sqm_house) : '',
      sqm_land: e.sqm_land != null ? String(e.sqm_land) : '',
      num_bedrooms: e.num_bedrooms != null ? String(e.num_bedrooms) : '',
      num_bathrooms: e.num_bathrooms != null ? String(e.num_bathrooms) : '',
      year_built: e.year_built != null ? String(e.year_built) : '',
      energy_class: String(e.energy_class ?? ''),
      has_olive_grove: Boolean(e.has_olive_grove),
      olive_tree_count: e.olive_tree_count != null ? String(e.olive_tree_count) : '',
      has_vineyard: Boolean(e.has_vineyard),
      has_outbuildings: Boolean(e.has_outbuildings),
      outbuilding_sqm: e.outbuilding_sqm != null ? String(e.outbuilding_sqm) : '',
      has_pool: Boolean(e.has_pool),
      has_pizza_oven: Boolean(e.has_pizza_oven),
      listing_description: String(e.listing_description ?? ''),
      notes: '',
    };

    return Response.json({ prefill });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[parse-listing] ERROR:', msg);
    return Response.json(
      { error: `Server error: ${msg}` },
      { status: 500 },
    );
  }
}

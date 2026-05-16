import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import fs from 'fs/promises';
import path from 'path';

const IMAGE_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp', '.heic', '.heif']);
const LISTING_EXTENSIONS = new Set(['.mhtml', '.mht', '.html', '.htm']);

export interface ScannedFile {
  name: string;
  path: string;
  type: 'image' | 'listing';
  size: number;
}

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { folderPath } = (await req.json()) as { folderPath?: string };
    if (!folderPath) {
      return NextResponse.json({ error: 'folderPath is required' }, { status: 400 });
    }

    const resolved = path.resolve(folderPath);

    let stat;
    try {
      stat = await fs.stat(resolved);
    } catch {
      return NextResponse.json({ error: `Folder not found: ${resolved}` }, { status: 404 });
    }

    if (!stat.isDirectory()) {
      return NextResponse.json({ error: `Not a directory: ${resolved}` }, { status: 400 });
    }

    const entries = await fs.readdir(resolved, { withFileTypes: true });
    const files: ScannedFile[] = [];

    for (const entry of entries) {
      if (!entry.isFile()) continue;
      const ext = path.extname(entry.name).toLowerCase();
      const filePath = path.join(resolved, entry.name);
      const fileStat = await fs.stat(filePath);

      if (IMAGE_EXTENSIONS.has(ext)) {
        files.push({ name: entry.name, path: filePath, type: 'image', size: fileStat.size });
      } else if (LISTING_EXTENSIONS.has(ext)) {
        files.push({ name: entry.name, path: filePath, type: 'listing', size: fileStat.size });
      }
    }

    const images = files.filter((f) => f.type === 'image');
    const listings = files.filter((f) => f.type === 'listing');

    return NextResponse.json({
      folder: resolved,
      images,
      listings,
      totalFiles: entries.length,
    });
  } catch (err) {
    const msg = (err as Error).message;
    console.error('[scan-folder] error:', msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

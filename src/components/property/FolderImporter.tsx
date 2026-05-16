'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { PHOTO_CATEGORY_LABELS, type PhotoCategory } from '@/types/photo';

interface ImportedPhoto {
  id: string;
  url: string;
  category: string;
  name: string;
}

type Status = 'idle' | 'scanning' | 'scanned' | 'importing' | 'done' | 'error';

interface ScanResult {
  folder: string;
  images: { name: string; path: string; size: number }[];
  listings: { name: string; path: string; size: number }[];
}

interface ImportResult {
  propertyId: string;
  propertyName: string;
  listingParsed: boolean;
  photos: ImportedPhoto[];
}

interface Props {
  projectId: string;
  locale: string;
  defaultFolder?: string;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function FolderImporter({ projectId, locale, defaultFolder = '' }: Props) {
  const router = useRouter();
  const [folderPath, setFolderPath] = useState(defaultFolder);
  const [status, setStatus] = useState<Status>('idle');
  const [error, setError] = useState('');
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [progress, setProgress] = useState('');

  async function handleScan() {
    if (!folderPath.trim()) {
      setError('Enter a folder path');
      return;
    }
    setStatus('scanning');
    setError('');

    try {
      const res = await fetch('/api/import/scan-folder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ folderPath: folderPath.trim() }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      setScanResult(json);
      setStatus('scanned');
    } catch (err) {
      setError((err as Error).message);
      setStatus('error');
    }
  }

  async function handleImport() {
    if (!scanResult) return;
    setStatus('importing');
    setError('');
    setProgress('Parsing listing and classifying photos with AI...');

    try {
      const res = await fetch('/api/import/process-folder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ folderPath: folderPath.trim(), projectId }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      setImportResult(json);
      setStatus('done');
    } catch (err) {
      setError((err as Error).message);
      setStatus('error');
    }
  }

  if (status === 'done' && importResult) {
    return (
      <div className="space-y-6">
        <div className="rounded-xl border border-green-200 bg-green-50 p-6 text-center space-y-3">
          <div className="text-4xl">✓</div>
          <h2 className="text-lg font-semibold text-green-900">{importResult.propertyName}</h2>
          <p className="text-sm text-green-700">
            {importResult.listingParsed ? 'Listing parsed' : 'No listing file found'} · {importResult.photos.length} photos classified and uploaded
          </p>
        </div>

        {importResult.photos.length > 0 && (
          <div className="grid grid-cols-4 gap-2">
            {importResult.photos.map((p) => (
              <div key={p.id} className="relative group">
                <div className="aspect-video rounded-lg overflow-hidden bg-stone-100">
                  <img src={p.url} alt={p.name} className="w-full h-full object-cover" />
                </div>
                <span className="absolute bottom-1 left-1 px-1.5 py-0.5 bg-black/60 text-white text-[10px] rounded">
                  {PHOTO_CATEGORY_LABELS[p.category as PhotoCategory] ?? p.category}
                </span>
              </div>
            ))}
          </div>
        )}

        <button
          onClick={() => router.push(`/${locale}/property/${importResult.propertyId}`)}
          className="w-full py-3 bg-amber-600 text-white text-sm font-medium rounded-lg hover:bg-amber-700 transition-colors"
        >
          Open Property →
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h2 className="text-xl font-semibold text-stone-900">Import from folder</h2>
        <p className="text-sm text-stone-500">
          Point to a folder containing the listing HTML file and property photos.
          The AI will parse the listing and classify each photo automatically.
        </p>
      </div>

      {/* Folder path input */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-stone-700">Folder path</label>
        <div className="flex gap-2">
          <input
            type="text"
            value={folderPath}
            onChange={(e) => setFolderPath(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleScan()}
            placeholder="C:\Users\you\Downloads\casale-umbria"
            className="flex-1 px-3 py-2.5 bg-white border border-stone-200 rounded-lg text-sm text-stone-900 placeholder:text-stone-300 focus:outline-none focus:ring-2 focus:ring-amber-400"
            disabled={status === 'importing'}
          />
          <button
            onClick={handleScan}
            disabled={status === 'scanning' || status === 'importing'}
            className="px-5 py-2.5 text-sm font-medium bg-stone-800 text-white rounded-lg hover:bg-stone-900 disabled:opacity-50 transition-colors"
          >
            {status === 'scanning' ? 'Scanning...' : 'Scan'}
          </button>
        </div>
      </div>

      {/* Scan results */}
      {scanResult && status === 'scanned' && (
        <div className="rounded-xl border border-stone-200 overflow-hidden">
          <div className="px-5 py-3 bg-stone-50 border-b border-stone-100">
            <p className="text-sm font-medium text-stone-700">
              Found {scanResult.images.length} photos and {scanResult.listings.length} listing file{scanResult.listings.length !== 1 ? 's' : ''}
            </p>
          </div>
          <div className="px-5 py-4 space-y-3">
            {scanResult.listings.length > 0 && (
              <div className="space-y-1">
                <p className="text-xs font-medium text-stone-500 uppercase tracking-wider">Listing</p>
                {scanResult.listings.map((f) => (
                  <div key={f.name} className="flex items-center gap-2 text-sm text-stone-700">
                    <span className="text-amber-600">📄</span>
                    <span>{f.name}</span>
                    <span className="text-xs text-stone-400">{formatBytes(f.size)}</span>
                  </div>
                ))}
              </div>
            )}

            {scanResult.listings.length === 0 && (
              <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-100 rounded-lg">
                <span className="text-amber-600 mt-0.5">ℹ</span>
                <p className="text-xs text-amber-800">
                  No HTML/MHTML listing file found. The property will be created with photos only — you can add listing details manually.
                </p>
              </div>
            )}

            {scanResult.images.length > 0 && (
              <div className="space-y-1">
                <p className="text-xs font-medium text-stone-500 uppercase tracking-wider">
                  Photos ({scanResult.images.length})
                </p>
                <div className="flex flex-wrap gap-1">
                  {scanResult.images.map((f) => (
                    <span key={f.name} className="px-2 py-1 bg-stone-100 text-stone-600 text-xs rounded">
                      {f.name}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <button
              onClick={handleImport}
              disabled={scanResult.images.length === 0 && scanResult.listings.length === 0}
              className="w-full mt-2 py-3 bg-amber-600 text-white text-sm font-medium rounded-lg hover:bg-amber-700 disabled:opacity-50 transition-colors"
            >
              Import — Parse Listing + Classify & Upload Photos
            </button>
          </div>
        </div>
      )}

      {/* Import progress */}
      {status === 'importing' && (
        <div className="flex items-center gap-3 py-4 px-5 bg-amber-50 rounded-xl border border-amber-100">
          <div className="w-5 h-5 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
          <div>
            <p className="text-sm font-medium text-amber-900">Importing property...</p>
            <p className="text-xs text-amber-700">{progress}</p>
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="py-3 px-4 bg-red-50 rounded-lg border border-red-100">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}
    </div>
  );
}

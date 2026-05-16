'use client';

import { useRef, useState } from 'react';

export type PrefillData = {
  name: string;
  listing_url: string;
  listing_source: string;
  listed_price: string;
  commune: string;
  province: string;
  region: string;
  lat: string;
  lng: string;
  sqm_house: string;
  sqm_land: string;
  num_bedrooms: string;
  num_bathrooms: string;
  year_built: string;
  energy_class: string;
  has_olive_grove: boolean;
  olive_tree_count: string;
  has_vineyard: boolean;
  has_outbuildings: boolean;
  outbuilding_sqm: string;
  has_pool: boolean;
  has_pizza_oven: boolean;
  listing_description: string;
  notes: string;
};

interface Props {
  onPrefill: (data: PrefillData) => void;
  onSkip: () => void;
}

type Status = 'idle' | 'parsing' | 'error';

export default function ListingImporter({ onPrefill, onSkip }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<Status>('idle');
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);

  async function handleFile(file: File) {
    setStatus('parsing');
    setError(null);
    const form = new FormData();
    form.append('file', file);
    try {
      const res = await fetch('/api/ai/parse-listing', { method: 'POST', body: form });

      // Guard against HTML error pages (Next.js returns HTML for unhandled 500s)
      const contentType = res.headers.get('content-type') ?? '';
      if (!contentType.includes('application/json')) {
        throw new Error(`Server error (${res.status}) — check the server console`);
      }

      const json = await res.json();
      if (!res.ok || !json.prefill) throw new Error(json.error ?? 'Parse failed');
      onPrefill(json.prefill as PrefillData);
    } catch (err) {
      setStatus('error');
      setError(err instanceof Error ? err.message : 'Something went wrong — try entering details manually');
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  }

  const isParsing = status === 'parsing';

  return (
    <div className="space-y-5">
      <div
        onDrop={handleDrop}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onClick={() => !isParsing && fileInputRef.current?.click()}
        className={[
          'border-2 border-dashed rounded-xl p-10 text-center transition-colors',
          isParsing
            ? 'border-amber-300 bg-amber-50 cursor-default'
            : dragging
            ? 'border-amber-500 bg-amber-100 cursor-copy'
            : 'border-amber-300 bg-amber-50 hover:bg-amber-100 hover:border-amber-400 cursor-pointer',
        ].join(' ')}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".mhtml,.mht,.html,.htm"
          className="hidden"
          onChange={handleChange}
        />

        {isParsing ? (
          <div className="space-y-3">
            <div className="w-8 h-8 border-2 border-amber-600 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-sm font-medium text-amber-900">Parsing listing…</p>
            <p className="text-xs text-stone-500">Claude is extracting the property details</p>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="text-4xl select-none">📄</div>
            <div>
              <p className="text-sm font-semibold text-stone-800">Drop your saved listing file here</p>
              <p className="text-xs text-stone-500 mt-1">
                or click to browse
              </p>
            </div>
            <p className="text-xs text-stone-400 leading-relaxed">
              In Chrome or Edge: open the listing page → File → Save as →{' '}
              <span className="font-medium">Webpage, Single File (.mhtml)</span>
              <br />
              Works with Immobiliare.it · Idealista · Gate-Away
            </p>
          </div>
        )}
      </div>

      {status === 'error' && error && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="flex items-center gap-3">
        <div className="flex-1 h-px bg-stone-200" />
        <span className="text-xs text-stone-400">or</span>
        <div className="flex-1 h-px bg-stone-200" />
      </div>

      <button
        onClick={onSkip}
        disabled={isParsing}
        className="w-full py-2.5 rounded-lg border border-stone-300 text-sm text-stone-600 hover:bg-stone-50 hover:text-stone-900 disabled:opacity-40 transition-colors"
      >
        Enter property details manually
      </button>
    </div>
  );
}

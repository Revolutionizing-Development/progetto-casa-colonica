'use client';

import { useState, useCallback } from 'react';
import { deleteRendering } from '@/app/actions/renderings';
import BeforeAfterSlider from '@/components/rendering/BeforeAfterSlider';
import type { Rendering, RenderingType } from '@/types/rendering';
import type { RenovationScenario } from '@/types/renovation';

const TYPE_LABELS: Record<RenderingType, string> = {
  exterior_front: 'Exterior (front)',
  exterior_rear: 'Exterior (rear)',
  courtyard: 'Courtyard',
  interior_living: 'Living room',
  interior_kitchen: 'Kitchen',
  interior_airbnb: 'Guest apartment',
  aerial: 'Aerial view',
};

const RENDERING_TYPES: RenderingType[] = [
  'exterior_front', 'exterior_rear', 'courtyard',
  'interior_living', 'interior_kitchen', 'interior_airbnb', 'aerial',
];

interface PropertyPhoto {
  id: string;
  url: string;
  category: string;
}

interface Props {
  propertyId: string;
  scenarios: RenovationScenario[];
  initialRenderings: Rendering[];
  photos: PropertyPhoto[];
}

export default function RenderingsPanel({ propertyId, scenarios, initialRenderings, photos }: Props) {
  const [renderings, setRenderings] = useState(initialRenderings);
  const [selectedScenarioId, setSelectedScenarioId] = useState(scenarios[0]?.id ?? '');
  const [selectedType, setSelectedType] = useState<RenderingType>('exterior_front');
  const [selectedPhotoUrl, setSelectedPhotoUrl] = useState(photos[0]?.url ?? '');
  const [additionalInstructions, setAdditionalInstructions] = useState('');
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');

  const scenarioRenderings = renderings.filter((r) => r.scenario_id === selectedScenarioId);

  const handleGenerate = useCallback(async () => {
    if (!selectedScenarioId) {
      setError('Select a renovation scenario first — renderings must reflect your configured scope (Constitution N6).');
      return;
    }
    if (!selectedPhotoUrl) {
      setError('Select a source photo — per Constitution N6, renderings use the original photo as canvas.');
      return;
    }
    setGenerating(true);
    setError('');

    try {
      const res = await fetch('/api/ai/renderings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          propertyId,
          scenarioId: selectedScenarioId,
          type: selectedType,
          sourcePhotoUrl: selectedPhotoUrl,
          additionalInstructions: additionalInstructions || undefined,
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? 'Generation failed');
      } else {
        setRenderings((prev) => [json.data, ...prev]);
        setAdditionalInstructions('');
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setGenerating(false);
    }
  }, [propertyId, selectedScenarioId, selectedType, selectedPhotoUrl, additionalInstructions]);

  async function handleDelete(id: string) {
    const result = await deleteRendering(id);
    if (!result.error) {
      setRenderings((prev) => prev.filter((r) => r.id !== id));
    }
  }

  if (scenarios.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-stone-300 p-12 text-center space-y-3">
        <div className="text-4xl">🎨</div>
        <h2 className="text-base font-semibold text-stone-700">Generate scenarios first</h2>
        <p className="text-sm text-stone-500 max-w-md mx-auto">
          Per Constitution N6, renderings must reflect your configured renovation scope. Generate Basic and Lifestyle scenarios on the Scenarios tab first.
        </p>
      </div>
    );
  }

  if (photos.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-stone-300 p-12 text-center space-y-3">
        <div className="text-4xl">📷</div>
        <h2 className="text-base font-semibold text-stone-700">Upload photos first</h2>
        <p className="text-sm text-stone-500 max-w-md mx-auto">
          Per Constitution N6, renderings edit your original photos — the camera angle, building footprint, and surroundings stay the same. Upload property photos on the Overview tab first.
        </p>
      </div>
    );
  }

  return (
    <section className="space-y-8">
      {/* Generation controls */}
      <div className="rounded-xl border border-stone-200 bg-white overflow-hidden">
        <div className="px-5 py-3 border-b border-stone-100 bg-stone-50">
          <h3 className="text-sm font-semibold text-stone-700">Generate rendering</h3>
          <p className="text-xs text-stone-400 mt-0.5">
            Select a source photo and renovation scenario — the AI will edit the photo to show your renovation applied.
          </p>
        </div>
        <div className="px-5 py-4 space-y-4">
          {/* Source photo selection */}
          <div>
            <label className="block text-xs text-stone-500 mb-2">Source photo (the "before" image)</label>
            <div className="flex gap-2 overflow-x-auto pb-2">
              {photos.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setSelectedPhotoUrl(p.url)}
                  className={`shrink-0 w-24 h-16 rounded-lg overflow-hidden border-2 transition-colors ${
                    selectedPhotoUrl === p.url
                      ? 'border-amber-500 ring-2 ring-amber-200'
                      : 'border-stone-200 hover:border-stone-300'
                  }`}
                >
                  <img src={p.url} alt={p.category} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs text-stone-500 mb-1">Renovation scenario</label>
              <select
                value={selectedScenarioId}
                onChange={(e) => setSelectedScenarioId(e.target.value)}
                className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm"
              >
                {scenarios.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-stone-500 mb-1">View type</label>
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value as RenderingType)}
                className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm"
              >
                {RENDERING_TYPES.map((t) => (
                  <option key={t} value={t}>{TYPE_LABELS[t]}</option>
                ))}
              </select>
            </div>
            <div className="flex items-end">
              <button
                onClick={handleGenerate}
                disabled={generating}
                className="w-full px-4 py-2 bg-amber-600 text-white text-sm font-medium rounded-lg hover:bg-amber-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {generating ? 'Editing photo...' : 'Generate Rendering'}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs text-stone-500 mb-1">Additional instructions (optional)</label>
            <input
              value={additionalInstructions}
              onChange={(e) => setAdditionalInstructions(e.target.value)}
              placeholder="e.g., Focus on restoring the stone walls, add evening lighting..."
              className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm"
            />
          </div>

          {generating && (
            <div className="flex items-center gap-3 py-3 px-4 bg-amber-50 rounded-lg border border-amber-100">
              <div className="w-4 h-4 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-sm text-amber-700">
                Editing your {TYPE_LABELS[selectedType].toLowerCase()} photo with renovation changes — this typically takes 30-60 seconds...
              </p>
            </div>
          )}

          {error && (
            <div className="py-3 px-4 bg-red-50 rounded-lg border border-red-100">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}
        </div>
      </div>

      {/* Scenario filter tabs */}
      {scenarios.length > 1 && (
        <div className="flex gap-2">
          {scenarios.map((s) => (
            <button
              key={s.id}
              onClick={() => setSelectedScenarioId(s.id)}
              className={`px-4 py-1.5 text-sm rounded-full border transition-colors ${
                selectedScenarioId === s.id
                  ? 'bg-amber-600 text-white border-amber-600'
                  : 'bg-white text-stone-600 border-stone-200 hover:border-stone-300'
              }`}
            >
              {s.name}
              <span className="ml-1.5 text-xs opacity-70">
                ({renderings.filter((r) => r.scenario_id === s.id).length})
              </span>
            </button>
          ))}
        </div>
      )}

      {/* Rendering grid — before/after sliders */}
      {scenarioRenderings.length === 0 ? (
        <div className="rounded-xl border border-dashed border-stone-200 p-10 text-center">
          <p className="text-stone-400 text-sm">
            No renderings yet for this scenario. Select a photo and generate your first one above.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {scenarioRenderings.map((r) => (
            <RenderingCard
              key={r.id}
              rendering={r}
              onDelete={() => handleDelete(r.id)}
            />
          ))}
        </div>
      )}

      {/* All renderings count */}
      {renderings.length > 0 && (
        <p className="text-xs text-stone-400 text-center">
          {renderings.length} total rendering{renderings.length !== 1 ? 's' : ''} across all scenarios
        </p>
      )}

      <p className="text-xs text-stone-400">
        Renderings are AI-edited versions of your original photos, showing how the property could look after renovation. The camera angle, building footprint, and surroundings are preserved from the original. Actual results will vary.
      </p>
    </section>
  );
}

function RenderingCard({
  rendering,
  onDelete,
}: {
  rendering: Rendering;
  onDelete: () => void;
}) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const hasSourcePhoto = !!rendering.source_photo_url;

  return (
    <div className="rounded-xl border border-stone-200 overflow-hidden bg-white">
      {/* Before/After Slider or standalone image */}
      {hasSourcePhoto ? (
        <BeforeAfterSlider
          beforeUrl={rendering.source_photo_url!}
          afterUrl={rendering.image_url}
        />
      ) : (
        <div className="relative aspect-[3/2] bg-stone-100">
          <img
            src={rendering.image_url}
            alt={`${TYPE_LABELS[rendering.type]} rendering`}
            className="w-full h-full object-cover"
          />
        </div>
      )}

      {/* Metadata bar */}
      <div className="px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 bg-stone-100 text-stone-600 text-xs rounded-full">
            {TYPE_LABELS[rendering.type]}
          </span>
          {rendering.is_inpainted && (
            <span className="px-2 py-0.5 bg-amber-50 text-amber-700 text-xs rounded-full border border-amber-200">
              Inpainted
            </span>
          )}
          <p className="text-xs text-stone-400">
            {new Date(rendering.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <a
            href={rendering.image_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-stone-500 hover:text-stone-700"
          >
            Open
          </a>
          {confirmDelete ? (
            <div className="flex gap-1">
              <button onClick={onDelete} className="text-xs text-red-600 font-medium">Confirm</button>
              <button onClick={() => setConfirmDelete(false)} className="text-xs text-stone-400">Cancel</button>
            </div>
          ) : (
            <button onClick={() => setConfirmDelete(true)} className="text-xs text-stone-400 hover:text-red-500">
              Delete
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

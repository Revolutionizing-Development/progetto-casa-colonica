'use client';

import { useState, useCallback } from 'react';
import { deleteRendering } from '@/app/actions/renderings';
import BeforeAfterSlider from '@/components/rendering/BeforeAfterSlider';
import type { Rendering, RenderingType } from '@/types/rendering';
import type { RenovationScenario } from '@/types/renovation';
import type { PhotoCategory } from '@/types/photo';
import { PHOTO_CATEGORY_LABELS } from '@/types/photo';

const TYPE_LABELS: Record<RenderingType, string> = {
  exterior_front: 'Exterior (front)',
  exterior_rear: 'Exterior (rear)',
  courtyard: 'Courtyard',
  interior_living: 'Living room',
  interior_kitchen: 'Kitchen',
  interior_airbnb: 'Guest apartment',
  aerial: 'Aerial view',
};

/** Map photo classification → rendering type. Null = not renderable. */
const PHOTO_TO_RENDERING: Record<PhotoCategory, RenderingType | null> = {
  aerial: 'aerial',
  exterior_front: 'exterior_front',
  exterior_rear: 'exterior_rear',
  courtyard: 'courtyard',
  interior_living: 'interior_living',
  interior_kitchen: 'interior_kitchen',
  interior_bedroom: 'interior_airbnb',
  interior_bathroom: 'interior_living',
  land: 'aerial',
  outbuilding: 'exterior_front',
  roof: null,
  detail: null,
};

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
  const [selectedPhotoId, setSelectedPhotoId] = useState(photos[0]?.id ?? '');
  const [overrideType, setOverrideType] = useState<RenderingType | null>(null);
  const [showReclassify, setShowReclassify] = useState(false);
  const [additionalInstructions, setAdditionalInstructions] = useState('');
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');

  const selectedPhoto = photos.find((p) => p.id === selectedPhotoId);
  const photoCategory = (selectedPhoto?.category ?? 'exterior_front') as PhotoCategory;
  const autoDetectedType = PHOTO_TO_RENDERING[photoCategory];
  const renderingType = overrideType ?? autoDetectedType;
  const isRenderable = renderingType !== null;

  const scenarioRenderings = renderings.filter((r) => r.scenario_id === selectedScenarioId);

  function handleSelectPhoto(photo: PropertyPhoto) {
    setSelectedPhotoId(photo.id);
    setOverrideType(null);
    setShowReclassify(false);
  }

  const handleGenerate = useCallback(async () => {
    if (!selectedScenarioId) {
      setError('Select a renovation scenario first — renderings must reflect your configured scope (Constitution N6).');
      return;
    }
    if (!selectedPhoto) {
      setError('Select a source photo — per Constitution N6, renderings use the original photo as canvas.');
      return;
    }
    if (!renderingType) {
      setError('This photo type cannot be rendered. Select a different photo.');
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
          type: renderingType,
          sourcePhotoUrl: selectedPhoto.url,
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
  }, [propertyId, selectedScenarioId, renderingType, selectedPhoto, additionalInstructions]);

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
            <label className="block text-xs text-stone-500 mb-2">Source photo (the &quot;before&quot; image)</label>
            <div className="flex gap-2 overflow-x-auto pb-2">
              {photos.map((p) => {
                const cat = p.category as PhotoCategory;
                const canRender = PHOTO_TO_RENDERING[cat] !== null;
                return (
                  <button
                    key={p.id}
                    onClick={() => handleSelectPhoto(p)}
                    className={`shrink-0 relative rounded-lg overflow-hidden border-2 transition-colors ${
                      selectedPhotoId === p.id
                        ? 'border-amber-500 ring-2 ring-amber-200'
                        : canRender
                        ? 'border-stone-200 hover:border-stone-300'
                        : 'border-stone-200 opacity-50'
                    }`}
                  >
                    <img src={p.url} alt={p.category} className="w-24 h-16 object-cover" />
                    <span className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-[9px] px-1 py-0.5 text-center truncate">
                      {PHOTO_CATEGORY_LABELS[cat] ?? p.category}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Auto-detected type label */}
          {selectedPhoto && (
            <div className="flex items-center gap-3">
              <span className="text-xs text-stone-500">Detected type:</span>
              <span className={`text-xs font-semibold px-2 py-0.5 rounded ${isRenderable ? 'bg-amber-50 text-amber-700 border border-amber-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                {isRenderable
                  ? TYPE_LABELS[renderingType!]
                  : `${PHOTO_CATEGORY_LABELS[photoCategory]} — not renderable`}
              </span>
              {isRenderable && !showReclassify && (
                <button
                  onClick={() => setShowReclassify(true)}
                  className="text-xs text-stone-400 hover:text-stone-600 underline"
                >
                  Reclassify
                </button>
              )}
              {showReclassify && (
                <select
                  value={overrideType ?? ''}
                  onChange={(e) => {
                    const v = e.target.value as RenderingType;
                    setOverrideType(v || null);
                    if (!v) setShowReclassify(false);
                  }}
                  className="text-xs border border-stone-300 rounded px-2 py-1"
                >
                  <option value="">Auto ({TYPE_LABELS[autoDetectedType!] ?? 'none'})</option>
                  {(Object.keys(TYPE_LABELS) as RenderingType[]).map((t) => (
                    <option key={t} value={t}>{TYPE_LABELS[t]}</option>
                  ))}
                </select>
              )}
            </div>
          )}

          {/* Not renderable warning */}
          {selectedPhoto && !isRenderable && (
            <div className="p-3 bg-stone-50 border border-stone-200 rounded-lg">
              <p className="text-sm text-stone-600">
                <strong>{PHOTO_CATEGORY_LABELS[photoCategory]}</strong> photos cannot be rendered.
                Select a facade, aerial, courtyard, interior, or land photo instead.
              </p>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
            <div className="flex items-end">
              <button
                onClick={handleGenerate}
                disabled={generating || !isRenderable}
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
                Editing your {renderingType ? TYPE_LABELS[renderingType].toLowerCase() : ''} photo with renovation changes — this typically takes 30-60 seconds...
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

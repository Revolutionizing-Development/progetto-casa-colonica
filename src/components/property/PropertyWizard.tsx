'use client';

import { useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createProperty, type PropertyInput } from '@/app/actions/properties';
import { ITALIAN_REGIONS } from '@/config/regions';

const ENERGY_CLASSES = ['A4', 'A3', 'A2', 'A1', 'B', 'C', 'D', 'E', 'F', 'G'] as const;
const LISTING_SOURCES = ['Idealista', 'Immobiliare.it', 'Gate-Away', 'Grimaldi', 'Direct', 'Agent', 'Other'];

import { PHOTO_CATEGORY_LABELS, type PhotoCategory } from '@/types/photo';

interface PendingPhoto {
  file: File;
  preview: string;
  category: PhotoCategory;
  classifying?: boolean;
}

interface WizardData {
  // Step 1 — Listing basics
  name: string;
  listing_url: string;
  listing_source: string;
  listed_price: string;
  // Step 2 — Location
  commune: string;
  province: string;
  region: string;
  lat: string;
  lng: string;
  // Step 3 — Building details
  sqm_house: string;
  sqm_land: string;
  num_bedrooms: string;
  num_bathrooms: string;
  year_built: string;
  energy_class: string;
  // Step 4 — Land & features
  has_olive_grove: boolean;
  olive_tree_count: string;
  has_vineyard: boolean;
  has_outbuildings: boolean;
  outbuilding_sqm: string;
  has_pool: boolean;
  has_pizza_oven: boolean;
  // Step 5 — Description
  listing_description: string;
  notes: string;
}

const INITIAL_DATA: WizardData = {
  name: '', listing_url: '', listing_source: '', listed_price: '',
  commune: '', province: '', region: '', lat: '', lng: '',
  sqm_house: '', sqm_land: '', num_bedrooms: '', num_bathrooms: '',
  year_built: '', energy_class: '',
  has_olive_grove: false, olive_tree_count: '',
  has_vineyard: false, has_outbuildings: false, outbuilding_sqm: '',
  has_pool: false, has_pizza_oven: false,
  listing_description: '', notes: '',
};

function computeCompleteness(d: WizardData, photos: PendingPhoto[]): number {
  let score = 0;
  if (d.name.trim()) score += 5;
  if (d.listed_price && parseInt(d.listed_price) > 0) score += 8;
  if (d.commune.trim() && d.province.trim() && d.region) score += 10;
  if (d.lat && d.lng) score += 5;
  if (d.sqm_house && parseInt(d.sqm_house) > 0) score += 6;
  if (d.sqm_land && parseInt(d.sqm_land) > 0) score += 6;
  if (d.num_bedrooms) score += 3;
  if (d.num_bathrooms) score += 2;
  if (d.year_built) score += 4;
  if (d.energy_class) score += 5;
  score += 5;
  if (d.listing_description.trim()) score += 5;
  if (photos.length > 0) score += 16;
  if (photos.length >= 5) score += 10;
  if (photos.length >= 10) score += 10;
  return Math.min(score, 100);
}

export type { WizardData };

interface Props {
  projectId: string;
  locale: string;
  initialData?: Partial<WizardData>;
}

export default function PropertyWizard({ projectId, locale, initialData }: Props) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [data, setData] = useState<WizardData>({ ...INITIAL_DATA, ...initialData });
  const [photos, setPhotos] = useState<PendingPhoto[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [classifying, setClassifying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const completeness = computeCompleteness(data, photos);

  const set = useCallback(<K extends keyof WizardData>(key: K, value: WizardData[K]) => {
    setData((prev) => ({ ...prev, [key]: value }));
  }, []);

  const addPhotos = useCallback(
    async (files: FileList | null) => {
      if (!files || files.length === 0) return;
      const incoming: PendingPhoto[] = Array.from(files).map((file) => ({
        file,
        preview: URL.createObjectURL(file),
        category: 'exterior_front' as PhotoCategory,
        classifying: true,
      }));
      const startIdx = photos.length;
      setPhotos((prev) => [...prev, ...incoming]);

      setClassifying(true);
      try {
        const formData = new FormData();
        for (const file of Array.from(files)) {
          formData.append('photos', file);
        }
        const res = await fetch('/api/ai/classify-photos', {
          method: 'POST',
          body: formData,
        });
        const json = await res.json();
        if (res.ok && json.classifications) {
          setPhotos((prev) =>
            prev.map((p, i) => {
              const classIdx = i - startIdx;
              const cls = json.classifications.find(
                (c: { index: number; category: PhotoCategory }) => c.index === classIdx,
              );
              if (cls) return { ...p, category: cls.category, classifying: false };
              return { ...p, classifying: false };
            }),
          );
        } else {
          setPhotos((prev) => prev.map((p) => ({ ...p, classifying: false })));
        }
      } catch {
        setPhotos((prev) => prev.map((p) => ({ ...p, classifying: false })));
      } finally {
        setClassifying(false);
      }
    },
    [photos.length],
  );

  const removePhoto = useCallback((preview: string) => {
    setPhotos((prev) => prev.filter((p) => p.preview !== preview));
  }, []);

  async function handleSubmit() {
    setSubmitting(true);
    setError(null);

    const input: PropertyInput = {
      project_id: projectId,
      name: data.name.trim() || 'Untitled Property',
      listing_url: data.listing_url.trim() || undefined,
      listing_source: data.listing_source || undefined,
      listed_price: parseInt(data.listed_price) || 0,
      sqm_house: parseInt(data.sqm_house) || 0,
      sqm_land: parseInt(data.sqm_land) || 0,
      num_bedrooms: data.num_bedrooms ? parseInt(data.num_bedrooms) : null,
      num_bathrooms: data.num_bathrooms ? parseInt(data.num_bathrooms) : null,
      year_built: data.year_built ? parseInt(data.year_built) : null,
      energy_class: (data.energy_class as PropertyInput['energy_class']) || null,
      has_olive_grove: data.has_olive_grove,
      olive_tree_count: data.olive_tree_count ? parseInt(data.olive_tree_count) : null,
      has_vineyard: data.has_vineyard,
      has_outbuildings: data.has_outbuildings,
      outbuilding_sqm: data.outbuilding_sqm ? parseInt(data.outbuilding_sqm) : null,
      has_pool: data.has_pool,
      has_pizza_oven: data.has_pizza_oven,
      commune: data.commune.trim() || undefined,
      province: data.province.trim() || undefined,
      region: data.region || undefined,
      lat: data.lat ? parseFloat(data.lat) : null,
      lng: data.lng ? parseFloat(data.lng) : null,
      listing_description: data.listing_description.trim() || undefined,
      notes: data.notes.trim() || undefined,
    };

    const result = await createProperty(input);

    if (result.error || !result.data) {
      setError(result.error ?? 'Failed to create property');
      setSubmitting(false);
      return;
    }

    const propertyId = result.data.id;

    // Upload photos in parallel (up to 5 at a time)
    const uploadPhoto = async (photo: PendingPhoto) => {
      const fd = new FormData();
      fd.append('file', photo.file);
      fd.append('propertyId', propertyId);
      fd.append('category', photo.category);
      await fetch('/api/upload', { method: 'POST', body: fd });
    };

    const chunks = [];
    for (let i = 0; i < photos.length; i += 5) {
      chunks.push(photos.slice(i, i + 5));
    }
    for (const chunk of chunks) {
      await Promise.all(chunk.map(uploadPhoto));
    }

    router.push(`/${locale}/property/${propertyId}`);
  }

  const steps = [
    'Listing Basics',
    'Location',
    'Building Details',
    'Land & Features',
    'Description',
    'Photos',
    'Review',
  ];

  return (
    <div className="max-w-2xl mx-auto">
      {/* Progress bar */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-stone-500">
            Step {step} of {steps.length} — {steps[step - 1]}
          </span>
          <CompletenessIndicator score={completeness} />
        </div>
        <div className="h-1.5 bg-stone-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-amber-600 rounded-full transition-all duration-300"
            style={{ width: `${(step / steps.length) * 100}%` }}
          />
        </div>
        <div className="flex mt-2 gap-1">
          {steps.map((_, i) => (
            <div
              key={i}
              className={`flex-1 h-0.5 rounded-full transition-colors ${
                i < step ? 'bg-amber-600' : 'bg-stone-100'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Step content */}
      <div className="bg-white rounded-xl border border-stone-200 p-8 shadow-sm min-h-[400px]">
        {step === 1 && <Step1Listing data={data} set={set} />}
        {step === 2 && <Step2Location data={data} set={set} />}
        {step === 3 && <Step3Building data={data} set={set} />}
        {step === 4 && <Step4Features data={data} set={set} />}
        {step === 5 && <Step5Description data={data} set={set} />}
        {step === 6 && (
          <StepAllPhotos
            photos={photos}
            addPhotos={addPhotos}
            removePhoto={removePhoto}
            updateCategory={(preview, category) =>
              setPhotos((prev) =>
                prev.map((p) => (p.preview === preview ? { ...p, category } : p)),
              )
            }
            fileInputRef={fileInputRef}
            classifying={classifying}
          />
        )}
        {step === 7 && (
          <Step9Review data={data} photos={photos} completeness={completeness} />
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Navigation */}
      <div className="mt-6 flex items-center justify-between">
        <button
          onClick={() => setStep((s) => s - 1)}
          disabled={step === 1}
          className="px-5 py-2.5 text-sm text-stone-600 border border-stone-200 rounded-lg hover:bg-stone-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          Back
        </button>

        {step < steps.length ? (
          <button
            onClick={() => setStep((s) => s + 1)}
            className="px-5 py-2.5 text-sm font-medium bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors"
          >
            Continue →
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="px-6 py-2.5 text-sm font-medium bg-amber-600 text-white rounded-lg hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {submitting ? 'Creating property…' : 'Create Property'}
          </button>
        )}
      </div>
    </div>
  );
}

// ── Step components ─────────────────────────────────────────────────────────

interface StepProps {
  data: WizardData;
  set: <K extends keyof WizardData>(key: K, value: WizardData[K]) => void;
}

function Step1Listing({ data, set }: StepProps) {
  return (
    <div className="space-y-6">
      <StepHeader
        title="Listing Basics"
        subtitle="Start with the core listing details. You can update these later."
      />
      <Field label="Property Name" required hint='Give this property a memorable name, e.g. "Umbria Farmhouse — Assisi"'>
        <input
          type="text"
          value={data.name}
          onChange={(e) => set('name', e.target.value)}
          placeholder="Umbria Farmhouse — Assisi"
          className={inputClass}
        />
      </Field>
      <Field label="Listing URL" hint="Paste the URL from Idealista, Immobiliare, or Gate-Away">
        <input
          type="url"
          value={data.listing_url}
          onChange={(e) => set('listing_url', e.target.value)}
          placeholder="https://www.idealista.it/…"
          className={inputClass}
        />
      </Field>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Source">
          <select
            value={data.listing_source}
            onChange={(e) => set('listing_source', e.target.value)}
            className={inputClass}
          >
            <option value="">Select source</option>
            {LISTING_SOURCES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </Field>
        <Field label="Listed Price (€)" required>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 text-sm">€</span>
            <input
              type="number"
              min={0}
              step={1000}
              value={data.listed_price}
              onChange={(e) => set('listed_price', e.target.value)}
              placeholder="280000"
              className={inputClass + ' pl-7'}
            />
          </div>
        </Field>
      </div>
    </div>
  );
}

function Step2Location({ data, set }: StepProps) {
  return (
    <div className="space-y-6">
      <StepHeader
        title="Location"
        subtitle="Where is this property? Commune and region feed into the regulatory risk assessment."
      />
      <div className="grid grid-cols-2 gap-4">
        <Field label="Commune" required hint="The Italian municipality (comune)">
          <input
            type="text"
            value={data.commune}
            onChange={(e) => set('commune', e.target.value)}
            placeholder="Assisi"
            className={inputClass}
          />
        </Field>
        <Field label="Province" required hint="e.g. PG for Perugia">
          <input
            type="text"
            value={data.province}
            onChange={(e) => set('province', e.target.value)}
            placeholder="PG"
            className={inputClass}
          />
        </Field>
      </div>
      <Field label="Region" required>
        <select
          value={data.region}
          onChange={(e) => set('region', e.target.value)}
          className={inputClass}
        >
          <option value="">Select region</option>
          {ITALIAN_REGIONS.map((r) => (
            <option key={r} value={r}>{r}</option>
          ))}
        </select>
      </Field>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Latitude" hint="Optional — enables map pin">
          <input
            type="number"
            step="any"
            value={data.lat}
            onChange={(e) => set('lat', e.target.value)}
            placeholder="43.0707"
            className={inputClass}
          />
        </Field>
        <Field label="Longitude" hint="Optional — enables map pin">
          <input
            type="number"
            step="any"
            value={data.lng}
            onChange={(e) => set('lng', e.target.value)}
            placeholder="12.6194"
            className={inputClass}
          />
        </Field>
      </div>
      <p className="text-xs text-stone-400">
        Tip: right-click on Google Maps and select &quot;What&apos;s here?&quot; to get coordinates.
      </p>
    </div>
  );
}

function Step3Building({ data, set }: StepProps) {
  return (
    <div className="space-y-6">
      <StepHeader
        title="Building Details"
        subtitle="Key metrics that drive the renovation cost estimate and scoring."
      />
      <div className="grid grid-cols-2 gap-4">
        <Field label="House Size (m²)" required>
          <input
            type="number"
            min={0}
            value={data.sqm_house}
            onChange={(e) => set('sqm_house', e.target.value)}
            placeholder="320"
            className={inputClass}
          />
        </Field>
        <Field label="Land Size (m²)" required>
          <input
            type="number"
            min={0}
            value={data.sqm_land}
            onChange={(e) => set('sqm_land', e.target.value)}
            placeholder="15000"
            className={inputClass}
          />
        </Field>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Bedrooms">
          <input
            type="number"
            min={0}
            max={20}
            value={data.num_bedrooms}
            onChange={(e) => set('num_bedrooms', e.target.value)}
            placeholder="4"
            className={inputClass}
          />
        </Field>
        <Field label="Bathrooms">
          <input
            type="number"
            min={0}
            max={20}
            value={data.num_bathrooms}
            onChange={(e) => set('num_bathrooms', e.target.value)}
            placeholder="2"
            className={inputClass}
          />
        </Field>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Year Built" hint="Approximate is fine">
          <input
            type="number"
            min={1200}
            max={2025}
            value={data.year_built}
            onChange={(e) => set('year_built', e.target.value)}
            placeholder="1850"
            className={inputClass}
          />
        </Field>
        <Field label="Energy Class" hint="From the APE certificate — G = no insulation">
          <select
            value={data.energy_class}
            onChange={(e) => set('energy_class', e.target.value)}
            className={inputClass}
          >
            <option value="">Unknown</option>
            {ENERGY_CLASSES.map((c) => (
              <option key={c} value={c}>
                Class {c}{c === 'G' ? ' — No insulation' : c === 'A4' ? ' — Best' : ''}
              </option>
            ))}
          </select>
        </Field>
      </div>
    </div>
  );
}

function Step4Features({ data, set }: StepProps) {
  return (
    <div className="space-y-6">
      <StepHeader
        title="Land & Features"
        subtitle="These determine farmstead income potential, regulatory path, and layout constraints."
      />
      <div className="space-y-4">
        <ToggleField
          label="Olive Grove"
          checked={data.has_olive_grove}
          onChange={(v) => set('has_olive_grove', v)}
          hint="Olive oil production + agriturismo eligibility"
        />
        {data.has_olive_grove && (
          <Field label="Approximate number of olive trees" className="ml-7">
            <input
              type="number"
              min={1}
              value={data.olive_tree_count}
              onChange={(e) => set('olive_tree_count', e.target.value)}
              placeholder="40"
              className={inputClass + ' max-w-xs'}
            />
          </Field>
        )}
        <ToggleField
          label="Vineyard"
          checked={data.has_vineyard}
          onChange={(v) => set('has_vineyard', v)}
          hint="Wine tasting potential + agriturismo eligibility"
        />
        <ToggleField
          label="Outbuildings / Annex"
          checked={data.has_outbuildings}
          onChange={(v) => set('has_outbuildings', v)}
          hint="Barn, stable, fienile — additional conversion potential"
        />
        {data.has_outbuildings && (
          <Field label="Outbuilding size (m²)" className="ml-7">
            <input
              type="number"
              min={1}
              value={data.outbuilding_sqm}
              onChange={(e) => set('outbuilding_sqm', e.target.value)}
              placeholder="80"
              className={inputClass + ' max-w-xs'}
            />
          </Field>
        )}
        <ToggleField
          label="Pool"
          checked={data.has_pool}
          onChange={(v) => set('has_pool', v)}
          hint="Adds Airbnb premium, adds maintenance cost"
        />
        <ToggleField
          label="Pizza Oven"
          checked={data.has_pizza_oven}
          onChange={(v) => set('has_pizza_oven', v)}
          hint="Enables pizza night experiences — strong Airbnb differentiator"
        />
      </div>
    </div>
  );
}

function Step5Description({ data, set }: StepProps) {
  return (
    <div className="space-y-6">
      <StepHeader
        title="Description & Notes"
        subtitle="Paste the listing description and add your own observations."
      />
      <Field label="Listing Description" hint="Paste directly from Idealista or Immobiliare — AI will read this">
        <textarea
          value={data.listing_description}
          onChange={(e) => set('listing_description', e.target.value)}
          rows={8}
          placeholder="Cascina in pietra del 1800, da ristrutturare…"
          className={inputClass + ' resize-y'}
        />
      </Field>
      <Field label="Your Notes" hint="Personal observations — things that caught your eye, concerns, questions">
        <textarea
          value={data.notes}
          onChange={(e) => set('notes', e.target.value)}
          rows={4}
          placeholder="The photos show the roof needs attention. Great views from the north terrace…"
          className={inputClass + ' resize-y'}
        />
      </Field>
    </div>
  );
}

interface StepAllPhotosProps {
  photos: PendingPhoto[];
  addPhotos: (files: FileList | null) => void;
  removePhoto: (preview: string) => void;
  updateCategory: (preview: string, category: PhotoCategory) => void;
  fileInputRef: React.RefObject<HTMLInputElement>;
  classifying: boolean;
}

function StepAllPhotos({ photos, addPhotos, removePhoto, updateCategory, fileInputRef, classifying }: StepAllPhotosProps) {
  return (
    <div className="space-y-6">
      <StepHeader
        title="Photos"
        subtitle="Drop all photos at once — the AI will classify each as aerial, exterior, interior, etc."
      />

      <label className="block cursor-pointer">
        <div
          className="border-2 border-dashed border-stone-200 rounded-xl p-8 text-center hover:border-amber-400 hover:bg-amber-50/30 transition-colors"
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            addPhotos(e.dataTransfer.files);
          }}
        >
          <div className="text-3xl mb-2">📷</div>
          <p className="text-sm font-medium text-stone-700">Drop all photos here or click to browse</p>
          <p className="text-xs text-stone-400 mt-1">JPEG, PNG, WebP, HEIC · up to 20 MB each · AI auto-classifies</p>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*"
            className="sr-only"
            onChange={(e) => addPhotos(e.target.files)}
          />
        </div>
      </label>

      {classifying && (
        <div className="flex items-center gap-3 py-3 px-4 bg-amber-50 rounded-lg border border-amber-100">
          <div className="w-4 h-4 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-amber-700">Classifying photos with AI...</p>
        </div>
      )}

      {photos.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          {photos.map((photo) => (
            <div key={photo.preview} className="relative group">
              <div className="aspect-video rounded-lg overflow-hidden bg-stone-100">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={photo.preview} alt="" className="w-full h-full object-cover" />
              </div>
              <select
                value={photo.category}
                onChange={(e) => updateCategory(photo.preview, e.target.value as PhotoCategory)}
                className="absolute bottom-1 left-1 px-1.5 py-0.5 bg-black/70 text-white text-[10px] rounded border-0 appearance-auto"
              >
                {Object.entries(PHOTO_CATEGORY_LABELS).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
              <button
                onClick={() => removePhoto(photo.preview)}
                className="absolute top-1.5 right-1.5 w-6 h-6 bg-black/60 text-white rounded-full text-xs opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                aria-label="Remove photo"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      {photos.length === 0 && (
        <div className="flex items-start gap-2.5 p-3 bg-amber-50 border border-amber-100 rounded-lg">
          <span className="text-amber-600 mt-0.5">ℹ</span>
          <p className="text-xs text-amber-800">
            Add all property photos at once — exterior, interior, land, aerial, everything.
            The AI will determine what each photo shows.
          </p>
        </div>
      )}

      <Badge
        text={`${photos.length} photo${photos.length !== 1 ? 's' : ''} added`}
        type={photos.length > 0 ? 'green' : 'neutral'}
      />
    </div>
  );
}

function Step9Review({
  data,
  photos,
  completeness,
}: {
  data: WizardData;
  photos: PendingPhoto[];
  completeness: number;
}) {
  const categories = new Set(photos.map((p) => p.category));
  const categoryCount = categories.size;

  return (
    <div className="space-y-6">
      <StepHeader
        title="Review & Create"
        subtitle="Confirm the details below, then click Create Property to begin analysis."
      />

      {/* Completeness bar */}
      <div className="p-4 bg-stone-50 rounded-lg space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-stone-700">Data completeness</span>
          <span
            className={`text-sm font-bold ${
              completeness >= 80 ? 'text-green-700' : completeness >= 50 ? 'text-amber-700' : 'text-red-600'
            }`}
          >
            {completeness}%
          </span>
        </div>
        <div className="h-2 bg-stone-200 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${
              completeness >= 80 ? 'bg-green-500' : completeness >= 50 ? 'bg-amber-500' : 'bg-red-400'
            }`}
            style={{ width: `${completeness}%` }}
          />
        </div>
        <p className="text-xs text-stone-500">
          {completeness >= 80
            ? 'Excellent — the AI analysis will be comprehensive.'
            : completeness >= 50
            ? 'Good start — you can add more detail after creation.'
            : 'Add photos and location to improve AI analysis quality.'}
        </p>
      </div>

      {/* Summary grid */}
      <div className="grid grid-cols-2 gap-3 text-sm">
        <ReviewItem label="Property name" value={data.name || '—'} />
        <ReviewItem
          label="Listed price"
          value={data.listed_price ? `€${parseInt(data.listed_price).toLocaleString()}` : '—'}
        />
        <ReviewItem
          label="Location"
          value={
            data.commune && data.region ? `${data.commune}, ${data.region}` : data.region || '—'
          }
        />
        <ReviewItem
          label="Size"
          value={data.sqm_house ? `${data.sqm_house} m² house · ${data.sqm_land} m² land` : '—'}
        />
        <ReviewItem
          label="Year / Energy"
          value={[data.year_built, data.energy_class ? `Class ${data.energy_class}` : ''].filter(Boolean).join(' · ') || '—'}
        />
        <ReviewItem
          label="Features"
          value={
            [
              data.has_olive_grove && 'Olive grove',
              data.has_vineyard && 'Vineyard',
              data.has_outbuildings && 'Outbuildings',
              data.has_pool && 'Pool',
              data.has_pizza_oven && 'Pizza oven',
            ]
              .filter(Boolean)
              .join(', ') || 'None specified'
          }
        />
        <ReviewItem
          label="Photos"
          value={`${photos.length} photo${photos.length !== 1 ? 's' : ''} across ${categoryCount} categor${categoryCount !== 1 ? 'ies' : 'y'}`}
        />
        <ReviewItem
          label="Source"
          value={data.listing_source || '—'}
        />
      </div>

      <div className="p-3 bg-blue-50 border border-blue-100 rounded-lg text-xs text-blue-800">
        After creation, the property will be in <strong>Scouted</strong> stage. Use &quot;Analyze with AI&quot;
        to generate structural assessment, regulatory risk, and renovation scenarios.
      </div>
    </div>
  );
}

// ── Shared sub-components ────────────────────────────────────────────────────

function StepHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="pb-2 border-b border-stone-100">
      <h2 className="text-xl font-semibold text-stone-900">{title}</h2>
      <p className="text-sm text-stone-500 mt-1">{subtitle}</p>
    </div>
  );
}

function Field({
  label,
  required,
  hint,
  children,
  className = '',
}: {
  label: string;
  required?: boolean;
  hint?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`space-y-1.5 ${className}`}>
      <label className="block text-sm font-medium text-stone-700">
        {label}
        {required && <span className="text-amber-600 ml-1">*</span>}
        {hint && <span className="ml-2 text-xs font-normal text-stone-400">{hint}</span>}
      </label>
      {children}
    </div>
  );
}

function ToggleField({
  label,
  hint,
  checked,
  onChange,
}: {
  label: string;
  hint?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex items-start gap-3 cursor-pointer group">
      <div className="mt-0.5 relative">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="sr-only"
        />
        <div
          className={`w-10 h-6 rounded-full transition-colors ${
            checked ? 'bg-amber-600' : 'bg-stone-200'
          }`}
        >
          <div
            className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
              checked ? 'translate-x-4' : 'translate-x-0.5'
            }`}
          />
        </div>
      </div>
      <div>
        <span className="text-sm font-medium text-stone-700 group-hover:text-stone-900 transition-colors">
          {label}
        </span>
        {hint && <p className="text-xs text-stone-400 mt-0.5">{hint}</p>}
      </div>
    </label>
  );
}

function Badge({ text, type }: { text: string; type: 'green' | 'neutral' }) {
  const cls =
    type === 'green'
      ? 'bg-green-50 text-green-700 border-green-100'
      : 'bg-stone-50 text-stone-500 border-stone-100';
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-md border text-xs font-medium ${cls}`}>
      {text}
    </span>
  );
}

function ReviewItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="p-3 bg-stone-50 rounded-lg">
      <dt className="text-xs text-stone-400 mb-0.5">{label}</dt>
      <dd className="text-sm text-stone-800 font-medium leading-snug">{value}</dd>
    </div>
  );
}

function CompletenessIndicator({ score }: { score: number }) {
  const color =
    score >= 80 ? 'text-green-700 bg-green-50 border-green-100' :
    score >= 50 ? 'text-amber-700 bg-amber-50 border-amber-100' :
    'text-stone-500 bg-stone-50 border-stone-100';
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md border text-xs font-medium ${color}`}>
      <span className="font-bold">{score}%</span>
      <span className="font-normal opacity-80">complete</span>
    </span>
  );
}

const inputClass =
  'w-full px-3 py-2.5 bg-white border border-stone-200 rounded-lg text-sm text-stone-900 placeholder:text-stone-300 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400 transition-colors';

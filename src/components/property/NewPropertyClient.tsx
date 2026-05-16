'use client';

import { useState } from 'react';
import FolderImporter from './FolderImporter';
import ListingImporter, { type PrefillData } from './ListingImporter';
import PropertyWizard from './PropertyWizard';

interface Props {
  projectId: string;
  locale: string;
  importFolder?: string;
}

type Phase = 'choose' | 'folder' | 'import' | 'wizard';

export default function NewPropertyClient({ projectId, locale, importFolder }: Props) {
  const [phase, setPhase] = useState<Phase>('choose');
  const [prefill, setPrefill] = useState<Partial<PrefillData>>({});

  if (phase === 'folder') {
    return (
      <div className="space-y-4">
        <button
          onClick={() => setPhase('choose')}
          className="text-sm text-stone-500 hover:text-stone-700"
        >
          ← Back
        </button>
        <FolderImporter projectId={projectId} locale={locale} defaultFolder={importFolder} />
      </div>
    );
  }

  if (phase === 'wizard') {
    return <PropertyWizard projectId={projectId} locale={locale} initialData={prefill} />;
  }

  if (phase === 'import') {
    return (
      <div className="space-y-4">
        <button
          onClick={() => setPhase('choose')}
          className="text-sm text-stone-500 hover:text-stone-700"
        >
          ← Back
        </button>
        <ListingImporter
          onPrefill={(data) => {
            setPrefill(data);
            setPhase('wizard');
          }}
          onSkip={() => {
            setPrefill({});
            setPhase('wizard');
          }}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h2 className="text-xl font-semibold text-stone-900">Add a property</h2>
        <p className="text-sm text-stone-500">
          Choose how you want to get started.
        </p>
      </div>

      <div className="grid gap-4">
        {/* Folder import — primary option */}
        <button
          onClick={() => setPhase('folder')}
          className="text-left p-5 rounded-xl border-2 border-amber-200 bg-amber-50/50 hover:border-amber-400 hover:bg-amber-50 transition-colors group"
        >
          <div className="flex items-start gap-4">
            <span className="text-2xl mt-0.5">📁</span>
            <div>
              <p className="text-sm font-semibold text-stone-900 group-hover:text-amber-900">
                Import from folder
              </p>
              <p className="text-xs text-stone-500 mt-1 leading-relaxed">
                Save the listing page and all photos to a folder. The AI will parse the listing,
                classify each photo (aerial, exterior, interior, etc.), and create the property automatically.
              </p>
            </div>
          </div>
        </button>

        {/* Listing file import */}
        <button
          onClick={() => setPhase('import')}
          className="text-left p-5 rounded-xl border border-stone-200 hover:border-stone-300 hover:bg-stone-50/50 transition-colors group"
        >
          <div className="flex items-start gap-4">
            <span className="text-2xl mt-0.5">📄</span>
            <div>
              <p className="text-sm font-semibold text-stone-900">
                Import listing file only
              </p>
              <p className="text-xs text-stone-500 mt-1 leading-relaxed">
                Drop an MHTML/HTML file saved from the listing page. Prefills property details, then use the wizard to add photos.
              </p>
            </div>
          </div>
        </button>

        {/* Manual entry */}
        <button
          onClick={() => { setPrefill({}); setPhase('wizard'); }}
          className="text-left p-5 rounded-xl border border-stone-200 hover:border-stone-300 hover:bg-stone-50/50 transition-colors group"
        >
          <div className="flex items-start gap-4">
            <span className="text-2xl mt-0.5">✏️</span>
            <div>
              <p className="text-sm font-semibold text-stone-900">
                Enter manually
              </p>
              <p className="text-xs text-stone-500 mt-1 leading-relaxed">
                Fill in property details step by step using the guided wizard.
              </p>
            </div>
          </div>
        </button>
      </div>
    </div>
  );
}

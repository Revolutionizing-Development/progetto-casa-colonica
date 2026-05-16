import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getProject } from '@/app/actions/projects';
import { getProperties, type PropertyRow } from '@/app/actions/properties';
import { getScoringsByProject } from '@/app/actions/scoring';
import type { ScoringResult, CriterionScore, OverallRating } from '@/types/scoring';
import { WEIGHT_KEYS, type WeightKey } from '@/lib/scoring-criteria';

interface Props {
  params: { locale: string; id: string };
}

const CRITERION_LABELS: Record<WeightKey, string> = {
  purchase_price: 'Purchase Price',
  all_in_cost: 'All-In Cost',
  structural_condition: 'Structural',
  airbnb_potential: 'Airbnb Potential',
  regulatory_risk: 'Regulatory Risk',
  lifestyle_fit: 'Lifestyle Fit',
  location_quality: 'Location',
  land_characteristics: 'Land',
  outbuilding_potential: 'Outbuildings',
  negotiation_margin: 'Negotiation',
  exit_value: 'Exit Value',
};

const RATING_STYLE: Record<OverallRating, string> = {
  strong_candidate: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  promising: 'bg-amber-50 text-amber-800 border-amber-200',
  marginal: 'bg-orange-50 text-orange-800 border-orange-200',
  not_recommended: 'bg-red-50 text-red-800 border-red-200',
};

const RATING_LABEL: Record<OverallRating, string> = {
  strong_candidate: 'Strong',
  promising: 'Promising',
  marginal: 'Marginal',
  not_recommended: 'Not Rec.',
};

function scoreColor(raw: number): string {
  if (raw >= 7) return 'text-emerald-700';
  if (raw >= 5) return 'text-amber-700';
  return 'text-red-600';
}

function scoreBg(raw: number): string {
  if (raw >= 7) return 'bg-emerald-50';
  if (raw >= 5) return 'bg-amber-50';
  return 'bg-red-50';
}

export default async function ComparePage({ params: { locale, id } }: Props) {
  const [project, properties, scorings] = await Promise.all([
    getProject(id),
    getProperties(id),
    getScoringsByProject(id),
  ]);

  if (!project) notFound();

  // Map scoring results by property_id for quick lookup
  const scoreByProperty = new Map<string, ScoringResult>();
  for (const s of scorings) {
    if (!scoreByProperty.has(s.property_id)) {
      scoreByProperty.set(s.property_id, s);
    }
  }

  // Only show properties that have been scored
  const scoredProperties = properties.filter((p) => scoreByProperty.has(p.id));
  const unscoredProperties = properties.filter((p) => !scoreByProperty.has(p.id));

  // Find the best score per criterion (for highlighting)
  const bestPerCriterion = new Map<WeightKey, number>();
  for (const key of WEIGHT_KEYS) {
    let best = -1;
    for (const scoring of scorings) {
      const cs = (scoring.scores as Record<string, CriterionScore>)[key];
      if (cs && cs.raw_score > best) best = cs.raw_score;
    }
    if (best >= 0) bestPerCriterion.set(key, best);
  }

  return (
    <main className="max-w-7xl mx-auto px-6 py-10 space-y-8">
      {/* Breadcrumb */}
      <nav className="text-sm text-stone-500 flex items-center gap-1.5">
        <Link href={`/${locale}/dashboard`} className="hover:text-stone-900 transition-colors">Projects</Link>
        <span>/</span>
        <Link href={`/${locale}/project/${id}`} className="hover:text-stone-900 transition-colors">{project.name}</Link>
        <span>/</span>
        <span className="text-stone-900 font-medium">Compare</span>
      </nav>

      <div>
        <h1 className="text-2xl font-bold text-stone-900">Property Comparison</h1>
        <p className="text-sm text-stone-500 mt-1">
          Side-by-side scoring matrix for {properties.length} {properties.length === 1 ? 'property' : 'properties'} in {project.name}.
        </p>
      </div>

      {scoredProperties.length === 0 ? (
        <div className="rounded-xl border border-dashed border-stone-300 p-10 text-center">
          <p className="text-sm font-medium text-stone-500 mb-1">No scored properties yet</p>
          <p className="text-xs text-stone-400">
            Score properties from their Overview tab, then return here to compare.
          </p>
        </div>
      ) : (
        <div className="rounded-xl border border-stone-200 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-stone-200 bg-stone-50">
                <th className="text-left px-4 py-3 text-xs font-semibold text-stone-400 uppercase tracking-wide sticky left-0 bg-stone-50 min-w-[140px]">
                  Criterion
                </th>
                {scoredProperties.map((p) => (
                  <th key={p.id} className="px-4 py-3 text-center min-w-[130px]">
                    <Link
                      href={`/${locale}/property/${p.id}`}
                      className="text-sm font-semibold text-stone-800 hover:text-amber-700 transition-colors"
                    >
                      {p.name}
                    </Link>
                    <p className="text-xs text-stone-400 font-normal mt-0.5">
                      €{p.listed_price.toLocaleString()}
                    </p>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {/* Overall rating row */}
              <tr className="border-b border-stone-100 bg-stone-50/50">
                <td className="px-4 py-3 font-semibold text-stone-700 sticky left-0 bg-stone-50/50">
                  Overall Rating
                </td>
                {scoredProperties.map((p) => {
                  const scoring = scoreByProperty.get(p.id)!;
                  const rs = RATING_STYLE[scoring.overall_rating];
                  const rl = RATING_LABEL[scoring.overall_rating];
                  return (
                    <td key={p.id} className="px-4 py-3 text-center">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-bold border ${rs}`}>
                        {rl}
                      </span>
                      <p className="text-lg font-bold text-stone-900 mt-1">{scoring.total_weighted_score}</p>
                      {scoring.red_flag_override && (
                        <span className="text-xs text-red-500">🔴 Red flag</span>
                      )}
                    </td>
                  );
                })}
              </tr>

              {/* Per-criterion rows */}
              {WEIGHT_KEYS.map((key) => {
                const best = bestPerCriterion.get(key) ?? -1;
                return (
                  <tr key={key} className="border-b border-stone-100 hover:bg-stone-50/40 transition-colors">
                    <td className="px-4 py-2.5 text-stone-600 sticky left-0 bg-white">
                      <span className="font-medium">{CRITERION_LABELS[key]}</span>
                    </td>
                    {scoredProperties.map((p) => {
                      const scoring = scoreByProperty.get(p.id)!;
                      const cs = (scoring.scores as Record<string, CriterionScore>)[key];
                      if (!cs) {
                        return <td key={p.id} className="px-4 py-2.5 text-center text-stone-300">—</td>;
                      }
                      const isBest = scoredProperties.length > 1 && cs.raw_score === best && best > 0;
                      return (
                        <td
                          key={p.id}
                          className={`px-4 py-2.5 text-center ${isBest ? scoreBg(cs.raw_score) : ''}`}
                        >
                          <span className={`text-sm font-bold ${scoreColor(cs.raw_score)}`}>
                            {cs.raw_score.toFixed(1)}
                          </span>
                          {isBest && scoredProperties.length > 1 && (
                            <span className="ml-1 text-xs text-emerald-600">★</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Unscored properties callout */}
      {unscoredProperties.length > 0 && (
        <div className="rounded-lg border border-amber-100 bg-amber-50 p-4">
          <p className="text-sm text-amber-800">
            <span className="font-semibold">{unscoredProperties.length} unscored:</span>{' '}
            {unscoredProperties.map((p, i) => (
              <span key={p.id}>
                <Link
                  href={`/${locale}/property/${p.id}`}
                  className="underline underline-offset-2 hover:text-amber-600"
                >
                  {p.name}
                </Link>
                {i < unscoredProperties.length - 1 ? ', ' : ''}
              </span>
            ))}
          </p>
        </div>
      )}

      <p className="text-xs text-stone-400">
        Scores are AI-generated (0–10 per criterion). ★ marks the best score in each row. Weights are configurable in Project Settings.
      </p>
    </main>
  );
}

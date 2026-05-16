'use client';

import { useState } from 'react';

interface CostRange {
  low: number;
  high: number;
}

interface AgentComparison {
  claude: CostRange;
  openai: CostRange;
  gemini: CostRange;
}

interface FlaggedItem {
  lineItemKey: string;
  description: string;
  confidence: 'high' | 'medium' | 'low';
  agentEstimates: AgentComparison;
  consensusEstimate: CostRange;
  divergenceReason: string;
  recommendation: string;
}

interface ItemComparison {
  lineItemKey: string;
  description: string;
  confidence: 'high' | 'medium' | 'low';
  agentEstimates: AgentComparison;
  consensusEstimate: CostRange;
  divergenceReason?: string;
  recommendation?: string;
}

interface DivergenceReportData {
  totalItemsCompared: number;
  highConfidence: number;
  mediumConfidence: number;
  lowConfidence: number;
  flaggedItems: FlaggedItem[];
  overallConfidenceScore: number;
}

function fmt(n: number) {
  return n.toLocaleString('en-US');
}

function ConfidenceBadge({ score }: { score: number }) {
  const color = score >= 75 ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
    : score >= 50 ? 'bg-amber-100 text-amber-800 border-amber-200'
    : 'bg-red-100 text-red-800 border-red-200';

  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-sm font-bold ${color}`}>
      {score}/100
    </span>
  );
}

function ConfidenceDot({ level }: { level: 'high' | 'medium' | 'low' }) {
  const color = level === 'high' ? 'bg-emerald-500' : level === 'medium' ? 'bg-amber-500' : 'bg-red-500';
  return <span className={`inline-block w-2.5 h-2.5 rounded-full ${color}`} />;
}

function AgentBar({ label, range, maxVal }: { label: string; range: CostRange; maxVal: number }) {
  const widthPct = maxVal > 0 ? (range.high / maxVal) * 100 : 0;
  const colors: Record<string, string> = {
    Claude: 'bg-orange-400',
    'GPT-4o': 'bg-green-400',
    Gemini: 'bg-blue-400',
    Consensus: 'bg-stone-700',
  };

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-stone-500 w-16 shrink-0">{label}</span>
      <div className="flex-1 h-4 bg-stone-100 rounded-full overflow-hidden relative">
        <div className={`h-full rounded-full ${colors[label] ?? 'bg-stone-400'}`} style={{ width: `${Math.min(widthPct, 100)}%` }} />
      </div>
      <span className="text-xs text-stone-600 w-28 shrink-0 text-right">
        €{fmt(range.low)} – €{fmt(range.high)}
      </span>
    </div>
  );
}

function ComparisonItemCard({ item, defaultExpanded }: { item: ItemComparison; defaultExpanded?: boolean }) {
  const [expanded, setExpanded] = useState(defaultExpanded ?? false);
  const allValues = [
    item.agentEstimates.claude.high,
    item.agentEstimates.openai.high,
    item.agentEstimates.gemini.high,
    item.consensusEstimate.high,
  ];
  const maxVal = Math.max(...allValues);

  return (
    <div className="rounded-lg border border-stone-200 overflow-hidden">
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-stone-50 transition-colors text-left"
      >
        <div className="flex items-center gap-2.5">
          <ConfidenceDot level={item.confidence} />
          <span className="text-sm font-medium text-stone-800">{item.description}</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-stone-600">
            €{fmt(item.consensusEstimate.low)} – €{fmt(item.consensusEstimate.high)}
          </span>
          <span className="text-stone-400 text-sm">{expanded ? '▲' : '▼'}</span>
        </div>
      </button>

      {expanded && (
        <div className="px-4 pb-4 space-y-3 border-t border-stone-100 pt-3">
          <div className="space-y-1.5">
            <AgentBar label="Claude" range={item.agentEstimates.claude} maxVal={maxVal} />
            <AgentBar label="GPT-4o" range={item.agentEstimates.openai} maxVal={maxVal} />
            <AgentBar label="Gemini" range={item.agentEstimates.gemini} maxVal={maxVal} />
            <AgentBar label="Consensus" range={item.consensusEstimate} maxVal={maxVal} />
          </div>

          {item.divergenceReason && (
            <div className="text-xs space-y-1">
              <p className="text-stone-600"><strong>Why:</strong> {item.divergenceReason}</p>
              {item.recommendation && (
                <p className="text-stone-600"><strong>Action:</strong> {item.recommendation}</p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

interface Props {
  report: DivergenceReportData;
  allItemComparisons?: ItemComparison[];
}

export default function DivergenceReport({ report, allItemComparisons }: Props) {
  if (!report) return null;

  const [showAll, setShowAll] = useState(false);

  const hasFullData = allItemComparisons && allItemComparisons.length > 0;
  const highItems = hasFullData ? allItemComparisons.filter((i) => i.confidence === 'high') : [];
  const mediumItems = hasFullData ? allItemComparisons.filter((i) => i.confidence === 'medium') : [];
  const lowItems = hasFullData ? allItemComparisons.filter((i) => i.confidence === 'low') : [];

  return (
    <div className="space-y-4">
      {/* Header with confidence score */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-stone-800">Multi-Agent Confidence</h3>
          <p className="text-xs text-stone-500 mt-0.5">
            {report.totalItemsCompared} line items compared across Claude, GPT-4o, and Gemini
          </p>
        </div>
        <ConfidenceBadge score={report.overallConfidenceScore} />
      </div>

      {/* Confidence breakdown */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-lg bg-emerald-50 border border-emerald-100 px-3 py-2 text-center">
          <p className="text-lg font-bold text-emerald-800">{report.highConfidence}</p>
          <p className="text-xs text-emerald-600">High confidence</p>
        </div>
        <div className="rounded-lg bg-amber-50 border border-amber-100 px-3 py-2 text-center">
          <p className="text-lg font-bold text-amber-800">{report.mediumConfidence}</p>
          <p className="text-xs text-amber-600">Medium confidence</p>
        </div>
        <div className="rounded-lg bg-red-50 border border-red-100 px-3 py-2 text-center">
          <p className="text-lg font-bold text-red-800">{report.lowConfidence}</p>
          <p className="text-xs text-red-600">Low confidence</p>
        </div>
      </div>

      {/* Full proof: ALL items with per-agent bars */}
      {hasFullData ? (
        <div className="space-y-4">
          {/* Toggle between showing flagged only vs all */}
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-stone-400 uppercase tracking-wide">
              {showAll ? 'All Line Items — Per-Agent Estimates' : 'Flagged Items — Agents Disagreed'}
            </p>
            <button
              onClick={() => setShowAll((v) => !v)}
              className="text-xs text-stone-500 hover:text-stone-700 underline underline-offset-2"
            >
              {showAll ? 'Show flagged only' : `Show all ${allItemComparisons.length} items`}
            </button>
          </div>

          {showAll ? (
            <div className="space-y-4">
              {/* LOW confidence items first — these need attention */}
              {lowItems.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-medium text-red-600">Low confidence — obtain contractor quotes</p>
                  {lowItems.map((item) => (
                    <ComparisonItemCard key={item.lineItemKey} item={item} defaultExpanded />
                  ))}
                </div>
              )}

              {/* MEDIUM confidence items */}
              {mediumItems.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-medium text-amber-600">Medium confidence — one agent diverged</p>
                  {mediumItems.map((item) => (
                    <ComparisonItemCard key={item.lineItemKey} item={item} defaultExpanded />
                  ))}
                </div>
              )}

              {/* HIGH confidence items — proof of agreement */}
              {highItems.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-medium text-emerald-600">
                    High confidence — all agents agree ({highItems.length} items)
                  </p>
                  {highItems.map((item) => (
                    <ComparisonItemCard key={item.lineItemKey} item={item} />
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              {/* Show flagged items (medium + low) */}
              {mediumItems.length > 0 || lowItems.length > 0 ? (
                [...lowItems, ...mediumItems].map((item) => (
                  <ComparisonItemCard key={item.lineItemKey} item={item} defaultExpanded />
                ))
              ) : (
                <div className="rounded-lg bg-emerald-50 border border-emerald-100 p-4 text-center">
                  <p className="text-sm text-emerald-800 font-medium">All agents are in agreement</p>
                  <p className="text-xs text-emerald-600 mt-0.5">
                    No significant divergence — click "Show all {allItemComparisons.length} items" above to see the proof.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        // Fallback: only divergence report data available (no full comparisons)
        <>
          {report.flaggedItems.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-stone-400 uppercase tracking-wide">
                Flagged Items — Agents Disagreed
              </p>
              {report.flaggedItems.map((item) => (
                <ComparisonItemCard key={item.lineItemKey} item={item} defaultExpanded />
              ))}
            </div>
          )}

          {report.flaggedItems.length === 0 && (
            <div className="rounded-lg bg-emerald-50 border border-emerald-100 p-4 text-center">
              <p className="text-sm text-emerald-800 font-medium">All agents are in agreement</p>
              <p className="text-xs text-emerald-600 mt-0.5">No significant divergence detected across estimates.</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}

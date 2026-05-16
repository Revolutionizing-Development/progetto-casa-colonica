import type {
  TimelinePhase,
  DecisionGate,
  FundingInflow,
  MonthlySnapshot,
  TimelineConfig,
  LiquidityWarning,
} from '@/types/timeline';
import type { ScenarioCostSummary } from '@/types/cost-config';
import type { HouseholdProfile } from '@/types/household';
import type { ProjectType } from '@/types/project';

export const DEFAULT_GATES: DecisionGate[] = [
  {
    month: 24,
    label: 'Move to Italy',
    description: 'Relocate — owner begins full-time DIY, wife earning €70K/year',
    type: 'move',
  },
  {
    month: 42,
    label: 'Airbnb go-live',
    description: 'Guest apartments ready, listings published, income begins',
    type: 'launch',
  },
];

export const DEFAULT_INFLOWS: FundingInflow[] = [
  {
    label: 'Salary savings (US)',
    monthlyAmount: 8000,
    startMonth: 1,
    endMonth: 24,
    type: 'salary_savings',
  },
  {
    label: "Wife's income (Italy)",
    monthlyAmount: Math.round(70000 / 12),
    startMonth: 25,
    endMonth: 48,
    type: 'employment_income',
  },
];

export function buildInflowsFromProfile(hp: HouseholdProfile): FundingInflow[] {
  const totalMonths = hp.us_phase_months + hp.diy_phase_months;
  return [
    {
      label: 'Salary savings (US)',
      monthlyAmount: hp.monthly_savings_rate,
      startMonth: 1,
      endMonth: hp.us_phase_months,
      type: 'salary_savings',
    },
    {
      label: "Partner's income (Italy)",
      monthlyAmount: Math.round(hp.partner_income / 12),
      startMonth: hp.us_phase_months + 1,
      endMonth: totalMonths,
      type: 'employment_income',
    },
  ];
}

export function buildGatesFromProfile(hp: HouseholdProfile, projectType: ProjectType = 'farmstead_hosting'): DecisionGate[] {
  const gates: DecisionGate[] = [
    {
      month: hp.us_phase_months,
      label: 'Move to Italy',
      description: `Relocate — owner begins full-time DIY, partner earning €${Math.round(hp.partner_income / 1000)}K/year`,
      type: 'move',
    },
  ];

  if (projectType === 'farmstead_hosting') {
    const totalMonths = hp.us_phase_months + hp.diy_phase_months;
    const airbnbMonth = Math.max(totalMonths - 6, hp.us_phase_months + 12);
    gates.push({
      month: airbnbMonth,
      label: 'Airbnb go-live',
      description: 'Guest apartments ready, listings published, income begins',
      type: 'launch',
    });
  }

  return gates;
}

const PHASE_ORDER: Record<string, number> = {
  'purchase': 0,
  'structural': 1,
  'roof': 2,
  'envelope': 3,
  'systems': 4,
  'demolition': 5,
  'finishes': 6,
  'guest-separation': 7,
  'airbnb-fitout': 8,
  'courtyard': 9,
  'livestock': 10,
  'solar': 11,
  'landscaping': 12,
};

const HOSTING_ONLY_PHASE_IDS = new Set(['guest-separation', 'airbnb-fitout']);

export function buildDefaultPhases(costSummary: ScenarioCostSummary, purchasePrice = 0, projectType: ProjectType = 'farmstead_hosting'): TimelinePhase[] {
  const y1Items = costSummary.byPhase.find((p) => p.year === 1);
  const y2Items = costSummary.byPhase.find((p) => p.year === 2);
  const y3Items = costSummary.byPhase.find((p) => p.year === 3);

  const phases: TimelinePhase[] = [
    {
      id: 'purchase',
      name: 'Purchase & Permits',
      name_it: 'Acquisto e Permessi',
      startMonth: 1,
      durationMonths: 3,
      isContractor: false,
      isDiy: false,
      costEur: purchasePrice,
      dependsOn: [],
      category: 'admin',
    },
    {
      id: 'structural',
      name: 'Structural & Seismic',
      name_it: 'Strutturale e Sismico',
      startMonth: 4,
      durationMonths: 4,
      isContractor: true,
      isDiy: false,
      costEur: sumCategoryItems(y1Items?.items ?? [], ['structural_envelope']),
      dependsOn: ['purchase'],
      category: 'structural',
    },
    {
      id: 'roof',
      name: 'Roof Replacement',
      name_it: 'Rifacimento Tetto',
      startMonth: 6,
      durationMonths: 3,
      isContractor: true,
      isDiy: false,
      costEur: 0,
      dependsOn: ['structural'],
      category: 'structural',
    },
    {
      id: 'envelope',
      name: 'Envelope & Windows',
      name_it: 'Involucro e Finestre',
      startMonth: 9,
      durationMonths: 4,
      isContractor: true,
      isDiy: false,
      costEur: sumCategoryItems(y1Items?.items ?? [], ['windows_doors']),
      dependsOn: ['roof'],
      category: 'envelope',
    },
    {
      id: 'systems',
      name: 'Systems (Elec/Plumb/HVAC)',
      name_it: 'Impianti (Elett/Idr/HVAC)',
      startMonth: 13,
      durationMonths: 6,
      isContractor: true,
      isDiy: false,
      costEur: sumCategoryItems(y1Items?.items ?? [], ['systems', 'energy']),
      dependsOn: ['envelope'],
      category: 'systems',
    },
    {
      id: 'demolition',
      name: 'Interior Demolition & Clearing',
      name_it: 'Demolizione e Sgombero Interni',
      startMonth: 25,
      durationMonths: 2,
      isContractor: false,
      isDiy: true,
      costEur: 0,
      dependsOn: ['systems'],
      category: 'finishes',
    },
    {
      id: 'finishes',
      name: 'Interior Finishes',
      name_it: 'Finiture Interne',
      startMonth: 27,
      durationMonths: 8,
      isContractor: false,
      isDiy: true,
      costEur: sumCategoryItems(y2Items?.items ?? [], ['interior_finishes']),
      dependsOn: ['demolition'],
      category: 'finishes',
    },
    {
      id: 'guest-separation',
      name: 'Guest Separation',
      name_it: 'Separazione Ospiti',
      startMonth: 27,
      durationMonths: 6,
      isContractor: false,
      isDiy: true,
      costEur: sumCategoryItems(y2Items?.items ?? [], ['guest_separation']),
      dependsOn: ['systems'],
      category: 'finishes',
    },
    {
      id: 'airbnb-fitout',
      name: 'Airbnb Fit-out & Furnishing',
      name_it: 'Allestimento e Arredo Airbnb',
      startMonth: 35,
      durationMonths: 3,
      isContractor: false,
      isDiy: true,
      costEur: sumCategoryItems(y3Items?.items ?? [], ['transition_setup']),
      dependsOn: ['finishes'],
      category: 'finishes',
    },
    {
      id: 'courtyard',
      name: 'Courtyard & Pizza Oven',
      name_it: 'Cortile e Forno Pizza',
      startMonth: 30,
      durationMonths: 4,
      isContractor: false,
      isDiy: true,
      costEur: sumCategoryItems(y3Items?.items ?? [], ['outdoor_hospitality']),
      dependsOn: ['systems'],
      category: 'exterior',
    },
    {
      id: 'livestock',
      name: 'Livestock Setup',
      name_it: 'Allestimento Animali',
      startMonth: 32,
      durationMonths: 3,
      isContractor: false,
      isDiy: true,
      costEur: sumCategoryItems(y3Items?.items ?? [], ['livestock']),
      dependsOn: ['courtyard'],
      category: 'lifestyle',
    },
    {
      id: 'solar',
      name: 'Solar PV',
      name_it: 'Fotovoltaico',
      startMonth: 20,
      durationMonths: 2,
      isContractor: true,
      isDiy: false,
      costEur: sumCategoryItems(y1Items?.items ?? [], ['energy']),
      dependsOn: ['roof', 'systems'],
      category: 'systems',
    },
    {
      id: 'landscaping',
      name: 'Landscaping & Trees',
      name_it: 'Paesaggistica e Alberi',
      startMonth: 38,
      durationMonths: 4,
      isContractor: false,
      isDiy: true,
      costEur: sumCategoryItems(y3Items?.items ?? [], ['site_work', 'greenhouse_growing', 'perimeter_security']),
      dependsOn: ['courtyard'],
      category: 'exterior',
    },
  ];

  const filtered = projectType === 'private_homestead'
    ? phases.filter((p) => !HOSTING_ONLY_PHASE_IDS.has(p.id))
    : phases;

  return filtered.sort((a, b) => a.startMonth - b.startMonth);
}

function sumCategoryItems(
  items: { category: string; effectiveCost: number }[],
  categories: string[],
): number {
  return items
    .filter((i) => categories.includes(i.category))
    .reduce((sum, i) => sum + i.effectiveCost, 0);
}

export function computeMonthlySnapshots(config: TimelineConfig): MonthlySnapshot[] {
  const snapshots: MonthlySnapshot[] = [];
  let cumulative = 0;
  let cashRemaining = config.initialCash;

  for (let m = 1; m <= config.totalMonths; m++) {
    const year = Math.ceil(m / 12);

    const phaseSpend = config.phases.reduce((sum, phase) => {
      if (m >= phase.startMonth && m < phase.startMonth + phase.durationMonths) {
        return sum + Math.round(phase.costEur / phase.durationMonths);
      }
      return sum;
    }, 0);

    const carrying = config.carryingCostMonthly;

    const isInItaly = m > config.moveMonth;
    const living = isInItaly ? config.livingCostMonthly : 0;

    const totalOutflow = phaseSpend + carrying + living;

    const fundingInflow = config.inflows.reduce((sum, inflow) => {
      if (m >= inflow.startMonth && m <= inflow.endMonth) {
        return sum + inflow.monthlyAmount;
      }
      return sum;
    }, 0);

    const net = fundingInflow - totalOutflow;
    cumulative += totalOutflow;
    cashRemaining += net;

    snapshots.push({
      month: m,
      year,
      label: `M${m} (Y${year})`,
      phaseSpend,
      carryingCosts: carrying,
      livingCosts: living,
      totalOutflow,
      fundingInflow,
      net,
      cumulativeSpend: cumulative,
      cashRemaining,
      isLiquidityWarning: cashRemaining < 0,
    });
  }

  return snapshots;
}

export function findLiquidityWarnings(
  snapshots: MonthlySnapshot[],
  phases: TimelinePhase[],
): LiquidityWarning[] {
  const warnings: LiquidityWarning[] = [];
  const warned = new Set<string>();

  for (const snap of snapshots) {
    if (!snap.isLiquidityWarning) continue;

    const activePhases = phases.filter(
      (p) => snap.month >= p.startMonth && snap.month < p.startMonth + p.durationMonths,
    );

    for (const phase of activePhases) {
      if (warned.has(phase.id)) continue;
      warned.add(phase.id);

      warnings.push({
        month: snap.month,
        phaseId: phase.id,
        phaseName: phase.name,
        shortfall: Math.abs(snap.cashRemaining),
        suggestion: `Insufficient funds to continue "${phase.name}" in month ${snap.month} — delay or reduce scope`,
      });
    }
  }

  return warnings;
}

export function validateDependencies(phases: TimelinePhase[]): string[] {
  const errors: string[] = [];
  const byId = new Map(phases.map((p) => [p.id, p]));

  for (const phase of phases) {
    for (const depId of phase.dependsOn) {
      const dep = byId.get(depId);
      if (!dep) {
        errors.push(`${phase.name}: depends on unknown phase "${depId}"`);
        continue;
      }
      const depEnd = dep.startMonth + dep.durationMonths;
      if (phase.startMonth < depEnd) {
        errors.push(
          `${phase.name} starts in month ${phase.startMonth} but "${dep.name}" doesn't finish until month ${depEnd}`,
        );
      }
    }
  }

  return errors;
}

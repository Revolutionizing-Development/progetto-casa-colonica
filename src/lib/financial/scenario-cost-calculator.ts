import {
  COST_LINE_ITEMS,
  REGIONAL_MULTIPLIERS,
  ALL_CATEGORIES,
  type CostLineItem,
  type RegionalMultiplierKey,
  type ItemCategory,
} from '@/config/cost-line-items';
import type {
  ScopeToggles,
  DIYToggles,
  PhaseAssignments,
  PhaseYear,
  ComputedLineItem,
  PhaseSummary,
  CategorySummary,
  ScenarioCostSummary,
} from '@/types/cost-config';

export interface QuantityOverrides {
  [itemKey: string]: number;
}

export interface ScenarioCostInput {
  region: RegionalMultiplierKey;
  scopeToggles: ScopeToggles;
  diyToggles: DIYToggles;
  phaseAssignments: PhaseAssignments;
  quantities: QuantityOverrides;
}

function defaultQuantity(item: CostLineItem): number {
  if (item.unitType === 'forfait' || item.unitType === 'pct') return 1;
  if (item.unitType === 'year' || item.unitType === 'month') return 1;
  return 1;
}

function defaultPhase(item: CostLineItem): PhaseYear {
  const y1Categories: ItemCategory[] = [
    'structural_envelope', 'windows_doors', 'systems',
    'guest_separation', 'energy', 'professional_fees',
  ];
  if (y1Categories.includes(item.category)) return 1;

  const y2Categories: ItemCategory[] = [
    'interior_finishes', 'site_work',
  ];
  if (y2Categories.includes(item.category)) return 2;

  const y3Categories: ItemCategory[] = [
    'transition_setup', 'outdoor_hospitality',
  ];
  if (y3Categories.includes(item.category)) return 3;

  return 4;
}

function isItemInScope(item: CostLineItem, scopeToggles: ScopeToggles): boolean {
  if (!item.toggleable) return true;
  const key = item.key;
  if (key in scopeToggles) return scopeToggles[key];
  return false;
}

function isRadioSelected(item: CostLineItem, scopeToggles: ScopeToggles): boolean {
  if (!item.radioGroup) return true;

  const groupItems = COST_LINE_ITEMS.filter((i) => i.radioGroup === item.radioGroup);
  const explicitlyOn = groupItems.find((i) => scopeToggles[i.key] === true);
  if (explicitlyOn) return explicitlyOn.key === item.key;

  return groupItems[0].key === item.key;
}

function isDiyEnabled(item: CostLineItem, diyToggles: DIYToggles): boolean {
  if (item.isRegulated) return false;
  if (item.diyLaborPercent === 0) return false;
  return diyToggles[item.key] === true;
}

function computeItemCosts(
  item: CostLineItem,
  quantity: number,
  multiplier: number,
  diyEnabled: boolean,
): { contractorCost: number; diyCost: number; diySavings: number; effectiveCost: number } {
  if (item.unitType === 'pct') {
    return { contractorCost: 0, diyCost: 0, diySavings: 0, effectiveCost: 0 };
  }

  const base = item.unitType === 'year' || item.unitType === 'month'
    ? item.unitCost * quantity
    : item.unitCost * quantity * multiplier;

  const contractorCost = Math.round(base);
  const laborFraction = item.diyLaborPercent / 100;
  const diyCost = Math.round(base * (1 - laborFraction));
  const diySavings = diyEnabled ? contractorCost - diyCost : 0;
  const effectiveCost = diyEnabled ? diyCost : contractorCost;

  return { contractorCost, diyCost, diySavings, effectiveCost };
}

export function computeScenarioCosts(input: ScenarioCostInput): ScenarioCostSummary {
  const { region, scopeToggles, diyToggles, phaseAssignments, quantities } = input;
  const multiplier = REGIONAL_MULTIPLIERS[region].multiplier;

  const computedItems: ComputedLineItem[] = [];

  for (const item of COST_LINE_ITEMS) {
    if (item.unitType === 'pct') continue;

    const inScope = isItemInScope(item, scopeToggles);
    if (!inScope) continue;
    if (item.radioGroup && !isRadioSelected(item, scopeToggles)) continue;

    const quantity = quantities[item.key] ?? defaultQuantity(item);
    const diyEnabled = isDiyEnabled(item, diyToggles);
    const phaseYear = phaseAssignments[item.key] ?? defaultPhase(item);
    const costs = computeItemCosts(item, quantity, multiplier, diyEnabled);

    computedItems.push({
      key: item.key,
      description: item.description,
      description_it: item.description_it,
      category: item.category,
      unitType: item.unitType,
      unitCost: item.unitCost,
      quantity,
      regionalMultiplier: multiplier,
      contractorCost: costs.contractorCost,
      diyCost: costs.diyCost,
      diyEnabled,
      diyLaborPercent: item.diyLaborPercent,
      diySavings: costs.diySavings,
      effectiveCost: costs.effectiveCost,
      isRegulated: item.isRegulated,
      taxBonus: item.taxBonus,
      phaseYear,
      isOngoing: item.isOngoing,
      isToggled: item.toggleable,
    });
  }

  const oneTimeItems = computedItems.filter((i) => !i.isOngoing);
  const ongoingItems = computedItems.filter((i) => i.isOngoing);

  const totalContractor = oneTimeItems.reduce((s, i) => s + i.contractorCost, 0);
  const totalDiy = oneTimeItems.reduce((s, i) => s + i.diyCost, 0);
  const totalEffective = oneTimeItems.reduce((s, i) => s + i.effectiveCost, 0);
  const totalDiySavings = oneTimeItems.reduce((s, i) => s + i.diySavings, 0);

  const totalOngoingAnnual = ongoingItems.reduce((s, i) => {
    const annualized = i.unitType === 'month' ? i.effectiveCost * 12 : i.effectiveCost;
    return s + annualized;
  }, 0);

  // N2: mandatory 20% contingency on one-time construction costs
  const contingencyAmount = Math.round(totalEffective * 0.20);
  const grandTotal = totalEffective + contingencyAmount;

  // Group by phase
  const phaseYears: PhaseYear[] = [1, 2, 3, 4];
  const phaseLabels = ['Year 1', 'Year 2', 'Year 3', 'Year 4'];
  const byPhase: PhaseSummary[] = phaseYears.map((year, idx) => {
    const phaseItems = oneTimeItems.filter((i) => i.phaseYear === year);
    return {
      year,
      label: phaseLabels[idx],
      items: phaseItems,
      contractorTotal: phaseItems.reduce((s, i) => s + i.contractorCost, 0),
      diyTotal: phaseItems.reduce((s, i) => s + i.diyCost, 0),
      effectiveTotal: phaseItems.reduce((s, i) => s + i.effectiveCost, 0),
      diySavings: phaseItems.reduce((s, i) => s + i.diySavings, 0),
    };
  });

  // Group by category
  const byCategory: CategorySummary[] = ALL_CATEGORIES
    .map((cat) => {
      const catItems = computedItems.filter((i) => i.category === cat.key);
      if (catItems.length === 0) return null;
      return {
        category: cat.key,
        label: cat.label,
        label_it: cat.label_it,
        items: catItems,
        contractorTotal: catItems.reduce((s, i) => s + i.contractorCost, 0),
        diyTotal: catItems.reduce((s, i) => s + i.diyCost, 0),
        effectiveTotal: catItems.reduce((s, i) => s + i.effectiveCost, 0),
      };
    })
    .filter((c): c is CategorySummary => c !== null);

  return {
    items: computedItems,
    byPhase,
    byCategory,
    totalContractor,
    totalDiy,
    totalEffective,
    totalDiySavings,
    totalOngoingAnnual,
    contingencyAmount,
    grandTotal,
    region,
  };
}

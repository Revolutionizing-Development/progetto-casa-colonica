import type {
  AgentRenovationScenario,
  AgentLineItem,
  AgentPhase,
  PropertyInput,
} from '../types';
import { isRegulatedWork } from '../context/regulated-work';

export interface ComplianceIssue {
  type: 'missing_contingency' | 'regulated_diy' | 'missing_guest_separation';
  description: string;
  fixed: boolean;
}

export interface ComplianceResult {
  scenario: AgentRenovationScenario;
  issues: ComplianceIssue[];
}

// N2: contingency must be present as a line item at 15-25%
function ensureContingency(scenario: AgentRenovationScenario): {
  scenario: AgentRenovationScenario;
  issue: ComplianceIssue | null;
} {
  const allItems = scenario.phases.flatMap((p) => p.lineItems);
  const hasContingency = allItems.some((i) => i.category === 'contingency');

  if (hasContingency && scenario.contingencyPercent >= 15 && scenario.contingencyPercent <= 25) {
    return { scenario, issue: null };
  }

  // Add a contingency line item to the last phase
  const pct = scenario.contingencyPercent >= 15 && scenario.contingencyPercent <= 25
    ? scenario.contingencyPercent
    : 20;

  const constructionTotal = scenario.totalRenovationCost;
  const contingencyLow = Math.round(constructionTotal.low * (pct / 100));
  const contingencyHigh = Math.round(constructionTotal.high * (pct / 100));

  const contingencyItem: AgentLineItem = {
    key: 'contingency_reserve',
    description: `Contingency reserve (${pct}%) — unforeseen conditions, price escalation`,
    category: 'contingency',
    materialsCost: { low: 0, high: 0 },
    laborCost: { low: 0, high: 0 },
    totalCost: { low: contingencyLow, high: contingencyHigh },
    diyEligible: false,
    diyIneligibleReason: 'Reserve fund — not applicable',
  };

  const phases = [...scenario.phases];
  const lastPhase = phases[phases.length - 1];
  phases[phases.length - 1] = {
    ...lastPhase,
    lineItems: [...lastPhase.lineItems, contingencyItem],
    totalCost: {
      low: lastPhase.totalCost.low + contingencyLow,
      high: lastPhase.totalCost.high + contingencyHigh,
    },
  };

  return {
    scenario: {
      ...scenario,
      phases,
      contingencyPercent: pct,
      contingencyAmount: { low: contingencyLow, high: contingencyHigh },
    },
    issue: {
      type: 'missing_contingency',
      description: `Contingency line item was missing or out of range — added ${pct}% reserve`,
      fixed: true,
    },
  };
}

// N4: regulated work must not be DIY-eligible
function enforceRegulatedWork(scenario: AgentRenovationScenario): {
  scenario: AgentRenovationScenario;
  issues: ComplianceIssue[];
} {
  const issues: ComplianceIssue[] = [];

  const phases = scenario.phases.map((phase): AgentPhase => ({
    ...phase,
    lineItems: phase.lineItems.map((item): AgentLineItem => {
      if (!item.diyEligible) return item;

      const reason = isRegulatedWork(item.description);
      if (!reason) return item;

      issues.push({
        type: 'regulated_diy',
        description: `"${item.description}" (key: ${item.key}) was incorrectly marked DIY-eligible — fixed`,
        fixed: true,
      });

      return {
        ...item,
        diyEligible: false,
        diyIneligibleReason: reason,
      };
    }),
  }));

  return { scenario: { ...scenario, phases }, issues };
}

// N10: guest separation line items required when Airbnb units are present
function checkGuestSeparation(
  scenario: AgentRenovationScenario,
  property: PropertyInput,
): ComplianceIssue | null {
  if (property.searchCriteria.numberOfAirbnbUnits === 0) return null;

  const allItems = scenario.phases.flatMap((p) => p.lineItems);
  const hasGuestSeparation = allItems.some((i) => i.category === 'airbnb_fitout');

  if (hasGuestSeparation) return null;

  return {
    type: 'missing_guest_separation',
    description:
      `Property has ${property.searchCriteria.numberOfAirbnbUnits} Airbnb unit(s) but no guest_separation line items found. ` +
      `Synthesis step must add: independent entrances, sound insulation, separate terraces, privacy landscaping.`,
    fixed: false,
  };
}

export function runComplianceCheck(
  scenario: AgentRenovationScenario,
  property: PropertyInput,
): ComplianceResult {
  const issues: ComplianceIssue[] = [];

  const afterContingency = ensureContingency(scenario);
  if (afterContingency.issue) issues.push(afterContingency.issue);

  const afterRegulated = enforceRegulatedWork(afterContingency.scenario);
  issues.push(...afterRegulated.issues);

  const guestIssue = checkGuestSeparation(afterRegulated.scenario, property);
  if (guestIssue) issues.push(guestIssue);

  return { scenario: afterRegulated.scenario, issues };
}

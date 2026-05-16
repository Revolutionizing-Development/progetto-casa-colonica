import { describe, it, expect } from 'vitest';
import { runComplianceCheck } from '../synthesis/compliance';
import type { AgentRenovationScenario, PropertyInput } from '../types';

function makeScenario(
  overrides: Partial<AgentRenovationScenario> = {},
): AgentRenovationScenario {
  return {
    scenarioType: 'basic',
    phases: [
      {
        phaseNumber: 1,
        name: 'Structural',
        estimatedMonths: '1-6',
        totalCost: { low: 100000, high: 150000 },
        lineItems: [
          {
            key: 'phase1_structural_work',
            description: 'Seismic structural reinforcement and consolidation',
            category: 'structural',
            materialsCost: { low: 40000, high: 60000 },
            laborCost: { low: 60000, high: 90000 },
            totalCost: { low: 100000, high: 150000 },
            diyEligible: false,
            diyIneligibleReason: 'Licensed structural engineer required',
          },
        ],
      },
    ],
    farmFeatures: [],
    totalRenovationCost: { low: 100000, high: 150000 },
    contingencyPercent: 20,
    contingencyAmount: { low: 20000, high: 30000 },
    ...overrides,
  };
}

function makeProperty(overrides: Partial<PropertyInput> = {}): PropertyInput {
  return {
    commune: 'Città della Pieve',
    province: 'PG',
    region: 'Umbria',
    askingPrice: 200000,
    buildingAreaSqm: 300,
    landAreaSqm: 5000,
    numberOfFloors: 2,
    constructionType: 'stone',
    energyClass: 'G',
    conditionCategory: 'major_renovation',
    description: 'Test property',
    photos: [],
    searchCriteria: {
      intendedUse: 'vacation_home',
      numberOfAirbnbUnits: 0,
      farmFeatures: [],
    },
    ...overrides,
  };
}

describe('N2 — contingency enforcement', () => {
  it('passes when contingency line item is present at 15-25%', () => {
    const scenario = makeScenario({
      phases: [
        {
          phaseNumber: 1,
          name: 'Phase',
          estimatedMonths: '1-6',
          totalCost: { low: 120000, high: 180000 },
          lineItems: [
            {
              key: 'structural',
              description: 'Structural work',
              category: 'structural',
              materialsCost: { low: 40000, high: 60000 },
              laborCost: { low: 60000, high: 90000 },
              totalCost: { low: 100000, high: 150000 },
              diyEligible: false,
            },
            {
              key: 'contingency_reserve',
              description: 'Contingency 20%',
              category: 'contingency',
              materialsCost: { low: 0, high: 0 },
              laborCost: { low: 0, high: 0 },
              totalCost: { low: 20000, high: 30000 },
              diyEligible: false,
            },
          ],
        },
      ],
    });

    const result = runComplianceCheck(scenario, makeProperty());
    const contingencyIssues = result.issues.filter((i) => i.type === 'missing_contingency');
    expect(contingencyIssues).toHaveLength(0);
  });

  it('adds contingency when missing', () => {
    const scenario = makeScenario();
    // Remove contingency from the scenario
    const withoutContingency = {
      ...scenario,
      phases: scenario.phases.map((p) => ({
        ...p,
        lineItems: p.lineItems.filter((i) => i.category !== 'contingency'),
      })),
    };

    const result = runComplianceCheck(withoutContingency, makeProperty());
    const contingencyIssues = result.issues.filter((i) => i.type === 'missing_contingency');
    expect(contingencyIssues).toHaveLength(1);
    expect(contingencyIssues[0].fixed).toBe(true);

    // Verify contingency was actually added to the output scenario
    const allItems = result.scenario.phases.flatMap((p) => p.lineItems);
    expect(allItems.some((i) => i.category === 'contingency')).toBe(true);
  });
});

describe('N4 — regulated work enforcement', () => {
  it('fixes electrical work marked as DIY-eligible', () => {
    const scenario = makeScenario({
      phases: [
        {
          phaseNumber: 1,
          name: 'Systems',
          estimatedMonths: '3-6',
          totalCost: { low: 30000, high: 50000 },
          lineItems: [
            {
              key: 'electrical_rewiring',
              description: 'Complete electrical rewiring and distribution boards',
              category: 'systems',
              materialsCost: { low: 12000, high: 20000 },
              laborCost: { low: 18000, high: 30000 },
              totalCost: { low: 30000, high: 50000 },
              diyEligible: true, // WRONG — electrical requires licensed professional
            },
          ],
        },
      ],
    });

    const result = runComplianceCheck(scenario, makeProperty());
    const regulatedIssues = result.issues.filter((i) => i.type === 'regulated_diy');
    expect(regulatedIssues).toHaveLength(1);
    expect(regulatedIssues[0].fixed).toBe(true);

    // Verify the item was fixed in the output
    const allItems = result.scenario.phases.flatMap((p) => p.lineItems);
    const electrical = allItems.find((i) => i.key === 'electrical_rewiring');
    expect(electrical?.diyEligible).toBe(false);
    expect(electrical?.diyIneligibleReason?.toLowerCase()).toContain('dichiarazione di conformità');
  });

  it('does not flag non-regulated work', () => {
    const scenario = makeScenario({
      phases: [
        {
          phaseNumber: 1,
          name: 'Finishes',
          estimatedMonths: '1-2',
          totalCost: { low: 5000, high: 8000 },
          lineItems: [
            {
              key: 'interior_painting',
              description: 'Interior painting and wall preparation',
              category: 'finishes',
              materialsCost: { low: 2000, high: 3000 },
              laborCost: { low: 3000, high: 5000 },
              totalCost: { low: 5000, high: 8000 },
              diyEligible: true,
            },
          ],
        },
      ],
    });

    const result = runComplianceCheck(scenario, makeProperty());
    const regulatedIssues = result.issues.filter((i) => i.type === 'regulated_diy');
    expect(regulatedIssues).toHaveLength(0);
  });
});

describe('N10 — guest separation check', () => {
  it('flags missing airbnb_fitout items when Airbnb units are requested', () => {
    const scenario = makeScenario();
    const property = makeProperty({
      searchCriteria: {
        intendedUse: 'airbnb',
        numberOfAirbnbUnits: 2,
        farmFeatures: [],
      },
    });

    const result = runComplianceCheck(scenario, property);
    const guestIssues = result.issues.filter((i) => i.type === 'missing_guest_separation');
    expect(guestIssues).toHaveLength(1);
    expect(guestIssues[0].fixed).toBe(false);
  });

  it('does not flag when no Airbnb units', () => {
    const scenario = makeScenario();
    const property = makeProperty({
      searchCriteria: {
        intendedUse: 'vacation_home',
        numberOfAirbnbUnits: 0,
        farmFeatures: [],
      },
    });

    const result = runComplianceCheck(scenario, property);
    const guestIssues = result.issues.filter((i) => i.type === 'missing_guest_separation');
    expect(guestIssues).toHaveLength(0);
  });

  it('does not flag when airbnb_fitout items are present', () => {
    const scenario = makeScenario({
      phases: [
        {
          phaseNumber: 1,
          name: 'Airbnb fitout',
          estimatedMonths: '2-4',
          totalCost: { low: 40000, high: 60000 },
          lineItems: [
            {
              key: 'guest_separation_entrance',
              description: 'Independent entrance for Airbnb apartment A',
              category: 'airbnb_fitout',
              materialsCost: { low: 15000, high: 20000 },
              laborCost: { low: 25000, high: 40000 },
              totalCost: { low: 40000, high: 60000 },
              diyEligible: false,
              diyIneligibleReason: 'Structural modification requires licensed contractor',
            },
          ],
        },
      ],
    });
    const property = makeProperty({
      searchCriteria: {
        intendedUse: 'airbnb',
        numberOfAirbnbUnits: 1,
        farmFeatures: [],
      },
    });

    const result = runComplianceCheck(scenario, property);
    const guestIssues = result.issues.filter((i) => i.type === 'missing_guest_separation');
    expect(guestIssues).toHaveLength(0);
  });
});

'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { PropertyRow } from '@/app/actions/properties';
import type { RenovationScenario } from '@/types/renovation';
import { FINANCIAL_DEFAULTS } from '@/config/defaults';

const D = FINANCIAL_DEFAULTS;

const NIGHTLY_RATE_BY_REGION: Record<string, number> = {
  Toscana: 200, Umbria: 155, Marche: 130, Lazio: 145, Abruzzo: 110,
  Campania: 135, Sicilia: 150, Sardegna: 160, Piemonte: 140, Liguria: 165,
};

function fmt(n: number, decimals = 0) { return n.toLocaleString('en-US', { maximumFractionDigits: decimals }); }
function fmtEur(n: number) { return `€${fmt(n)}`; }

function Row({ label, value, sub, highlight }: { label: string; value: string; sub?: string; highlight?: boolean }) {
  return (
    <div className={`flex items-start justify-between py-2.5 border-b border-stone-100 last:border-0 ${highlight ? 'font-semibold' : ''}`}>
      <div>
        <span className={`text-sm ${highlight ? 'text-stone-900' : 'text-stone-600'}`}>{label}</span>
        {sub && <span className="block text-xs text-stone-400 mt-0.5">{sub}</span>}
      </div>
      <span className={`text-sm ${highlight ? 'text-stone-900' : 'text-stone-700'} text-right ml-4`}>{value}</span>
    </div>
  );
}

function InputRow({ label, sub, children }: { label: string; sub?: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 py-2.5 border-b border-stone-100 last:border-0">
      <div>
        <p className="text-sm text-stone-600">{label}</p>
        {sub && <p className="text-xs text-stone-400 mt-0.5">{sub}</p>}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <button
      type="button"
      onClick={onChange}
      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${checked ? 'bg-amber-500' : 'bg-stone-200'}`}
    >
      <span className={`inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-5' : 'translate-x-1'}`} />
    </button>
  );
}

interface Props {
  property: PropertyRow;
  scenarios: RenovationScenario[];
}

export default function CostsPanel({ property, scenarios }: Props) {
  const pathname = usePathname();
  const locale = pathname.split('/')[1] ?? 'en';

  // Acquisition
  const [negotiatedPrice, setNegotiatedPrice] = useState(property.listed_price);
  const [isPrimary, setIsPrimary] = useState(false);
  const [selectedScenarioId, setSelectedScenarioId] = useState<string>(scenarios[0]?.id ?? '');
  const [manualRenovation, setManualRenovation] = useState(0);

  // Accommodation income
  const [nightlyRate, setNightlyRate] = useState(NIGHTLY_RATE_BY_REGION[property.region] ?? 120);
  const [beds, setBeds] = useState(Math.max(1, property.num_bedrooms ?? 2));
  const [occupancyPct, setOccupancyPct] = useState(40);

  // Experience income (5 lines per Constitution)
  const [wineEnabled, setWineEnabled] = useState(!!property.has_vineyard);
  const [winePricePerPerson, setWinePricePerPerson] = useState(35);
  const [wineSessionsPerWeek, setWineSessionsPerWeek] = useState(2);

  const [cookingEnabled, setCookingEnabled] = useState(!!property.has_pizza_oven);
  const [cookingPricePerPerson, setCookingPricePerPerson] = useState(55);
  const [cookingSessionsPerWeek, setCookingSessionsPerWeek] = useState(1);

  const [farmEnabled, setFarmEnabled] = useState(false);
  const [farmPricePerPerson, setFarmPricePerPerson] = useState(25);
  const [farmSessionsPerWeek, setFarmSessionsPerWeek] = useState(2);

  const [oliveEnabled, setOliveEnabled] = useState(!!property.has_olive_grove);
  const [oliveTrees, setOliveTrees] = useState(property.has_olive_grove ? 50 : 0);

  // Farmstead toggles
  const [chickensEnabled, setChickensEnabled] = useState(false);
  const [goatsEnabled, setGoatsEnabled] = useState(false);
  const [pizzaOvenEnabled, setPizzaOvenEnabled] = useState(!!property.has_pizza_oven);
  const [courtyardEnabled, setCourtyardEnabled] = useState(true);

  // View toggle
  const [showInvestment, setShowInvestment] = useState(false);

  const selectedScenario = scenarios.find((s) => s.id === selectedScenarioId) ?? null;

  const computed = useMemo(() => {
    // ── Purchase costs ──
    const notaio = Math.round(negotiatedPrice * D.notaio_fee_pct);
    const agency = Math.round(negotiatedPrice * D.agency_fee_pct);
    const regTax = Math.round(negotiatedPrice * (isPrimary ? D.registration_tax_pct_resident : D.registration_tax_pct_non_resident));
    const legal = 3000;
    const survey = 2500;
    const totalPurchase = negotiatedPrice + notaio + agency + regTax + legal + survey;

    // ── Renovation ──
    let renovationBase = manualRenovation;
    let contingency = 0;
    if (selectedScenario) {
      renovationBase = selectedScenario.renovation_total_max;
      contingency = selectedScenario.contingency_amount;
    } else if (renovationBase > 0) {
      contingency = Math.round(renovationBase * D.contingency_pct);
    }
    const totalRenovation = renovationBase + contingency;
    const totalInvestment = totalPurchase + totalRenovation;

    // ── 5-line income (stabilized year, per Constitution) ──
    const seasonWeeks = 26;
    const guestsPerSession = 6;

    const accommodationIncome = Math.round(nightlyRate * 365 * (occupancyPct / 100));
    const wineIncome = wineEnabled ? Math.round(winePricePerPerson * guestsPerSession * wineSessionsPerWeek * seasonWeeks) : 0;
    const cookingIncome = cookingEnabled ? Math.round(cookingPricePerPerson * guestsPerSession * cookingSessionsPerWeek * seasonWeeks) : 0;
    const farmIncome = farmEnabled ? Math.round(farmPricePerPerson * guestsPerSession * farmSessionsPerWeek * seasonWeeks) : 0;

    const oliveOilLitres = oliveTrees * ((D.olive_oil_litres_per_tree_min + D.olive_oil_litres_per_tree_max) / 2);
    const oliveIncome = oliveEnabled ? Math.round(oliveOilLitres * D.olive_oil_price_per_litre) : 0;

    const totalGrossIncome = accommodationIncome + wineIncome + cookingIncome + farmIncome + oliveIncome;

    // ── Operating costs ──
    const platformFee = Math.round(accommodationIncome * D.airbnb_platform_fee_pct);
    const mgmt = Math.round(accommodationIncome * D.property_management_pct);
    const cleaning = Math.round(accommodationIncome * 0.08);
    const utilities = 3000;
    const maintenance = Math.round(totalPurchase * D.annual_maintenance_pct);
    const insurance = 2000;
    const imu = isPrimary ? 0 : Math.round(negotiatedPrice * 0.001);
    const tari = 800;

    // Farmstead ongoing costs (€3-6K/yr per Constitution)
    const chickensAnnual = chickensEnabled ? Math.round((D.farmstead_chickens_annual_min + D.farmstead_chickens_annual_max) / 2) : 0;
    const goatsAnnual = goatsEnabled ? Math.round((D.farmstead_goats_annual_min + D.farmstead_goats_annual_max) / 2) : 0;
    const pizzaOvenAnnual = pizzaOvenEnabled ? Math.round((D.farmstead_pizza_oven_annual_min + D.farmstead_pizza_oven_annual_max) / 2) : 0;
    const courtyardAnnual = courtyardEnabled ? Math.round((D.farmstead_courtyard_annual_min + D.farmstead_courtyard_annual_max) / 2) : 0;
    const oliveAnnual = oliveEnabled ? D.olive_maintenance_cost_annual + D.olive_pressing_cost_annual : 0;
    const farmsteadTotal = chickensAnnual + goatsAnnual + pizzaOvenAnnual + courtyardAnnual + oliveAnnual;

    const totalOpEx = platformFee + mgmt + cleaning + utilities + maintenance + insurance + imu + tari + farmsteadTotal;

    // ── Operating P&L (primary view per N12) ──
    const netOperatingIncome = totalGrossIncome - totalOpEx;
    const monthlyNet = Math.round(netOperatingIncome / 12);

    // ── Carrying costs (during renovation) ──
    const renovMonths = selectedScenario?.renovation_duration_months ?? 18;
    const monthlyCarrying = Math.round((imu + insurance + utilities + maintenance) / 12);

    // ── Operating year-by-year (income starts Y2 partial, Y3 full per Constitution N1) ──
    const operatingYears = Array.from({ length: 6 }, (_, i) => {
      if (i === 0) return { year: i, label: `Year ${i} (Reno)`, income: 0, expenses: Math.round(totalOpEx * 0.3), net: 0, cumulative: 0 };
      if (i === 1) {
        const renoRemaining = renovMonths > 12 ? Math.min(12, renovMonths - 12) : 0;
        const opMonths = Math.max(0, 12 - renoRemaining);
        const partialIncome = Math.round(totalGrossIncome * (opMonths / 12) * 0.3);
        const partialExpenses = Math.round(totalOpEx * (opMonths / 12));
        return { year: i, label: renoRemaining > 0 ? `Year ${i} (Reno)` : `Year ${i}`, income: partialIncome, expenses: partialExpenses, net: partialIncome - partialExpenses, cumulative: 0 };
      }
      if (i === 2) {
        const partialIncome = Math.round(totalGrossIncome * 0.5);
        return { year: i, label: `Year ${i} (Ramp)`, income: partialIncome, expenses: totalOpEx, net: partialIncome - totalOpEx, cumulative: 0 };
      }
      return { year: i, label: `Year ${i}`, income: totalGrossIncome, expenses: totalOpEx, net: netOperatingIncome, cumulative: 0 };
    });

    let cum = 0;
    for (const row of operatingYears) { cum += row.net; row.cumulative = cum; }

    const selfSustainingYear = operatingYears.findIndex((r) => r.year >= 2 && r.net > 0);

    // ── Investment break-even (secondary toggle per N12) ──
    const investmentBreakEvenYears = netOperatingIncome > 0 ? Math.round(totalInvestment / netOperatingIncome) : null;

    return {
      notaio, agency, regTax, legal, survey, totalPurchase,
      renovationBase, contingency, totalRenovation, totalInvestment,
      accommodationIncome, wineIncome, cookingIncome, farmIncome, oliveIncome, totalGrossIncome,
      platformFee, mgmt, cleaning, utilities, maintenance, insurance, imu, tari,
      chickensAnnual, goatsAnnual, pizzaOvenAnnual, courtyardAnnual, oliveAnnual, farmsteadTotal,
      totalOpEx, netOperatingIncome, monthlyNet,
      monthlyCarrying, renovMonths,
      operatingYears, selfSustainingYear,
      investmentBreakEvenYears,
    };
  }, [negotiatedPrice, isPrimary, selectedScenario, manualRenovation, nightlyRate, beds, occupancyPct,
    wineEnabled, winePricePerPerson, wineSessionsPerWeek, cookingEnabled, cookingPricePerPerson, cookingSessionsPerWeek,
    farmEnabled, farmPricePerPerson, farmSessionsPerWeek, oliveEnabled, oliveTrees,
    chickensEnabled, goatsEnabled, pizzaOvenEnabled, courtyardEnabled]);

  return (
    <section className="space-y-8">
      <div>
        <h2 className="text-base font-semibold text-stone-900">Financial Model</h2>
        <p className="text-sm text-stone-500 mt-1">
          Operating P&L — can you afford this life? Adjust inputs to model your scenario.
        </p>
      </div>

      {/* ── SUSTAINABILITY HEADLINE ── */}
      <div className={`rounded-xl border p-5 ${computed.netOperatingIncome > 0 ? 'bg-emerald-50 border-emerald-200' : 'bg-amber-50 border-amber-200'}`}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-stone-500">Monthly net operating income (stabilized)</p>
            <p className={`text-2xl font-bold ${computed.monthlyNet >= 0 ? 'text-emerald-800' : 'text-red-700'}`}>
              {computed.monthlyNet >= 0 ? '+' : ''}{fmtEur(computed.monthlyNet)}/mo
            </p>
          </div>
          {computed.selfSustainingYear > 0 && (
            <span className="px-3 py-1.5 bg-emerald-100 text-emerald-800 text-sm font-semibold rounded-full">
              Self-sustaining from Year {computed.operatingYears[computed.selfSustainingYear]?.year ?? '—'}
            </span>
          )}
        </div>
        <p className="text-xs text-stone-500 mt-2">
          Burn rate during renovation: {fmtEur(computed.monthlyCarrying)}/mo for ~{computed.renovMonths} months
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ── LEFT: INPUTS ── */}
        <div className="space-y-6">
          {/* Acquisition */}
          <Card title="Acquisition">
            <InputRow label="Negotiated price" sub="Target purchase price">
              <EuroInput value={negotiatedPrice} onChange={setNegotiatedPrice} step={5000} />
            </InputRow>
            <InputRow label="Primary residence?" sub="2% vs 9% registration tax">
              <Toggle checked={isPrimary} onChange={() => setIsPrimary((v) => !v)} />
            </InputRow>
          </Card>

          {/* Renovation */}
          <Card title="Renovation">
            {scenarios.length > 0 && (
              <InputRow label="Scenario" sub="Uses scenario max + contingency">
                <select
                  value={selectedScenarioId}
                  onChange={(e) => setSelectedScenarioId(e.target.value)}
                  className="text-sm border border-stone-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-amber-400"
                >
                  <option value="">Manual budget</option>
                  {scenarios.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </InputRow>
            )}
            {!selectedScenario && (
              <InputRow label="Manual renovation budget" sub="Before contingency">
                <EuroInput value={manualRenovation} onChange={setManualRenovation} step={10000} />
              </InputRow>
            )}
          </Card>

          {/* Accommodation income */}
          <Card title="Accommodation income">
            <InputRow label="Nightly rate" sub={property.region || 'Avg rate'}>
              <EuroInput value={nightlyRate} onChange={setNightlyRate} step={10} width="w-24" />
            </InputRow>
            <InputRow label="Bookable beds">
              <Stepper value={beds} min={1} onChange={setBeds} />
            </InputRow>
            <InputRow label="Occupancy" sub={`${Math.round(365 * occupancyPct / 100)} nights/year`}>
              <div className="flex items-center gap-2">
                <input type="range" min={10} max={90} step={5} value={occupancyPct} onChange={(e) => setOccupancyPct(Number(e.target.value))} className="w-28 accent-amber-600" />
                <span className="text-sm font-medium text-stone-800 w-8 text-right">{occupancyPct}%</span>
              </div>
            </InputRow>
          </Card>

          {/* Experience income (4 additional lines) */}
          <Card title="Experience income">
            <InputRow label="Wine tastings" sub={wineEnabled ? `${wineSessionsPerWeek}x/wk · ${winePricePerPerson}€/person · 26 wks` : 'Disabled'}>
              <Toggle checked={wineEnabled} onChange={() => setWineEnabled((v) => !v)} />
            </InputRow>
            <InputRow label="Cooking / pizza classes" sub={cookingEnabled ? `${cookingSessionsPerWeek}x/wk · ${cookingPricePerPerson}€/person` : 'Disabled'}>
              <Toggle checked={cookingEnabled} onChange={() => setCookingEnabled((v) => !v)} />
            </InputRow>
            <InputRow label="Farm experiences" sub={farmEnabled ? `${farmSessionsPerWeek}x/wk · ${farmPricePerPerson}€/person` : 'Disabled'}>
              <Toggle checked={farmEnabled} onChange={() => setFarmEnabled((v) => !v)} />
            </InputRow>
            <InputRow label="Olive oil sales" sub={oliveEnabled ? `${oliveTrees} trees · ~${D.olive_oil_price_per_litre}€/L` : 'Disabled'}>
              <Toggle checked={oliveEnabled} onChange={() => setOliveEnabled((v) => !v)} />
            </InputRow>
          </Card>

          {/* Farmstead costs */}
          <Card title="Farmstead operating costs">
            <InputRow label="Chickens (10-15 birds)" sub={`€${D.farmstead_chickens_annual_min}–${D.farmstead_chickens_annual_max}/yr · ~30 min/day`}>
              <Toggle checked={chickensEnabled} onChange={() => setChickensEnabled((v) => !v)} />
            </InputRow>
            <InputRow label="Goats (3-4)" sub={`€${D.farmstead_goats_annual_min}–${D.farmstead_goats_annual_max}/yr · ~45 min/day`}>
              <Toggle checked={goatsEnabled} onChange={() => setGoatsEnabled((v) => !v)} />
            </InputRow>
            <InputRow label="Pizza oven ops" sub={`€${D.farmstead_pizza_oven_annual_min}–${D.farmstead_pizza_oven_annual_max}/yr`}>
              <Toggle checked={pizzaOvenEnabled} onChange={() => setPizzaOvenEnabled((v) => !v)} />
            </InputRow>
            <InputRow label="Courtyard care" sub={`€${D.farmstead_courtyard_annual_min}–${D.farmstead_courtyard_annual_max}/yr`}>
              <Toggle checked={courtyardEnabled} onChange={() => setCourtyardEnabled((v) => !v)} />
            </InputRow>
            {computed.farmsteadTotal > 0 && (
              <Row label="Total farmstead" value={`${fmtEur(computed.farmsteadTotal)}/yr`} sub={`${fmtEur(Math.round(computed.farmsteadTotal / 12))}/mo`} highlight />
            )}
          </Card>
        </div>

        {/* ── RIGHT: OUTPUTS ── */}
        <div className="space-y-6">
          {/* Operating P&L — PRIMARY VIEW (N12) */}
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 overflow-hidden">
            <div className="px-5 py-3 border-b border-emerald-100">
              <h3 className="text-sm font-semibold text-emerald-800">Annual Operating P&L (Stabilized)</h3>
            </div>
            <div className="px-5 divide-y divide-emerald-100">
              <Row label="Accommodation" sub={`${Math.round(365 * occupancyPct / 100)} nights @ €${nightlyRate}`} value={fmtEur(computed.accommodationIncome)} />
              {computed.wineIncome > 0 && <Row label="Wine tastings" value={fmtEur(computed.wineIncome)} />}
              {computed.cookingIncome > 0 && <Row label="Cooking / pizza" value={fmtEur(computed.cookingIncome)} />}
              {computed.farmIncome > 0 && <Row label="Farm experiences" value={fmtEur(computed.farmIncome)} />}
              {computed.oliveIncome > 0 && <Row label="Olive oil" value={fmtEur(computed.oliveIncome)} />}
              <Row label="Total gross income" value={fmtEur(computed.totalGrossIncome)} highlight />
              <Row label="Platform fees (3%)" value={`-${fmtEur(computed.platformFee)}`} />
              <Row label="Property management (15%)" value={`-${fmtEur(computed.mgmt)}`} />
              <Row label="Cleaning" value={`-${fmtEur(computed.cleaning)}`} />
              <Row label="Utilities" value={`-${fmtEur(computed.utilities)}`} />
              <Row label="Maintenance" value={`-${fmtEur(computed.maintenance)}`} />
              <Row label="Insurance" value={`-${fmtEur(computed.insurance)}`} />
              {computed.imu > 0 && <Row label="IMU" value={`-${fmtEur(computed.imu)}`} />}
              <Row label="TARI" value={`-${fmtEur(computed.tari)}`} />
              {computed.farmsteadTotal > 0 && <Row label="Farmstead operations" sub={`€${fmt(Math.round(computed.farmsteadTotal / 12))}/mo`} value={`-${fmtEur(computed.farmsteadTotal)}`} />}
              <Row label="Total operating costs" value={`-${fmtEur(computed.totalOpEx)}`} highlight />
              <div className={`py-3 ${computed.netOperatingIncome >= 0 ? 'text-emerald-800' : 'text-red-700'}`}>
                <Row label="Net operating income" value={`${computed.netOperatingIncome >= 0 ? '+' : ''}${fmtEur(computed.netOperatingIncome)}/yr`} highlight />
                <p className="text-xs text-stone-500 mt-1 px-0">{computed.monthlyNet >= 0 ? '+' : ''}{fmtEur(computed.monthlyNet)}/mo</p>
              </div>
            </div>
          </div>

          {/* Acquisition + Renovation (always visible) */}
          <Card title="Acquisition costs">
            <Row label="Negotiated price" value={fmtEur(negotiatedPrice)} />
            <Row label="Notaio (1.5%)" value={fmtEur(computed.notaio)} />
            <Row label="Agency (3%)" value={fmtEur(computed.agency)} />
            <Row label="Registration tax" sub={isPrimary ? '2% primary' : '9% second home'} value={fmtEur(computed.regTax)} />
            <Row label="Legal + survey" value={fmtEur(computed.legal + computed.survey)} />
            <Row label="Total acquisition" value={fmtEur(computed.totalPurchase)} highlight />
          </Card>

          <Card title="Renovation">
            <Row label={selectedScenario ? `${selectedScenario.name} (max)` : 'Renovation budget'} value={fmtEur(computed.renovationBase)} />
            <Row label="Contingency (20%)" value={fmtEur(computed.contingency)} />
            <Row label="Total renovation" value={fmtEur(computed.totalRenovation)} highlight />
          </Card>

          <Card title="Total investment">
            <Row label="Total investment" value={fmtEur(computed.totalInvestment)} highlight />
          </Card>

          {/* Investment break-even — SECONDARY TOGGLE (N12) */}
          <div className="border border-stone-200 rounded-xl overflow-hidden">
            <button
              onClick={() => setShowInvestment((v) => !v)}
              className="w-full px-5 py-3 flex items-center justify-between text-sm text-stone-600 hover:bg-stone-50"
            >
              <span>Investment break-even</span>
              <span className="text-xs text-stone-400">{showInvestment ? '▲ collapse' : '▼ expand'}</span>
            </button>
            {showInvestment && (
              <div className="px-5 pb-4 border-t border-stone-100 divide-y divide-stone-100">
                <Row
                  label="Break-even (rental only)"
                  value={computed.investmentBreakEvenYears ? `~${computed.investmentBreakEvenYears} years` : '—'}
                  sub="Total investment / net operating income"
                />
                <Row
                  label="Break-even (with 3% appreciation)"
                  value={computed.investmentBreakEvenYears && computed.investmentBreakEvenYears > 5 ? `~${Math.round(computed.investmentBreakEvenYears * 0.5)} years` : computed.investmentBreakEvenYears ? `~${computed.investmentBreakEvenYears} years` : '—'}
                  sub="Including estimated property value appreciation"
                />
                <p className="text-xs text-stone-400 pt-2">
                  Investment break-even is a secondary metric. The primary question is operating sustainability — can you afford to live there?
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Operating cash flow projection */}
      <div className="rounded-xl border border-stone-200 overflow-hidden">
        <div className="px-5 py-3 border-b border-stone-100 bg-stone-50">
          <h3 className="text-sm font-semibold text-stone-700">Operating P&L by year</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-stone-100">
                <th className="px-4 py-2.5 text-left text-xs font-semibold text-stone-400 uppercase tracking-wide">Period</th>
                <th className="px-4 py-2.5 text-right text-xs font-semibold text-stone-400 uppercase tracking-wide">Income</th>
                <th className="px-4 py-2.5 text-right text-xs font-semibold text-stone-400 uppercase tracking-wide">Operating Costs</th>
                <th className="px-4 py-2.5 text-right text-xs font-semibold text-stone-400 uppercase tracking-wide">Net</th>
                <th className="px-4 py-2.5 text-right text-xs font-semibold text-stone-400 uppercase tracking-wide">Cumulative Net</th>
              </tr>
            </thead>
            <tbody>
              {computed.operatingYears.map((row, i) => (
                <tr key={i} className={`border-b border-stone-100 last:border-0 ${i <= 1 ? 'bg-stone-50' : ''}`}>
                  <td className="px-4 py-2.5 text-stone-700 font-medium">{row.label}</td>
                  <td className="px-4 py-2.5 text-right text-stone-600">{row.income ? fmtEur(row.income) : '—'}</td>
                  <td className="px-4 py-2.5 text-right text-stone-600">{row.expenses ? fmtEur(row.expenses) : '—'}</td>
                  <td className={`px-4 py-2.5 text-right font-medium ${row.net >= 0 ? 'text-emerald-700' : 'text-red-600'}`}>
                    {row.net >= 0 ? '+' : ''}{fmtEur(Math.round(row.net))}
                  </td>
                  <td className={`px-4 py-2.5 text-right font-semibold ${row.cumulative >= 0 ? 'text-emerald-700' : 'text-red-600'}`}>
                    {row.cumulative >= 0 ? '+' : ''}{fmtEur(Math.round(row.cumulative))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-stone-200">
        <p className="text-xs text-stone-400 flex-1">
          All figures are estimates. Consult a commercialista before committing. Income follows Constitution N1: zero during renovation, partial Y2, full from Y3.
        </p>
        <Link
          href={`/${locale}/property/${property.id}/costs/invoice`}
          className="ml-6 shrink-0 px-5 py-2.5 bg-amber-600 text-white text-sm font-medium rounded-lg hover:bg-amber-700 transition-colors"
        >
          Record Invoices &amp; Track Tax Bonuses →
        </Link>
      </div>
    </section>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-stone-200 bg-white overflow-hidden">
      <div className="px-5 py-3 border-b border-stone-100 bg-stone-50">
        <h3 className="text-sm font-semibold text-stone-700">{title}</h3>
      </div>
      <div className="px-5 divide-y divide-stone-100">{children}</div>
    </div>
  );
}

function EuroInput({ value, onChange, step = 1000, width = 'w-32' }: { value: number; onChange: (n: number) => void; step?: number; width?: string }) {
  return (
    <div className="flex items-center gap-1">
      <span className="text-sm text-stone-500">€</span>
      <input type="number" value={value} onChange={(e) => onChange(Number(e.target.value))} step={step} min={0} className={`${width} text-right text-sm border border-stone-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-amber-400`} />
    </div>
  );
}

function Stepper({ value, min = 0, onChange }: { value: number; min?: number; onChange: (n: number) => void }) {
  return (
    <div className="flex items-center gap-2">
      <button onClick={() => onChange(Math.max(min, value - 1))} className="w-7 h-7 rounded-full border border-stone-200 text-stone-600 hover:bg-stone-50 text-sm font-bold">−</button>
      <span className="text-sm font-medium text-stone-800 w-6 text-center">{value}</span>
      <button onClick={() => onChange(value + 1)} className="w-7 h-7 rounded-full border border-stone-200 text-stone-600 hover:bg-stone-50 text-sm font-bold">+</button>
    </div>
  );
}

export type FundingSourceType =
  | 'property_sale'
  | 'investment_liquidation'
  | 'salary_savings'
  | 'existing_cash'
  | 'currency_conversion'
  | 'mortgage';

export type FundingStatus = 'planned' | 'in_progress' | 'complete' | 'received';

export interface FundingSource {
  id: string;
  financial_model_id: string;
  user_id: string;
  type: FundingSourceType;
  description: string;
  amount_usd?: number;
  amount_eur: number;
  status: FundingStatus;
  expected_date?: string;
  actual_date?: string;
  exchange_rate?: number;
  confidence_pct: number;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface CurrencyConversion {
  id: string;
  user_id: string;
  property_id: string;
  date: string;
  amount_usd: number;
  exchange_rate: number;
  amount_eur: number;
  fee: number;
  net_eur: number;
  provider?: string;
  notes?: string;
  created_at: string;
}

export interface FundingGap {
  total_required: number;
  total_committed: number;
  total_received: number;
  gap: number;
  surplus: number;
  funding_confidence_pct: number;
  timeline_risk: 'low' | 'medium' | 'high';
}

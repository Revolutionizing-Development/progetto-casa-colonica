'use server';

import { withAccess } from '@/lib/access';
import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import type { FundingSource } from '@/types/financial';

const FundingSchema = z.object({
  type: z.enum(['property_sale', 'investment_liquidation', 'salary_savings', 'existing_cash', 'currency_conversion', 'mortgage']),
  description: z.string().min(1, 'Description is required').max(300),
  amount_usd: z.coerce.number().int().min(0).optional(),
  amount_eur: z.coerce.number().int().min(1, 'EUR amount is required'),
  status: z.enum(['planned', 'in_progress', 'complete', 'received']),
  expected_date: z.string().optional(),
  actual_date: z.string().optional(),
  exchange_rate: z.coerce.number().min(0).optional(),
  notes: z.string().max(500).optional(),
});

type ActionResult<T = true> =
  | { data: T; error?: never }
  | { data?: never; error: string };

export async function getFundingSources(propertyId: string): Promise<FundingSource[]> {
  await withAccess('property:read');
  const supabase = createClient();

  const { data } = await supabase
    .from('funding_sources')
    .select('*')
    .eq('property_id', propertyId)
    .order('expected_date', { ascending: true });

  return (data ?? []) as FundingSource[];
}

export async function createFundingSource(
  propertyId: string,
  input: z.infer<typeof FundingSchema>,
): Promise<ActionResult<FundingSource>> {
  const uid = await withAccess('property:update');
  const supabase = createClient();

  const parsed = FundingSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const d = parsed.data;
  const { data: saved, error } = await supabase
    .from('funding_sources')
    .insert({
      property_id: propertyId,
      user_id: uid,
      type: d.type,
      description: d.description,
      amount_usd: d.amount_usd ?? null,
      amount_eur: d.amount_eur,
      status: d.status,
      expected_date: d.expected_date || null,
      actual_date: d.actual_date || null,
      exchange_rate: d.exchange_rate ?? null,
      notes: d.notes || null,
    })
    .select()
    .single();

  if (error) return { error: error.message };
  revalidatePath('/', 'layout');
  return { data: saved as FundingSource };
}

export async function updateFundingStatus(
  fundingId: string,
  status: FundingSource['status'],
  actualDate?: string,
): Promise<ActionResult> {
  const uid = await withAccess('property:update');
  const supabase = createClient();

  const update: Record<string, string> = { status };
  if (actualDate) update.actual_date = actualDate;

  const { error } = await supabase
    .from('funding_sources')
    .update(update)
    .eq('id', fundingId)
    .eq('user_id', uid);

  if (error) return { error: error.message };
  revalidatePath('/', 'layout');
  return { data: true };
}

export async function deleteFundingSource(fundingId: string): Promise<ActionResult> {
  const uid = await withAccess('property:update');
  const supabase = createClient();

  const { error } = await supabase
    .from('funding_sources')
    .delete()
    .eq('id', fundingId)
    .eq('user_id', uid);

  if (error) return { error: error.message };
  revalidatePath('/', 'layout');
  return { data: true };
}

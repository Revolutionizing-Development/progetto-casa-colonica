'use server';

import { withAccess } from '@/lib/access';
import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import type { Invoice, TaxDeductionTracker } from '@/types/invoice';

const InvoiceSchema = z.object({
  vendor_name: z.string().min(1, 'Vendor name is required').max(200),
  vendor_partita_iva: z.string().max(20).optional(),
  invoice_number: z.string().max(50).optional(),
  invoice_date: z.string().optional(),
  amount_excl_iva: z.coerce.number().int().min(0),
  iva_rate: z.coerce.number().min(0).max(100).optional(),
  iva_amount: z.coerce.number().int().min(0).optional(),
  total_amount: z.coerce.number().int().min(1, 'Total amount is required'),
  description: z.string().min(1, 'Description is required').max(500),
  phase_number: z.coerce.number().int().min(0).optional().nullable(),
  line_item_key: z.string().max(100).optional(),
  is_diy_materials: z.boolean().optional(),
  tax_bonus: z.enum(['ristrutturazione', 'ecobonus', 'sismabonus', 'mobili', 'none']).optional(),
  payment_method: z.enum(['bonifico_parlante', 'credit_card', 'cash', 'regular_transfer']),
  bonifico_text: z.string().max(500).optional(),
  notes: z.string().max(1000).optional(),
});

type ActionResult<T = true> =
  | { data: T; error?: never }
  | { data?: never; error: string };

export async function getInvoices(propertyId: string): Promise<Invoice[]> {
  await withAccess('property:read');
  const supabase = createClient();

  const { data } = await supabase
    .from('invoices')
    .select('*')
    .eq('property_id', propertyId)
    .order('invoice_date', { ascending: false });

  return (data ?? []) as Invoice[];
}

export async function createInvoice(
  propertyId: string,
  input: z.infer<typeof InvoiceSchema>,
): Promise<ActionResult<Invoice>> {
  const uid = await withAccess('property:update');
  const supabase = createClient();

  const parsed = InvoiceSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const d = parsed.data;
  const isTaxDeductible =
    d.tax_bonus !== 'none' &&
    d.tax_bonus !== undefined &&
    (d.payment_method === 'bonifico_parlante' ||
      (d.tax_bonus === 'mobili' && d.payment_method === 'credit_card'));

  const { data: saved, error } = await supabase
    .from('invoices')
    .insert({
      property_id: propertyId,
      user_id: uid,
      vendor_name: d.vendor_name,
      vendor_partita_iva: d.vendor_partita_iva || null,
      invoice_number: d.invoice_number || null,
      invoice_date: d.invoice_date || null,
      amount_excl_iva: d.amount_excl_iva,
      iva_rate: d.iva_rate ?? 22,
      iva_amount: d.iva_amount ?? 0,
      total_amount: d.total_amount,
      description: d.description,
      phase_number: d.phase_number ?? null,
      line_item_key: d.line_item_key || null,
      is_diy_materials: d.is_diy_materials ?? false,
      tax_bonus: d.tax_bonus ?? 'none',
      payment_method: d.payment_method,
      is_tax_deductible: isTaxDeductible,
      bonifico_text: d.bonifico_text || null,
      payment_confirmed: false,
      notes: d.notes || null,
    })
    .select()
    .single();

  if (error) return { error: error.message };

  // Update tax tracker spending
  if (isTaxDeductible && d.tax_bonus && d.tax_bonus !== 'none') {
    await updateTaxTrackerSpending(supabase, propertyId, uid, d.tax_bonus, d.total_amount);
  }

  revalidatePath('/', 'layout');
  return { data: saved as Invoice };
}

export async function deleteInvoice(invoiceId: string): Promise<ActionResult> {
  const uid = await withAccess('property:update');
  const supabase = createClient();

  const { data: invoice } = await supabase
    .from('invoices')
    .select('*')
    .eq('id', invoiceId)
    .eq('user_id', uid)
    .single();

  if (!invoice) return { error: 'Invoice not found' };

  const { error } = await supabase
    .from('invoices')
    .delete()
    .eq('id', invoiceId)
    .eq('user_id', uid);

  if (error) return { error: error.message };

  // Reverse tax tracker spending
  const inv = invoice as Invoice;
  if (inv.is_tax_deductible && inv.tax_bonus && inv.tax_bonus !== 'none') {
    await updateTaxTrackerSpending(supabase, inv.property_id, uid, inv.tax_bonus, -inv.total_amount);
  }

  revalidatePath('/', 'layout');
  return { data: true };
}

export async function getTaxTracker(propertyId: string): Promise<TaxDeductionTracker | null> {
  await withAccess('property:read');
  const supabase = createClient();

  const { data } = await supabase
    .from('tax_deduction_trackers')
    .select('*')
    .eq('property_id', propertyId)
    .maybeSingle();

  return data as TaxDeductionTracker | null;
}

async function updateTaxTrackerSpending(
  supabase: ReturnType<typeof createClient>,
  propertyId: string,
  userId: string,
  bonus: string,
  amount: number,
) {
  const { data: existing } = await supabase
    .from('tax_deduction_trackers')
    .select('*')
    .eq('property_id', propertyId)
    .maybeSingle();

  const spentKey = `${bonus}_spent`;

  if (existing) {
    const currentSpent = (existing as Record<string, number>)[spentKey] ?? 0;
    await supabase
      .from('tax_deduction_trackers')
      .update({ [spentKey]: Math.max(0, currentSpent + amount) })
      .eq('id', existing.id);
  } else {
    await supabase
      .from('tax_deduction_trackers')
      .insert({
        property_id: propertyId,
        user_id: userId,
        is_primary_residence: false,
        ristrutturazione_rate: 0.50,
        ecobonus_rate: 0.50,
        sismabonus_rate: 0.50,
        ristrutturazione_cap: 96000,
        ristrutturazione_spent: bonus === 'ristrutturazione' ? amount : 0,
        ecobonus_cap: 60000,
        ecobonus_spent: bonus === 'ecobonus' ? amount : 0,
        sismabonus_cap: 96000,
        sismabonus_spent: bonus === 'sismabonus' ? amount : 0,
        mobili_cap: 5000,
        mobili_spent: bonus === 'mobili' ? amount : 0,
        enea_filed: false,
      });
  }
}

import { supabase } from './supabase';

export type CheckoutRule = {
  rule_id?: string;
  rule_type?: 'percent' | 'amount';
  type?: 'percent' | 'amount'; // fallback field name
  percent?: number | null;
  amount?: number | null;
  min_order?: number | null;
  max_discount_cap?: number | null;
  active?: boolean;
  starts_at?: string | null;
  ends_at?: string | null;
};

export const calculateCheckoutDiscount = (rule: CheckoutRule, subtotal: number): number => {
  if (!rule) return 0;
  const kind = (rule.rule_type || rule.type) as 'percent' | 'amount' | undefined;
  if (!kind) return 0;
  let discount = 0;
  if (kind === 'percent') {
    const pct = Math.max(0, Math.min(100, Number(rule.percent) || 0));
    discount = (subtotal * pct) / 100;
  } else {
    discount = Math.max(0, Number(rule.amount) || 0);
  }
  if (rule.min_order && subtotal < Number(rule.min_order)) return 0;
  if (rule.max_discount_cap != null) discount = Math.min(discount, Number(rule.max_discount_cap));
  return Math.min(discount, subtotal);
};

export const getActiveCheckoutRule = async (): Promise<CheckoutRule | null> => {
  try {
    const { data, error } = await supabase
      .from('checkout_discount_rules')
      .select('*')
      .eq('active', true)
      .limit(1);
    if (error || !data || !data.length) return null;

    const rule = data[0] as CheckoutRule;
    const now = new Date();
    const startsAt = rule.starts_at ? new Date(rule.starts_at) : null;
    const endsAt = rule.ends_at ? new Date(rule.ends_at) : null;
    if (startsAt && now < startsAt) return null;
    if (endsAt && now > endsAt) return null;
    return rule;
  } catch (_) {
    // Table might not exist yet
    return null;
  }
};

export type ProductDiscountRule = {
  product_id: string;
  mode: 'percent' | 'amount';
  value: number;
  base?: 'mrp' | 'price';
  active?: boolean;
  starts_at?: string | null;
  ends_at?: string | null;
};

export const getActiveProductDiscountsForProducts = async (
  productIds: string[]
): Promise<Record<string, ProductDiscountRule>> => {
  if (!productIds.length) return {};
  try {
    const { data, error } = await supabase
      .from('product_discounts')
      .select('product_id, mode, value, base, starts_at, ends_at, active')
      .in('product_id', productIds)
      .eq('active', true);
    if (error || !data) return {};
    const now = new Date();
    const map: Record<string, ProductDiscountRule> = {};
    for (const row of data as any[]) {
      const startsAt = row.starts_at ? new Date(row.starts_at) : null;
      const endsAt = row.ends_at ? new Date(row.ends_at) : null;
      if (startsAt && now < startsAt) continue;
      if (endsAt && now > endsAt) continue;
      map[row.product_id] = {
        product_id: row.product_id,
        mode: (row.mode || 'amount') as 'percent' | 'amount',
        value: Number(row.value) || 0,
        base: (row.base || 'price') as 'mrp' | 'price',
        starts_at: row.starts_at || null,
        ends_at: row.ends_at || null,
        active: true
      };
    }
    return map;
  } catch (_) {
    // Table might not exist yet
    return {};
  }
};

export const applyProductDiscountToPrice = (
  price: number,
  mrp: number | undefined,
  rule?: ProductDiscountRule
): number => {
  if (!rule) return price;
  const basePrice = rule.base === 'mrp' && mrp ? Number(mrp) : Number(price);
  let discountAmt = 0;
  if (rule.mode === 'percent') {
    const pct = Math.max(0, Math.min(100, Number(rule.value)));
    discountAmt = (basePrice * pct) / 100;
  } else {
    discountAmt = Math.max(0, Number(rule.value));
  }
  const newPrice = Math.max(0, basePrice - discountAmt);
  return newPrice;
};

// Admin helpers
export const upsertCheckoutRule = async (rule: CheckoutRule) => {
  if (rule.active) {
    await supabase.from('checkout_discount_rules').update({ active: false }).eq('active', true);
  }
  const payload: any = {
    rule_type: rule.rule_type || rule.type,
    percent: rule.percent ?? null,
    amount: rule.amount ?? null,
    min_order: rule.min_order ?? null,
    max_discount_cap: rule.max_discount_cap ?? null,
    active: rule.active ?? false,
    starts_at: rule.starts_at ?? null,
    ends_at: rule.ends_at ?? null
  };
  if (rule.rule_id) payload.rule_id = rule.rule_id;
  const { error } = await supabase.from('checkout_discount_rules').upsert(payload).select('rule_id').single();
  if (error) throw error;
};

export const upsertProductDiscount = async (rule: ProductDiscountRule) => {
  const payload: any = {
    product_id: rule.product_id,
    mode: rule.mode,
    value: rule.value,
    base: rule.base || 'price',
    active: rule.active ?? true,
    starts_at: rule.starts_at ?? null,
    ends_at: rule.ends_at ?? null
  };
  const { error } = await supabase.from('product_discounts').upsert(payload, { onConflict: 'product_id' });
  if (error) throw error;
};

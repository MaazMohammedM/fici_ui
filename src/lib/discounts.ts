import { db, collection, getDocs, query, where, doc, updateDoc, addDoc } from "./firebase";

export type CheckoutRule = {
  rule_id?: string;
  rule_type?: "percent" | "amount";
  type?: "percent" | "amount"; // fallback field name
  percent?: number | null;
  amount?: number | null;
  min_order?: number | null;
  max_discount_cap?: number | null;
  active?: boolean;
  starts_at?: string | null;
  ends_at?: string | null;
};

export const calculateCheckoutDiscount = (
  rule: CheckoutRule,
  subtotal: number
): number => {
  if (!rule) return 0;

  const kind = (rule.rule_type || rule.type) as
    | "percent"
    | "amount"
    | undefined;
  if (!kind) return 0;

  let discount = 0;

  if (kind === "percent") {
    const pct = Math.max(0, Math.min(100, Number(rule.percent) || 0));
    discount = (subtotal * pct) / 100;
  } else {
    discount = Math.max(0, Number(rule.amount) || 0);
  }

  // Min order condition
  if (rule.min_order && subtotal < Number(rule.min_order)) return 0;

  // Cap the discount amount if configured (e.g. "10% up to 200")
  if (rule.max_discount_cap != null) {
    discount = Math.min(discount, Number(rule.max_discount_cap));
  }

  // Don't allow discount > subtotal
  return Math.min(discount, subtotal);
};

export const getActiveCheckoutRule = async (): Promise<CheckoutRule | null> => {
  try {
    const q = query(
      collection(db, "checkout_discount_rules"),
      where("active", "==", true)
    );
    
    const querySnapshot = await getDocs(q);
    const rules = querySnapshot.docs.map(doc => ({ 
      rule_id: doc.id, 
      ...doc.data() 
    } as CheckoutRule));
    
    return rules.length > 0 ? rules[0] : null;
  } catch (error: any) {
    console.error('Error fetching checkout rule:', error);
    return null;
  }
};

export type ProductDiscountRule = {
  discount_id?: string;
  product_id: string;
  mode: "percent" | "amount";
  value: number;
  base?: "mrp" | "price";
  active?: boolean;
  starts_at?: string | null;
  ends_at?: string | null;
  max_discount_cap?: number | null;
  name?: string | null;
  promotion_type?: "clearance" | "deal_of_the_day" | "flash_sale" | "campaign" | "generic";
  priority?: number;
  stackable?: boolean;
  promo_tag?: string | null;
};

export const getActiveProductDiscountsForProducts = async (
  productIds: string[]
): Promise<Record<string, ProductDiscountRule>> => {
  if (!productIds.length) return {};
  
  try {
    // Firebase supports 'in' queries but with a limit of 10 items
    const chunks = [];
    for (let i = 0; i < productIds.length; i += 10) {
      chunks.push(productIds.slice(i, i + 10));
    }
    
    const allDiscounts: ProductDiscountRule[] = [];
    
    for (const chunk of chunks) {
      const q = query(
        collection(db, "product_discounts"),
        where("product_id", "in", chunk),
        where("active", "==", true)
      );
      
      const querySnapshot = await getDocs(q);
      const chunkDiscounts = querySnapshot.docs.map(doc => ({ 
        discount_id: doc.id, 
        ...doc.data() 
      } as ProductDiscountRule));
      
      allDiscounts.push(...chunkDiscounts);
    }
    
    // Convert to Record<string, ProductDiscountRule>
    const discountsMap: Record<string, ProductDiscountRule> = {};
    allDiscounts.forEach(discount => {
      if (discount.product_id) {
        discountsMap[discount.product_id] = discount;
      }
    });
    
    return discountsMap;
  } catch (error: any) {
    console.error('Error fetching product discounts:', error);
    return {};
  }
};

export const applyProductDiscountToPrice = (
  price: number,
  mrp: number | undefined,
  rule?: ProductDiscountRule
): number => {
  if (!rule || rule.active === false) return price;

  const basePrice =
    rule.base === "mrp" && mrp != null ? Number(mrp) : Number(price);

  let discountAmt = 0;

  if (rule.mode === "percent") {
    const pct = Math.max(0, Math.min(100, Number(rule.value) || 0));
    discountAmt = (basePrice * pct) / 100;

    // Apply percent cap (e.g. "10% up to 200")
    if (rule.max_discount_cap != null) {
      discountAmt = Math.min(discountAmt, Number(rule.max_discount_cap));
    }
  } else {
    // amount mode is already effectively capped by the fixed value
    discountAmt = Math.max(0, Number(rule.value) || 0);
  }

  const newPrice = Math.max(0, basePrice - discountAmt);
  return newPrice;
};

// Admin helpers
export const upsertCheckoutRule = async (rule: CheckoutRule) => {
  if (rule.active) {
    // Deactivate existing active rule
    try {
      const q = query(
        collection(db, "checkout_discount_rules"),
        where("active", "==", true)
      );
      
      const querySnapshot = await getDocs(q);
      const activeRules = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      if (activeRules.length > 0) {
        const activeRule = activeRules[0];
        await updateDoc(doc(db, "checkout_discount_rules", activeRule.id), { active: false });
      }
    } catch (error) {
      console.error('Error deactivating existing rule:', error);
    }
  }
  
  try {
    const payload = {
      rule_type: rule.rule_type || "percent",
      type: rule.type || "percent",
      percent: rule.percent || null,
      amount: rule.amount || null,
      min_order: rule.min_order || null,
      max_discount_cap: rule.max_discount_cap || null,
      active: rule.active ?? true,
      starts_at: rule.starts_at || null,
      ends_at: rule.ends_at || null
    };
    
    if (rule.rule_id) {
      // Update existing rule
      await updateDoc(doc(db, "checkout_discount_rules", rule.rule_id), payload);
    } else {
      // Create new rule
      const docRef = await addDoc(collection(db, "checkout_discount_rules"), payload);
      return docRef.id;
    }
  } catch (error) {
    console.error('Error upserting checkout rule:', error);
    throw error;
  }
};

export const upsertProductDiscount = async (rule: ProductDiscountRule) => {
  const payload = {
    product_id: rule.product_id,
    mode: rule.mode || "percent",
    value: rule.value || 0,
    base: rule.base || 0,
    starts_at: rule.starts_at || null,
    ends_at: rule.ends_at || null,
    active: rule.active ?? true,
    max_discount_cap: rule.max_discount_cap || null
  };
  
  if (rule.discount_id) {
    // Update existing discount
    await updateDoc(doc(db, "product_discounts", rule.discount_id), payload);
  } else {
    // Create new discount
    const docRef = await addDoc(collection(db, "product_discounts"), payload);
    return docRef.id;
  }
};
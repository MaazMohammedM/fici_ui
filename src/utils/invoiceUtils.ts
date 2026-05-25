/**
 * invoiceUtils.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Fici Shoes – Tax Invoice utilities
 *
 * GST model (corrected):
 *   taxableAmount  = effective_amount   (the amount customer actually paid)
 *   gstAmount      = taxableAmount × 0.05   (5 % additive on top)
 *   grandTotal     = taxableAmount + gstAmount
 *
 * Inter-state  → IGST  @ 5 %
 * Intra-state (Tamil Nadu) → CGST 2.5 % + SGST 2.5 %
 */

import { showSuccessAlert, showErrorAlert } from '../lib/utils/alertUtils';
import { generatePackagingLabelsPdf, type LabelInvoiceData } from './packagingLabelPdf';

// ─── Install (run once) ───────────────────────────────────────────────────────
//   yarn add jspdf html2canvas
//   yarn add -D @types/html2canvas   (if types aren't bundled)

// ─── Constants ────────────────────────────────────────────────────────────────

const FICI_SHOES = {
  businessName: 'NMF International',
  brandName: 'FiCi Shoes',
  gstin:      '33BMAPM8509H1Z4',
  stateCode:  '33',
  stateName:  'Tamil Nadu',
  address:    'No.20, 1st Floor, Broad Bazaar, Flower Bazaar Lane, Ambur - 635802 Tirupattur District, Tamilnadu, India.',
  phone:      '8122003006',
  contactUrl: 'https://www.ficishoes.com/contact',
  logoUrl:    'https://www.ficishoes.com/fici_128x128.webp',
  hsnCode:    '6730',
  /** GST rate as a plain percentage, e.g. 5 means 5 % */
  gstRate:    5,
} as const;

const MONTH_CODES: Record<number, string> = {
  0:'JA', 1:'FB', 2:'MR', 3:'AP', 4:'MY', 5:'JN',
  6:'JL', 7:'AG', 8:'SP', 9:'OC', 10:'NV', 11:'DC',
};

// ─── Safe number conversion ───────────────────────────────────────────────────

/**
 * Safely converts any Supabase value (string | number | null | undefined) to a
 * finite number.  Returns 0 for anything that isn't a valid number.
 */
export const toNumber = (value: unknown): number => {
  if (value === null || value === undefined) return 0;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const round2 = (n: number): number => Number(n.toFixed(2));

// ─── Types ────────────────────────────────────────────────────────────────────

export interface InvoiceItem {
  id:           string;
  name:         string;
  description?: string;
  quantity:     number;
  /** Selling price per unit (GST-exclusive — the taxable base per unit) */
  price:        number;
  /** Original MRP per unit (used for discount display only) */
  mrp:          number;
  /** price × quantity  (GST-exclusive subtotal for this line) */
  total:        number;
  size?:        string;
  color?:       string;
  hsnCode?:     string;
}

export interface ShippingAddress {
  name:       string;
  email?:     string;
  phone?:     string;
  address:    string;
  city:       string;
  district?:  string;
  state:      string;
  pincode:    string;
  landmark?:  string;
}

export interface InvoiceData {
  id:              string;
  invoiceNumber:   string;
  orderId:         string;
  orderDate:       string;
  invoiceDate:     string;
  orderType:       'registered' | 'guest';
  customer: {
    name:   string;
    email:  string;
    phone?: string;
  };
  billingAddress:  ShippingAddress;
  shippingAddress: ShippingAddress;
  items:           InvoiceItem[];
  /** Sum of all item.total (GST-exclusive) before discount */
  subtotal:        number;
  /** Total discount applied */
  discount:        number;
  deliveryCharge:  number;
  /** effective_amount = the amount customer actually paid (taxable base) */
  effectiveAmount: number;
  /** GST amount (5 % of effectiveAmount) */
  gstAmount:       number;
  cgst?:           number;   // intra-state only (Tamil Nadu)
  sgst?:           number;   // intra-state only (Tamil Nadu)
  igst?:           number;   // inter-state only
  /** effectiveAmount + gstAmount */
  grandTotal:      number;
  paymentMethod:   string;
  status:          'pending' | 'paid' | 'overdue' | 'cancelled';
  notes?:          string;
}

// ─── Invoice number ───────────────────────────────────────────────────────────

export const generateInvoiceNumber = (orderId: string, date?: string): string => {
  const d          = date ? new Date(date) : new Date();
  const monthCode  = MONTH_CODES[d.getMonth()];
  const year       = String(d.getFullYear()).slice(-2);
  const suffix     = orderId.replace(/-/g, '').slice(-8).toUpperCase();
  return `FSI${monthCode}CT${year}${suffix}`;
};

// ─── GST helpers ─────────────────────────────────────────────────────────────

/** True when the delivery state is Tamil Nadu (same state as seller). */
export const isIntraState = (shippingState: string): boolean => {
  const n = shippingState.trim().toUpperCase();
  return n === 'TAMIL NADU' || n === 'TN' || n === 'IN-TN' || n === '33';
};

/**
 * Computes GST on top of an EXCLUSIVE (taxable) amount.
 *
 * Formula (additive, not back-calculated):
 *   gstAmount = taxableAmount × (gstRate / 100)
 *
 * Split:
 *   Intra-state → CGST = gstAmount / 2, SGST = gstAmount / 2
 *   Inter-state → IGST = gstAmount
 */
export const computeGST = (
  taxableAmount: number,
  gstRate:       number,
  shippingState: string,
): { gstAmount: number; cgst: number; sgst: number; igst: number } => {
  const gstAmount = round2(taxableAmount * (gstRate / 100));

  if (isIntraState(shippingState)) {
    const half = round2(gstAmount / 2);
    return { gstAmount, cgst: half, sgst: half, igst: 0 };
  }
  return { gstAmount, cgst: 0, sgst: 0, igst: gstAmount };
};

// ─── Formatters ───────────────────────────────────────────────────────────────

export const formatCurrency = (amount: number): string =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(amount);

export const formatCurrencyPlain = (amount: number): string =>
  new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);

export const formatDate = (date: string | Date): string => {
  const d  = typeof date === 'string' ? new Date(date) : date;
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  return `${dd}-${mm}-${d.getFullYear()}`;
};

// ─── Admin Order → InvoiceData adapter ───────────────────────────────────────

export interface AdminOrderForInvoice {
  order_id:         string;
  order_date:       string;
  order_type?:      'registered' | 'guest';
  payment_status:   string;
  payment_method:   string;
  total_amount?:    number | string | null;
  effective_amount?: number | string | null;
  discount?:        number | string | null;
  delivery_charge?: number | string | null;
  user_id?:         string | null;
  guest_email?:     string | null;
  guest_phone?:     string | null;
  shipping_address?: unknown;
  order_items: Array<{
    order_item_id?:       string;
    product_id?:          string;
    product_name?:        string;
    name?:                string;
    size?:                string;
    color?:               string;
    quantity?:            number | string | null;
    price_at_purchase?:   number | string | null;
    mrp?:                 number | string | null;
    thumbnail_url?:       string;
    product_thumbnail_url?: string;
  }>;
}

const parseShippingAddress = (raw: unknown, fallbackEmail?: string | null): ShippingAddress => {
  if (!raw) {
    return {
      name:    fallbackEmail?.split('@')[0] ?? 'Customer',
      address: '', city: '', state: '', pincode: '',
    };
  }
  if (typeof raw === 'string') {
    try {
      return JSON.parse(raw) as ShippingAddress;
    } catch {
      return { name: 'Customer', address: raw, city: '', state: '', pincode: '' };
    }
  }
  return raw as ShippingAddress;
};

/**
 * Converts a raw admin Order into the InvoiceData shape.
 *
 * GST calculation:
 *   1. taxableBase = effective_amount (what the customer actually paid, GST-exclusive)
 *   2. gstAmount   = taxableBase × 5 %
 *   3. grandTotal  = taxableBase + gstAmount
 */
export const generateInvoiceFromAdminOrder = (order: AdminOrderForInvoice): InvoiceData => {
  const shippingAddr = parseShippingAddress(order.shipping_address, order.guest_email);

  const isGuest     = !order.user_id;
  const customerName  = shippingAddr.name || order.guest_email?.split('@')[0] || 'Customer';
  const customerEmail = isGuest ? (order.guest_email ?? shippingAddr.email ?? '') : (shippingAddr.email ?? '');
  const customerPhone = isGuest ? (order.guest_phone ?? shippingAddr.phone ?? '') : (shippingAddr.phone ?? '');

  // ── Build line items ──────────────────────────────────────────────────────
  const items: InvoiceItem[] = (order.order_items ?? []).map((oi, idx) => {
    const price = round2(toNumber(oi.price_at_purchase));
    const qty   = toNumber(oi.quantity) || 1;
    const mrp   = oi.mrp ? round2(toNumber(oi.mrp)) : price;
    return {
      id:       oi.order_item_id ?? oi.product_id ?? String(idx),
      name:     oi.product_name  ?? oi.name ?? 'Product',
      size:     oi.size,
      color:    oi.color,
      quantity: qty,
      price,
      mrp,
      total:    round2(price * qty),
      hsnCode:  FICI_SHOES.hsnCode,
    };
  });

  // ── Financial base ────────────────────────────────────────────────────────
  const subtotal      = round2(items.reduce((s, i) => s + i.total, 0));
  const discount      = round2(toNumber(order.discount));
  const deliveryCharge = round2(toNumber(order.delivery_charge));

  /**
   * taxableBase is the GST-exclusive amount the customer paid.
   * Prefer effective_amount (already deducted discounts & charges on DB side).
   * Fall back to computing from item totals if effective_amount is unavailable.
   */
  const effectiveRaw  = toNumber(order.effective_amount);
  const effectiveAmount = effectiveRaw > 0
    ? round2(effectiveRaw)
    : round2(subtotal - discount + deliveryCharge);

  const { gstAmount, cgst, sgst, igst } = computeGST(
    effectiveAmount,
    FICI_SHOES.gstRate,
    shippingAddr.state ?? '',
  );

  const grandTotal = round2(effectiveAmount + gstAmount);
  const intra      = isIntraState(shippingAddr.state ?? '');

  return {
    id:             order.order_id,
    invoiceNumber:  generateInvoiceNumber(order.order_id, order.order_date),
    orderId:        order.order_id,
    orderDate:      order.order_date || new Date().toISOString(),
    invoiceDate:    new Date().toISOString(),
    orderType:      order.order_type ?? (isGuest ? 'guest' : 'registered'),
    customer:       { name: customerName, email: customerEmail, phone: customerPhone },
    billingAddress:  shippingAddr,
    shippingAddress: shippingAddr,
    items,
    subtotal,
    discount,
    deliveryCharge,
    effectiveAmount,
    gstAmount,
    cgst:  intra  ? cgst : undefined,
    sgst:  intra  ? sgst : undefined,
    igst: !intra  ? igst : undefined,
    grandTotal,
    paymentMethod: order.payment_method || 'razorpay',
    status:        order.payment_status === 'paid' ? 'paid' : 'pending',
  };
};

// ─── Legacy builder (kept for non-admin flows) ────────────────────────────────

export interface RawOrderData {
  order_id:         string;
  order_date:       string;
  status:           string;
  total_amount:     string | number;
  effective_amount?: string | number | null;
  subtotal:         string | number;
  discount:         string | number;
  delivery_charge:  string | number;
  payment_status:   string;
  payment_method:   string;
  shipping_address: string | ShippingAddress;
  order_type:       'registered' | 'guest';
  user?: { name?: string; email?: string; phone?: string } | null;
  guest_email?:     string | null;
  guest_phone?:     string | null;
}

export interface RawOrderItem {
  order_item_id:    string;
  product_id:       string;
  product_name:     string;
  size?:            string;
  color?:           string;
  quantity:         number;
  price_at_purchase: string | number;
  mrp?:             string | number;
  thumbnail_url?:   string;
}

export const buildInvoiceFromOrder = (
  order:      RawOrderData,
  orderItems: RawOrderItem[],
): InvoiceData => {
  const shippingAddr = parseShippingAddress(order.shipping_address, order.guest_email);

  const customerName  = order.order_type === 'guest' ? shippingAddr.name  : (order.user?.name  || shippingAddr.name);
  const customerEmail = order.order_type === 'guest' ? (order.guest_email ?? shippingAddr.email ?? '') : (order.user?.email ?? shippingAddr.email ?? '');
  const customerPhone = order.order_type === 'guest' ? (order.guest_phone ?? shippingAddr.phone ?? '') : (order.user?.phone ?? shippingAddr.phone ?? '');

  const items: InvoiceItem[] = orderItems.map((oi) => {
    const price = round2(toNumber(oi.price_at_purchase));
    const qty   = toNumber(oi.quantity) || 1;
    const mrp   = oi.mrp ? round2(toNumber(oi.mrp)) : price;
    return {
      id: oi.order_item_id, name: oi.product_name,
      size: oi.size, color: oi.color, quantity: qty,
      price, mrp,
      total:   round2(price * qty),
      hsnCode: FICI_SHOES.hsnCode,
    };
  });

  const subtotal       = round2(items.reduce((s, i) => s + i.total, 0));
  const discount       = round2(toNumber(order.discount));
  const deliveryCharge = round2(toNumber(order.delivery_charge));
  const effectiveRaw   = toNumber(order.effective_amount);
  const effectiveAmount = effectiveRaw > 0 ? round2(effectiveRaw) : round2(subtotal - discount + deliveryCharge);

  const { gstAmount, cgst, sgst, igst } = computeGST(effectiveAmount, FICI_SHOES.gstRate, shippingAddr.state ?? '');
  const grandTotal = round2(effectiveAmount + gstAmount);
  const intra      = isIntraState(shippingAddr.state ?? '');

  return {
    id: order.order_id,
    invoiceNumber:   generateInvoiceNumber(order.order_id, order.order_date),
    orderId:         order.order_id,
    orderDate:       order.order_date,
    invoiceDate:     new Date().toISOString(),
    orderType:       order.order_type,
    customer:        { name: customerName, email: customerEmail, phone: customerPhone },
    billingAddress:  shippingAddr,
    shippingAddress: shippingAddr,
    items, subtotal, discount, deliveryCharge,
    effectiveAmount, gstAmount,
    cgst:  intra  ? cgst : undefined,
    sgst:  intra  ? sgst : undefined,
    igst: !intra  ? igst : undefined,
    grandTotal,
    paymentMethod: order.payment_method,
    status:        order.payment_status === 'paid' ? 'paid' : 'pending',
  };
};

// ─── HTML template ────────────────────────────────────────────────────────────

const statusColor = (s: string): string =>
  ({ paid:'#16a34a', pending:'#d97706', overdue:'#dc2626', cancelled:'#6b7280' }[s] ?? '#111827');

export const generateInvoiceHTML = (inv: InvoiceData): string => {
  const intra    = isIntraState(inv.shippingAddress.state);
  const gstRate  = FICI_SHOES.gstRate;
  const halfRate = gstRate / 2;
  const addr     = inv.shippingAddress;
  const bill     = inv.billingAddress;

  // ── Per-item rows ──────────────────────────────────────────────────────────
  const itemRows = inv.items.map((item) => {
    const effectiveMrp  = item.mrp ?? item.price;
    const grossAmount   = round2(effectiveMrp * item.quantity);
    const discountAmt   = round2((effectiveMrp - item.price) * item.quantity);
    // Per-line GST split is proportional to item.total / effectiveAmount
    const lineProportion  = inv.effectiveAmount > 0 ? item.total / inv.effectiveAmount : 0;
    const lineGst         = round2(inv.gstAmount * lineProportion);
    const lineCgst        = intra ? round2(lineGst / 2) : 0;
    const lineSgst        = intra ? round2(lineGst / 2) : 0;
    const lineIgst        = intra ? 0 : lineGst;
    // Line total is just item.total (GST already included in effective_amount)
    const lineTotal       = item.total;

    const gstCell = intra
      ? `<td style="padding:10px 8px;border-bottom:1px solid #e5e7eb;text-align:right;font-size:12px;">₹${formatCurrencyPlain(lineCgst)}</td>
         <td style="padding:10px 8px;border-bottom:1px solid #e5e7eb;text-align:right;font-size:12px;">₹${formatCurrencyPlain(lineSgst)}</td>`
      : `<td style="padding:10px 8px;border-bottom:1px solid #e5e7eb;text-align:right;font-size:12px;">₹${formatCurrencyPlain(lineIgst)}</td>`;

    return `<tr>
      <td style="padding:10px 8px;border-bottom:1px solid #e5e7eb;font-size:11px;color:#6b7280;">${item.hsnCode ?? FICI_SHOES.hsnCode}</td>
      <td style="padding:10px 8px;border-bottom:1px solid #e5e7eb;">
        <div style="font-weight:600;font-size:12px;color:#111827;">${item.name}</div>
        ${item.size ? `<div style="font-size:10px;color:#6b7280;margin-top:2px;">Size: ${item.size}${item.color ? ' | Colour: ' + item.color : ''}</div>` : ''}
        <div style="font-size:10px;color:#6b7280;margin-top:2px;">${intra ? `CGST ${halfRate}% + SGST ${halfRate}%` : `IGST ${gstRate}%`}</div>
      </td>
      <td style="padding:10px 8px;border-bottom:1px solid #e5e7eb;text-align:center;font-size:12px;">${item.quantity}</td>
      <td style="padding:10px 8px;border-bottom:1px solid #e5e7eb;text-align:right;font-size:12px;">₹${formatCurrencyPlain(grossAmount)}</td>
      <td style="padding:10px 8px;border-bottom:1px solid #e5e7eb;text-align:right;font-size:12px;">₹${formatCurrencyPlain(discountAmt)}</td>
      <td style="padding:10px 8px;border-bottom:1px solid #e5e7eb;text-align:right;font-size:12px;">₹${formatCurrencyPlain(item.total)}</td>
      ${gstCell}
      <td style="padding:10px 8px;border-bottom:1px solid #e5e7eb;text-align:right;font-size:12px;font-weight:600;">₹${formatCurrencyPlain(lineTotal)}</td>
    </tr>`;
  }).join('');

  // ── Totals row ─────────────────────────────────────────────────────────────
  const totalGross   = round2(inv.items.reduce((s, i) => s + (i.mrp ?? i.price) * i.quantity, 0));
  const totalDisc    = round2(inv.items.reduce((s, i) => s + ((i.mrp ?? i.price) - i.price) * i.quantity, 0) + inv.discount);
  const totalTaxable = inv.effectiveAmount;
  const totalCgst    = inv.cgst ?? 0;
  const totalSgst    = inv.sgst ?? 0;
  const totalIgst    = inv.igst ?? 0;
  const totalQty     = inv.items.reduce((s, i) => s + i.quantity, 0);

  const gstTotCells = intra
    ? `<td style="padding:10px 8px;border-top:2px solid #d1d5db;text-align:right;font-size:12px;">₹${formatCurrencyPlain(totalCgst)}</td>
       <td style="padding:10px 8px;border-top:2px solid #d1d5db;text-align:right;font-size:12px;">₹${formatCurrencyPlain(totalSgst)}</td>`
    : `<td style="padding:10px 8px;border-top:2px solid #d1d5db;text-align:right;font-size:12px;">₹${formatCurrencyPlain(totalIgst)}</td>`;

  const totalsRow = `<tr style="background:#f9fafb;font-weight:700;">
    <td colspan="2" style="padding:10px 8px;border-top:2px solid #d1d5db;font-size:12px;">TOTAL</td>
    <td style="padding:10px 8px;border-top:2px solid #d1d5db;text-align:center;font-size:12px;">${totalQty}</td>
    <td style="padding:10px 8px;border-top:2px solid #d1d5db;text-align:right;font-size:12px;">₹${formatCurrencyPlain(totalGross)}</td>
    <td style="padding:10px 8px;border-top:2px solid #d1d5db;text-align:right;font-size:12px;">₹${formatCurrencyPlain(totalDisc)}</td>
    <td style="padding:10px 8px;border-top:2px solid #d1d5db;text-align:right;font-size:12px;">₹${formatCurrencyPlain(totalTaxable)}</td>
    ${gstTotCells}
    <td style="padding:10px 8px;border-top:2px solid #d1d5db;text-align:right;font-size:12px;">₹${formatCurrencyPlain(inv.effectiveAmount)}</td>
  </tr>`;

  // ── Column headers ─────────────────────────────────────────────────────────
  const gstHeaders = intra
    ? `<th style="padding:10px 8px;text-align:right;font-size:11px;font-weight:600;">CGST ₹<br/><span style="font-weight:400;font-size:10px;">${halfRate}%</span></th>
       <th style="padding:10px 8px;text-align:right;font-size:11px;font-weight:600;">SGST ₹<br/><span style="font-weight:400;font-size:10px;">${halfRate}%</span></th>`
    : `<th style="padding:10px 8px;text-align:right;font-size:11px;font-weight:600;">IGST ₹<br/><span style="font-weight:400;font-size:10px;">${gstRate}%</span></th>`;

  const tableHeader = `<tr style="background:#1e293b;color:#fff;">
    <th style="padding:10px 8px;text-align:left;font-size:11px;font-weight:600;">HSN</th>
    <th style="padding:10px 8px;text-align:left;font-size:11px;font-weight:600;">Description</th>
    <th style="padding:10px 8px;text-align:center;font-size:11px;font-weight:600;">Qty</th>
    <th style="padding:10px 8px;text-align:right;font-size:11px;font-weight:600;">Gross Amt ₹</th>
    <th style="padding:10px 8px;text-align:right;font-size:11px;font-weight:600;">Discount ₹</th>
    <th style="padding:10px 8px;text-align:right;font-size:11px;font-weight:600;">Taxable ₹</th>
    ${gstHeaders}
    <th style="padding:10px 8px;text-align:right;font-size:11px;font-weight:600;">Total ₹</th>
  </tr>`;

  // ── GST summary box rows ───────────────────────────────────────────────────
  const gstSummary = intra
    ? `<div class="totals-row">
         <span class="totals-label">CGST @ ${halfRate}%</span>
         <span class="totals-value">₹${formatCurrencyPlain(totalCgst)}</span>
       </div>
       <div class="totals-row">
         <span class="totals-label">SGST @ ${halfRate}%</span>
         <span class="totals-value">₹${formatCurrencyPlain(totalSgst)}</span>
       </div>`
    : `<div class="totals-row">
         <span class="totals-label">IGST @ ${gstRate}%</span>
         <span class="totals-value">₹${formatCurrencyPlain(totalIgst)}</span>
       </div>`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1.0"/>
  <title>Tax Invoice – ${inv.invoiceNumber}</title>
  <style>
    *{box-sizing:border-box;margin:0;padding:0}
    body{font-family:Arial,sans-serif;background:#f8f8f6;color:#111827;font-size:13px;line-height:1.5;-webkit-print-color-adjust:exact;print-color-adjust:exact}
    .invoice-wrapper{max-width:900px;margin:0 auto;background:#fff;border:1px solid #e5e7eb}
    .invoice-header{background:#1e293b;color:#fff;padding:24px 32px;display:flex;justify-content:space-between;align-items:flex-start}
    .brand-block{display:flex;align-items:center;gap:14px}
    .brand-logo{width:52px;height:52px;border-radius:8px;background:#fff;padding:4px;object-fit:contain}
    .brand-name{font-size:22px;font-weight:700;letter-spacing:-0.5px}
    .brand-tagline{font-size:11px;color:#94a3b8;margin-top:2px}
    .invoice-meta{text-align:right}
    .invoice-title{font-size:11px;font-weight:600;letter-spacing:2px;text-transform:uppercase;color:#94a3b8;margin-bottom:4px}
    .invoice-number{font-size:18px;font-weight:700}
    .invoice-dates{font-size:11px;color:#94a3b8;margin-top:4px}
    .status-badge{display:inline-block;margin-top:6px;padding:2px 10px;border-radius:99px;font-size:10px;font-weight:600;letter-spacing:1px;text-transform:uppercase}
    .section-band{background:#f1f5f9;border-top:1px solid #e2e8f0;border-bottom:1px solid #e2e8f0;padding:12px 32px;display:flex}
    .section-col{flex:1;padding-right:24px}
    .section-col:not(:last-child){border-right:1px solid #cbd5e1;margin-right:24px}
    .section-label{font-size:9px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:#64748b;margin-bottom:6px}
    .section-value{font-size:12px;color:#1e293b;line-height:1.6}
    .section-value strong{font-weight:600}
    .order-strip{display:flex;padding:14px 32px;background:#fff;border-bottom:1px solid #e5e7eb}
    .order-strip-item{flex:1}
    .order-strip-item:not(:last-child){border-right:1px solid #e5e7eb;padding-right:16px;margin-right:16px}
    .osl{font-size:10px;color:#9ca3af;font-weight:500;letter-spacing:0.5px;text-transform:uppercase}
    .osv{font-size:13px;font-weight:600;color:#111827;margin-top:2px}
    .table-section{padding:0 32px 24px}
    table{width:100%;border-collapse:collapse;margin-top:16px}
    .totals-section{display:flex;justify-content:flex-end;padding:0 32px 24px}
    .totals-box{min-width:260px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:6px;overflow:hidden}
    .totals-row{display:flex;justify-content:space-between;padding:8px 16px;font-size:12px;border-bottom:1px solid #e2e8f0}
    .totals-row:last-child{border-bottom:none}
    .totals-row.grand{background:#1e293b;color:#fff;font-weight:700;font-size:14px}
    .totals-label{color:#6b7280}
    .totals-value{font-weight:600;color:#111827}
    .grand .totals-label,.grand .totals-value{color:#fff}
    .invoice-footer{background:#1e293b;color:#94a3b8;padding:20px 32px;display:flex;justify-content:space-between;align-items:flex-start;gap:24px}
    .footer-section{flex:1}
    .footer-title{font-size:10px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:#f1f5f9;margin-bottom:6px}
    .footer-text{font-size:11px;line-height:1.6}
    .gst-tag{display:inline-block;background:#334155;border-radius:4px;padding:2px 8px;font-size:10px;font-family:monospace;color:#e2e8f0;margin-top:4px}
    .footer-divider{width:1px;background:#334155}
    .sig-block{text-align:right}
    .sig-line{width:140px;height:1px;background:#475569;margin:40px 0 6px auto}
    .sig-label{font-size:10px;color:#64748b}
  </style>
</head>
<body>
<div class="invoice-wrapper" id="invoice-root">
  <div class="invoice-header">
    <div class="brand-block">
      <img src="${FICI_SHOES.logoUrl}" alt="Fici Shoes" class="brand-logo" crossorigin="anonymous"/>
      <div>
        <div class="brand-name">${FICI_SHOES.businessName}</div>
        <div class="brand-tagline">TAX INVOICE</div>
      </div>
    </div>
    <div class="invoice-meta">
      <div class="invoice-title">Invoice</div>
      <div class="invoice-number"># ${inv.invoiceNumber}</div>
      <div class="invoice-dates">Order Date: ${formatDate(inv.orderDate)}<br/>Invoice Date: ${formatDate(inv.invoiceDate)}</div>
      <span class="status-badge" style="background:${statusColor(inv.status)}20;color:${statusColor(inv.status)};border:1px solid ${statusColor(inv.status)}40;">${inv.status.toUpperCase()}</span>
    </div>
  </div>

  <div class="section-band">
    <div class="section-col">
      <div class="section-label">Sold By</div>
      <div class="section-value">
        <strong>${FICI_SHOES.businessName}</strong><br/>
        ${FICI_SHOES.address}<br/>
        GSTIN: <strong>${FICI_SHOES.gstin}</strong><br/>
        Ph: ${FICI_SHOES.phone}
      </div>
    </div>
    <div class="section-col">
      <div class="section-label">Bill To</div>
      <div class="section-value">
        <strong>${bill.name}</strong><br/>
        ${bill.address}<br/>
        ${bill.city}, ${bill.state} – ${bill.pincode}<br/>
        ${inv.customer.phone ? 'Ph: ' + inv.customer.phone : ''}
        ${inv.customer.email ? '<br/>Email: ' + inv.customer.email : ''}
      </div>
    </div>
    <div class="section-col" style="padding-right:0;">
      <div class="section-label">Ship To</div>
      <div class="section-value">
        <strong>${addr.name}</strong><br/>
        ${addr.address}<br/>
        ${addr.city}, ${addr.state} – ${addr.pincode}<br/>
        ${addr.landmark ? 'Landmark: ' + addr.landmark + '<br/>' : ''}
        ${addr.phone ? 'Ph: ' + addr.phone : ''}
      </div>
    </div>
  </div>

  <div class="order-strip">
    <div class="order-strip-item"><div class="osl">Order ID</div><div class="osv" style="font-size:11px;word-break:break-all;">${inv.orderId}</div></div>
    <div class="order-strip-item"><div class="osl">Customer Type</div><div class="osv">${inv.orderType === 'guest' ? 'Guest' : 'Registered'}</div></div>
    <div class="order-strip-item"><div class="osl">Payment</div><div class="osv" style="text-transform:capitalize;">${inv.paymentMethod}</div></div>
    <div class="order-strip-item"><div class="osl">GST Type</div><div class="osv">${intra ? 'CGST + SGST (Intra-State)' : 'IGST (Inter-State)'}</div></div>
  </div>

  <div class="table-section">
    <table><thead>${tableHeader}</thead><tbody>${itemRows}${totalsRow}</tbody></table>
  </div>

  <div class="totals-section">
    <div class="totals-box">
      <div class="totals-row"><span class="totals-label">Taxable Value (Effective Amt)</span><span class="totals-value">₹${formatCurrencyPlain(inv.effectiveAmount)}</span></div>
      ${inv.discount > 0 ? `<div class="totals-row"><span class="totals-label">Coupon / Discount</span><span class="totals-value" style="color:#16a34a;">–₹${formatCurrencyPlain(inv.discount)}</span></div>` : ''}
      ${gstSummary}
      ${inv.deliveryCharge > 0 ? `<div class="totals-row"><span class="totals-label">Delivery Charges</span><span class="totals-value">₹${formatCurrencyPlain(inv.deliveryCharge)}</span></div>` : ''}
      <div class="totals-row grand"><span class="totals-label">Grand Total</span><span class="totals-value">₹${formatCurrencyPlain(inv.effectiveAmount)}</span></div>
    </div>
  </div>

  <div class="invoice-footer">
    <div class="footer-section">
      <div class="footer-title">${FICI_SHOES.businessName}</div>
      <div class="footer-text">${FICI_SHOES.address}<br/>Ph: ${FICI_SHOES.phone}<br/><a href="${FICI_SHOES.contactUrl}" style="color:#60a5fa;">${FICI_SHOES.contactUrl}</a></div>
      <div class="gst-tag">GSTIN: ${FICI_SHOES.gstin}</div>
    </div>
    <div class="footer-divider"></div>
    <div class="footer-section" style="padding:0 20px;">
      <div class="footer-title">Exchange / Replacement Policy</div>
      <div class="footer-text">We do not accept returns. Exchange or replacement is offered only when the size does not fit. Please retain this invoice for any future exchange requests.</div>
    </div>
    <div class="footer-divider"></div>
    <div class="footer-section sig-block">
      <div class="footer-title">Authorised Signatory</div>
      <div class="sig-line"></div>
      <div class="sig-label">${FICI_SHOES.businessName}</div>
      <div style="font-size:10px;color:#475569;margin-top:16px;">E. &amp; O.E. &nbsp;|&nbsp; Page 1 of 1</div>
    </div>
  </div>
</div>
</body>
</html>`;
};

// ─── PDF download (real .pdf via html2canvas + jsPDF) ─────────────────────────

/**
 * Generates a real PDF from the invoice HTML and triggers a browser download.
 * Works on: Chrome, Edge, Firefox, Safari (desktop + mobile), Android browsers.
 *
 * Strategy:
 *  1. Mount the invoice HTML in a hidden off-screen iframe.
 *  2. Wait for fonts/images to load.
 *  3. Capture via html2canvas (scale:2 for retina clarity).
 *  4. Slice the canvas into A4-sized pages.
 *  5. Use jsPDF to build and save the PDF.
 */
export const downloadInvoicePdf = async (invoice: InvoiceData): Promise<void> => {
  try {
    // Lazy-import so the libraries are only loaded when needed (keeps initial bundle small)
    const [{ default: jsPDF }, { default: html2canvas }] = await Promise.all([
      import('jspdf'),
      import('html2canvas'),
    ]);

    // ── 1. Create a hidden iframe to host the rendered invoice ────────────
    const iframe = document.createElement('iframe');
    Object.assign(iframe.style, {
      position:   'fixed',
      top:        '-9999px',
      left:       '-9999px',
      width:      '900px',   // match invoice-wrapper max-width
      height:     '1px',
      border:     'none',
      visibility: 'hidden',
    });
    document.body.appendChild(iframe);

    const iframeDoc = iframe.contentDocument ?? iframe.contentWindow?.document;
    if (!iframeDoc) {
      document.body.removeChild(iframe);
      throw new Error('Could not access iframe document');
    }

    iframeDoc.open();
    iframeDoc.write(generateInvoiceHTML(invoice));
    iframeDoc.close();

    // ── 2. Wait for images/fonts inside the iframe ────────────────────────
    await new Promise<void>((resolve) => {
      const onLoad = () => resolve();
      if (iframe.contentWindow) {
        iframe.contentWindow.addEventListener('load', onLoad);
        // Fallback timeout in case load already fired or fonts stall
        setTimeout(onLoad, 1500);
      } else {
        setTimeout(onLoad, 1500);
      }
    });

    const invoiceRoot = iframeDoc.getElementById('invoice-root') ?? iframeDoc.body;

    // ── 3. Capture the element with html2canvas ───────────────────────────
    const canvas = await html2canvas(invoiceRoot, {
      scale:           2,         // high DPI for clarity
      useCORS:         true,      // allow cross-origin images (logo)
      logging:         false,
      backgroundColor: '#ffffff',
      windowWidth:     900,
    });

    // Clean up the hidden iframe immediately after capture
    document.body.removeChild(iframe);

    // ── 4. Build the PDF ──────────────────────────────────────────────────
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit:        'mm',
      format:      'a4',
    });

    const A4_WIDTH_MM  = 210;
    const A4_HEIGHT_MM = 297;

    const imgWidthMm   = A4_WIDTH_MM;
    const scaleFactor  = imgWidthMm / canvas.width;
    const imgHeightMm  = canvas.height * scaleFactor;

    // ── 5. Paginate if the invoice is taller than one A4 page ────────────
    let yOffset = 0;
    let pageIndex = 0;

    while (yOffset < imgHeightMm) {
      if (pageIndex > 0) pdf.addPage();

      // Clip the source canvas to the current A4 slice
      const sourceY      = Math.round(yOffset / scaleFactor);
      const sliceHeightPx = Math.round(A4_HEIGHT_MM / scaleFactor);

      const pageCanvas   = document.createElement('canvas');
      pageCanvas.width   = canvas.width;
      pageCanvas.height  = Math.min(sliceHeightPx, canvas.height - sourceY);

      const ctx = pageCanvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(
          canvas,
          0, sourceY,                          // source x, y
          canvas.width, pageCanvas.height,     // source w, h
          0, 0,                                // dest x, y
          canvas.width, pageCanvas.height,     // dest w, h
        );
      }

      const pageImgData = pageCanvas.toDataURL('image/jpeg', 0.92);
      const pageHeightMm = pageCanvas.height * scaleFactor;

      pdf.addImage(pageImgData, 'JPEG', 0, 0, imgWidthMm, pageHeightMm);

      yOffset    += A4_HEIGHT_MM;
      pageIndex  += 1;
    }

    // ── 6. Trigger the download ───────────────────────────────────────────
    pdf.save(`invoice-${invoice.orderId}.pdf`);
    showSuccessAlert(`Invoice ${invoice.invoiceNumber} downloaded as PDF`);

  } catch (err) {
    console.error('[downloadInvoicePdf]', err);
    showErrorAlert('Failed to generate PDF. Please try again.');
    throw err;
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// PUBLIC: downloadPackagingLabelPdf
// Uses the new packaging label generator from packagingLabelPdf.ts
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Generates a professional A4 shipping label PDF using the new packaging label library.
 * 
 * This function converts InvoiceData to LabelInvoiceData and calls the new
 * generatePackagingLabelsPdf function which supports multiple orders per page.
 * 
 * For backward compatibility, this function generates two identical labels
 * for the same order (one for the package, one for records).
 */
export const downloadPackagingLabelPdf = async (invoice: InvoiceData): Promise<void> => {
  try {
    // Convert InvoiceData to LabelInvoiceData (the new library's interface)
    const labelInvoice: LabelInvoiceData = {
      orderId: invoice.orderId,
      invoiceNumber: invoice.invoiceNumber,
      orderDate: invoice.orderDate,
      invoiceDate: invoice.invoiceDate,
      paymentMethod: invoice.paymentMethod,
      status: invoice.status,
      effectiveAmount: invoice.effectiveAmount,
      discount: invoice.discount,
      deliveryCharge: invoice.deliveryCharge,
      grandTotal: invoice.grandTotal,
      customer: {
        name: invoice.customer.name,
        email: invoice.customer.email,
        phone: invoice.customer.phone,
      },
      shippingAddress: {
        name: invoice.shippingAddress.name,
        address: invoice.shippingAddress.address,
        city: invoice.shippingAddress.city,
        district: invoice.shippingAddress.district,
        state: invoice.shippingAddress.state,
        pincode: invoice.shippingAddress.pincode,
        phone: invoice.shippingAddress.phone,
        landmark: invoice.shippingAddress.landmark,
      },
      items: invoice.items.map(item => ({
        name: item.name,
        size: item.size,
        color: item.color,
        quantity: item.quantity,
        total: item.total,
      })),
    };

    // Generate packaging label using the new library
    // ONE order = ONE label
    await generatePackagingLabelsPdf({
      orders: [labelInvoice],
      downloadFileName: `Packaging_Label_${invoice.orderId.replace(/-/g, '').slice(-12).toUpperCase()}`,
    });

    const shortId = invoice.orderId.replace(/-/g, '').slice(-12).toUpperCase();
    showSuccessAlert(`Packaging label downloaded for order ${shortId}`);

  } catch (err) {
    console.error('[downloadPackagingLabelPdf]', err);
    showErrorAlert('Failed to generate packaging label PDF. Please try again.');
    throw err;
  }
};

// ─── Legacy / compat exports (keep existing call-sites working) ───────────────

/** @deprecated Use downloadInvoicePdf instead */
export const downloadInvoiceAsHTML = (invoice: InvoiceData): void => {
  // Silently delegate to the PDF version so callers get the right output
  void downloadInvoicePdf(invoice).catch(() => {
    // Hard fallback: if PDF libs fail, offer HTML
    try {
      const html  = generateInvoiceHTML(invoice);
      const blob  = new Blob([html], { type: 'text/html;charset=utf-8' });
      const url   = URL.createObjectURL(blob);
      const a     = document.createElement('a');
      a.href      = url;
      a.download  = `invoice-${invoice.invoiceNumber}.html`;
      a.style.display = 'none';
      document.body.appendChild(a);
      a.click();
      setTimeout(() => { document.body.removeChild(a); URL.revokeObjectURL(url); }, 300);
      showSuccessAlert(`Invoice downloaded (HTML fallback)`);
    } catch {
      showErrorAlert('Failed to download invoice');
    }
  });
};

/** @deprecated Use downloadInvoicePdf instead */
export const downloadInvoice = (invoice: InvoiceData): void =>
  downloadInvoiceAsHTML(invoice);

/** @deprecated Use downloadInvoicePdf instead */
export const printInvoice = (
  invoice: InvoiceData,
): Promise<{ success: boolean; action: 'printed' | 'cancelled' | 'downloaded' | 'failed' | 'share_intent' }> =>
  downloadInvoicePdf(invoice)
    .then(() => ({ success: true,  action: 'downloaded' as const }))
    .catch(() => ({ success: false, action: 'failed'     as const }));

// ─── Misc utilities (unchanged) ───────────────────────────────────────────────

export const validateInvoice = (
  invoice: Partial<InvoiceData>,
): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  if (!invoice.customer?.name)                    errors.push('Customer name is required');
  if (!invoice.customer?.email)                   errors.push('Customer email is required');
  if (!invoice.items || invoice.items.length === 0) errors.push('At least one item is required');
  if (!invoice.orderDate)                         errors.push('Order date is required');
  invoice.items?.forEach((item, i) => {
    if (!item.name)                                   errors.push(`Item ${i + 1}: Name is required`);
    if (!item.quantity || item.quantity <= 0)         errors.push(`Item ${i + 1}: Quantity must be > 0`);
    if (item.price === undefined || item.price < 0)  errors.push(`Item ${i + 1}: Price must be non-negative`);
  });
  return { isValid: errors.length === 0, errors };
};

export const validateInvoiceNumber = (num: string): boolean =>
  /^FSI[A-Z]{2}CT\d{2}[A-Z0-9]{8}$/.test(num);

export const calculateInvoiceTotal = (items: InvoiceItem[]): number =>
  items.reduce((s, i) => s + i.total, 0);

export const calculateTax = (amount: number, taxRate: number): number =>
  amount * (taxRate / 100);

export const applyDiscount = (
  amount: number,
  type:  'percentage' | 'fixed',
  value: number,
): number => (type === 'percentage' ? amount * (value / 100) : value);

export const parseInvoiceDate  = (d?: string): Date => (d ? new Date(d) : new Date());
export const safeDateParse     = (d?: string): Date => {
  if (!d) return new Date();
  const p = new Date(d);
  return Number.isNaN(p.getTime()) ? new Date() : p;
};
export const isInvoiceOverdue  = (_invoice: InvoiceData): boolean => false;

export const sanitizeCustomerData = (c: InvoiceData['customer']): InvoiceData['customer'] => ({
  name:  c.name.trim(),
  email: c.email.toLowerCase().trim(),
  phone: c.phone?.trim() || undefined,
});

export const getInvoiceSummary = (invoices: InvoiceData[]) =>
  invoices.reduce(
    (s, inv) => { s.total++; s[inv.status]++; return s; },
    { total: 0, paid: 0, pending: 0, overdue: 0, cancelled: 0 },
  );

export const filterInvoicesByStatus = (
  invoices: InvoiceData[],
  status:   InvoiceData['status'],
): InvoiceData[] => invoices.filter((i) => i.status === status);

export const filterInvoicesByDateRange = (
  invoices:  InvoiceData[],
  start:     string,
  end:       string,
): InvoiceData[] => {
  const s = new Date(start), e = new Date(end);
  return invoices.filter((inv) => { const d = new Date(inv.orderDate); return d >= s && d <= e; });
};

export const searchInvoices = (invoices: InvoiceData[], term: string): InvoiceData[] => {
  const t = term.toLowerCase();
  return invoices.filter((inv) =>
    inv.invoiceNumber.toLowerCase().includes(t) ||
    inv.customer.name.toLowerCase().includes(t)  ||
    inv.customer.email.toLowerCase().includes(t) ||
    inv.items.some((item) => item.name.toLowerCase().includes(t)),
  );
};

export const sortInvoices = (
  invoices: InvoiceData[],
  by:       'date' | 'total' | 'invoiceNumber',
  order:    'asc' | 'desc' = 'desc',
): InvoiceData[] =>
  [...invoices].sort((a, b) => {
    let cmp = 0;
    if (by === 'date')          cmp = new Date(a.orderDate).getTime() - new Date(b.orderDate).getTime();
    else if (by === 'total')    cmp = a.grandTotal - b.grandTotal;
    else                        cmp = a.invoiceNumber.localeCompare(b.invoiceNumber);
    return order === 'asc' ? cmp : -cmp;
  });

export const exportInvoicesToCSV = (invoices: InvoiceData[]): string => {
  const headers = [
    'Invoice Number','Order ID','Order Date','Customer Name','Customer Email',
    'Status','Taxable Value','GST Amount','Discount','Delivery','Grand Total','GST Type',
  ];
  const rows = invoices.map((inv) => [
    inv.invoiceNumber, inv.orderId, inv.orderDate,
    inv.customer.name, inv.customer.email, inv.status,
    inv.effectiveAmount.toString(),
    inv.gstAmount.toString(),
    inv.discount.toString(),
    inv.deliveryCharge.toString(),
    inv.grandTotal.toString(),
    isIntraState(inv.shippingAddress.state) ? 'CGST+SGST' : 'IGST',
  ]);
  return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
};

export const downloadInvoicesCSV = (invoice: InvoiceData): void => {
  try {
    const csv  = exportInvoicesToCSV([invoice]);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `invoices-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => { document.body.removeChild(a); URL.revokeObjectURL(url); }, 300);
    showSuccessAlert('Invoices exported to CSV successfully');
  } catch (err) {
    console.error('Error exporting CSV:', err);
    showErrorAlert('Failed to export invoices to CSV');
  }
};

export const generateInvoicePDF = async (invoice: InvoiceData): Promise<Blob> => {
  const html = generateInvoiceHTML(invoice);
  return new Blob([html], { type: 'text/html' });
};

export const sendInvoiceEmail = async (invoice: InvoiceData, recipientEmail: string): Promise<void> => {
  console.log('Sending invoice to:', recipientEmail, '| Invoice:', invoice.invoiceNumber);
  await new Promise((r) => setTimeout(r, 1000));
  showSuccessAlert(`Invoice ${invoice.invoiceNumber} sent to ${recipientEmail}`);
};

export const getInvoiceStats = (invoices: InvoiceData[]) => {
  const paid    = filterInvoicesByStatus(invoices, 'paid');
  const pending = filterInvoicesByStatus(invoices, 'pending');
  const overdue = invoices.filter(isInvoiceOverdue);
  const revenue = paid.reduce((s, i) => s + i.grandTotal, 0);
  const sorted  = [...paid].sort((a, b) => b.grandTotal - a.grandTotal);
  return {
    totalRevenue:         revenue,
    averageInvoiceValue:  paid.length > 0 ? revenue / paid.length : 0,
    highestInvoice:       sorted[0] ?? null,
    lowestInvoice:        sorted[sorted.length - 1] ?? null,
    paidInvoices:         paid,
    pendingInvoices:      pending,
    overdueInvoices:      overdue,
  };
};

export const updateInvoiceStatus = (
  invoice: InvoiceData,
  status:  InvoiceData['status'],
): InvoiceData => ({ ...invoice, status });
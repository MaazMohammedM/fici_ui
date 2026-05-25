export type LabelPdf = {
  setFont:         (family: string, style: string) => void;
  setFontSize:     (size: number) => void;
  setTextColor:    (r: number, g?: number, b?: number) => void;
  setDrawColor:    (r: number, g?: number, b?: number) => void;
  setFillColor:    (r: number, g?: number, b?: number) => void;
  setLineWidth:    (w: number) => void;
  text:            (txt: string | string[], x: number, y: number, opts?: Record<string, unknown>) => void;
  splitTextToSize: (txt: string, maxW: number) => string[];
  line:            (x1: number, y1: number, x2: number, y2: number) => void;
  rect:            (x: number, y: number, w: number, h: number, style?: string) => void;
  addPage:         () => void;
  save:            (filename: string) => void;
  internal:        { pageSize: { getWidth: () => number; getHeight: () => number } };
};

/** Subset of InvoiceData the label renderer needs.  Full InvoiceData is compatible. */
export interface LabelInvoiceData {
  orderId:        string;
  invoiceNumber:  string;
  orderDate:      string;
  invoiceDate:    string;
  paymentMethod:  string;
  status:         string;
  effectiveAmount: number;
  discount:       number;
  deliveryCharge: number;
  grandTotal:     number;
  customer: {
    name:   string;
    email?: string;
    phone?: string;
  };
  shippingAddress: {
    name:      string;
    address:   string;
    city:      string;
    district?: string;
    state:     string;
    pincode:   string;
    phone?:    string;
    landmark?: string;
  };
  items: Array<{
    name:      string;
    size?:     string;
    color?:    string;
    quantity:  number;
    total:     number;
  }>;
}

// ─── Seller constants ─────────────────────────────────────────────────────────

const SELLER = {
  name:       'Fici Shoes',
  gstin:      '33BMAPM8509H1Z4',
  address:    'No.20, 1st Floor, Broad Bazaar, Flower Bazaar Lane, Ambur - 635802, Tamil Nadu.',
  phone:      '8122003006',
  contactUrl: 'https://www.ficishoes.com/contact',
  gstRate:    5,
} as const;

// ─── Page / label geometry ────────────────────────────────────────────────────

/** A4 landscape page dimensions (mm) */
const PAGE_W  = 297;
const PAGE_H  = 210;

/**
 * Each label occupies exactly half the A4 page width.
 * ONE label per page: 148.5 × 210 mm.
 */
export const LABEL_W  = 148.5;   // mm  — label width  = page width / 2
export const LABEL_H  = 210;     // mm  — label height = page height

/** Inner horizontal padding inside each label */
const PAD = 5; // mm

// ─────────────────────────────────────────────────────────────────────────────
// CODE128-B BARCODE ENGINE
// Pure vector: black filled rectangles, no images, sharp at any resolution.
// ─────────────────────────────────────────────────────────────────────────────

/** CODE128-B bar/space width patterns, indexed by symbol value (0-106). */
const C128: Record<number, string> = {
  0:'212222',  1:'222122',  2:'222221',  3:'121223',  4:'121322',  5:'131222',
  6:'122213',  7:'122312',  8:'132212',  9:'221213', 10:'221312', 11:'231212',
  12:'112232', 13:'122132', 14:'122231', 15:'113222', 16:'123122', 17:'123221',
  18:'223211', 19:'221132', 20:'221231', 21:'213212', 22:'223112', 23:'312131',
  24:'311222', 25:'321122', 26:'321221', 27:'312212', 28:'322112', 29:'322211',
  30:'212123', 31:'212321', 32:'232121', 33:'111323', 34:'131123', 35:'131321',
  36:'112313', 37:'132113', 38:'132311', 39:'211313', 40:'231113', 41:'231311',
  42:'112133', 43:'112331', 44:'132131', 45:'113123', 46:'113321', 47:'133121',
  48:'313121', 49:'211331', 50:'231131', 51:'213113', 52:'213311', 53:'213131',
  54:'311123', 55:'311321', 56:'331121', 57:'312113', 58:'312311', 59:'332111',
  60:'314111', 61:'221411', 62:'431111', 63:'111224', 64:'111422', 65:'121124',
  66:'121421', 67:'141122', 68:'141221', 69:'112214', 70:'112412', 71:'122114',
  72:'122411', 73:'142112', 74:'142211', 75:'241211', 76:'221114', 77:'413111',
  78:'241112', 79:'134111', 80:'111242', 81:'121142', 82:'121241', 83:'114212',
  84:'124112', 85:'124211', 86:'411212', 87:'421112', 88:'421211', 89:'212141',
  90:'214121', 91:'412121', 92:'111143', 93:'111341', 94:'131141', 95:'114113',
  96:'114311', 97:'411113', 98:'411311', 99:'113141',100:'114131',101:'311141',
  102:'411131',103:'211412',104:'211214',105:'211232',106:'233111',
};

/**
 * drawBarcode — renders a CODE128-B barcode as pure black vector rectangles.
 *
 * @param pdf   LabelPdf instance
 * @param text  ASCII string to encode (chars 32-126)
 * @param x     left edge of barcode area (mm)
 * @param y     top edge of barcode area (mm)
 * @param w     total barcode width (mm) — auto-scales, never overflows
 * @param h     bar height (mm)
 */
export function drawBarcode(
  pdf:  LabelPdf,
  text: string,
  x:    number,
  y:    number,
  w:    number,
  h:    number,
): void {
  const START_B = 104;
  const STOP    = 106;

  // Build symbol list: START_B + data + checksum + STOP
  const codes: number[] = [START_B];
  for (let i = 0; i < text.length; i++) {
    codes.push(text.charCodeAt(i) - 32);
  }
  let checksum = START_B;
  for (let i = 0; i < text.length; i++) {
    checksum += (text.charCodeAt(i) - 32) * (i + 1);
  }
  codes.push(checksum % 103);
  codes.push(STOP);

  // Build pattern string
  let pattern = '';
  for (const code of codes) pattern += C128[code] ?? '';

  // Total module count → per-module width so barcode fills exactly w
  let totalModules = 0;
  for (const ch of pattern) totalModules += Number(ch);
  if (totalModules === 0) return;
  const modW = w / totalModules;

  // Render: odd position = bar (filled black), even = space (skip)
  pdf.setFillColor(0, 0, 0);
  let curX = x;
  let isBar = true;
  for (const ch of pattern) {
    const bw = Number(ch) * modW;
    if (isBar) {
      (pdf as unknown as { rect: (x: number, y: number, w: number, h: number, s: string) => void })
        .rect(curX, y, bw, h, 'F');
    }
    curX += bw;
    isBar = !isBar;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// LAYOUT HELPER LIBRARY
// All helpers are pure functions: receive pdf + geometry, draw, return new Y.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * drawWrappedText — wraps `text` to `maxW` mm and draws it.
 * Returns the Y baseline of the LAST line drawn.
 */
export function drawWrappedText(
  pdf:   LabelPdf,
  text:  string,
  x:     number,
  y:     number,
  maxW:  number,
  lineH: number = 4.0,
): number {
  const lines = pdf.splitTextToSize(text, maxW);
  pdf.text(lines, x, y);
  return y + (lines.length - 1) * lineH;
}

/**
 * measureTextHeight — returns the total height (mm) a wrapped block will need.
 */
function measureTextHeight(
  pdf:   LabelPdf,
  text:  string,
  maxW:  number,
  lineH: number = 4.0,
): number {
  const lines = pdf.splitTextToSize(text, maxW);
  return lines.length * lineH;
}

/**
 * fitSingleLine — truncates text to fit within maxW mm on a single line,
 * appending "…" if truncation was needed.
 */
function fitSingleLine(pdf: LabelPdf, text: string, maxW: number): string {
  const lines = pdf.splitTextToSize(text, maxW);
  if (lines.length <= 1) return text;
  // Binary search for longest prefix that fits
  let lo = 0, hi = text.length;
  while (lo < hi - 1) {
    const mid  = Math.floor((lo + hi) / 2);
    const test = pdf.splitTextToSize(text.slice(0, mid) + '…', maxW);
    if (test.length === 1) lo = mid; else hi = mid;
  }
  return text.slice(0, lo) + '…';
}

/**
 * drawSection — draws a solid black header band and returns the Y cursor
 * immediately below it.  White text, professional uppercase label.
 */
export function drawSection(
  pdf:   LabelPdf,
  label: string,
  lx:    number,   // left x of band
  y:     number,   // top y of band
  bw:    number,   // band width
  bh:    number = 6.5, // band height
): number {
  pdf.setFillColor(0, 0, 0);
  pdf.rect(lx, y, bw, bh, 'F');
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(7);
  pdf.setTextColor(255, 255, 255);
  pdf.text(label, lx + PAD, y + bh - 2.0);
  return y + bh;
}

/** Thin horizontal rule */
function hRule(
  pdf:  LabelPdf,
  y:    number,
  lx:   number,
  rx:   number,
  gray: number = 200,
  lw:   number = 0.2,
): void {
  pdf.setDrawColor(gray);
  pdf.setLineWidth(lw);
  pdf.line(lx, y, rx, y);
}

/** Thin vertical rule */
function vRule(
  pdf:  LabelPdf,
  x:    number,
  ty:   number,
  by:   number,
  gray: number = 200,
  lw:   number = 0.2,
): void {
  pdf.setDrawColor(gray);
  pdf.setLineWidth(lw);
  pdf.line(x, ty, x, by);
}

/** Outline-only rect — thin black/grey border, white interior */
function outlineRect(
  pdf:  LabelPdf,
  x:    number,
  y:    number,
  w:    number,
  h:    number,
  gray: number = 0,
  lw:   number = 0.35,
): void {
  pdf.setDrawColor(gray);
  pdf.setFillColor(255, 255, 255);
  pdf.setLineWidth(lw);
  pdf.rect(x, y, w, h, 'FD');
}

/** Micro uppercase section-caption label (gray) */
function caption(
  pdf:  LabelPdf,
  text: string,
  x:    number,
  y:    number,
): void {
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(6);
  pdf.setTextColor(140);
  pdf.text(text.toUpperCase(), x, y);
}

// ─────────────────────────────────────────────────────────────────────────────
// calculateDynamicHeights
// Pre-measures every section so drawPackagingLabel knows how tall each block
// is before drawing — critical for keeping everything inside LABEL_H = 105 mm.
// ─────────────────────────────────────────────────────────────────────────────

interface SectionHeights {
  header:    number;  // brand + invoice meta band
  meta:      number;  // order-id / date / payment strip
  barcode:   number;  // barcode + human-readable text
  deliverTo: number;  // recipient address block
  payment:   number;  // COD box or PAID stamp
  items:     number;  // item rows
  totals:    number;  // summary rows
  footer:    number;  // return addr + notice
}

export function calculateDynamicHeights(
  pdf:     LabelPdf,
  invoice: LabelInvoiceData,
): SectionHeights {
  const iW     = LABEL_W - PAD * 2;
  const addr   = invoice.shippingAddress;
  const isCOD  = invoice.paymentMethod.toLowerCase().includes('cod');
  const lineH  = 4.0;

  // Address block
  const addrStr  = addr.address;
  const addrH    = measureTextHeight(pdf, addrStr, iW, lineH);
  const phoneH   = (addr.phone || invoice.customer.phone) ? lineH : 0;
  const landmarkH = addr.landmark ? measureTextHeight(pdf, `Landmark: ${addr.landmark}`, iW, lineH) : 0;
  const deliverTo =
    6.5 +          // section band
    2 +            // top pad
    5.5 +          // name line (bold, bigger)
    2.5 +          // name->addr gap (increased from 1.5 to prevent overlap)
    addrH +
    lineH +        // city/state
    lineH +        // pincode/country
    phoneH +
    landmarkH +
    3;             // bottom pad

  // Items block
  const itemHdrH = 6;
  let itemsH = itemHdrH;
  for (const item of invoice.items) {
    const desc  = `${item.name}${item.size ? ` (${item.size})` : ''}`;
    const lines = pdf.splitTextToSize(desc, iW * 0.60 - 1).length;
    itemsH += lines * 3.8 + 3.5;   // row height per item
  }

  // Totals block
  const hasDiscount = Number(invoice.discount) > 0;
  const hasShipping = Number(invoice.deliveryCharge) > 0;
  const summaryCount = 1             // grand total always
    + (hasDiscount ? 1 : 0)
    + (hasShipping ? 1 : 0)
    + (isCOD       ? 1 : 0);         // COD fee row
  const totalsH = summaryCount * 5.0 + 3;

  return {
    header:    9,
    meta:      13,
    barcode:   4 + 14 + 5,   // top-pad + bars + text (updated for taller barcode)
    deliverTo,
    payment:   10,
    items:     itemsH,
    totals:    totalsH,
    footer:    16,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// drawPackagingLabel
// Draws ONE complete shipping label into the given bounding box.
// Every section flows dynamically; no absolute Y assumptions beyond startY.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Renders one premium B&W shipping label.
 *
 * @param pdf      LabelPdf instance
 * @param invoice  Order data
 * @param startX   Left edge of label on the page (mm)
 * @param startY   Top edge of label on the page (mm)
 */
export function drawPackagingLabel(
  pdf:     LabelPdf,
  invoice: LabelInvoiceData,
  startX:  number,
  startY:  number,
): void {
  // ── Geometry shorthands ────────────────────────────────────────────────────
  const LX   = startX;
  const LY   = startY;
  const LW   = LABEL_W;
  const LH   = LABEL_H;
  const RX   = LX + LW;
  const BY   = LY + LH;          // bottom y of label
  const iLX  = LX + PAD;        // inner left
  const iRX  = RX - PAD;        // inner right
  const iW   = LW - PAD * 2;    // inner width

  const shortId  = invoice.orderId.replace(/-/g, '').slice(-12).toUpperCase();
  const isCOD    = invoice.paymentMethod.toLowerCase().includes('cod');
  const addr     = invoice.shippingAddress;

  // White background for this label slot
  pdf.setFillColor(255, 255, 255);
  pdf.rect(LX, LY, LW, LH, 'F');

  // Outer border — 0.5 pt black, crisp on all printers
  outlineRect(pdf, LX, LY, LW, LH, 0, 0.5);

  let y = LY; // running Y cursor

  // ══════════════════════════════════════════════════════════════════════════
  // SECTION A — Header band
  // Left: FICI SHOES (white bold) + "SHIPPING LABEL" caption
  // Right: Invoice # and order date
  // ══════════════════════════════════════════════════════════════════════════
  const HDR_H = 9; // mm
  pdf.setFillColor(0, 0, 0);
  pdf.rect(LX, y, LW, HDR_H, 'F');

  // Brand name
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(10.5);
  pdf.setTextColor(255, 255, 255);
  pdf.text(SELLER.name.toUpperCase(), iLX, y + 6.5);

  // Right-side meta (invoice # + date), smaller
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(6);
  pdf.setTextColor(210, 210, 210);
  pdf.text('SHIPPING LABEL', iRX, y + 3.5, { align: 'right' });
  pdf.setFontSize(6.5);
  pdf.text(`INV: ${invoice.invoiceNumber}`, iRX, y + 7.5, { align: 'right' });

  y += HDR_H;

  // ══════════════════════════════════════════════════════════════════════════
  // SECTION B — Meta strip  (2 columns for narrower label, gray background)
  // Col 1: SHIP FROM seller   Col 2: ORDER ID + PAYMENT
  // ══════════════════════════════════════════════════════════════════════════
  const META_H   = 13; // mm
  const COL_W    = iW / 2;

  pdf.setFillColor(247, 247, 247);
  pdf.rect(LX, y, LW, META_H, 'F');
  hRule(pdf, y, LX, RX, 0, 0.3);

  // ── Col 1: SHIP FROM ──────────────────────────────────────────────────────
  caption(pdf, 'SHIP FROM', iLX, y + 4);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(7.5);
  pdf.setTextColor(0);
  pdf.text(fitSingleLine(pdf, SELLER.name, COL_W - 2), iLX, y + 8.5);
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(6.5);
  pdf.setTextColor(60);
  pdf.text(`Ph: ${SELLER.phone}`, iLX, y + 12.2);

  // ── Divider ───────────────────────────────────────────────────────────────
  const col2X = iLX + COL_W + 1;
  vRule(pdf, iLX + COL_W, y + 2, y + META_H - 2, 200, 0.2);

  // ── Col 2: ORDER ID & PAYMENT ───────────────────────────────────────────────
  caption(pdf, 'ORDER ID', col2X, y + 4);
  pdf.setFont('courier', 'bold');
  pdf.setFontSize(7);
  pdf.setTextColor(0);
  pdf.text(fitSingleLine(pdf, shortId, COL_W - 2), col2X, y + 8.5);
  
  // Payment method on same line (smaller)
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(5.5);
  pdf.setTextColor(80);
  pdf.text(isCOD ? 'COD' : invoice.paymentMethod.toUpperCase(), col2X, y + 12.2);

  y += META_H;
  hRule(pdf, y, LX, RX, 0, 0.3);

  // ══════════════════════════════════════════════════════════════════════════
  // SECTION C — Barcode  (CODE128-B vector, auto-width, pure black bars)
  // ══════════════════════════════════════════════════════════════════════════
  const BC_TOP = 4;    // top padding before bars
  const BC_H   = 14;   // bar height mm — taller for 210 mm label
  const BC_TXT = 5;    // space for human-readable text below bars

  y += BC_TOP;

  pdf.setFillColor(0, 0, 0);
  drawBarcode(pdf, shortId, iLX, y, iW, BC_H);

  // Human-readable text under barcode
  pdf.setFont('courier', 'bold');
  pdf.setFontSize(7);
  pdf.setTextColor(0);
  pdf.text(shortId, LX + LW / 2, y + BC_H + 3.5, { align: 'center' });

  y += BC_H + BC_TXT + 1;
  hRule(pdf, y, LX, RX, 180, 0.2);

  // ══════════════════════════════════════════════════════════════════════════
  // SECTION D — DELIVER TO  (recipient name + address block)
  // Dynamic height — handles long addresses, landmarks, missing fields safely.
  // ══════════════════════════════════════════════════════════════════════════
  y = drawSection(pdf, 'DELIVER TO', LX, y, LW, 6.5);

  y += 2; // top pad

  // Recipient name — large bold (dominant visual hierarchy)
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(9.5);
  pdf.setTextColor(0);
  pdf.text(fitSingleLine(pdf, addr.name, iW), iLX, y + 5);
  y += 8; // Increased from 6.5 to prevent overlap with address

  // Address body
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(7.5);
  pdf.setTextColor(25);

  const LINE_H = 4.0;

  const addrEnd = drawWrappedText(pdf, addr.address, iLX, y, iW, LINE_H);
  y = addrEnd + LINE_H;

  const cityState = `${addr.city}${addr.district ? ', ' + addr.district : ''}, ${addr.state}`;
  pdf.text(cityState, iLX, y);
  y += LINE_H;

  pdf.text(`${addr.pincode}  —  INDIA`, iLX, y);
  y += LINE_H;

  const phone = addr.phone || invoice.customer.phone || '';
  if (phone) {
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(7.5);
    pdf.text(`Ph: ${phone}`, iLX, y);
    y += LINE_H;
  }

  if (addr.landmark) {
    pdf.setFont('helvetica', 'italic');
    pdf.setFontSize(7);
    pdf.setTextColor(80);
    const lmEnd = drawWrappedText(pdf, `Landmark: ${addr.landmark}`, iLX, y, iW, LINE_H);
    y = lmEnd + LINE_H;
  }

  y += 2.5; // bottom pad
  hRule(pdf, y, LX, RX, 0, 0.3);

  // ══════════════════════════════════════════════════════════════════════════
  // SECTION E — Payment status badge (COD or PAID)
  // Prominent, black border, bold text — no colour fills.
  // ══════════════════════════════════════════════════════════════════════════
  const PAY_H = 9.5;
  y += 1;

  outlineRect(pdf, LX + PAD, y, LW - PAD * 2, PAY_H, 0, 0.5);

  if (isCOD) {
    // Left: "CASH ON DELIVERY" label
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(8);
    pdf.setTextColor(0);
    pdf.text('CASH ON DELIVERY', iLX + 2, y + PAY_H - 2.5);

    // Right: amount to collect
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(8.5);
    pdf.text(
      `Rs. ${fmtAmt(invoice.effectiveAmount)}`,
      iRX - 2,
      y + PAY_H - 2.5,
      { align: 'right' },
    );

    // Vertical divider
    const midX = LX + LW / 2;
    vRule(pdf, midX, y + 1.5, y + PAY_H - 1.5, 0, 0.2);

    // Micro captions
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(5.5);
    pdf.setTextColor(100);
    pdf.text('PAYMENT MODE', iLX + 2, y + 2.5);
    pdf.text('AMOUNT TO COLLECT', midX + 2, y + 2.5);

  } else {
    // PAID stamp
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(9.5);
    pdf.setTextColor(0);
    pdf.text('PAID', LX + LW / 2, y + PAY_H - 2, { align: 'center' });

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(6.5);
    pdf.setTextColor(70);
    pdf.text(
      `${invoice.paymentMethod.toUpperCase()}  •  Rs. ${fmtAmt(invoice.effectiveAmount)}`,
      LX + LW / 2,
      y + 3,
      { align: 'center' },
    );
  }

  y += PAY_H + 1.5;
  hRule(pdf, y, LX, RX, 0, 0.3);

  // ══════════════════════════════════════════════════════════════════════════
  // SECTION F — Items table
  // Dynamic rows; compact 3-column layout: Description | Qty | Amount
  // ══════════════════════════════════════════════════════════════════════════
  const COL_DESC = iW * 0.62;
  const COL_QTY  = iW * 0.12;
  // Amount column uses remaining width
  const QTY_X    = iLX + COL_DESC;
  const AMT_X    = iLX + COL_DESC + COL_QTY;

  y += 1;

  // Header row — dark gray band
  const ITM_HDR_H = 5.5;
  pdf.setFillColor(30, 30, 30);
  pdf.rect(LX, y, LW, ITM_HDR_H, 'F');
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(6.5);
  pdf.setTextColor(255, 255, 255);
  pdf.text('DESCRIPTION', iLX, y + ITM_HDR_H - 1.5);
  pdf.text('QTY', QTY_X, y + ITM_HDR_H - 1.5);
  pdf.text('AMOUNT', iRX, y + ITM_HDR_H - 1.5, { align: 'right' });
  y += ITM_HDR_H;

  const ROW_LH  = 3.8; // line height within a row
  const ROW_PAD = 1.4; // top + bottom pad per row

  invoice.items.forEach((item, idx) => {
    const desc       = `${item.name}${item.size ? ` (${item.size})` : ''}`;
    const descLines  = pdf.splitTextToSize(desc, COL_DESC - 1);
    const rowH       = descLines.length * ROW_LH + ROW_PAD * 2;

    // Alternating light row tint
    if (idx % 2 === 0) {
      pdf.setFillColor(251, 251, 251);
      pdf.rect(LX, y, LW, rowH, 'F');
    }

    // Description
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(7);
    pdf.setTextColor(20);
    pdf.text(descLines, iLX, y + ROW_PAD + ROW_LH);

    // Qty — centred in its column
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(7);
    pdf.setTextColor(0);
    pdf.text(
      String(item.quantity),
      QTY_X + COL_QTY / 2,
      y + ROW_PAD + ROW_LH,
      { align: 'center' },
    );

    // Amount — right-aligned
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(7);
    pdf.setTextColor(0);
    pdf.text(`Rs. ${fmtAmt(item.total)}`, iRX, y + ROW_PAD + ROW_LH, { align: 'right' });

    y += rowH;
    hRule(pdf, y, LX, RX, 220, 0.15);
  });

  // ══════════════════════════════════════════════════════════════════════════
  // SECTION G — Totals summary
  // Uses ONLY effective_amount as the final amount.
  // GST is already included — we do NOT add it again.
  // Discount row shown ONLY if discount > 0.
  // ══════════════════════════════════════════════════════════════════════════
  y += 2;

  interface SummaryRow { label: string; value: string; bold?: boolean; }
  const summaryRows: SummaryRow[] = [];

  if (Number(invoice.discount) > 0) {
    summaryRows.push({
      label: 'Discount',
      value: `- Rs. ${fmtAmt(invoice.discount)}`,
    });
  }

  if (Number(invoice.deliveryCharge) > 0) {
    summaryRows.push({
      label: 'Shipping',
      value: `Rs. ${fmtAmt(invoice.deliveryCharge)}`,
    });
  }

  if (isCOD) {
    summaryRows.push({ label: 'COD Fee', value: 'Rs. 0.00' });
  }

  // Grand total — effective_amount, GST already inclusive
  summaryRows.push({
    label: 'TOTAL (incl. GST)',
    value: `Rs. ${fmtAmt(invoice.effectiveAmount)}`,
    bold:  true,
  });

  const SUM_LH = 4.8;

  summaryRows.forEach((row) => {
    const bold = row.bold ?? false;

    if (bold) {
      hRule(pdf, y - 0.5, LX + PAD, RX - PAD, 0, 0.25);
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(8.5);
    } else {
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(7);
    }

    pdf.setTextColor(bold ? 0 : 70);
    pdf.text(row.label, iRX - 22, y + SUM_LH - 1, { align: 'right' });
    pdf.setTextColor(0);
    pdf.text(row.value, iRX, y + SUM_LH - 1, { align: 'right' });

    y += SUM_LH;
  });

  // ══════════════════════════════════════════════════════════════════════════
  // SECTION H — Footer
  // Return address | GSTIN | "Computer generated" notice | Policy
  // Compact, minimal ink, print-safe.
  // ══════════════════════════════════════════════════════════════════════════
  // Pin footer to bottom of label slot; the exact y position is flexible.
  // We use BY (bottom of label) minus a fixed footer height.
  const FOOTER_H = 15;
  const footerY  = BY - FOOTER_H;

  // Only draw footer if there is room (prevents overlap with items on dense orders)
  if (y < footerY - 1) {
    hRule(pdf, footerY, LX, RX, 160, 0.2);
    let fy = footerY + 3;

    // Return address
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(6);
    pdf.setTextColor(80);
    const retStr   = `Return: ${SELLER.name}, ${SELLER.address}`;
    const retLines = pdf.splitTextToSize(retStr, iW);
    pdf.text(retLines, iLX, fy);
    fy += retLines.length * 3 + 1.5;

    // GSTIN + website on same line
    pdf.setFontSize(6);
    pdf.setTextColor(110);
    pdf.text(`GSTIN: ${SELLER.gstin}`, iLX, fy);
    pdf.text(SELLER.contactUrl, iRX, fy, { align: 'right' });
    fy += 3.5;

    // "Computer generated" notice
    pdf.setFont('helvetica', 'italic');
    pdf.setFontSize(5.5);
    pdf.setTextColor(150);
    pdf.text(
      'Computer generated document. No signature required.',
      LX + LW / 2,
      fy,
      { align: 'center' },
    );
    fy += 3;

    // Policy
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(5.5);
    pdf.setTextColor(140);
    pdf.text(
      'Exchange/replacement for size mismatch only. No returns. Retain this label.',
      LX + LW / 2,
      fy,
      { align: 'center' },
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// renderPackagingLabelsPage
// Draws ONE label on the current PDF page.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Places a single label on the current PDF page.
 *
 * @param pdf    LabelPdf instance (page must already be current)
 * @param order  Invoice for the label
 */
export function renderPackagingLabelsPage(
  pdf:   LabelPdf,
  order: LabelInvoiceData | null,
): void {
  // White page background
  pdf.setFillColor(255, 255, 255);
  pdf.rect(0, 0, PAGE_W, PAGE_H, 'F');

  // Render the single label centered on the page
  if (order) {
    drawPackagingLabel(pdf, order, 0, 0);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// generatePackagingLabelsPdf  — MAIN PUBLIC EXPORT
// ─────────────────────────────────────────────────────────────────────────────

export interface GeneratePackagingLabelsPdfOptions {
  /** Array of invoice data objects — one per order.  Each gets its own label. */
  orders:           LabelInvoiceData[];
  /** Filename for the downloaded PDF (without extension). */
  downloadFileName?: string;
}

/**
 * Generates a professional A4 packaging-label PDF and triggers a browser download.
 *
 * • ONE label per A4 page (landscape), each label 148.5 × 210 mm.
 * • Paginates automatically for any number of orders.
 * • Pure jsPDF vector — no rasterisation, no html2canvas.
 * • Thermal-printer and laser-printer friendly.
 *
 * @example
 * await generatePackagingLabelsPdf({ orders: [inv1, inv2, inv3] });
 * // → Page 1: inv1
 * // → Page 2: inv2
 * // → Page 3: inv3
 */
export async function generatePackagingLabelsPdf({
  orders,
  downloadFileName,
}: GeneratePackagingLabelsPdfOptions): Promise<void> {
  if (!orders || orders.length === 0) {
    throw new Error('[generatePackagingLabelsPdf] No orders provided.');
  }

  const { default: JsPDF } = await import('jspdf');

  // A4 landscape — 297 × 210 mm — one label per page
  const pdf = new JsPDF({
    orientation: 'landscape',
    unit:        'mm',
    format:      'a4',
  }) as unknown as LabelPdf;

  // One label per page
  for (let i = 0; i < orders.length; i++) {
    if (i > 0) pdf.addPage();

    renderPackagingLabelsPage(pdf, orders[i]);
  }

  // Determine filename
  const firstId  = orders[0].orderId.replace(/-/g, '').slice(-12).toUpperCase();
  const filename = downloadFileName
    ?? (orders.length === 1
        ? `Packaging_Label_${firstId}`
        : `Packaging_Labels_${orders.length}_orders`);

  pdf.save(`${filename}.pdf`);
}

// ─────────────────────────────────────────────────────────────────────────────
// Internal helpers
// ─────────────────────────────────────────────────────────────────────────────

/** Format a number as Indian-locale amount string (no ₹ symbol — caller adds prefix). */
function fmtAmt(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}
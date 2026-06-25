// packagingLabelPdf.ts
// ─────────────────────────────────────────────────────────────────────────────
// Professional Packaging Label PDF Generator
// Pure jsPDF vector output — no rasterisation, no html2canvas.
// One A4 landscape page per order.
// ─────────────────────────────────────────────────────────────────────────────

// ═══════════════════════════════════════════════════════════════════════════════
// DEVELOPER-EDITABLE PADDING CONSTANTS (all values in mm)
// ═══════════════════════════════════════════════════════════════════════════════
/** Left inner padding inside the label boundary */
const PAD_LEFT   = 12;
/** Right inner padding inside the label boundary */
const PAD_RIGHT  = 12;
/** Top inner padding inside the label boundary (below header band) */
const PAD_TOP    = 10;
/** Bottom inner padding inside the label boundary (above footer) */
const PAD_BOTTOM = 10;

// Convenience shorthand used internally — match 1mg's compact but readable layout
const PAD_H = PAD_LEFT;  // horizontal pad alias used in older helpers

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION SPACING CONSTANTS (all values in mm)
// ═══════════════════════════════════════════════════════════════════════════════
const SECTION_SPACING = 4;       // Spacing between major sections
const BARCODE_SPACING = 6;       // Spacing around barcode section
const ADDRESS_LINE_H = 4.5;      // Line height for address text
const FOOTER_HEIGHT = 28;        // Fixed footer height
const FOOTER_SPACING = 8;        // Spacing above footer

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

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

/** Subset of InvoiceData the label renderer needs. Full InvoiceData is compatible. */
export interface LabelInvoiceData {
  orderId:         string;
  invoiceNumber:   string;
  orderDate:       string;
  invoiceDate:     string;
  paymentMethod:   string;
  status:          string;
  effectiveAmount: number;
  discount:        number;
  deliveryCharge:  number;
  grandTotal:      number;
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
    name:     string;
    size?:    string;
    color?:   string;
    quantity: number;
    total:    number;
  }>;
}

// ═══════════════════════════════════════════════════════════════════════════════
// SELLER CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════════

const SELLER = {
  name:       'Fici Shoes',
  city:       'Ambur 635802',
  gstin:      '33BMAPM8509H1Z4',
  address:    'No.20, 1st Floor, Broad Bazaar, Flower Bazaar Lane, Ambur - 635802, Tamil Nadu.',
  phone:      '8122003006',
  contactUrl: 'https://www.ficishoes.com/contact',
  gstRate:    5,
} as const;

// ═══════════════════════════════════════════════════════════════════════════════
// PAGE / LABEL GEOMETRY
// ═══════════════════════════════════════════════════════════════════════════════

/** A4 landscape page dimensions (mm) */
const PAGE_W = 297;
const PAGE_H = 210;

/**
 * Each label occupies exactly half the A4 page width.
 * ONE label per page: 148.5 × 210 mm.
 */
export const LABEL_W = 148.5;   // mm  — label width  = page width / 2
export const LABEL_H = 210;     // mm  — label height = page height

// ═══════════════════════════════════════════════════════════════════════════════
// CODE128-B BARCODE ENGINE — pure vector, sharp at any zoom/print resolution
// ═══════════════════════════════════════════════════════════════════════════════

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
  const codes: number[] = [START_B];
  for (let i = 0; i < text.length; i++) codes.push(text.charCodeAt(i) - 32);
  let checksum = START_B;
  for (let i = 0; i < text.length; i++) checksum += (text.charCodeAt(i) - 32) * (i + 1);
  codes.push(checksum % 103);
  codes.push(STOP);

  let pattern = '';
  for (const code of codes) pattern += C128[code] ?? '';

  let totalModules = 0;
  for (const ch of pattern) totalModules += Number(ch);
  if (totalModules === 0) return;
  const modW = w / totalModules;

  pdf.setFillColor(0, 0, 0);
  let curX = x;
  let isBar = true;
  for (const ch of pattern) {
    const bw = Number(ch) * modW;
    if (isBar) {
      (pdf as unknown as {
        rect: (x: number, y: number, w: number, h: number, s: string) => void;
      }).rect(curX, y, bw, h, 'F');
    }
    curX += bw;
    isBar = !isBar;
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// LAYOUT PRIMITIVES
// ═══════════════════════════════════════════════════════════════════════════════

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
  pdf.text(label, lx + PAD_LEFT, y + bh - 2.0);
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

function fmtAmt(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

// ═══════════════════════════════════════════════════════════════════════════════
// drawPackagingLabel — renders ONE complete shipping label
// ═══════════════════════════════════════════════════════════════════════════════

export function drawPackagingLabel(
  pdf: LabelPdf,
  invoice: LabelInvoiceData,
  startX: number,
  startY: number,
): void {

  const LX = startX;
  const LY = startY;
  const LW = LABEL_W;
  const LH = LABEL_H;

  const RX = LX + LW;
  const BY = LY + LH;

  const iLX = LX + PAD_LEFT;
  const iRX = RX - PAD_RIGHT;
  const iW = LW - PAD_LEFT - PAD_RIGHT;

  const shortId = invoice.orderId.replace(/-/g, '').slice(-12).toUpperCase();

  const isCOD =
    invoice.paymentMethod.toLowerCase().includes('cod');

  const addr = invoice.shippingAddress;

  // Background
  pdf.setFillColor(255, 255, 255);
  pdf.rect(LX, LY, LW, LH, 'F');

  outlineRect(pdf, LX, LY, LW, LH, 0, 0.5);

  // =========================================================
  // HEADER
  // =========================================================

  let y = LY + PAD_TOP;

  const headerH = 14;

  pdf.setFillColor(0, 0, 0);
  pdf.rect(LX, y, LW, headerH, 'F');

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(13);
  pdf.setTextColor(255);
  pdf.text('FICI SHOES', iLX, y + 9);

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(6.5);

  pdf.text('SHIPPING LABEL', iRX, y + 5, {
    align: 'right',
  });

  pdf.text(`INV: ${invoice.invoiceNumber}`, iRX, y + 10, {
    align: 'right',
  });

  y += headerH + SECTION_SPACING;

  // =========================================================
  // SHIP FROM + ORDER INFO
  // =========================================================

  const metaTop = y;

  const colGap = 8;
  const leftW = (iW / 2) - colGap;
  const rightX = iLX + leftW + colGap;

  caption(pdf, 'SHIP FROM', iLX, metaTop + 3);

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(10);
  pdf.setTextColor(0);
  pdf.text('Fici Shoes', iLX, metaTop + 10);

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(8);
  pdf.text('Ambur 635802', iLX, metaTop + 16);

  pdf.text('Ph: 8122003006', iLX, metaTop + 22);

  // Divider
  vRule(pdf, LX + LW / 2, metaTop, metaTop + 26, 180, 0.25);

  // RIGHT
  caption(pdf, 'ORDER ID', rightX, metaTop + 3);

  pdf.setFont('courier', 'bold');
  pdf.setFontSize(10);
  pdf.text(shortId, rightX, metaTop + 10);

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(8);

  pdf.text(
    isCOD ? 'CASH ON DELIVERY (COD)' : 'PREPAID',
    rightX,
    metaTop + 16,
  );

  const dateStr = new Date(invoice.orderDate)
    .toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });

  pdf.text(
    `Order Date: ${dateStr}`,
    rightX,
    metaTop + 22,
  );

  y += 26 + SECTION_SPACING;

  // =========================================================
  // BARCODE
  // =========================================================

  hRule(pdf, y, LX, RX, 0, 0.35);

  y += BARCODE_SPACING;

  drawBarcode(
    pdf,
    shortId,
    iLX + 10,
    y,
    iW - 20,
    18,
  );

  pdf.setFont('courier', 'bold');
  pdf.setFontSize(9);

  pdf.text(
    shortId,
    LX + LW / 2,
    y + 24,
    {
      align: 'center',
    },
  );

  y += BARCODE_SPACING + 18 + 6;

  // =========================================================
  // DELIVER TO BAND
  // =========================================================

  pdf.setFillColor(0, 0, 0);
  pdf.rect(LX, y, LW, 7, 'F');

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(8);
  pdf.setTextColor(255);

  pdf.text('DELIVER TO', iLX, y + 5);

  y += 7 + SECTION_SPACING;

  // =========================================================
  // ADDRESS SECTION
  // =========================================================

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(11);
  pdf.setTextColor(0);

  pdf.text(addr.name, iLX, y);

  y += 6;

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(8.5);

  const addressLines = pdf.splitTextToSize(
    addr.address,
    iW,
  );

  pdf.text(addressLines, iLX, y);

  y += addressLines.length * ADDRESS_LINE_H;

  pdf.text(
    `${addr.city}, ${addr.state}`,
    iLX,
    y,
  );

  y += ADDRESS_LINE_H;

  pdf.text(
    `${addr.pincode}  —  INDIA`,
    iLX,
    y,
  );

  y += ADDRESS_LINE_H;

  const phone =
    addr.phone || invoice.customer.phone || '';

  if (phone) {
    pdf.setFont('helvetica', 'bold');
    pdf.text(`Ph: ${phone}`, iLX, y);
    y += ADDRESS_LINE_H;
  }

  if (addr.landmark) {
    pdf.setFont('helvetica', 'italic');
    pdf.setFontSize(7.5);

    const landmarkLines = pdf.splitTextToSize(
      `Landmark: ${addr.landmark}`,
      iW,
    );

    pdf.text(landmarkLines, iLX, y);

    y += landmarkLines.length * ADDRESS_LINE_H;
  }

  y += SECTION_SPACING;
  hRule(pdf, y, LX, RX, 0, 0.35);

  // =========================================================
  // PAYMENT BOX
  // =========================================================

  const PAY_H = 12;

  outlineRect(
    pdf,
    iLX,
    y,
    iW,
    12,
    0,
    0.45,
  );

  if (isCOD) {

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(10);

    pdf.text(
      'CASH ON DELIVERY',
      LX + LW / 2,
      y + 5,
      {
        align: 'center',
      },
    );

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(12);

    pdf.text(
      `Rs. ${fmtAmt(invoice.effectiveAmount)}`,
      LX + LW / 2,
      y + 10,
      {
        align: 'center',
      },
    );

  } else {

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(7);

    pdf.text(
      `PREPAID`,
      LX + LW / 2,
      y + 4,
      {
        align: 'center',
      },
    );

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(11);

    pdf.text(
      'Payment already received. Do not collect any amount.',
      LX + LW / 2,
      y + 10,
      {
        align: 'center',
      },
    );
  }

  y += PAY_H + SECTION_SPACING;
  hRule(pdf, y, LX, RX, 0, 0.35);

  // =========================================================
  // ITEMS TABLE
  // =========================================================

  pdf.setFillColor(25, 25, 25);
  pdf.rect(LX, y, LW, 6, 'F');

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(7);
  pdf.setTextColor(255);

  pdf.text('DESCRIPTION', iLX, y + 4);

  pdf.text('QTY', iRX - 10, y + 4);

  y += 6 + SECTION_SPACING;

  invoice.items.forEach((item) => {

    const desc =
      `${item.name}${item.size ? ` (${item.size})` : ''}`;

    const lines = pdf.splitTextToSize(
      desc,
      iW - 25,
    );

    const rowH =
      Math.max(lines.length * 4.2, 8);

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(7.5);
    pdf.setTextColor(0);

    pdf.text(lines, iLX, y + 5);

    pdf.setFont('helvetica', 'bold');

    pdf.text(
      String(item.quantity),
      iRX - 8,
      y + 5,
      {
        align: 'center',
      },
    );

    y += rowH;

    hRule(pdf, y, LX, RX, 210, 0.2);
  });

  // =========================================================
  // SUMMARY
  // =========================================================

  y += SECTION_SPACING;
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(10);  
    // =========================================================
  // FOOTER
  // =========================================================

  const footerTop = BY - FOOTER_HEIGHT - PAD_BOTTOM;

  hRule(pdf, footerTop, LX, RX, 0, 0.35);

  let fy = footerTop + FOOTER_SPACING;

  // Return address — left-aligned, clean format
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(7);
  pdf.setTextColor(40);
  const returnAddr = `Return: ${SELLER.name}, ${SELLER.address}`;
  const returnAddrLines = pdf.splitTextToSize(returnAddr, iW);
  pdf.text(returnAddrLines, iLX, fy);
  fy += returnAddrLines.length * 4 + 3;

  // GSTIN — left-aligned
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(7);
  pdf.setTextColor(60);
  pdf.text(`GSTIN: ${SELLER.gstin}`, iLX, fy);
  fy += 4;

  // Website — right-aligned on same line as GSTIN
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(7);
  pdf.setTextColor(60);
  pdf.text(SELLER.contactUrl, iRX, fy - 4, { align: 'right' });

  fy += 4;

  // Legal note 1 — centered
  pdf.setFont('helvetica', 'italic');
  pdf.setFontSize(6.5);
  pdf.setTextColor(100);
  pdf.text(
    'Computer generated document. No signature required.',
    LX + LW / 2,
    fy,
    { align: 'center' },
  );
  fy += 3.5;

  // Legal note 2 — centered
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(6.5);
  pdf.setTextColor(100);
  pdf.text(
    'Exchange/replacement for size mismatch only. No returns. Retain this label.',
    LX + LW / 2,
    fy,
    { align: 'center' },
  );
}


// ═══════════════════════════════════════════════════════════════════════════════
// renderPackagingLabelsPage
// ═══════════════════════════════════════════════════════════════════════════════

export function renderPackagingLabelsPage(
  pdf:   LabelPdf,
  order: LabelInvoiceData | null,
): void {
  pdf.setFillColor(255, 255, 255);
  pdf.rect(0, 0, PAGE_W, PAGE_H, 'F');
  if (order) drawPackagingLabel(pdf, order, 0, 0);
}

// ═══════════════════════════════════════════════════════════════════════════════
// generatePackagingLabelsPdf — MAIN PUBLIC EXPORT
// ═══════════════════════════════════════════════════════════════════════════════

export interface GeneratePackagingLabelsPdfOptions {
  orders:            LabelInvoiceData[];
  downloadFileName?: string;
}

/**
 * Generates a professional A4 landscape packaging-label PDF and downloads it.
 *
 * • One label per A4 landscape page (297 × 210 mm).
 * • Pure jsPDF vector — sharp at any zoom, thermal & laser printer ready.
 * • COD: shows total amount prominently for delivery person, no per-item amounts.
 * • Prepaid: shows "PREPAID" only, no amount.
 * • Items table: DESCRIPTION | SIZE | QTY columns.
 */
export async function generatePackagingLabelsPdf({
  orders,
  downloadFileName,
}: GeneratePackagingLabelsPdfOptions): Promise<void> {
  if (!orders || orders.length === 0) {
    throw new Error('[generatePackagingLabelsPdf] No orders provided.');
  }

  const { default: JsPDF } = await import('jspdf');

  const pdf = new JsPDF({
    orientation: 'landscape',
    unit:        'mm',
    format:      'a4',
  }) as unknown as LabelPdf;

  for (let i = 0; i < orders.length; i++) {
    if (i > 0) pdf.addPage();
    renderPackagingLabelsPage(pdf, orders[i]);
  }

  const firstId  = orders[0].orderId.replace(/-/g, '').slice(-12).toUpperCase();
  const filename = downloadFileName
    ?? (orders.length === 1
        ? `Packaging_Label_${firstId}`
        : `Packaging_Labels_${orders.length}_orders`);

  pdf.save(`${filename}.pdf`);
}
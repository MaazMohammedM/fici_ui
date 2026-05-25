import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '@lib/supabase';
import {
  Eye,
  ShoppingCart,
  Zap,
  AlertCircle,
  Filter,
  ChevronDown,
  ChevronUp,
  Smartphone,
  Monitor,
  Tablet,
  Clock,
  User,
  Package,
  Ruler,
  TrendingUp,
  BarChart2,
  RefreshCw,
} from 'lucide-react';

// ─── Raw event from Supabase ──────────────────────────────────────────────────

interface ProductEvent {
  event_id: string;
  event_type: 'view_product' | 'size_selected' | 'add_to_cart' | 'buy_now' | 'wishlist' | 'out_of_stock_click';
  event_timestamp: string;
  product_id: string;
  article_id: string;
  product_name: string;
  category?: string;
  sub_category?: string;
  gender?: string;
  selected_size?: string;
  quantity?: number;
  mrp_price?: number;
  selling_price?: number;
  thumbnail_url?: string;
  user_id?: string;
  guest_session_id?: string;
  device_type?: 'mobile' | 'desktop' | 'tablet';
  browser?: string;
  operating_system?: string;
  source?: string;
  medium?: string;
  campaign?: string;
  current_url: string;
  page_path: string;
  referrer: string;
  session_id: string;
  metadata: string;
  created_at: string;
}

interface ParsedMetadata {
  language?: string;
  timezone?: string;
  user_agent?: string;
  device_type?: 'mobile' | 'desktop' | 'tablet';
  screen_width?: number;
  screen_height?: number;
  viewport_width?: number;
  viewport_height?: number;
  connection_type?: string;
  color_scheme?: string;
  is_touch_device?: boolean;
  scroll_depth_at_event?: number;
  time_on_page_seconds?: number;
  wishlist_action?: 'add' | 'remove';
}

// ─── New aggregated analytics structure ──────────────────────────────────────

interface SizeCount { size: string; count: number; }

interface DeviceBreakdown { mobile: number; desktop: number; tablet: number; unknown: number; }

interface ProductAnalyticsGroup {
  // Identity
  product_id:   string;
  article_id:   string;
  product_name: string;
  category?:    string;
  sub_category?:string;
  gender?:      string;
  thumbnail_url?:string;
  mrp_price?:   number;
  selling_price?:number;

  // Total event counts
  views:         number;
  sizeSelections:number;
  addToCart:     number;
  buyNow:        number;
  outOfStock:    number;
  wishlistAdds:  number;
  wishlistRemoves: number;

  // Conversion metrics
  conversionRate: number; // buy_now / views  (%)
  cartRate:       number; // add_to_cart / views (%)

  // Size analytics (sorted desc by count)
  sizeSelectionCounts: SizeCount[];
  addToCartBySizes:    SizeCount[];
  buyNowBySizes:       SizeCount[];
  outOfStockBySizes:   SizeCount[];

  // Derived size insights
  mostSelectedSize?:   string;
  leastSelectedSize?:  string;
  uniqueSizesCount:    number;

  // Device breakdown (from top-level column)
  devices: DeviceBreakdown;

  // Traffic source breakdown (from top-level columns)
  sourceCounts:   Map<string, number>;
  mediumCounts:   Map<string, number>;

  // Browser breakdown (from top-level column)
  browserCounts:  Map<string, number>;

  // OS breakdown (from top-level column)
  osCounts:       Map<string, number>;

  // Campaign (non-null/non-empty only)
  campaignCounts: Map<string, number>;

  // Session quality metrics (from metadata)
  avgScrollDepth: number;
  avgTimeOnPage: number;
  connectionTypeCounts: Map<string, number>;
  darkModeUsers: number;
  lightModeUsers: number;

  // Recency
  lastInteraction: string; // ISO string of most recent event
  allEvents: ProductEvent[];
}

// ─── Aggregation ─────────────────────────────────────────────────────────────

function parseMetadata(raw: string): ParsedMetadata {
  try { return JSON.parse(raw); } catch { return {}; }
}

function toSizeCountsSorted(map: Map<string, number>): SizeCount[] {
  return Array.from(map.entries())
    .map(([size, count]) => ({ size, count }))
    .sort((a, b) => b.count - a.count);
}

function buildAnalyticsGroups(events: ProductEvent[]): ProductAnalyticsGroup[] {
  // Primary map: product_id → accumulator
  const map = new Map<string, ProductAnalyticsGroup>();

  for (const ev of events) {
    if (!map.has(ev.product_id)) {
      map.set(ev.product_id, {
        product_id:    ev.product_id,
        article_id:    ev.article_id,
        product_name:  ev.product_name,
        category:      ev.category,
        sub_category:  ev.sub_category,
        gender:        ev.gender,
        thumbnail_url: ev.thumbnail_url,
        mrp_price:     ev.mrp_price,
        selling_price: ev.selling_price,
        views: 0, sizeSelections: 0, addToCart: 0, buyNow: 0, outOfStock: 0, wishlistAdds: 0, wishlistRemoves: 0,
        conversionRate: 0, cartRate: 0,
        sizeSelectionCounts: [], addToCartBySizes: [], buyNowBySizes: [], outOfStockBySizes: [],
        mostSelectedSize: undefined, leastSelectedSize: undefined, uniqueSizesCount: 0,
        devices: { mobile: 0, desktop: 0, tablet: 0, unknown: 0 },
        sourceCounts: new Map(), mediumCounts: new Map(), browserCounts: new Map(), osCounts: new Map(), campaignCounts: new Map(),
        avgScrollDepth: 0, avgTimeOnPage: 0, connectionTypeCounts: new Map(), darkModeUsers: 0, lightModeUsers: 0,
        lastInteraction: ev.event_timestamp,
        allEvents: [],
      });
    }

    const g = map.get(ev.product_id)!;
    g.allEvents.push(ev);

    // Update recency
    if (ev.event_timestamp > g.lastInteraction) g.lastInteraction = ev.event_timestamp;

    // Enrich product info from newer events (thumbnail may not exist on older rows)
    if (ev.thumbnail_url && !g.thumbnail_url) g.thumbnail_url = ev.thumbnail_url;
    if (ev.mrp_price    && !g.mrp_price)    g.mrp_price    = ev.mrp_price;
    if (ev.selling_price && !g.selling_price) g.selling_price = ev.selling_price;

    // Device (from top-level column, fallback to metadata)
    const meta = parseMetadata(ev.metadata);
    const dt   = ev.device_type ?? meta.device_type ?? 'unknown';
    if (dt === 'mobile' || dt === 'desktop' || dt === 'tablet') g.devices[dt]++;
    else g.devices.unknown++;

    // Traffic source (from top-level columns)
    if (ev.source) g.sourceCounts.set(ev.source, (g.sourceCounts.get(ev.source) ?? 0) + 1);
    if (ev.medium) g.mediumCounts.set(ev.medium, (g.mediumCounts.get(ev.medium) ?? 0) + 1);

    // Browser (from top-level column)
    if (ev.browser) g.browserCounts.set(ev.browser, (g.browserCounts.get(ev.browser) ?? 0) + 1);

    // OS (from top-level column)
    if (ev.operating_system) g.osCounts.set(ev.operating_system, (g.osCounts.get(ev.operating_system) ?? 0) + 1);

    // Campaign (from top-level column)
    if (ev.campaign) g.campaignCounts.set(ev.campaign, (g.campaignCounts.get(ev.campaign) ?? 0) + 1);

    // Session quality metrics (from metadata)
    if (meta.scroll_depth_at_event !== undefined) {
      g.avgScrollDepth += meta.scroll_depth_at_event;
    }
    if (meta.time_on_page_seconds !== undefined) {
      g.avgTimeOnPage += meta.time_on_page_seconds;
    }
    if (meta.connection_type) {
      g.connectionTypeCounts.set(meta.connection_type, (g.connectionTypeCounts.get(meta.connection_type) ?? 0) + 1);
    }
    if (meta.color_scheme === 'dark') g.darkModeUsers++;
    if (meta.color_scheme === 'light') g.lightModeUsers++;

    // Count by type
    switch (ev.event_type) {
      case 'view_product':         g.views++;         break;
      case 'size_selected':        g.sizeSelections++; break;
      case 'add_to_cart':          g.addToCart++;      break;
      case 'buy_now':              g.buyNow++;         break;
      case 'out_of_stock_click':   g.outOfStock++;     break;
      case 'wishlist':
        if (meta.wishlist_action === 'add') g.wishlistAdds++;
        if (meta.wishlist_action === 'remove') g.wishlistRemoves++;
        break;
    }
  }

  // Second pass: build size breakdown maps per product
  for (const g of map.values()) {
    const selMap = new Map<string, number>();
    const cartMap = new Map<string, number>();
    const buyMap  = new Map<string, number>();
    const oosMap  = new Map<string, number>();

    for (const ev of g.allEvents) {
      if (!ev.selected_size) continue;
      switch (ev.event_type) {
        case 'size_selected':       selMap.set(ev.selected_size,  (selMap.get(ev.selected_size)  ?? 0) + 1); break;
        case 'add_to_cart':        cartMap.set(ev.selected_size, (cartMap.get(ev.selected_size) ?? 0) + 1); break;
        case 'buy_now':             buyMap.set(ev.selected_size,  (buyMap.get(ev.selected_size)  ?? 0) + 1); break;
        case 'out_of_stock_click':  oosMap.set(ev.selected_size,  (oosMap.get(ev.selected_size)  ?? 0) + 1); break;
      }
    }

    g.sizeSelectionCounts = toSizeCountsSorted(selMap);
    g.addToCartBySizes    = toSizeCountsSorted(cartMap);
    g.buyNowBySizes       = toSizeCountsSorted(buyMap);
    g.outOfStockBySizes   = toSizeCountsSorted(oosMap);

    if (g.sizeSelectionCounts.length > 0) {
      g.mostSelectedSize  = g.sizeSelectionCounts[0].size;
      g.leastSelectedSize = g.sizeSelectionCounts[g.sizeSelectionCounts.length - 1].size;
      g.uniqueSizesCount  = g.sizeSelectionCounts.length;
    }

    // Conversion metrics
    g.conversionRate = g.views > 0 ? parseFloat(((g.buyNow  / g.views) * 100).toFixed(1)) : 0;
    g.cartRate       = g.views > 0 ? parseFloat(((g.addToCart / g.views) * 100).toFixed(1)) : 0;

    // Calculate average session quality metrics
    const totalEvents = g.allEvents.length;
    if (totalEvents > 0) {
      g.avgScrollDepth = Math.round(g.avgScrollDepth / totalEvents);
      g.avgTimeOnPage = Math.round(g.avgTimeOnPage / totalEvents);
    }
  }

  // Sort by total engagement descending
  return Array.from(map.values()).sort((a, b) =>
    (b.views + b.sizeSelections + b.addToCart + b.buyNow + b.outOfStock + b.wishlistAdds + b.wishlistRemoves) -
    (a.views + a.sizeSelections + a.addToCart + a.buyNow + a.outOfStock + a.wishlistAdds + a.wishlistRemoves)
  );
}

// ─── Small pure UI helpers ────────────────────────────────────────────────────

function fmtTime(iso: string) {
  return new Date(iso).toLocaleString('en-IN', {
    day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
  });
}

function DeviceBar({ d }: { d: DeviceBreakdown }) {
  const total = d.mobile + d.desktop + d.tablet + d.unknown;
  if (total === 0) return <span className="text-xs text-gray-400">—</span>;
  const pct = (n: number) => Math.round((n / total) * 100);
  return (
    <div className="flex items-center gap-2 flex-wrap">
      {d.mobile  > 0 && <span className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400"><Smartphone className="w-3 h-3"/>{pct(d.mobile)}%</span>}
      {d.desktop > 0 && <span className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400"><Monitor  className="w-3 h-3"/>{pct(d.desktop)}%</span>}
      {d.tablet  > 0 && <span className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400"><Tablet   className="w-3 h-3"/>{pct(d.tablet)}%</span>}
    </div>
  );
}

// Horizontal bar chip for size analytics
function SizeBar({ sc, max, color }: { sc: SizeCount; max: number; color: string }) {
  const pct = max > 0 ? Math.round((sc.count / max) * 100) : 0;
  return (
    <div className="flex items-center gap-2 min-w-0">
      <span className="text-xs font-mono font-semibold text-gray-700 dark:text-gray-300 w-7 shrink-0 text-right">{sc.size}</span>
      <div className="flex-1 h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs font-semibold text-gray-600 dark:text-gray-400 w-6 text-right shrink-0">{sc.count}</span>
    </div>
  );
}

function SizeGrid({ items, color, label }: { items: SizeCount[]; color: string; label: string }) {
  if (items.length === 0) return null;
  const max = items[0].count;
  return (
    <div>
      <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-1.5">{label}</p>
      <div className="space-y-1.5">
        {items.slice(0, 6).map(sc => (
          <SizeBar key={sc.size} sc={sc} max={max} color={color} />
        ))}
        {items.length > 6 && (
          <p className="text-[10px] text-gray-400 pl-9">+{items.length - 6} more</p>
        )}
      </div>
    </div>
  );
}

function StatPill({
  icon, label, value, sub, bg, text,
}: {
  icon: React.ReactNode; label: string; value: number | string; sub?: string;
  bg: string; text: string;
}) {
  return (
    <div className={`${bg} rounded-xl px-3 py-2.5 flex flex-col gap-0.5 min-w-0`}>
      <div className="flex items-center gap-1.5">
        {icon}
        <span className={`text-xl font-bold tabular-nums ${text}`}>{value}</span>
      </div>
      <p className={`text-[10px] font-semibold ${text} opacity-80`}>{label}</p>
      {sub && <p className="text-[9px] text-gray-400 dark:text-gray-500">{sub}</p>}
    </div>
  );
}

// ─── Product card ─────────────────────────────────────────────────────────────

function ProductCard({ g }: { g: ProductAnalyticsGroup }) {
  const [open, setOpen] = useState(false);

  const totalEngagement = g.views + g.sizeSelections + g.addToCart + g.buyNow + g.outOfStock + g.wishlistAdds + g.wishlistRemoves;
  const dominantDevice  = (['mobile','desktop','tablet','unknown'] as const).reduce(
    (best, k) => g.devices[k] > g.devices[best] ? k : best,
    'unknown' as keyof DeviceBreakdown,
  );

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-200">

      {/* ── Card header ───────────────────────────────────────────────────── */}
      <div className="flex items-start gap-4 p-4">
        {/* Thumbnail */}
        <div className="w-14 h-14 shrink-0 rounded-xl bg-gray-100 dark:bg-gray-700 overflow-hidden border border-gray-200 dark:border-gray-600">
          {g.thumbnail_url
            ? <img src={g.thumbnail_url} alt={g.product_name} className="w-full h-full object-cover" />
            : <div className="w-full h-full flex items-center justify-center"><Package className="w-5 h-5 text-gray-400"/></div>
          }
        </div>

        {/* Product info */}
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-bold text-gray-900 dark:text-white leading-snug truncate">{g.product_name}</h3>
          <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1">
            {g.article_id   && <span className="text-[10px] font-mono text-gray-400">{g.article_id}</span>}
            {g.category     && <span className="text-[10px] text-gray-400">{g.category}</span>}
            {g.sub_category && <span className="text-[10px] text-gray-400">{g.sub_category}</span>}
            {g.gender       && <span className="text-[10px] text-gray-400 capitalize">{g.gender}</span>}
          </div>
          {(g.mrp_price || g.selling_price) && (
            <div className="flex items-baseline gap-2 mt-1">
              {g.selling_price && <span className="text-sm font-bold text-gray-800 dark:text-gray-200">₹{g.selling_price}</span>}
              {g.mrp_price && g.selling_price && g.mrp_price > g.selling_price && (
                <span className="text-xs text-gray-400 line-through">₹{g.mrp_price}</span>
              )}
            </div>
          )}
        </div>

        {/* Top-right: last interaction + expand toggle */}
        <div className="flex flex-col items-end gap-2 shrink-0">
          <button
            onClick={() => setOpen(v => !v)}
            className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
            aria-label={open ? 'Collapse' : 'Expand'}
          >
            {open ? <ChevronUp className="w-4 h-4"/> : <ChevronDown className="w-4 h-4"/>}
          </button>
          <div className="flex items-center gap-1 text-[10px] text-gray-400">
            <Clock className="w-3 h-3"/>
            {fmtTime(g.lastInteraction)}
          </div>
        </div>
      </div>

      {/* ── Stats row ─────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 px-4 pb-3">
        <StatPill icon={<Eye className="w-3.5 h-3.5 text-blue-500"/>}   label="Views"      value={g.views}         bg="bg-blue-50 dark:bg-blue-900/20"   text="text-blue-600 dark:text-blue-400"/>
        <StatPill icon={<Ruler className="w-3.5 h-3.5 text-violet-500"/>} label="Sizes"    value={g.sizeSelections} bg="bg-violet-50 dark:bg-violet-900/20" text="text-violet-600 dark:text-violet-400"/>
        <StatPill icon={<ShoppingCart className="w-3.5 h-3.5 text-emerald-500"/>} label="Cart" value={g.addToCart}  bg="bg-emerald-50 dark:bg-emerald-900/20" text="text-emerald-600 dark:text-emerald-400" sub={g.cartRate > 0 ? `${g.cartRate}% rate` : undefined}/>
        <StatPill icon={<Zap className="w-3.5 h-3.5 text-amber-500"/>}  label="Buy Now"    value={g.buyNow}        bg="bg-amber-50 dark:bg-amber-900/20"    text="text-amber-600 dark:text-amber-400"   sub={g.conversionRate > 0 ? `${g.conversionRate}% cvr` : undefined}/>
        <StatPill icon={<AlertCircle className="w-3.5 h-3.5 text-rose-500"/>} label="OOS"  value={g.outOfStock}    bg="bg-rose-50 dark:bg-rose-900/20"     text="text-rose-600 dark:text-rose-400"/>
        {(g.wishlistAdds > 0 || g.wishlistRemoves > 0) && (
          <StatPill icon={<Package className="w-3.5 h-3.5 text-pink-500"/>} label="Wish" value={g.wishlistAdds} bg="bg-pink-50 dark:bg-pink-900/20" text="text-pink-600 dark:text-pink-400" sub={g.wishlistRemoves > 0 ? `${g.wishlistRemoves} rem` : undefined}/>
        )}
      </div>

      {/* ── Size insight strip (always visible when there's size data) ───── */}
      {g.sizeSelectionCounts.length > 0 && (
        <div className="mx-4 mb-3 px-3 py-2.5 bg-gray-50 dark:bg-gray-700/50 rounded-xl border border-gray-100 dark:border-gray-700">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Size Demand</span>
            <span className="text-[10px] text-gray-400">{g.uniqueSizesCount} size{g.uniqueSizesCount !== 1 ? 's' : ''}</span>
            {g.mostSelectedSize  && <span className="px-1.5 py-0.5 bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300 text-[10px] font-semibold rounded-md">🔥 {g.mostSelectedSize}</span>}
            {g.leastSelectedSize && g.leastSelectedSize !== g.mostSelectedSize && (
              <span className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 text-[10px] rounded-md">Low: {g.leastSelectedSize}</span>
            )}
          </div>
          {/* Size chips */}
          <div className="flex flex-wrap gap-1.5">
            {g.sizeSelectionCounts.map((sc, i) => {
              const max  = g.sizeSelectionCounts[0].count;
              const heat = sc.count / max; // 0-1
              const bg   = heat > 0.7 ? 'bg-violet-600 text-white'
                         : heat > 0.4 ? 'bg-violet-200 dark:bg-violet-800 text-violet-800 dark:text-violet-200'
                         :              'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400';
              return (
                <span key={sc.size} className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-semibold ${bg}`}>
                  {sc.size}
                  <span className="opacity-70">{sc.count}</span>
                </span>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Expanded detail panel ─────────────────────────────────────────── */}
      {open && (
        <div className="border-t border-gray-100 dark:border-gray-700 px-4 pt-4 pb-5 space-y-5">

          {/* Conversion metrics row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="text-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
              <p className="text-lg font-bold text-gray-800 dark:text-gray-200">{totalEngagement}</p>
              <p className="text-[10px] text-gray-400 uppercase tracking-wider">Total Events</p>
            </div>
            <div className="text-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
              <p className="text-lg font-bold text-amber-600 dark:text-amber-400">{g.conversionRate}%</p>
              <p className="text-[10px] text-gray-400 uppercase tracking-wider">Buy Conversion</p>
            </div>
            <div className="text-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
              <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">{g.cartRate}%</p>
              <p className="text-[10px] text-gray-400 uppercase tracking-wider">Cart Rate</p>
            </div>
            <div className="text-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
              <DeviceBar d={g.devices}/>
              <p className="text-[10px] text-gray-400 uppercase tracking-wider mt-1">Devices</p>
            </div>
          </div>

          {/* Size analytics — 4 event types */}
          {(g.sizeSelectionCounts.length + g.addToCartBySizes.length + g.buyNowBySizes.length + g.outOfStockBySizes.length) > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <BarChart2 className="w-4 h-4 text-gray-400"/>
                <h4 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">Size Analytics</h4>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <SizeGrid items={g.sizeSelectionCounts} color="bg-violet-500" label="Size Selected"/>
                <SizeGrid items={g.addToCartBySizes}    color="bg-emerald-500" label="Add to Cart"/>
                <SizeGrid items={g.buyNowBySizes}       color="bg-amber-500"   label="Buy Now"/>
                <SizeGrid items={g.outOfStockBySizes}   color="bg-rose-500"    label="Out of Stock"/>
              </div>
            </div>
          )}

          {/* Traffic Sources */}
          {g.sourceCounts.size > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp className="w-4 h-4 text-gray-400"/>
                <h4 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">Traffic Sources</h4>
              </div>
              <div className="space-y-2">
                {Array.from(g.sourceCounts.entries())
                  .sort((a, b) => b[1] - a[1])
                  .slice(0, 5)
                  .map(([source, count]) => {
                    const total = Array.from(g.sourceCounts.values()).reduce((sum, c) => sum + c, 0);
                    const pct = total > 0 ? Math.round((count / total) * 100) : 0;
                    return (
                      <div key={source} className="flex items-center gap-2">
                        <span className="text-xs font-medium text-gray-700 dark:text-gray-300 w-24 truncate">{source}</span>
                        <div className="flex-1 h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                          <div className="h-full bg-gray-400 dark:bg-gray-500 rounded-full" style={{ width: `${pct}%` }} />
                        </div>
                        <span className="text-xs font-semibold text-gray-600 dark:text-gray-400 w-12 text-right">{count}</span>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}

          {/* Browser & OS */}
          {(g.browserCounts.size > 0 || g.osCounts.size > 0) && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Monitor className="w-4 h-4 text-gray-400"/>
                <h4 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">Browser & OS</h4>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {g.browserCounts.size > 0 && (
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">Top Browsers</p>
                    <div className="flex flex-wrap gap-1.5">
                      {Array.from(g.browserCounts.entries())
                        .sort((a, b) => b[1] - a[1])
                        .slice(0, 4)
                        .map(([browser, count]) => {
                          const total = Array.from(g.browserCounts.values()).reduce((sum, c) => sum + c, 0);
                          const pct = total > 0 ? Math.round((count / total) * 100) : 0;
                          return (
                            <span key={browser} className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs rounded-md">
                              {browser} {pct}%
                            </span>
                          );
                        })}
                    </div>
                  </div>
                )}
                {g.osCounts.size > 0 && (
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">Operating Systems</p>
                    <div className="flex flex-wrap gap-1.5">
                      {Array.from(g.osCounts.entries())
                        .sort((a, b) => b[1] - a[1])
                        .slice(0, 4)
                        .map(([os, count]) => {
                          const total = Array.from(g.osCounts.values()).reduce((sum, c) => sum + c, 0);
                          const pct = total > 0 ? Math.round((count / total) * 100) : 0;
                          return (
                            <span key={os} className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs rounded-md">
                              {os} {pct}%
                            </span>
                          );
                        })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Wishlist */}
          {(g.wishlistAdds > 0 || g.wishlistRemoves > 0) && (
            <div className="p-3 bg-pink-50 dark:bg-pink-900/20 rounded-xl border border-pink-100 dark:border-pink-900/40">
              <div className="flex items-center gap-2 mb-2">
                <Package className="w-4 h-4 text-pink-500"/>
                <h4 className="text-xs font-bold text-pink-700 dark:text-pink-300 uppercase tracking-widest">Wishlist</h4>
              </div>
              <p className="text-sm text-pink-700 dark:text-pink-300">
                Wishlisted: {g.wishlistAdds} adds · {g.wishlistRemoves} removes
              </p>
            </div>
          )}

          {/* Campaigns */}
          {g.campaignCounts.size > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <BarChart2 className="w-4 h-4 text-gray-400"/>
                <h4 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">Campaigns</h4>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {Array.from(g.campaignCounts.entries())
                  .sort((a, b) => b[1] - a[1])
                  .map(([campaign, count]) => (
                    <span key={campaign} className="px-2 py-0.5 bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 text-xs rounded-md">
                      {campaign}: {count}
                    </span>
                  ))}
              </div>
            </div>
          )}

          {/* Session Quality */}
          {(g.avgScrollDepth > 0 || g.avgTimeOnPage > 0 || g.connectionTypeCounts.size > 0) && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Smartphone className="w-4 h-4 text-gray-400"/>
                <h4 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">Session Quality</h4>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {g.avgScrollDepth > 0 && (
                  <div className="text-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                    <p className="text-lg font-bold text-gray-800 dark:text-gray-200">{g.avgScrollDepth}%</p>
                    <p className="text-[10px] text-gray-400 uppercase tracking-wider">Avg Scroll Depth</p>
                  </div>
                )}
                {g.avgTimeOnPage > 0 && (
                  <div className="text-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                    <p className="text-lg font-bold text-gray-800 dark:text-gray-200">{g.avgTimeOnPage}s</p>
                    <p className="text-[10px] text-gray-400 uppercase tracking-wider">Avg Time on Page</p>
                  </div>
                )}
                {g.connectionTypeCounts.size > 0 && (
                  <div className="text-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                    <p className="text-sm font-bold text-gray-800 dark:text-gray-200">
                      {Array.from(g.connectionTypeCounts.entries())
                        .sort((a, b) => b[1] - a[1])
                        .slice(0, 2)
                        .map(([type, count]) => {
                          const total = Array.from(g.connectionTypeCounts.values()).reduce((sum, c) => sum + c, 0);
                          const pct = total > 0 ? Math.round((count / total) * 100) : 0;
                          return `${type.toUpperCase()} ${pct}%`;
                        })
                        .join(' · ')}
                    </p>
                    <p className="text-[10px] text-gray-400 uppercase tracking-wider">Connection</p>
                  </div>
                )}
                {(g.darkModeUsers > 0 || g.lightModeUsers > 0) && (
                  <div className="text-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                    <p className="text-sm font-bold text-gray-800 dark:text-gray-200">
                      Dark: {g.darkModeUsers} · Light: {g.lightModeUsers}
                    </p>
                    <p className="text-[10px] text-gray-400 uppercase tracking-wider">Color Mode</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Recent raw events */}
          <div>
            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Recent Events</h4>
            <div className="space-y-1.5 max-h-52 overflow-y-auto pr-1">
              {g.allEvents.slice(0, 20).map(ev => {
                const meta = parseMetadata(ev.metadata);
                return (
                  <div key={ev.event_id} className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-700/40 rounded-lg px-2.5 py-1.5">
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold shrink-0 ${EVENT_BADGE[ev.event_type]}`}>
                      {EVENT_SHORT[ev.event_type]}
                    </span>
                    {ev.selected_size && <span className="font-mono font-bold text-gray-700 dark:text-gray-300">sz {ev.selected_size}</span>}
                    <span className="flex-1 truncate">{ev.user_id ? <><User className="w-3 h-3 inline mr-0.5"/>{ev.user_id.slice(0,8)}</> : 'Guest'}</span>
                    {meta.device_type === 'mobile' ? <Smartphone className="w-3 h-3 shrink-0"/> : meta.device_type === 'tablet' ? <Tablet className="w-3 h-3 shrink-0"/> : <Monitor className="w-3 h-3 shrink-0"/>}
                    <span className="shrink-0 whitespace-nowrap">{fmtTime(ev.event_timestamp)}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const EVENT_BADGE: Record<string, string> = {
  view_product:       'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  size_selected:      'bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300',
  add_to_cart:        'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
  buy_now:            'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  out_of_stock_click: 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300',
  wishlist:          'bg-pink-100 text-pink-700 dark:bg-pink-900/40 dark:text-pink-300',
};

const EVENT_SHORT: Record<string, string> = {
  view_product:       'VIEW',
  size_selected:      'SIZE',
  add_to_cart:        'CART',
  buy_now:            'BUY',
  out_of_stock_click: 'OOS',
  wishlist:          'WISH',
};

// ─── Main widget ──────────────────────────────────────────────────────────────

const ProductEventsWidget: React.FC = () => {
  const [events,           setEvents]          = useState<ProductEvent[]>([]);
  const [loading,          setLoading]         = useState(true);
  const [error,            setError]           = useState<string | null>(null);
  const [filter,           setFilter]          = useState<'all' | ProductEvent['event_type']>('all');
  const [isTableCollapsed, setIsTableCollapsed]= useState(false);

  useEffect(() => { fetchEvents(); }, []);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      setError(null);
      const { data, error } = await supabase
        .from('product_user_events')
        .select('*')
        .order('event_timestamp', { ascending: false })
        .limit(500); // increased limit for richer analytics
      if (error) throw error;
      setEvents(data || []);
    } catch (err) {
      console.error('Error fetching product events:', err);
      setError('Failed to load events');
    } finally {
      setLoading(false);
    }
  };

  // ── Derived counts ─────────────────────────────────────────────────────────
  const eventCounts = useMemo(() => ({
    all:               events.length,
    view_product:      events.filter(e => e.event_type === 'view_product').length,
    size_selected:     events.filter(e => e.event_type === 'size_selected').length,
    add_to_cart:       events.filter(e => e.event_type === 'add_to_cart').length,
    buy_now:           events.filter(e => e.event_type === 'buy_now').length,
    out_of_stock_click:events.filter(e => e.event_type === 'out_of_stock_click').length,
  }), [events]);

  // ── Filtered + grouped ─────────────────────────────────────────────────────
  const filteredEvents = useMemo(
    () => filter === 'all' ? events : events.filter(e => e.event_type === filter),
    [events, filter],
  );

  const analyticsGroups = useMemo(
    () => buildAnalyticsGroups(filteredEvents),
    [filteredEvents],
  );

  // ── Loading ────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-1/3"/>
          {[1,2,3].map(i => (
            <div key={i} className="h-28 bg-gray-100 dark:bg-gray-700 rounded-2xl"/>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow p-6 text-center py-12">
        <AlertCircle className="w-10 h-10 text-rose-400 mx-auto mb-3"/>
        <p className="text-sm text-rose-500">{error}</p>
        <button onClick={fetchEvents} className="mt-4 flex items-center gap-2 mx-auto px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg text-sm hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
          <RefreshCw className="w-4 h-4"/> Retry
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-700 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h2 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-blue-500"/>
            Product Analytics
          </h2>
          <p className="text-xs text-gray-400 mt-0.5">{analyticsGroups.length} products · {eventCounts.all} events</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsTableCollapsed(v => !v)}
            className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
          >
            {isTableCollapsed ? <ChevronDown className="w-3.5 h-3.5"/> : <ChevronUp className="w-3.5 h-3.5"/>}
            {isTableCollapsed ? 'Show' : 'Hide'}
          </button>
          <button onClick={fetchEvents} className="p-1.5 rounded-lg border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors">
            <RefreshCw className="w-3.5 h-3.5"/>
          </button>
          <div className="flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-gray-400"/>
            <select
              value={filter}
              onChange={e => setFilter(e.target.value as typeof filter)}
              className="px-2.5 py-1.5 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All ({eventCounts.all})</option>
              <option value="view_product">Views ({eventCounts.view_product})</option>
              <option value="size_selected">Sizes ({eventCounts.size_selected})</option>
              <option value="add_to_cart">Cart ({eventCounts.add_to_cart})</option>
              <option value="buy_now">Buy Now ({eventCounts.buy_now})</option>
              <option value="out_of_stock_click">OOS ({eventCounts.out_of_stock_click})</option>
            </select>
          </div>
        </div>
      </div>

      {/* ── Summary stat bar ────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 px-5 py-3 border-b border-gray-100 dark:border-gray-700">
        {[
          { icon: <Eye className="w-3.5 h-3.5 text-blue-500"/>,   label:'Views',    val: eventCounts.view_product,       bg:'bg-blue-50 dark:bg-blue-900/20',    t:'text-blue-600 dark:text-blue-400' },
          { icon: <Ruler className="w-3.5 h-3.5 text-violet-500"/>, label:'Sizes',  val: eventCounts.size_selected,      bg:'bg-violet-50 dark:bg-violet-900/20', t:'text-violet-600 dark:text-violet-400' },
          { icon: <ShoppingCart className="w-3.5 h-3.5 text-emerald-500"/>, label:'Cart', val: eventCounts.add_to_cart,  bg:'bg-emerald-50 dark:bg-emerald-900/20', t:'text-emerald-600 dark:text-emerald-400' },
          { icon: <Zap className="w-3.5 h-3.5 text-amber-500"/>,  label:'Buy Now',  val: eventCounts.buy_now,            bg:'bg-amber-50 dark:bg-amber-900/20',   t:'text-amber-600 dark:text-amber-400' },
          { icon: <AlertCircle className="w-3.5 h-3.5 text-rose-500"/>, label:'OOS', val: eventCounts.out_of_stock_click, bg:'bg-rose-50 dark:bg-rose-900/20',   t:'text-rose-600 dark:text-rose-400' },
          { icon: <Package className="w-3.5 h-3.5 text-gray-400"/>, label:'Total',  val: eventCounts.all,                bg:'bg-gray-50 dark:bg-gray-700',        t:'text-gray-600 dark:text-gray-400' },
        ].map(s => (
          <div key={s.label} className={`${s.bg} rounded-xl px-3 py-2.5`}>
            <div className="flex items-center gap-1.5">{s.icon}<span className={`text-lg font-bold ${s.t}`}>{s.val}</span></div>
            <p className={`text-[10px] font-semibold ${s.t} opacity-75 mt-0.5`}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* ── Product cards ────────────────────────────────────────────────────── */}
      {!isTableCollapsed && (
        <div className="p-4 space-y-3">
          {analyticsGroups.length === 0 ? (
            <div className="py-16 text-center text-gray-400 dark:text-gray-500">
              <Package className="w-10 h-10 mx-auto mb-3 opacity-40"/>
              <p className="text-sm">No events match this filter</p>
            </div>
          ) : (
            analyticsGroups.map(g => <ProductCard key={g.product_id} g={g}/>)
          )}

          <p className="text-center text-[11px] text-gray-400 pt-1">
            {analyticsGroups.length} products · {filteredEvents.length} events
          </p>
        </div>
      )}
    </div>
  );
};

export default ProductEventsWidget;
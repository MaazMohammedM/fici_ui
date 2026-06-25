// scripts/generate-sitemap.ts
// Dynamic sitemap generator for FICI Shoes
import { createClient } from '@supabase/supabase-js';
import { writeFileSync } from 'fs';
import { join } from 'path';

interface SitemapEntry {
  url: string;
  lastmod: string;
  changefreq: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  priority: number;
}

const BASE_URL = 'https://www.ficishoes.com';

// Static pages with their priorities and change frequencies
const staticPages: SitemapEntry[] = [
  { url: '/', lastmod: new Date().toISOString(), changefreq: 'daily', priority: 1.0 },
  { url: '/about', lastmod: new Date().toISOString(), changefreq: 'monthly', priority: 0.8 },
  { url: '/contact', lastmod: new Date().toISOString(), changefreq: 'monthly', priority: 0.7 },
  { url: '/products', lastmod: new Date().toISOString(), changefreq: 'daily', priority: 0.9 },
  { url: '/shoe-care', lastmod: new Date().toISOString(), changefreq: 'monthly', priority: 0.6 },
  { url: '/ambur-leather-excellence', lastmod: new Date().toISOString(), changefreq: 'monthly', priority: 0.6 },
  { url: '/faq', lastmod: new Date().toISOString(), changefreq: 'weekly', priority: 0.7 },
  { url: '/privacy', lastmod: new Date().toISOString(), changefreq: 'yearly', priority: 0.3 },
  { url: '/terms', lastmod: new Date().toISOString(), changefreq: 'yearly', priority: 0.3 },
  { url: '/shipping', lastmod: new Date().toISOString(), changefreq: 'yearly', priority: 0.3 },
];

function generateSitemapXML(entries: SitemapEntry[]): string {
  const xmlHeader = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`;

  const xmlEntries = entries
    .map(entry => `  <url>
    <loc>${BASE_URL}${entry.url}</loc>
    <lastmod>${entry.lastmod}</lastmod>
    <changefreq>${entry.changefreq}</changefreq>
    <priority>${entry.priority}</priority>
  </url>`)
    .join('\n');

  const xmlFooter = `</urlset>`;

  return `${xmlHeader}\n${xmlEntries}\n${xmlFooter}`;
}

async function fetchProducts(): Promise<SitemapEntry[]> {
  try {
    // Get Supabase credentials from environment variables
    const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
    const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      console.warn('Supabase credentials not found, skipping product pages');
      return [];
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    const { data: products, error } = await supabase
      .from('products')
      .select('article_id, updated_at');

    if (error) {
      console.error('Error fetching products:', error);
      return [];
    }

    return (products || []).map(product => ({
      url: `/products/${product.article_id}`,
      lastmod: product.updated_at || new Date().toISOString(),
      changefreq: 'weekly' as const,
      priority: 0.8,
    }));
  } catch (error) {
    console.error('Error fetching products for sitemap:', error);
    return [];
  }
}

async function generateSitemap() {
  console.log('Generating sitemap...');

  // Fetch dynamic product pages
  const productEntries = await fetchProducts();

  // Combine static and dynamic entries
  const allEntries = [...staticPages, ...productEntries];

  // Generate XML
  const sitemapXML = generateSitemapXML(allEntries);

  // Write to public directory
  const outputPath = join(process.cwd(), 'public', 'sitemap.xml');
  writeFileSync(outputPath, sitemapXML, 'utf-8');

  console.log(`Sitemap generated successfully at ${outputPath}`);
  console.log(`Total URLs: ${allEntries.length}`);
}

// Run the generator
generateSitemap().catch(console.error);

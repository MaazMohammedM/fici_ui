import { createClient } from '@supabase/supabase-js';
import { writeFileSync } from 'fs';
import path from 'path';

// Supabase configuration
const supabaseUrl = 'https://qegaebazravcwofibtry.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFlZ2FlYmF6cmF2Y3dvZmlidHJ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM5ODE4NzksImV4cCI6MjA2OTU1Nzg3OX0.YKP1oM0WIWzuaa47S6OTVEitBalCNqBQxgoLw0yiUg0';
const supabase = createClient(supabaseUrl, supabaseKey);

const SITE_URL = 'https://www.ficishoes.com';

// Static routes
const staticRoutes = [
  '',
  '/contact',
  '/about',
  '/products',
  '/shoe-care',
  '/ambur-leather-excellence',
  '/faq',
  '/privacy',
  '/terms',
  '/shipping'
];

async function generateSitemap() {
  try {
    const urls = [];

    // Add static routes
    staticRoutes.forEach(route => {
      urls.push({
        loc: `${SITE_URL}${route}`,
        lastmod: new Date().toISOString(),
        changefreq: 'weekly',
        priority: route === '' ? 1.0 : 0.8
      });
    });

    // Fetch products from Supabase
    const { data: products, error } = await supabase
      .from('products')
      .select('article_id, updated_at');

    if (error) {
      console.error('Error fetching products:', error);
    } else if (products) {
      // Add product routes
      products.forEach(product => {
        urls.push({
          loc: `${SITE_URL}/products/${product.article_id}`,
          lastmod: product.updated_at || new Date().toISOString(),
          changefreq: 'weekly',
          priority: 0.7
        });
      });
    }

    // Generate XML sitemap
    const xml = generateXML(urls);

    // Write to public directory
    const outputPath = path.join(process.cwd(), 'public', 'sitemap.xml');
    writeFileSync(outputPath, xml);
    console.log('Sitemap generated successfully at:', outputPath);
  } catch (error) {
    console.error('Error generating sitemap:', error);
    process.exit(1);
  }
}

function generateXML(urls) {
  const xmlHeader = '<?xml version="1.0" encoding="UTF-8"?>\n';
  const urlsetStart = '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
  const urlsetEnd = '</urlset>';

  const urlElements = urls.map(url => {
    return `  <url>
    <loc>${url.loc}</loc>
    <lastmod>${url.lastmod}</lastmod>
    <changefreq>${url.changefreq}</changefreq>
    <priority>${url.priority}</priority>
  </url>`;
  }).join('\n');

  return xmlHeader + urlsetStart + urlElements + '\n' + urlsetEnd;
}

generateSitemap();

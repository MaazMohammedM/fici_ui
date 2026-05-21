import React from 'react';
import { Helmet } from 'react-helmet-async';

interface SEOHeadProps {
  title?: string;
  description?: string;
  keywords?: string;
  image?: string;
  url?: string;
  type?: 'website' | 'product' | 'article';
  price?: string;
  currency?: string;
  availability?: 'in stock' | 'out of stock';
  noIndex?: boolean;
}

const SEOHead: React.FC<SEOHeadProps> = ({
  title = '',
  description = 'Discover premium leather shoes, sandals, and accessories. Handcrafted quality with modern style. Free shipping on orders above ₹999.',
  keywords = 'leather shoes, premium footwear, handcrafted shoes, men shoes, women shoes, sandals, boots',
  image = '/og-image.jpg',
  url = window.location.href,
  type = 'website',
  price,
  currency = 'INR',
  availability = 'in stock',
  noIndex = false
}) => {
  const siteName = 'FiCi Shoes';
  const fullTitle = title.includes(siteName) ? title : `${title} ${siteName}`;
  
  // Fix canonical URL: ensure HTTPS and non-WWW
  const canonicalUrl = url
    .replace(/^http:/, 'https:')
    .replace(/^https?:\/\/www\./, 'https://')
    .split('?')[0]; // Remove query parameters for canonical

  return (
    <Helmet>
      {/* Basic Meta Tags */}
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      <meta name="author" content="FICI Shoes" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <link rel="canonical" href={canonicalUrl} />
      <meta name="robots" content={noIndex ? "noindex, nofollow" : "index, follow"} />

      {/* Open Graph Tags */}
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:type" content={type} />
      <meta property="og:site_name" content={siteName} />
      <meta property="og:locale" content="en_IN" />

      {/* Twitter Card Tags */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />

      {/* Product-specific Schema */}
      {type === 'product' && price && (
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org/",
            "@type": "Product",
            "name": title,
            "description": description,
            "image": image,
            "offers": {
              "@type": "Offer",
              "price": price,
              "priceCurrency": currency,
              "availability": `https://schema.org/${availability === 'in stock' ? 'InStock' : 'OutOfStock'}`,
              "seller": {
                "@type": "Organization",
                "name": siteName
              }
            },
            "brand": {
              "@type": "Brand",
              "name": siteName
            }
          })}
        </script>
      )}

      {/* Website Schema */}
      {type === 'website' && (
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebSite",
            "name": siteName,
            "description": description,
            "url": canonicalUrl,
            "potentialAction": {
              "@type": "SearchAction",
              "target": `${canonicalUrl}/search?q={search_term_string}`,
              "query-input": "required name=search_term_string"
            }
          })}
        </script>
      )}

      {/* Performance and Security */}
      <meta httpEquiv="X-Content-Type-Options" content="nosniff" />
      {/* Note: X-Frame-Options must be set via HTTP header, not meta */}
      <meta httpEquiv="X-XSS-Protection" content="1; mode=block" />
      
      {/* Preconnect to external domains */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
    </Helmet>
  );
};

export default SEOHead;

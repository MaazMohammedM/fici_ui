import React from 'react';

interface SEOHeadProps {
  title?: string;
  description?: string;
  keywords?: string[];
  image?: string;
  url?: string;
  type?: 'website' | 'product' | 'article';
  siteName?: string;
  author?: string;
  publishedTime?: string;
  modifiedTime?: string;
  price?: {
    amount: string;
    currency: string;
  };
  availability?: 'in stock' | 'out of stock' | 'preorder';
  brand?: string;
  category?: string;
  noIndex?: boolean;
  noFollow?: boolean;
}

const SEOHead: React.FC<SEOHeadProps> = ({
  title = 'FICI - Premium Footwear Collection',
  description = 'Discover premium quality footwear at FICI. Shop the latest collection of shoes, sneakers, and boots with fast delivery and easy returns.',
  keywords = ['shoes', 'footwear', 'sneakers', 'boots', 'fashion', 'premium', 'FICI'],
  image = '/og-image.jpg',
  url,
  type = 'website',
  siteName = 'FICI',
  author = 'FICI Team',
  publishedTime,
  modifiedTime,
  price,
  availability,
  brand,
  category,
  noIndex = false,
  noFollow = false
}) => {
  const currentUrl = url || (typeof window !== 'undefined' ? window.location.href : '');
  const fullImageUrl = image.startsWith('http') ? image : `${typeof window !== 'undefined' ? window.location.origin : ''}${image}`;

  const structuredData = {
    "@context": "https://schema.org",
    "@type": type === 'product' ? 'Product' : 'WebSite',
    "name": title,
    "description": description,
    "url": currentUrl,
    "image": fullImageUrl,
    ...(type === 'product' && {
      "brand": {
        "@type": "Brand",
        "name": brand || siteName
      },
      "category": category,
      ...(price && {
        "offers": {
          "@type": "Offer",
          "price": price.amount,
          "priceCurrency": price.currency,
          "availability": `https://schema.org/${availability === 'in stock' ? 'InStock' : availability === 'out of stock' ? 'OutOfStock' : 'PreOrder'}`
        }
      })
    }),
    ...(type === 'website' && {
      "potentialAction": {
        "@type": "SearchAction",
        "target": `${currentUrl}/products?search={search_term_string}`,
        "query-input": "required name=search_term_string"
      }
    })
  };

  const robotsContent = [
    noIndex ? 'noindex' : 'index',
    noFollow ? 'nofollow' : 'follow'
  ].join(', ');

  return (
    <>
      {/* Basic Meta Tags */}
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords.join(', ')} />
      <meta name="author" content={author} />
      <meta name="robots" content={robotsContent} />
      <link rel="canonical" href={currentUrl} />

      {/* Open Graph Meta Tags */}
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={fullImageUrl} />
      <meta property="og:url" content={currentUrl} />
      <meta property="og:type" content={type} />
      <meta property="og:site_name" content={siteName} />
      {publishedTime && <meta property="article:published_time" content={publishedTime} />}
      {modifiedTime && <meta property="article:modified_time" content={modifiedTime} />}

      {/* Twitter Card Meta Tags */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={fullImageUrl} />

      {/* Product-specific Meta Tags */}
      {type === 'product' && price && (
        <>
          <meta property="product:price:amount" content={price.amount} />
          <meta property="product:price:currency" content={price.currency} />
        </>
      )}
      {availability && <meta property="product:availability" content={availability} />}
      {brand && <meta property="product:brand" content={brand} />}
      {category && <meta property="product:category" content={category} />}

      {/* Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(structuredData)
        }}
      />

      {/* Additional SEO Meta Tags */}
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <meta httpEquiv="Content-Type" content="text/html; charset=utf-8" />
      <meta name="language" content="English" />
      <meta name="revisit-after" content="7 days" />
      <meta name="distribution" content="global" />
      <meta name="rating" content="general" />

      {/* Favicon and Icons */}
      <link rel="icon" type="image/x-icon" href="/favicon.ico" />
      <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
      <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
      <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
      <link rel="manifest" href="/site.webmanifest" />
      <meta name="theme-color" content="#000000" />
    </>
  );
};

export default SEOHead;

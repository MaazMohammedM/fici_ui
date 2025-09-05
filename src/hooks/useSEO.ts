import { useEffect } from 'react';

interface SEOData {
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

export const useSEO = (seoData: SEOData) => {
  useEffect(() => {
    const {
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
    } = seoData;

    const currentUrl = url || window.location.href;
    const fullImageUrl = image.startsWith('http') ? image : `${window.location.origin}${image}`;

    // Update document title
    document.title = title;

    // Helper function to update or create meta tag
    const updateMetaTag = (name: string, content: string, property?: boolean) => {
      const selector = property ? `meta[property="${name}"]` : `meta[name="${name}"]`;
      let meta = document.querySelector(selector) as HTMLMetaElement;
      
      if (!meta) {
        meta = document.createElement('meta');
        if (property) {
          meta.setAttribute('property', name);
        } else {
          meta.setAttribute('name', name);
        }
        document.head.appendChild(meta);
      }
      
      meta.setAttribute('content', content);
    };

    // Update basic meta tags
    updateMetaTag('description', description);
    updateMetaTag('keywords', keywords.join(', '));
    updateMetaTag('author', author);
    updateMetaTag('robots', [
      noIndex ? 'noindex' : 'index',
      noFollow ? 'nofollow' : 'follow'
    ].join(', '));

    // Update canonical link
    let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.setAttribute('rel', 'canonical');
      document.head.appendChild(canonical);
    }
    canonical.setAttribute('href', currentUrl);

    // Update Open Graph meta tags
    updateMetaTag('og:title', title, true);
    updateMetaTag('og:description', description, true);
    updateMetaTag('og:image', fullImageUrl, true);
    updateMetaTag('og:url', currentUrl, true);
    updateMetaTag('og:type', type, true);
    updateMetaTag('og:site_name', siteName, true);

    if (publishedTime) {
      updateMetaTag('article:published_time', publishedTime, true);
    }
    if (modifiedTime) {
      updateMetaTag('article:modified_time', modifiedTime, true);
    }

    // Update Twitter Card meta tags
    updateMetaTag('twitter:card', 'summary_large_image');
    updateMetaTag('twitter:title', title);
    updateMetaTag('twitter:description', description);
    updateMetaTag('twitter:image', fullImageUrl);

    // Update product-specific meta tags
    if (type === 'product' && price) {
      updateMetaTag('product:price:amount', price.amount, true);
      updateMetaTag('product:price:currency', price.currency, true);
    }
    if (availability) {
      updateMetaTag('product:availability', availability, true);
    }
    if (brand) {
      updateMetaTag('product:brand', brand, true);
    }
    if (category) {
      updateMetaTag('product:category', category, true);
    }

    // Update structured data
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

    // Update or create structured data script
    let structuredDataScript = document.querySelector('script[type="application/ld+json"]');
    if (!structuredDataScript) {
      structuredDataScript = document.createElement('script');
      structuredDataScript.setAttribute('type', 'application/ld+json');
      document.head.appendChild(structuredDataScript);
    }
    structuredDataScript.textContent = JSON.stringify(structuredData);

  }, [seoData]);
};

// Predefined SEO configurations for common pages
export const SEOConfigs = {
  home: {
    title: 'FICI - Premium Footwear Collection | Shop Latest Shoes & Sneakers',
    description: 'Discover premium quality footwear at FICI. Shop the latest collection of shoes, sneakers, and boots with fast delivery and easy returns. Free shipping on orders over ₹999.',
    keywords: ['shoes', 'footwear', 'sneakers', 'boots', 'fashion', 'premium', 'FICI', 'online shopping', 'free shipping'],
    type: 'website' as const
  },
  
  products: {
    title: 'All Products - FICI Footwear Collection',
    description: 'Browse our complete collection of premium footwear. Find the perfect shoes, sneakers, and boots for every occasion. Quality guaranteed.',
    keywords: ['shoes collection', 'footwear catalog', 'sneakers', 'boots', 'men shoes', 'women shoes'],
    type: 'website' as const
  },
  
  about: {
    title: 'About FICI - Premium Footwear Brand Story',
    description: 'Learn about FICI\'s journey in creating premium quality footwear. Discover our commitment to craftsmanship, comfort, and style.',
    keywords: ['about FICI', 'footwear brand', 'company story', 'premium shoes', 'craftsmanship'],
    type: 'article' as const
  },
  
  contact: {
    title: 'Contact FICI - Customer Support & Store Locations',
    description: 'Get in touch with FICI customer support. Find store locations, contact information, and customer service details.',
    keywords: ['contact FICI', 'customer support', 'store locations', 'help', 'customer service'],
    type: 'website' as const
  },
  
  cart: {
    title: 'Shopping Cart - FICI',
    description: 'Review your selected items and proceed to checkout. Secure payment and fast delivery guaranteed.',
    keywords: ['shopping cart', 'checkout', 'secure payment', 'FICI'],
    type: 'website' as const,
    noIndex: true
  },
  
  checkout: {
    title: 'Checkout - FICI',
    description: 'Complete your purchase securely with multiple payment options and fast delivery.',
    keywords: ['checkout', 'secure payment', 'fast delivery', 'FICI'],
    type: 'website' as const,
    noIndex: true
  }
};

export default useSEO;

import { Helmet } from 'react-helmet-async';
import { useLocation } from 'react-router-dom';
import ficiImage from '@/assets/fici_light_1920x917.png';
import ficiLogo from '@/assets/fici_128x128.webp';

interface SEOHeadProps {
  title?: string;
  description?: string;
  image?: string;
  type?: 'website' | 'article' | 'product';
  twitterCard?: 'summary' | 'summary_large_image';
  twitterSite?: string;
  publishedTime?: string;
  modifiedTime?: string;
  author?: string;
  keywords?: string[];
  noIndex?: boolean;
}

const DEFAULT_TITLE = 'Leather Shoe Manufacturer | Fici | Ambur';
const DEFAULT_DESCRIPTION = 'Premium leather shoe manufacturer in Ambur, India. Direct from factory wholesale prices. Verified Ambur craftsmanship with 30+ years heritage. Shop handcrafted leather shoes with worldwide shipping. GST: 33BMAPM8509H1Z4.';
const DEFAULT_IMAGE = ficiImage;
const SITE_URL = 'https://ficishoes.com';

const SEOHead = ({
  title = '',
  description = DEFAULT_DESCRIPTION,
  image = DEFAULT_IMAGE,
  type = 'website',
  twitterCard = 'summary_large_image',
  twitterSite = '@FiciShoes',
  publishedTime,
  modifiedTime,
  author = 'Mohammed Faisal - FICI Shoes by NMF International',
  keywords = ['leather shoe manufacturer', 'ambur leather', 'ambur shoes', 'leather manufacturing in india', 'wholesale shoe factory', 'fici shoes ambur', 'nmf international', 'ambur leather shoes wholesale market', 'ambur shoe factory list', 'ambur leather manufacturers', 'leather manufacturers in ambur', 'ambur wholesale market', 'broad formal shoes for men', 'shoe manufacturers in ambur', 'ambur shoes online shopping', 'shoe manufacturer near me', 'ambur leather factory', 'ambur shoe', 'ambur leather bags', 'ambur best leather shop', 'shoes ambur', 'leather shoes ambur', 'ambur shoe factory', 'sneakers india', 'nmf international', 'nmf', 'fici shoes', 'handcrafted leather shoes', 'men formal shoes', 'leather lace-ups', 'Chelsea boots', 'slip-on shoes', 'leather chappals', 'milled leather', 'Mohammed Faisal shoes', 'Khaderpet Ambur shoes', 'GST 33BMAPM8509H1Z4', 'Celby height increasing shoes', 'tassel shoes', 'office footwear', 'professional shoes', 'genuine leather shoes', 'traditional footwear Ambur', 'Justdial FICI shoes', 'IndiaMART FICI shoes'],
  noIndex = false,
}: SEOHeadProps) => {
  const { pathname } = useLocation();
  // Ensure consistent canonical URL (HTTPS, non-WWW)
  const currentUrl = `${SITE_URL}${pathname}`;
  const canonicalUrl = currentUrl.replace(/^http:\/\//, 'https://').replace(/^www\./, '');
  const pageTitle = title ? `${title} | Fici | Ambur` : DEFAULT_TITLE;

  return (
    <Helmet>
      {/* Core SEO Tags */}
      <title>{pageTitle}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={canonicalUrl} />
      <meta name="keywords" content={keywords.join(', ')} />
      <meta name="author" content={author} />
      <meta name="robots" content={noIndex ? "noindex, nofollow" : "index, follow"} />

      {/* Open Graph / Facebook */}
      <meta property="og:type" content={type} />
      <meta property="og:url" content={currentUrl} />
      <meta property="og:title" content={pageTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />
      <meta property="og:site_name" content="Fici Shoes" />

      {/* Twitter */}
      <meta name="twitter:card" content={twitterCard} />
      <meta name="twitter:site" content={twitterSite} />
      <meta name="twitter:title" content={pageTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />

      {/* Additional Meta Tags */}
      {publishedTime && <meta property="article:published_time" content={publishedTime} />}
      {modifiedTime && <meta property="article:modified_time" content={modifiedTime} />}
      {type === 'article' && author && <meta property="article:author" content={author} />}

      {/* Local SEO Meta Tags */}
      <meta name="geo.region" content="IN-TN" />
      <meta name="geo.placename" content="Ambur" />
      <meta name="geo.position" content="12.7895;78.7269" />
      <meta name="ICBM" content="12.7895,78.7269" />

      {/* Mobile Specific */}
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <meta name="theme-color" content="#ffffff" />

      {/* Local Business Structured Data */}
      <script type="application/ld+json">
        {JSON.stringify({
          "@context": "https://schema.org",
          "@type": "LocalBusiness",
          "name": "FICI Shoes by NMF International",
          "alternateName": ["FICI Shoes", "NMF International"],
          "description": "Premium handcrafted leather formal shoes for men in Ambur. Traditional lace-ups, slip-ons, Chelsea boots, chappals. Milled leather, customization options. Wholesale available. Shop online via Facebook, Instagram. GST: 33BMAPM8509H1Z4.",
          "url": SITE_URL,
          "logo": ficiLogo,
          "image": ficiImage,
          "telephone": "+91-8122003006",
          "address": {
            "@type": "PostalAddress",
            "streetAddress": "No.20, 1st Floor, Broad Bazaar, Flower Bazaar Lane",
            "addressLocality": "Ambur",
            "addressRegion": "Tamil Nadu",
            "addressCountry": "IN",
            "postalCode": "635802"
          },
          "geo": {
            "@type": "GeoCoordinates",
            "latitude": "12.7895",
            "longitude": "78.7269"
          },
          "hasMap": "https://share.google/5m1q1FRfsJlHXKmo5",
          "areaServed": "Ambur",
          "paymentAccepted": ["Cash", "Credit Card", "Debit Card", "COD", "Online Transfer"],
          "priceRange": "$$",
          "founder": "Mohammed Faisal",
          "legalName": "NMF International",
          "taxID": "33BMAPM8509H1Z4",
          "hasOfferCatalog": {
            "@type": "OfferCatalog",
            "name": ["Ambur Leather Shoes", "Wholesale Leather Shoes", "Formal Shoes", "Chelsea Boots", "Leather Chappals"],
            "itemListElement": [
              {
                "@type": "Offer",
                "itemOffered": {
                  "@type": "Product",
                  "name": "Ambur Leather Shoes Wholesale Market",
                  "category": "Wholesale Shoes",
                  "description": "Buy premium Ambur leather shoes at wholesale prices. Direct from manufacturers with bulk ordering available.",
                  "brand": {
                    "@type": "Brand",
                    "name": "FICI Shoes"
                  },
                  "material": "Genuine Leather",
                  "offers": {
                    "@type": "Offer",
                    "priceCurrency": "INR",
                    "price": "1999",
                    "availability": "https://schema.org/InStock"
                  }
                }
              },
              {
                "@type": "Offer",
                "itemOffered": {
                  "@type": "Product",
                  "name": "Ambur Leather Manufacturers",
                  "category": "Manufacturing",
                  "description": "Leading leather shoe manufacturers in Ambur. Quality footwear production with traditional craftsmanship and modern techniques.",
                  "brand": {
                    "@type": "Brand",
                    "name": "FICI Shoes"
                  },
                  "material": "Premium Leather",
                  "offers": {
                    "@type": "Offer",
                    "priceCurrency": "INR",
                    "price": "2999",
                    "availability": "https://schema.org/InStock"
                  }
                }
              },
              {
                "@type": "Offer",
                "itemOffered": {
                  "@type": "Product",
                  "name": "Ambur Shoe Factory List",
                  "category": "Manufacturing",
                  "description": "Complete list of shoe factories in Ambur. Find reliable manufacturers for bulk orders and custom footwear production.",
                  "brand": {
                    "@type": "Brand",
                    "name": "FICI Shoes"
                  },
                  "material": "Leather",
                  "offers": {
                    "@type": "Offer",
                    "priceCurrency": "INR",
                    "price": "2499",
                    "availability": "https://schema.org/InStock"
                  }
                }
              },
              {
                "@type": "Offer",
                "itemOffered": {
                  "@type": "Product",
                  "name": "Broad Formal Shoes for Men",
                  "category": "Formal Shoes",
                  "description": "Stylish formal shoes for men in various designs. Perfect for business meetings, formal events, and professional occasions.",
                  "brand": {
                    "@type": "Brand",
                    "name": "FICI Shoes"
                  },
                  "material": "Genuine Leather",
                  "offers": {
                    "@type": "Offer",
                    "priceCurrency": "INR",
                    "price": "3299",
                    "availability": "https://schema.org/InStock"
                  }
                }
              },
              {
                "@type": "Offer",
                "itemOffered": {
                  "@type": "Product",
                  "name": "Height Increasing Shoes",
                  "category": "Specialty Shoes",
                  "description": "Innovative height-increasing shoes with concealed elevator insole providing 2-3 inch lift. Features premium leather upper, comfortable cushioning, and discreet design that appears normal. Boosts confidence while maintaining comfort for all-day wear. Available in formal styles suitable for business and special occasions.",
                  "brand": {
                    "@type": "Brand",
                    "name": "FICI Shoes"
                  },
                  "material": "Premium Leather",
                  "offers": {
                    "@type": "Offer",
                    "priceCurrency": "INR",
                    "price": "3999",
                    "availability": "https://schema.org/InStock"
                  }
                }
              },
              {
                "@type": "Offer",
                "itemOffered": {
                  "@type": "Product",
                  "name": "Tassel Loafers",
                  "category": "Formal Shoes",
                  "description": "Sophisticated tassel loafers combining classic elegance with modern comfort. Features decorative tassels, moccasin toe design, and premium leather construction. Perfect for business casual events, formal dinners, and sophisticated gatherings. Hand-polished finish with attention to every detail for the discerning gentleman.",
                  "brand": {
                    "@type": "Brand",
                    "name": "FICI Shoes"
                  },
                  "material": "Premium Leather",
                  "offers": {
                    "@type": "Offer",
                    "priceCurrency": "INR",
                    "price": "3299",
                    "availability": "https://schema.org/InStock"
                  }
                }
              }
            ]
          },
          "sameAs": [
            "https://www.facebook.com/FICI-shoes",
            "https://www.instagram.com/FICI_shoes",
            "https://www.justdial.com/Ambur/FICI-Shoes-by-NMF-International",
            "https://www.indiamart.com/nmf-international",
            "https://maps.app.goo.gl/zN1S7K3zKaLyTiCo6"
          ]
        })}
      </script>
    </Helmet>
  );
};

export default SEOHead;
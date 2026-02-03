import { Helmet } from 'react-helmet-async';
import { useLocation } from 'react-router-dom';
import ficiImage from '@/assets/fici_light_1920x917.png';
import ficiLogo from '@/assets/fici_128x128.png';

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
}

const DEFAULT_TITLE = 'FICI Shoes by NMF International | Handcrafted Leather Formal Shoes Ambur | Mohammed Faisal';
const DEFAULT_DESCRIPTION = 'FICI Shoes by NMF International - Premium handcrafted leather formal shoes for men in Ambur. Traditional lace-ups, slip-ons, Chelsea boots, chappals. Milled leather, customization options. Shop online via Facebook, Instagram. GST: 33BMAPM8509H1Z4.';
const DEFAULT_IMAGE = ficiImage;
const SITE_URL = 'https://www.ficishoes.com';

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
  keywords = ['FICI shoes Ambur', 'NMF International Ambur', 'handcrafted leather shoes', 'men formal shoes', 'leather lace-ups', 'Chelsea boots', 'slip-on shoes', 'leather chappals', 'milled leather', 'Mohammed Faisal shoes', 'Khaderpet Ambur shoes', 'GST 33BMAPM8509H1Z4', 'Celby height increasing shoes', 'tassel shoes', 'office footwear', 'professional shoes', 'genuine leather shoes', 'traditional footwear Ambur', 'Justdial FICI shoes', 'IndiaMART FICI shoes'],
}: SEOHeadProps) => {
  const { pathname } = useLocation();
  const currentUrl = `${SITE_URL}${pathname}`;
  const pageTitle = title ? `${title} | Fici Shoes` : DEFAULT_TITLE;

  return (
    <Helmet>
      {/* Core SEO Tags */}
      <title>{pageTitle}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={currentUrl} />
      <meta name="keywords" content={keywords.join(', ')} />
      <meta name="author" content={author} />
      <meta name="robots" content="index, follow" />

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
          "alternateName": "FICI Shoes",
          "url": SITE_URL,
          "logo": ficiLogo,
          "description": "Premium handcrafted leather formal shoes for men in Ambur by Mohammed Faisal. Traditional lace-ups, slip-ons, Chelsea boots, chappals with milled leather and customization options.",
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
          "priceRange": "$$$",
          "founder": "Mohammed Faisal",
          "legalName": "NMF International",
          "taxID": "33BMAPM8509H1Z4",
          "hasOfferCatalog": {
            "@type": "OfferCatalog",
            "name": "Handcrafted Leather Footwear",
            "itemListElement": [
              {
                "@type": "Offer",
                "itemOffered": {
                  "@type": "Product",
                  "name": "Lace-Up Formal Shoes",
                  "category": "Formal Shoes",
                  "description": "Premium handcrafted leather lace-up shoes featuring Oxford and Derby designs. Made with full-grain leather, genuine leather sole, and hand-stitched detailing. Perfect for business meetings, formal events, and professional occasions. Available in black, brown, and tan colors with sizes 6-12 including half sizes.",
                  "brand": {
                    "@type": "Brand",
                    "name": "Fici Shoes"
                  },
                  "material": "Full-grain leather",
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
                  "name": "Chelsea Boots",
                  "category": "Boots",
                  "description": "Elegant leather Chelsea boots with elastic side panels and pull tabs. Crafted from premium leather with durable rubber sole for all-weather comfort. Features ankle-high design, sleek silhouette, and versatile styling for both formal and casual wear. Ideal for monsoon season and winter months.",
                  "brand": {
                    "@type": "Brand",
                    "name": "Fici Shoes"
                  },
                  "material": "Premium leather with rubber sole",
                  "offers": {
                    "@type": "Offer",
                    "priceCurrency": "INR",
                    "price": "3499",
                    "availability": "https://schema.org/InStock"
                  }
                }
              },
              {
                "@type": "Offer",
                "itemOffered": {
                  "@type": "Product",
                  "name": "Slip-On Formal Shoes",
                  "category": "Formal Shoes",
                  "description": "Convenient yet sophisticated slip-on shoes designed for modern professionals. Features moccasin construction, cushioned insole, and flexible outsole. Easy to wear without compromising on style. Perfect for daily office wear, business travel, and formal gatherings. Available in classic black and brown shades.",
                  "brand": {
                    "@type": "Brand",
                    "name": "Fici Shoes"
                  },
                  "material": "Genuine leather",
                  "offers": {
                    "@type": "Offer",
                    "priceCurrency": "INR",
                    "price": "2799",
                    "availability": "https://schema.org/InStock"
                  }
                }
              },
              {
                "@type": "Offer",
                "itemOffered": {
                  "@type": "Product",
                  "name": "Traditional Leather Chappals",
                  "category": "Traditional Footwear",
                  "description": "Authentic Indian leather chappals handcrafted by skilled artisans. Made using traditional techniques passed down through generations. Features comfortable leather straps, durable sole, and breathable design. Suitable for daily wear, traditional occasions, and casual outings. Reflects rich cultural heritage of Ambur leather craftsmanship.",
                  "brand": {
                    "@type": "Brand",
                    "name": "Fici Shoes"
                  },
                  "material": "Genuine leather with traditional sole",
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
                  "name": "Height Increasing Shoes",
                  "category": "Specialty Shoes",
                  "description": "Innovative height-increasing shoes with concealed elevator insole providing 2-3 inch lift. Features premium leather upper, comfortable cushioning, and discreet design that appears normal. Boosts confidence while maintaining comfort for all-day wear. Available in formal styles suitable for business and special occasions.",
                  "brand": {
                    "@type": "Brand",
                    "name": "Fici Shoes"
                  },
                  "material": "Premium leather with elevator insole",
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
                    "name": "Fici Shoes"
                  },
                  "material": "Premium leather with tassel details",
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
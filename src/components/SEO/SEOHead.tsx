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
                  "name": "Handcrafted Leather Formal Shoes",
                  "category": "Formal Footwear",
                  "material": "Genuine Leather"
                }
              },
              {
                "@type": "Offer", 
                "itemOffered": {
                  "@type": "Product",
                  "name": "Leather Lace-Up Shoes",
                  "category": "Formal Shoes"
                }
              },
              {
                "@type": "Offer",
                "itemOffered": {
                  "@type": "Product", 
                  "name": "Chelsea Boots",
                  "category": "Boots"
                }
              },
              {
                "@type": "Offer",
                "itemOffered": {
                  "@type": "Product",
                  "name": "Slip-On Shoes",
                  "category": "Formal Shoes"
                }
              },
              {
                "@type": "Offer",
                "itemOffered": {
                  "@type": "Product",
                  "name": "Leather Chappals",
                  "category": "Traditional Footwear"
                }
              },
              {
                "@type": "Offer",
                "itemOffered": {
                  "@type": "Product",
                  "name": "Celby Height Increasing Shoes",
                  "category": "Specialty Shoes"
                }
              },
              {
                "@type": "Offer",
                "itemOffered": {
                  "@type": "Product",
                  "name": "Tassel Shoes",
                  "category": "Formal Shoes"
                }
              }
            ]
          },
          "sameAs": [
            "https://www.facebook.com/FICIshoes",
            "https://www.instagram.com/FICIshoes",
            "https://www.justdial.com/Ambur/FICI-Shoes-by-NMF-International",
            "https://www.indiamart.com/nmf-international"
          ]
        })}
      </script>
    </Helmet>
  );
};

export default SEOHead;
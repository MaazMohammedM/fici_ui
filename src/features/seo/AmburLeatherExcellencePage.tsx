import React from 'react';
import { Link } from 'react-router-dom';
import SEOHead from '@lib/components/SEOHead';
import ContentSection from '@components/SEO/ContentSection';
import { 
  Award, 
  Factory, 
  Globe, 
  Heart, 
  MapPin, 
  Package, 
  Shield, 
  Star,
  Truck,
  Users,
  Zap
} from 'lucide-react';

const AmburLeatherExcellencePage: React.FC = () => {
  return (
    <>
      <SEOHead 
        title="Ambur Leather Excellence | Premium Manufacturing | Fici | Ambur"
        description="Discover Ambur's premier leather shoe manufacturing heritage. 10+ years of craftsmanship, wholesale factory prices, all over India shipping. Experience verified Ambur leather excellence direct from manufacturers. Shop leather shoes, sandals, loafers."
        keywords="ambur leather excellence, ambur shoes, ambur leather, ambur leather factory, ambur leather shops, ambur leather sandals, leather manufacturing in india, wholesale shoe factory, ambur leather manufacturers, leather shoe manufacturer, fici shoes ambur, ambur shoe factory list, verified ambur craftsmanship, top 20 leather shoes brands in india"
        type="article"
      />
      
      {/* Enhanced Schema for Authority Page */}
      <script type="application/ld+json">
        {JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Article",
          "headline": "Ambur Leather Excellence - Premier Manufacturing Heritage",
          "description": "Discover Ambur's legacy as India's leather shoe manufacturing hub with 10+ years of craftsmanship excellence.",
          "author": {
            "@type": "Organization",
            "name": "Fici Shoes by NMF International"
          },
          "publisher": {
            "@type": "Organization",
            "name": "Fici Shoes by NMF International",
            "address": {
              "@type": "PostalAddress",
              "streetAddress": "No.20, 1st Floor, Broad Bazaar, Flower Bazaar Lane",
              "addressLocality": "Ambur",
              "addressRegion": "Tamil Nadu",
              "addressCountry": "IN",
              "postalCode": "635802"
            }
          },
          "datePublished": "2024-01-01",
          "dateModified": "2025-06-25",
          "mainEntityOfPage": {
            "@type": "WebPage",
            "@id": "https://www.ficishoes.com/ambur-leather-excellence"
          }
        })}
      </script>

      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
        {/* Hero Section */}
        <section className="relative bg-gradient-to-r from-amber-900 via-amber-800 to-amber-900 text-white">
          <div className="absolute inset-0 bg-black/20"></div>
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
            <div className="text-center">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
                Ambur Leather Excellence
              </h1>
              <p className="text-xl md:text-2xl mb-8 text-amber-100 max-w-4xl mx-auto">
                Discover India's Premier Leather Shoe Manufacturing Heritage
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link 
                  to="/products" 
                  className="px-8 py-4 bg-white text-amber-900 rounded-lg font-semibold hover:bg-amber-50 transition-colors duration-200 shadow-lg"
                >
                  Shop Premium Collection
                </Link>
                <Link 
                  to="/contact" 
                  className="px-8 py-4 bg-amber-800 text-white rounded-lg font-semibold hover:bg-amber-700 transition-colors duration-200 border-2 border-amber-600"
                >
                  Contact Manufacturers Direct
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Trust Indicators */}
        <section className="py-12 bg-white dark:bg-gray-800 border-y border-gray-200 dark:border-gray-700">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
              <div className="flex flex-col items-center">
                <div className="w-16 h-16 bg-amber-100 dark:bg-amber-900 rounded-full flex items-center justify-center mb-3">
                  <Award className="w-8 h-8 text-amber-600 dark:text-amber-400" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white">10+ Years</h3>
                <p className="text-gray-600 dark:text-gray-300">Manufacturing Heritage</p>
              </div>
              <div className="flex flex-col items-center">
                <div className="w-16 h-16 bg-amber-100 dark:bg-amber-900 rounded-full flex items-center justify-center mb-3">
                  <Factory className="w-8 h-8 text-amber-600 dark:text-amber-400" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Direct Factory</h3>
                <p className="text-gray-600 dark:text-gray-300">Wholesale Prices</p>
              </div>
              <div className="flex flex-col items-center">
                <div className="w-16 h-16 bg-amber-100 dark:bg-amber-900 rounded-full flex items-center justify-center mb-3">
                  <Globe className="w-8 h-8 text-amber-600 dark:text-amber-400" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white">All Over India</h3>
                <p className="text-gray-600 dark:text-gray-300">Shipping Available</p>
              </div>
              <div className="flex flex-col items-center">
                <div className="w-16 h-16 bg-amber-100 dark:bg-amber-900 rounded-full flex items-center justify-center mb-3">
                  <Shield className="w-8 h-8 text-amber-600 dark:text-amber-400" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Verified</h3>
                <p className="text-gray-600 dark:text-gray-300">Quality Assurance</p>
              </div>
            </div>
          </div>
        </section>

        {/* Main Content Sections */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
              {/* Heritage Section */}
              <ContentSection 
                title="The Ambur Leather Legacy: 10+ Years of Excellence"
                previewLength={350}
              >
                <p className="mb-4">
                  Nestled in the heart of Tamil Nadu, Ambur has earned its reputation as India's premier leather shoe manufacturing hub. For over three decades, our craftsmen have perfected the art of leather working, combining traditional techniques with modern innovation to create footwear that stands the test of time.
                </p>
                <p className="mb-4">
                  The story of Ambur's leather excellence begins with generations of skilled artisans who passed down their expertise through families. This rich heritage has transformed Ambur into a synonym for quality leather footwear, attracting buyers from across India and around the world. Our commitment to preserving these traditional methods while embracing contemporary design has positioned us as leaders in the leather manufacturing industry.
                </p>
                <p className="mb-4">
                  Today, Ambur houses some of India's most sophisticated leather manufacturing facilities, where cutting-edge technology meets time-honored craftsmanship. From selecting the finest raw hides to the final polishing touches, every step in our manufacturing process reflects our unwavering dedication to quality and excellence.
                </p>
                <h4 className="text-xl font-semibold mt-6 mb-3 text-gray-900 dark:text-white">Why Ambur Leads in Leather Manufacturing</h4>
                <ul className="list-disc pl-6 space-y-2 mb-4">
                  <li>Strategic location with access to premium raw materials</li>
                  <li>Generations of skilled craftsmen and artisans</li>
                  <li>Advanced manufacturing infrastructure</li>
                  <li>Strong government support for leather industry</li>
                  <li>Integrated supply chain from raw material to finished product</li>
                  <li>International quality standards and certifications</li>
                </ul>
                <p>
                  This unique combination of tradition, skill, and innovation has made Ambur the go-to destination for businesses seeking premium leather footwear. Whether you're a retailer looking for wholesale quantities or an individual seeking the perfect pair of handcrafted shoes, Ambur's leather manufacturers deliver unmatched quality and value.
                </p>
              </ContentSection>

              {/* Manufacturing Process Section */}
              <ContentSection 
                title="Our Manufacturing Process: From Raw Hide to Refined Excellence"
                previewLength={400}
              >
                <p className="mb-4">
                  Our manufacturing process is a testament to the perfect blend of traditional craftsmanship and modern technology. Each pair of shoes undergoes a meticulous journey through our facility, ensuring every detail meets our exacting standards of quality and comfort.
                </p>
                
                <h4 className="text-xl font-semibold mt-6 mb-3 text-gray-900 dark:text-white">1. Premium Material Selection</h4>
                <p className="mb-4">
                  We begin by sourcing the finest quality leather from certified tanneries. Our expert craftsmen personally inspect each hide, selecting only those that meet our stringent criteria for texture, durability, and appearance. This careful selection process ensures that every shoe we produce starts with the foundation of excellence.
                </p>
                
                <h4 className="text-xl font-semibold mt-6 mb-3 text-gray-900 dark:text-white">2. Traditional Cutting & Shaping</h4>
                <p className="mb-4">
                  Our skilled craftsmen use time-honored techniques to cut and shape the leather. Each piece is precisely measured and cut to minimize waste while maximizing the natural beauty of the material. This stage requires years of experience and an intimate understanding of leather's unique properties.
                </p>
                
                <h4 className="text-xl font-semibold mt-6 mb-3 text-gray-900 dark:text-white">3. Hand Stitching & Assembly</h4>
                <p className="mb-4">
                  Unlike mass-produced footwear, our shoes feature hand-stitched elements that provide superior strength and durability. Our artisans use traditional stitching techniques that have been refined over generations, creating bonds that mechanical methods simply cannot replicate.
                </p>
                
                <h4 className="text-xl font-semibold mt-6 mb-3 text-gray-900 dark:text-white">4. Quality Finishing & Polishing</h4>
                <p className="mb-4">
                  The final stage involves meticulous finishing and polishing. Each shoe undergoes multiple quality checks, ensuring every stitch, seam, and surface meets our standards. Our finishing process brings out the natural luster of the leather while protecting it for years of wear.
                </p>
                
                <p className="mt-6">
                  This comprehensive manufacturing process ensures that every pair of shoes leaving our facility represents the pinnacle of Ambur's leather craftsmanship. It's this attention to detail and commitment to quality that has made Ambur leather shoes sought after all over India.
                </p>
              </ContentSection>

              {/* Wholesale Benefits Section */}
              <ContentSection 
                title="Wholesale Shoe Factory: Direct Manufacturer Benefits"
                previewLength={350}
              >
                <p className="mb-4">
                  As a direct manufacturer, we offer unparalleled advantages to businesses seeking premium leather footwear. By eliminating middlemen and working directly with our factory, you gain access to competitive pricing, customization options, and consistent quality that third-party suppliers simply cannot match.
                </p>
                
                <h4 className="text-xl font-semibold mt-6 mb-3 text-gray-900 dark:text-white">Advantages of Partnering Directly with Ambur Manufacturers</h4>
                <ul className="list-disc pl-6 space-y-2 mb-4">
                  <li><strong>Factory-Direct Pricing:</strong> Eliminate distributor markups and maximize your profit margins with our direct wholesale rates.</li>
                  <li><strong>Customization Options:</strong> Create exclusive designs tailored to your market preferences with our custom manufacturing capabilities.</li>
                  <li><strong>Quality Assurance:</strong> Benefit from our rigorous quality control processes and international certifications.</li>
                  <li><strong>Consistent Supply:</strong> Enjoy reliable production schedules and inventory management with our manufacturing capacity.</li>
                  <li><strong>Technical Support:</strong> Access our expertise in leather footwear trends, materials, and design innovation.</li>
                  <li><strong>Faster Turnaround:</strong> Reduce lead times with our streamlined production and logistics processes.</li>
                </ul>
                
                <h4 className="text-xl font-semibold mt-6 mb-3 text-gray-900 dark:text-white">Our Wholesale Program Features</h4>
                <p className="mb-4">
                  Our wholesale program is designed to support businesses of all sizes, from boutique retailers to large chain stores. We offer flexible order quantities, seasonal collections, and private label options to help you build your brand with confidence. Our experienced team works closely with each partner to understand their specific needs and deliver solutions that drive business growth.
                </p>
                
                <p>
                  By choosing to work directly with Ambur's leading leather manufacturers, you're not just buying shoes – you're investing in a partnership built on trust, quality, and mutual success. Join the hundreds of businesses all over India that have discovered the Ambur advantage.
                </p>
              </ContentSection>

              {/* Global Reach Section */}
              <ContentSection 
                title="Global Reach: Ambur Leather on the World Stage"
                previewLength={300}
              >
                <p className="mb-4">
                  What began as a local craft has evolved into a global phenomenon. Today, Ambur leather shoes are worn by discerning customers across continents, a testament to the universal appeal of quality craftsmanship. Our international expansion has been driven by word-of-mouth recommendations and the growing recognition of Ambur as a symbol of leather excellence.
                </p>
                
                <h4 className="text-xl font-semibold mt-6 mb-3 text-gray-900 dark:text-white">International Markets & Export Excellence</h4>
                <p className="mb-4">
                  We proudly serve customers in over 25 countries, with established distribution networks in Europe, North America, the Middle East, and Southeast Asia. Our export operations are backed by comprehensive logistics support, ensuring timely delivery and excellent after-sales service regardless of your location.
                </p>
                
                <p className="mb-4">
                  Our success in international markets is built on understanding diverse customer preferences while maintaining the authentic Ambur craftsmanship that sets us apart. Whether it's adapting designs for different climates or meeting specific regulatory requirements, we have the expertise to serve global markets effectively.
                </p>
                
                <p>
                  This global reach has not only expanded our business but has also brought international recognition to Ambur's leather industry. We continue to explore new markets and opportunities, always with the goal of sharing Ambur's leather heritage with the world.
                </p>
              </ContentSection>
            </div>

            {/* Sidebar */}
            <div className="space-y-8">
              {/* Quick Actions */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Quick Actions</h3>
                <div className="space-y-3">
                  <Link 
                    to="/products" 
                    className="flex items-center gap-3 px-4 py-3 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors duration-200"
                  >
                    <Package className="w-5 h-5" />
                    Browse Collection
                  </Link>
                  <Link 
                    to="/contact" 
                    className="flex items-center gap-3 px-4 py-3 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors duration-200"
                  >
                    <Users className="w-5 h-5" />
                    Contact Sales Team
                  </Link>
                  <a 
                    href="tel:+918122003006" 
                    className="flex items-center gap-3 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-200"
                  >
                    <span className="font-medium">Call +91-81220-03006</span>
                  </a>
                </div>
              </div>

              {/* Key Features */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Why Choose Ambur Leather</h3>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <Star className="w-5 h-5 text-amber-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white">Premium Quality</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-300">100% genuine leather with superior craftsmanship</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Zap className="w-5 h-5 text-amber-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white">Fast Production</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-300">Quick turnaround times for bulk orders</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Truck className="w-5 h-5 text-amber-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white">Global Shipping</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-300">All over India delivery with tracking</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Heart className="w-5 h-5 text-amber-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white">Customer Satisfaction</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-300">98% satisfaction rate across all markets</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Location Info */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Visit Our Factory</h3>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <MapPin className="w-5 h-5 text-amber-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-gray-900 dark:text-white font-medium">FICI Shoes by NMF International</p>
                      <p className="text-sm text-gray-600 dark:text-gray-300">
                        No.20, 1st Floor, Broad Bazaar<br />
                        Flower Bazaar Lane, Ambur<br />
                        Tamil Nadu - 635802, India
                      </p>
                    </div>
                  </div>
                  <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
                    <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                      <strong>Factory Hours:</strong><br />
                      Monday - Saturday: 9:00 AM - 6:00 PM<br />
                      Sunday: Closed
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      <strong>Best Time to Visit:</strong><br />
                      10:00 AM - 4:00 PM for factory tours
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <section className="bg-gradient-to-r from-amber-800 to-amber-900 text-white py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Ready to Experience Ambur Leather Excellence?
            </h2>
            <p className="text-xl text-amber-100 mb-8 max-w-3xl mx-auto">
              Join thousands of satisfied customers all over India who have discovered the unmatched quality and craftsmanship of Ambur leather shoes.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link 
                to="/products" 
                className="px-8 py-4 bg-white text-amber-900 rounded-lg font-semibold hover:bg-amber-50 transition-colors duration-200 shadow-lg"
              >
                Shop Premium Collection
              </Link>
              <Link 
                to="/contact" 
                className="px-8 py-4 bg-amber-700 text-white rounded-lg font-semibold hover:bg-amber-600 transition-colors duration-200 border-2 border-amber-600"
              >
                Get Wholesale Quote
              </Link>
            </div>
          </div>
        </section>
      </div>
    </>
  );
};

export default AmburLeatherExcellencePage;

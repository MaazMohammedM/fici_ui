import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { ChevronDown, ChevronUp, Phone, Mail, MapPin, Clock, Truck, Shield, RefreshCw } from 'lucide-react';

interface FAQItem {
  question: string;
  answer: React.ReactNode;
  category: string;
}

const FAQPage: React.FC = () => {
  const [expandedItems, setExpandedItems] = useState<Set<number>>(new Set());
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const faqData: FAQItem[] = [
    // Local & Manufacturing
    {
      question: "Where can I find the best Genuine Leather shoes?",
      answer: (
        <>
          The best genuine leather footwear can be found at the FiCi Shoes store located at No.20, 1st Floor, Broad Bazaar, Ambur. As a direct-from-workshop brand by NMF International, we offer premium quality leather shoes at factory-direct prices. <Link to='/products' className='text-blue-400 hover:text-blue-300 underline'>Shop our collection online</Link> or visit us in person.
        </>
      ),
      category: "general"
    },
    {
      question: "Are FiCi Shoes made in an authentic leather workshop?",
      answer: "Yes! Every pair of FiCi Shoes is handcrafted in our Ambur manufacturing unit. We leverage Ambur's rich heritage in leather craftsmanship to produce shoes that meet global export standards for durability and style.",
      category: "general"
    },
    {
      question: "Can I order custom-made leather shoes?",
      answer: (
        <>
          Yes! We offer tailor-made leather shoes for specific size requirements or design preferences. Our skilled Ambur craftsmen can customize the fit to your needs. <Link to='/contact' className='text-blue-400 hover:text-blue-300 underline'>Contact +91 81220 03006</Link>.
        </>
      ),
      category: "general"
    },

    // Product & Quality
    {
      question: "Does FiCi Shoes use 100% Genuine full-grain leather?",
      answer: "Absolutely! We use only 100% genuine full-grain and top-grain leather. We have more leather varieties like Corrected Grain, Oil-Pullup, Suede, Milled and Crunch. Our workshop-to-consumer (D2C) model ensures authentic leather products with a luxury finish and long-lasting durability.",
      category: "products"
    },
    {
      question: "What are the most comfortable leather formal shoes for office wear?",
      answer: (
        <>
          Our Leather Oxford and Derby collections are specifically designed for all-day comfort. They feature cushioned insoles and breathable leather linings, making them perfect for professionals seeking comfortable yet stylish office footwear. <Link to='/products?sub_category=Shoes' className='text-blue-400 hover:text-blue-300 underline'>View the collection</Link> at ficishoes.com.
        </>
      ),
      category: "products"
    },
    {
      question: "What makes Ambur leather shoes from NMF International special?",
      answer: "Ambur is globally recognized as the leather hub of India. At NMF International, we combine this heritage with modern quality control. Every pair reflects ethical sourcing, skilled manual lasting, and premium finishing that rivals international luxury brands.",
      category: "products"
    },

    // B2B & Wholesale
    {
      question: "How can I contact NMF International for wholesale leather shoe supply?",
      answer: (
        <>
          For bulk orders, B2B inquiries, or retail partnerships, reach our wholesale desk directly at +91 81220 03006. As a primary leather shoe manufacturer, we offer competitive wholesale rates and reliable supply chains for shops. <Link to='/contact' className='text-blue-400 hover:text-blue-300 underline'>Get in touch with our wholesale team</Link>.
        </>
      ),
      category: "b2b"
    },
    {
      question: "Do you offer white-label manufacturing for other footwear brands?",
      answer: "Yes! NMF International provides private-label and white-label manufacturing services. We can produce high-quality leather footwear under your own brand name using our Ambur production unit.",
      category: "b2b"
    },

    // Online Ordering
    {
      question: "How can I place an order?",
      answer: (
        <>
          You can order through our website ficishoes.com, via phone at +91 81220 03006, through our Facebook/Instagram pages, or visit our store in Ambur. We also accept WhatsApp orders. <Link to='/products' className='text-blue-400 hover:text-blue-300 underline'>Browse products now</Link>
        </>
      ),
      category: "ordering"
    },
    {
      question: "What payment methods do you accept?",
      answer: "We accept all major credit/debit cards, UPI payments, net banking, wallets (PayTM, PhonePe, Google Pay), and cash on delivery (for select locations). All payments are secured by Razorpay.",
      category: "ordering"
    },
    {
      question: "Can I cancel or modify my order?",
      answer: "Orders can be cancelled or modified within 2 hours of placement. After this period, please contact our customer service team, and we'll try our best to accommodate your request based on order status.",
      category: "ordering"
    },

    // Shipping & Trust
    {
      question: "How soon can I expect delivery for an online order from ficishoes.com?",
      answer: "We deliver orders as soon as possible! Typically, delivery takes 2–7 business days. Orders to metro cities are often delivered faster via premium courier partners. You'll receive tracking details once your order ships.",
      category: "shipping"
    },
    {
      question: "Do you ship nationwide?",
      answer: "We ship across India based on serviceable pincodes. Shipping availability and rates vary by location. Enter your pincode at checkout to check if we deliver to your area and see applicable shipping charges.",
      category: "shipping"
    },
    {
      question: "How are shipping charges calculated?",
      answer: "Shipping charges are variable and depend on your pincode. Rates are determined based on location, order value, and serviceability. Some pincodes may have free shipping above minimum order amounts. Check your pincode at checkout for exact charges.",
      category: "shipping"
    },
    {
      question: "Does FiCi Shoes provide Cash on Delivery (COD) across India?",
      answer: (
        <>
          Yes! Cash on Delivery (COD) is offered for most pincodes across India. Verify COD availability for your specific location by entering your pincode on the <Link to='/products' className='text-blue-400 hover:text-blue-300 underline'>checkout page</Link> at ficishoes.com.
        </>
      ),
      category: "shipping"
    },

    // Returns & Exchanges
    {
      question: "How do I exchange my shoes if the size doesn't fit?",
      answer: (
        <>
          We offer a hassle-free 3-day replacement policy! If the shoes don't fit perfectly, you can initiate a size exchange directly through the 'My Orders' section on ficishoes.com or visit our Ambur store for an immediate swap. <Link to='/orders' className='text-blue-400 hover:text-blue-300 underline'>Go to My Orders</Link>
        </>
      ),
      category: "returns"
    },
    {
      question: "What is your replacement policy?",
      answer: "We offer 3-day replacement policy for unused items in original packaging. Only exchanges are available - no refunds. Customized items cannot be exchanged unless there's a manufacturing defect. Replacement is subject to product availability.",
      category: "returns"
    },
    {
      question: "How do I initiate a replacement?",
      answer: (
        <>
          You can easily initiate a replacement yourself through your order details page. Go to 'My Orders' → click on your order → find the item → click 'Request Replacement'. Select the reason and preferred size, then submit. Our team will review and process your replacement request. <Link to='/orders' className='text-blue-400 hover:text-blue-300 underline'>Access My Orders</Link>
        </>
      ),
      category: "returns"
    },
    {
      question: "Are refunds available?",
      answer: "No, we do not offer refunds. We only provide replacements within the 3-day window. If the exact product is not available for replacement, we'll offer store credit or alternative products of equal value.",
      category: "returns"
    },

    // Shoe Care
    {
      question: "How do I maintain and clean my FiCi leather shoes?",
      answer: (
        <>
          To keep genuine leather shoes looking new, wipe them with a soft cloth after use and apply a high-quality leather cream monthly. Avoid wearing them in heavy rain to protect the hand-stitched soles. For detailed tips, check our <Link to='/shoe-care' className='text-blue-400 hover:text-blue-300 underline'>Shoe Care Guide</Link>.
        </>
      ),
      category: "care"
    },
    {
      question: "Are your shoes waterproof?",
      answer: "Our leather shoes are water-resistant but not fully waterproof. We recommend avoiding heavy rain. For water protection, use waterproof sprays available at shoe care stores.",
      category: "care"
    },

    // Sizing & Fit
    {
      question: "How do I choose the correct size when ordering online?",
      answer: (
        <>
          We follow standard UK/India sizing. Refer to the Size Chart on product pages to find the perfect fit. If between sizes, we recommend 'Sizing Up'. Size customization is also available by <Link to='/contact' className='text-blue-400 hover:text-blue-300 underline'>contacting us via WhatsApp</Link>.
        </>
      ),
      category: "sizing"
    },
    {
      question: "What if the shoes don't fit well?",
      answer: "We offer size replacement within 3 days of delivery. Try the shoes indoors on carpeted surface to maintain condition. Contact us immediately if you need a different size. Subject to product availability and pincode serviceability.",
      category: "sizing"
    }
  ];

  const categories = [
    { id: 'all', name: 'All Questions', icon: '📋' },
    { id: 'general', name: 'Local & Manufacturing', icon: '🏭' },
    { id: 'products', name: 'Product & Quality', icon: '👞' },
    { id: 'b2b', name: 'B2B & Wholesale', icon: '🤝' },
    { id: 'ordering', name: 'Online Ordering', icon: '💳' },
    { id: 'shipping', name: 'Shipping & Trust', icon: '🚚' },
    { id: 'returns', name: 'Returns & Exchanges', icon: '↩️' },
    { id: 'care', name: 'Shoe Care', icon: '🧴' },
    { id: 'sizing', name: 'Sizing & Fit', icon: '📏' }
  ];

  const filteredFAQs = selectedCategory === 'all' 
    ? faqData 
    : faqData.filter(item => item.category === selectedCategory);

  const toggleExpanded = (index: number) => {
    setExpandedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(index)) {
        newSet.delete(index);
      } else {
        newSet.add(index);
      }
      return newSet;
    });
  };

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": filteredFAQs.map((faq, index) => {
      // Extract text content from ReactNode for structured data
      let answerText = '';
      if (typeof faq.answer === 'string') {
        answerText = faq.answer;
      } else if (Array.isArray(faq.answer)) {
        answerText = faq.answer.map(child => 
          typeof child === 'string' ? child : ''
        ).join(' ');
      }
      
      return {
        "@type": "Question",
        "position": index + 1,
        "name": faq.question,
        "acceptedAnswer": {
          "@type": "Answer",
          "text": answerText
        }
      };
    })
  };

  return (
    <>
      <Helmet>
        <title>Frequently Asked Questions - Fici Shoes | Complete FAQ Guide</title>
        <meta name="description" content="Find answers to common questions about Fici Shoes products, ordering, shipping, returns, and shoe care. Comprehensive FAQ guide for premium leather footwear." />
        <meta name="keywords" content="Fici Shoes FAQ, leather shoes questions, shipping policy, return policy, shoe care, sizing guide, NMF International" />
        
        {/* Open Graph */}
        <meta property="og:title" content="Frequently Asked Questions - Fici Shoes" />
        <meta property="og:description" content="Complete FAQ guide for Fici Shoes premium leather footwear" />
        <meta property="og:type" content="website" />
        
        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="FAQ - Fici Shoes" />
        <meta name="twitter:description" content="Find answers to all your questions about Fici Shoes" />
        
        {/* FAQ Schema Markup */}
        <script type="application/ld+json">
          {JSON.stringify(structuredData)}
        </script>
      </Helmet>

      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
        {/* Header Section */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white py-12 sm:py-16 lg:py-20">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4">Frequently Asked Questions</h1>
            <p className="text-lg sm:text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
              Everything you need to know about Fici Shoes premium leather footwear
            </p>
            
            {/* Quick Contact */}
            <div className="flex flex-wrap justify-center gap-4 sm:gap-6 text-sm sm:text-base">
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 sm:w-5 sm:h-5" />
                <a 
                  href="tel:+918122003006" 
                  className="text-blue-100 hover:text-white transition-colors underline"
                >
                  <span className="hidden sm:inline">+91 81220 03006</span>
                  <span className="sm:hidden">Call</span>
                </a>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 sm:w-5 sm:h-5" />
                <a 
                  href="mailto:support@ficishoes.com" 
                  className="text-blue-100 hover:text-white transition-colors underline"
                >
                  <span className="hidden sm:inline">support@ficishoes.com</span>
                  <span className="sm:hidden">Email</span>
                </a>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 sm:w-5 sm:h-5" />
                <a 
                  href="https://maps.app.goo.gl/zN1S7K3zKaLyTiCo6?g_st=awb"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-100 hover:text-white transition-colors underline"
                >
                  <span className="hidden sm:inline">Ambur, Tamil Nadu</span>
                  <span className="sm:hidden">Location</span>
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Category Filter */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          <div className="flex flex-wrap gap-2 justify-center mb-6 sm:mb-8">
            {categories.map(category => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`px-3 py-2 sm:px-4 sm:py-2 rounded-full text-xs sm:text-sm font-medium transition-all ${
                  selectedCategory === category.id
                    ? 'bg-blue-600 text-white shadow-lg'
                    : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-gray-700'
                }`}
              >
                <span className="mr-1 sm:mr-2">{category.icon}</span>
                <span className="hidden sm:inline">{category.name}</span>
                <span className="sm:hidden">{category.name.split(' ')[0]}</span>
              </button>
            ))}
          </div>

          {/* FAQ Items */}
          <div className="space-y-3 sm:space-y-4">
            {filteredFAQs.map((faq, index) => {
              const globalIndex = faqData.indexOf(faq);
              const isExpanded = expandedItems.has(globalIndex);
              
              return (
                <div
                  key={globalIndex}
                  className="bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-lg transition-all duration-200"
                >
                  <button
                    onClick={() => toggleExpanded(globalIndex)}
                    className="w-full px-4 sm:px-6 py-3 sm:py-4 text-left flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors"
                  >
                    <h3 className="font-semibold text-gray-900 dark:text-white pr-2 sm:pr-4 text-sm sm:text-base">
                      {faq.question}
                    </h3>
                    <div className="flex-shrink-0">
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
                      ) : (
                        <ChevronDown className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
                      )}
                    </div>
                  </button>
                  
                  {isExpanded && (
                    <div className="px-4 sm:px-6 pb-3 sm:pb-4">
                      <div className="border-t border-gray-200 dark:border-gray-700 pt-3 sm:pt-4">
                        <div className="text-gray-700 dark:text-gray-300 leading-relaxed text-sm sm:text-base">
                          {faq.answer}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Still Need Help Section */}
          <div className="mt-8 sm:mt-12 bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900 dark:to-blue-800 rounded-2xl p-6 sm:p-8 text-center">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Still Need Help?
            </h2>
            <p className="text-gray-700 dark:text-gray-300 mb-6 text-sm sm:text-base">
              Our customer service team is here to help you with any questions or concerns.
            </p>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
              <div className="bg-white dark:bg-gray-800 rounded-lg p-3 sm:p-4">
                <Phone className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600 mx-auto mb-2" />
                <h3 className="font-semibold text-gray-900 dark:text-white mb-1 text-sm sm:text-base">Call Us</h3>
                <a 
                  href="tel:+918122003006" 
                  className="text-xs sm:text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors underline"
                >
                  +91 81220 03006
                </a>
                <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">Mon-Sat: 10AM-9PM</p>
              </div>
              
              <div className="bg-white dark:bg-gray-800 rounded-lg p-3 sm:p-4">
                <Mail className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600 mx-auto mb-2" />
                <h3 className="font-semibold text-gray-900 dark:text-white mb-1 text-sm sm:text-base">Email Us</h3>
                <a 
                  href="mailto:support@ficishoes.com" 
                  className="text-xs sm:text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors underline"
                >
                  support@ficishoes.com
                </a>
                <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">24-48 hour response</p>
              </div>
              
              <div className="bg-white dark:bg-gray-800 rounded-lg p-3 sm:p-4">
                <MapPin className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600 mx-auto mb-2" />
                <h3 className="font-semibold text-gray-900 dark:text-white mb-1 text-sm sm:text-base">Visit Us</h3>
                <a 
                  href="https://maps.app.goo.gl/zN1S7K3zKaLyTiCo6?g_st=awb"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs sm:text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors underline"
                >
                  Ambur, Tamil Nadu
                </a>
                <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">Check availability and visit us</p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
              <Link
                to="/contact"
                className="inline-flex items-center justify-center px-4 sm:px-6 py-2 sm:py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors text-sm sm:text-base"
              >
                Contact Form
              </Link>
              <a
                href="https://wa.me/918122003006"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center px-4 sm:px-6 py-2 sm:py-3 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors text-sm sm:text-base"
              >
                WhatsApp Support
              </a>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default FAQPage;

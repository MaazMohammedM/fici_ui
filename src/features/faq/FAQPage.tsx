import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { ChevronDown, ChevronUp, Phone, Mail, MapPin, Clock, Truck, Shield, RefreshCw } from 'lucide-react';

interface FAQItem {
  question: string;
  answer: string;
  category: string;
}

const FAQPage: React.FC = () => {
  const [expandedItems, setExpandedItems] = useState<Set<number>>(new Set());
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const faqData: FAQItem[] = [
    // General Questions
    {
      question: "What is Fici Shoes?",
      answer: "Fici Shoes is a premium brand of NMF International, crafting quality leather footwear since 2018. Based in Ambur, Tamil Nadu, we specialize in handcrafted leather formal shoes, sandals, and accessories that combine traditional craftsmanship with contemporary design.",
      category: "general"
    },
    {
      question: "Where is Fici Shoes located?",
      answer: "Our showroom is located at No.20, 1st Floor, Broad Bazaar, Flower Bazaar Lane, Ambur - 635802, Tirupattur District, Tamilnadu, India. You can visit us in person or shop online at ficishoes.com.",
      category: "general"
    },
    {
      question: "How long has Fici Shoes been in business?",
      answer: "NMF International (our parent company) was established in 2015, and we launched the Fici Shoes brand in August 2018. We have over 8 years of experience in leather footwear manufacturing.",
      category: "general"
    },

    // Products & Quality
    {
      question: "What materials are used in Fici Shoes?",
      answer: "We use only premium quality genuine leather sourced from reputable tanneries. Our materials include full-grain leather, top-grain leather, and high-quality synthetic materials for specific designs. All materials undergo strict quality control.",
      category: "products"
    },
    {
      question: "Are Fici Shoes handmade?",
      answer: "Yes, all our shoes are handcrafted by skilled artisans in Ambur, a region renowned for its leather craftsmanship. Each pair goes through multiple quality checks to ensure exceptional quality and comfort.",
      category: "products"
    },
    {
      question: "What types of shoes do you offer?",
      answer: "We offer a comprehensive range including: Formal Lace-Up Shoes, Slip-On Shoes, Chelsea Boots, Leather Sandals, Traditional Chappals, Height-Increasing Shoes, and Tassel Shoes. We also have bags and leather accessories.",
      category: "products"
    },
    {
      question: "Do you offer customization options?",
      answer: "Yes, we offer customization options including size adjustments, color preferences, and design modifications. Contact our customer service team to discuss your specific requirements.",
      category: "products"
    },

    // Ordering & Payment
    {
      question: "How can I place an order?",
      answer: "You can order through our website ficishoes.com, via phone at +91 81220 03006, through our Facebook/Instagram pages, or visit our showroom in Ambur. We also accept WhatsApp orders.",
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

    // Shipping & Delivery
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
      question: "How long does delivery take?",
      answer: "Delivery time varies by pincode and typically ranges from 2-7 business days. Exact delivery timelines are shown at checkout based on your location. Metro cities usually receive faster delivery. You'll receive tracking details once your order ships.",
      category: "shipping"
    },
    {
      question: "Is Cash on Delivery available?",
      answer: "COD availability depends on your pincode. Some locations support COD while others may require prepaid payment. COD charges may apply for certain pincodes. Check COD availability at checkout.",
      category: "shipping"
    },

    // Returns & Exchanges
    {
      question: "What is your replacement policy?",
      answer: "We offer 3-day replacement policy for unused items in original packaging. Only exchanges are available - no refunds. Customized items cannot be exchanged unless there's a manufacturing defect. Replacement is subject to product availability.",
      category: "returns"
    },
    {
      question: "How do I initiate a replacement?",
      answer: "You can easily initiate a replacement yourself through your order details page. Go to 'My Orders' → click on your order → find the item → click 'Request Replacement'. Select the reason and preferred size, then submit. Our team will review and process your replacement request.",
      category: "returns"
    },
    {
      question: "Where can I find the replacement option?",
      answer: "The replacement option is available in your order details page. After your order is delivered, visit your account, click on the specific order, and you'll see a 'Request Replacement' button next to each eligible item. This option appears only for delivered items within the 3-day window.",
      category: "returns"
    },
    {
      question: "Are refunds available?",
      answer: "No, we do not offer refunds. We only provide replacements within the 3-day window. If the exact product is not available for replacement, we'll offer store credit or alternative products of equal value.",
      category: "returns"
    },

    // Shoe Care & Maintenance
    {
      question: "How should I care for my leather shoes?",
      answer: "Clean regularly with a soft cloth, use leather conditioner monthly, avoid water exposure, store in a cool dry place, use shoe trees to maintain shape, and polish regularly for formal shoes. Detailed care guide available on our website.",
      category: "care"
    },
    {
      question: "Do you provide shoe care services?",
      answer: "Yes, we offer professional shoe care services including cleaning, polishing, sole replacement, and minor repairs. Visit our showroom or contact us for service details and pricing.",
      category: "care"
    },
    {
      question: "Are your shoes waterproof?",
      answer: "Our leather shoes are water-resistant but not fully waterproof. We recommend avoiding heavy rain. For water protection, use waterproof sprays available at shoe care stores.",
      category: "care"
    },

    // Sizing & Fit
    {
      question: "How do I find the right size?",
      answer: "Refer to our size chart on the product page. Measure your foot length and compare with our sizing guide. If between sizes, we recommend sizing up for better comfort. You can also visit our showroom for professional fitting.",
      category: "sizing"
    },
    {
      question: "Do you offer half sizes?",
      answer: "Yes, we offer half sizes for most of our formal shoe collection. However, some traditional designs may only be available in whole sizes. Check product availability or contact us for specific size requirements.",
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
    { id: 'general', name: 'General', icon: 'ℹ️' },
    { id: 'products', name: 'Products & Quality', icon: '👞' },
    { id: 'ordering', name: 'Ordering & Payment', icon: '💳' },
    { id: 'shipping', name: 'Shipping & Delivery', icon: '🚚' },
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
    "mainEntity": filteredFAQs.map((faq, index) => ({
      "@type": "Question",
      "position": index + 1,
      "name": faq.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": faq.answer
      }
    }))
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
        <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white py-16">
          <div className="max-w-4xl mx-auto px-4 text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Frequently Asked Questions</h1>
            <p className="text-xl text-blue-100 mb-8">
              Everything you need to know about Fici Shoes premium leather footwear
            </p>
            
            {/* Quick Contact */}
            <div className="flex flex-wrap justify-center gap-6 text-sm">
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4" />
                <span>+91 81220 03006</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4" />
                <span>support@ficishoes.com</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                <span>Ambur, Tamil Nadu</span>
              </div>
            </div>
          </div>
        </div>

        {/* Category Filter */}
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="flex flex-wrap gap-2 justify-center mb-8">
            {categories.map(category => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  selectedCategory === category.id
                    ? 'bg-blue-600 text-white shadow-lg'
                    : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-gray-700'
                }`}
              >
                <span className="mr-2">{category.icon}</span>
                {category.name}
              </button>
            ))}
          </div>

          {/* FAQ Items */}
          <div className="space-y-4">
            {filteredFAQs.map((faq, index) => {
              const globalIndex = faqData.indexOf(faq);
              const isExpanded = expandedItems.has(globalIndex);
              
              return (
                <div
                  key={globalIndex}
                  className="bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-lg transition-shadow"
                >
                  <button
                    onClick={() => toggleExpanded(globalIndex)}
                    className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors"
                  >
                    <h3 className="font-semibold text-gray-900 dark:text-white pr-4">
                      {faq.question}
                    </h3>
                    <div className="flex-shrink-0">
                      {isExpanded ? (
                        <ChevronUp className="w-5 h-5 text-blue-600" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-gray-400" />
                      )}
                    </div>
                  </button>
                  
                  {isExpanded && (
                    <div className="px-6 pb-4">
                      <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                        <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                          {faq.answer}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Still Need Help Section */}
          <div className="mt-12 bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900 dark:to-blue-800 rounded-2xl p-8 text-center">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Still Need Help?
            </h2>
            <p className="text-gray-700 dark:text-gray-300 mb-6">
              Our customer service team is here to help you with any questions or concerns.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-white dark:bg-gray-800 rounded-lg p-4">
                <Phone className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                <h3 className="font-semibold text-gray-900 dark:text-white mb-1">Call Us</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">+91 81220 03006</p>
                <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">Mon-Sat: 10AM-9PM</p>
              </div>
              
              <div className="bg-white dark:bg-gray-800 rounded-lg p-4">
                <Mail className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                <h3 className="font-semibold text-gray-900 dark:text-white mb-1">Email Us</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">support@ficishoes.com</p>
                <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">24-48 hour response</p>
              </div>
              
              <div className="bg-white dark:bg-gray-800 rounded-lg p-4">
                <MapPin className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                <h3 className="font-semibold text-gray-900 dark:text-white mb-1">Visit Us</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">Ambur, Tamil Nadu</p>
                <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">Check availability and visit us</p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="/contact"
                className="inline-flex items-center justify-center px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
              >
                Contact Form
              </a>
              <a
                href="https://wa.me/918122003006"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center px-6 py-3 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors"
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

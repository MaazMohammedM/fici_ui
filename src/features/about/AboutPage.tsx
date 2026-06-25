import React, { useEffect } from "react";
import SEOHead from "@lib/components/SEOHead";
import ficiLogo from "../../assets/Fici_logo.png";
import showroomDesktop from "../../assets/showroom_desktop.jpg";
import showroomMobile from "../../assets/showroom_mobile.jpg";

const AboutPage: React.FC = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <>
      <SEOHead
        title="About - FICI Shoes - A Brand of NMF International | Premium Leather Footwear | Brand Story"
        description="Fici Shoes is a premium brand of NMF International, crafting quality leather footwear since 2018. Discover our story of craftsmanship, comfort, and style from Ambur, Tamil Nadu."
        keywords="Fici Shoes, NMF International, leather footwear, premium shoes, Ambur Tamil Nadu, quality craftsmanship, leather shoes, footwear brand"
        url="https://ficishoes.com/about"
      />
    <div className="flex-1 bg-[color:var(--color-light1)] dark:bg-[color:var(--color-dark1)]">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="sr-only">About FiCi Shoes - Premium Leather Footwear from Ambur</h1>
        {/* Hero Section - Mobile Layout */}
        <div className="text-center lg:hidden mb-16">
          {/* Brand Logo - Mobile */}
          <div className="w-32 h-32 mx-auto mb-8 relative">
            <img
              src={ficiLogo}
              alt="FiCi Logo"
              className="w-full h-full object-contain"
            />
          </div>

          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6 tracking-tight">
            THE FiCi STORY
          </h2>

          <p className="text-lg md:text-xl text-gray-600 dark:text-gray-300 max-w-4xl mx-auto leading-relaxed">
            <strong>Fici Shoes is a brand of NMF International</strong>, bringing you premium leather footwear that combines 
            tradition, innovation, and exceptional craftsmanship. Every step we craft is built on quality, designed to win hearts everywhere.
          </p>
        </div>

        <div className="hidden lg:flex items-center justify-between mb-16">
          <div className="flex-1 pr-12">
            <h2 className="text-5xl font-bold text-gray-900 dark:text-white mb-6 tracking-tight">
              Our Mission
            </h2>

            <div className="text-xl text-gray-600 dark:text-gray-300 leading-relaxed space-y-6">
              <p>
                <strong>Fici Shoes is a brand of NMF International</strong>, and our mission is simple yet powerful:{" "}
                <strong>
                  To win hearts by delivering craftsmanship, comfort, and class—one step at a time.
                </strong>
              </p>

              <p>
                As a brand built on the foundation of <strong>leather excellence</strong>, we are dedicated to creating
                high-quality <strong>leather shoes and accessories</strong> that reflect both tradition and innovation.
              </p>

              <ul className="list-disc pl-6 space-y-2">
                <li>
                  <strong>100% Quality</strong> – Every product we craft is a result of skilled workmanship, premium
                  materials, and deep attention to detail.
                </li>
                <li>
                  <strong>Timely Delivery</strong> – Because your time matters, we ensure every order is delivered on
                  schedule, without compromise.
                </li>
                <li>
                  <strong>Made Your Way</strong> – We believe in personal style. That’s why we offer{" "}
                  <strong>customization options</strong>, tailored to your taste and comfort.
                </li>
                <li>
                  <strong>For Every Foot</strong> – Our ultimate goal is to <strong>reach every customer’s foot</strong>,
                  building a brand people trust, wear, and love—everywhere.
                </li>
              </ul>

              <p>
                We don’t just make shoes. <br />
                <strong>We craft confidence, comfort, and connection—with every pair.</strong>
              </p>
            </div>
          </div>

          <div className="w-32 h-32 flex-shrink-0">
            <img
              src={ficiLogo}
              alt="FiCi Logo"
              className="w-full h-full object-contain drop-shadow-lg"
            />
          </div>
        </div>

        {/* Showroom Images - Desktop Only */}
        <div className="hidden lg:block mb-12">
          <div className="rounded-2xl overflow-hidden shadow-xl">
            <img
              src={showroomDesktop}
              alt="Fici Shoes Showroom - Ambur Store"
              className="w-full h-auto object-cover"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center mb-16">
          <div className="order-2 lg:order-1">
            {/* Showroom image - mobile only, no side gaps */}
            <div className="lg:hidden rounded-2xl overflow-hidden shadow-xl">
              <img
                src={showroomMobile}
                alt="Fici Shoes Showroom - Ambur Store Mobile"
                className="w-full h-auto"
              />
            </div>
          </div>

          <div className="order-1 lg:order-2 lg:col-span-2">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white mb-6 tracking-tight">
              Our Story
            </h2>

            <div className="text-lg text-gray-600 dark:text-gray-300 leading-relaxed space-y-4">
              <p>
                Every great brand begins with a bold step—and ours started behind the scenes. Established in{" "}
                <strong>2015</strong>, <strong>NMF INTERNATIONAL</strong> began its journey in{" "}
                <strong>Ambur, Tamil Nadu</strong>, a region known for its rich legacy in leather and footwear
                craftsmanship.
              </p>
              <p>
                In our early years, we focused on <strong>manufacturing high-quality shoes</strong> for other
                well-known brands and footwear showrooms, perfecting our craft, and building a reputation for reliability,
                precision, and excellence.
              </p>
              <p>
                But deep down, we had a bigger dream: to create a brand of our own. That dream came to life in{" "}
                <strong>August 2018</strong> with the launch of <strong>FiCi</strong>.
              </p>
              <p>
                <strong>FiCi</strong> was born to break the mold—blending timeless quality with contemporary design.
                Every pair of FiCi shoes is a product of passion, innovation, and attention to detail, crafted to move
                with you through every chapter of life.
              </p>
              <p>
                What began in a small workshop in Ambur has now grown into a proudly homegrown brand, trusted by
                customers who value both style and substance.
              </p>
              <p>
                <strong>
                  From manufacturer to brand-builder, from Ambur to across the nation—<strong>Fici Shoes is a proud brand of NMF International</strong>. 
                  It's more than just footwear. It's a journey. And it's just getting started.
                </strong>
              </p>
              <p>
                <strong>Fici Shoes by NMF INTERNATIONAL — Crafted in Ambur, Since 2018.</strong>
              </p>
            </div>
          </div>
        </div>

        <div className="text-center mb-12">
          <h3 className="text-3xl md:text-4xl lg:text-5xl font-bold text-[color:var(--color-text-light)] dark:text-[color:var(--color-text-dark)] mb-8 md:mb-12 tracking-tight">
            SETTING OURSELVES APART
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            <div className="bg-[color:var(--color-light1)] dark:bg-[color:var(--color-dark2)] p-6 md:p-8 rounded-2xl shadow-lg border border-[color:var(--color-secondary)] dark:border-gray-700 hover:shadow-xl transition-shadow duration-200">
              <div className="w-12 h-12 md:w-16 md:h-16 bg-[color:var(--color-accent)] rounded-full flex items-center justify-center mx-auto mb-4 md:mb-6">
                <svg className="w-6 h-6 md:w-8 md:h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h4 className="text-lg md:text-xl font-bold text-[color:var(--color-text-light)] dark:text-[color:var(--color-text-dark)] mb-3 md:mb-4">
                Wide Footwear Collection
              </h4>
              <p className="text-sm md:text-base text-[color:var(--color-text-light)] dark:text-[color:var(--color-text-dark)] leading-relaxed">
                From everyday essentials to statement styles, we offer an extensive range of shoes tailored for every
                occasion and personality.
              </p>
            </div>

            <div className="bg-[color:var(--color-light1)] dark:bg-[color:var(--color-dark2)] p-6 md:p-8 rounded-2xl shadow-lg border border-[color:var(--color-secondary)] dark:border-gray-700 hover:shadow-xl transition-shadow duration-200">
              <div className="w-12 h-12 md:w-16 md:h-16 bg-[color:var(--color-accent)] rounded-full flex items-center justify-center mx-auto mb-4 md:mb-6">
                <svg className="w-6 h-6 md:w-8 md:h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                  />
                </svg>
              </div>
              <h4 className="text-lg md:text-xl font-bold text-[color:var(--color-text-light)] dark:text-[color:var(--color-text-dark)] mb-3 md:mb-4">
                Craftsmanship & Comfort
              </h4>
              <p className="text-sm md:text-base text-[color:var(--color-text-light)] dark:text-[color:var(--color-text-dark)] leading-relaxed">
                Each pair is designed with precision, using premium materials to ensure long-lasting comfort and
                contemporary aesthetics.
              </p>
            </div>

            <div className="bg-[color:var(--color-light1)] dark:bg-[color:var(--color-dark2)] p-6 md:p-8 rounded-2xl shadow-lg border border-[color:var(--color-secondary)] dark:border-gray-700 hover:shadow-xl transition-shadow duration-200 md:col-span-2 lg:col-span-1">
              <div className="w-12 h-12 md:w-16 md:h-16 bg-[color:var(--color-accent)] rounded-full flex items-center justify-center mx-auto mb-4 md:mb-6">
                <svg className="w-6 h-6 md:w-8 md:h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h4 className="text-lg md:text-xl font-bold text-[color:var(--color-text-light)] dark:text-[color:var(--color-text-dark)] mb-3 md:mb-4">
                Seamless Shopping Experience
              </h4>
              <p className="text-sm md:text-base text-[color:var(--color-text-light)] dark:text-[color:var(--color-text-dark)] leading-relaxed">
                Enjoy fast delivery, secure payments, and responsive customer support — all through a smooth and modern
                online interface.
              </p>
            </div>
          </div>
        </div>

        {/* SEO Content Section - Detailed company information */}
        <section className="py-12 sm:py-16 bg-white dark:bg-gray-900">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-6">
              Premium Handcrafted Leather Footwear from Ambur, India
            </h2>
            <div className="prose prose-lg max-w-none text-gray-700 dark:text-gray-300 space-y-4">
              <p>
                FiCi Shoes by NMF International brings you the finest handcrafted leather footwear from the leather capital of India - Ambur, Tamil Nadu. With over 10 years of heritage in leather craftsmanship, we combine traditional artistry with modern comfort to create premium leather shoes that stand the test of time.
              </p>
              <p>
                Our collection features a wide range of leather footwear including formal lace-ups, slip-ons, Chelsea boots, leather chappals, and traditional sandals. Each pair is meticulously crafted using premium milled leather sourced from the finest tanneries, ensuring durability, comfort, and style. Whether you're looking for office wear, casual outings, or special occasions, our leather shoes are designed to make a statement.
              </p>
              <p>
                At FiCi Shoes, we believe in delivering quality directly from the factory to your doorstep. Our wholesale prices make premium leather footwear accessible without compromising on craftsmanship. Every shoe undergoes rigorous quality checks to ensure it meets our high standards of excellence. From the stitching to the finishing, every detail reflects our commitment to quality.
              </p>
              <p>
                We offer customization options to ensure the perfect fit and style for our customers. Our skilled artisans in Ambur can create bespoke leather shoes tailored to your preferences. We ship across India, bringing authentic Ambur leather craftsmanship to customers nationwide. Our customer service team is always ready to assist you with sizing, styling, and any queries you may have.
              </p>
              <p>
                Shop with confidence at FiCi Shoes. We are a GST-registered business (GST: 33BMAPM8509H1Z4) committed to transparency and customer satisfaction. Our easy returns policy, secure payment options including Razorpay and Cash on Delivery, and responsive support ensure a seamless shopping experience. Join thousands of satisfied customers who trust FiCi Shoes for their premium leather footwear needs.
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
    </>
  );
};

export default AboutPage;

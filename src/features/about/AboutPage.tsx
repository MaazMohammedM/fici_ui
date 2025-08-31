import React from "react";

const AboutPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-[color:var(--color-light1)] dark:bg-[color:var(--color-dark1)]">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Hero Section - Mobile Layout */}
        <div className="text-center lg:hidden mb-16">
          {/* 3D Sphere Visual - Mobile */}
          <div className="w-32 h-32 mx-auto mb-8 relative">
            <div className="w-full h-full rounded-full bg-gradient-to-br from-white via-yellow-200 to-blue-200 shadow-lg transform rotate-12">
              <div className="w-full h-full rounded-full bg-gradient-to-br from-white/80 via-yellow-100/80 to-blue-100/80 backdrop-blur-sm"></div>
            </div>
          </div>

          <h1 className="text-4xl md:text-5xl font-bold text-[color:var(--color-text-light)] dark:text-[color:var(--color-text-dark)] mb-6 tracking-tight">
            THE FiCi STORY
          </h1>

          <p className="text-lg md:text-xl text-[color:var(--color-text-light)] dark:text-[color:var(--color-text-dark)] max-w-4xl mx-auto leading-relaxed">
            At FiCi, we believe footwear is more than fashion — it’s an expression of confidence, comfort, and class.
            Every step we craft is built on tradition, powered by innovation, and designed to win hearts everywhere.
          </p>
        </div>

        <div className="hidden lg:flex items-center justify-between mb-16">
          <div className="flex-1 pr-12">
            <h1 className="text-5xl font-bold text-[color:var(--color-text-light)] dark:text-[color:var(--color-text-dark)] mb-6 tracking-tight">
              Our Mission
            </h1>

            <div className="text-xl text-[color:var(--color-text-light)] dark:text-[color:var(--color-text-dark)] leading-relaxed space-y-6">
              <p>
                At <strong>FiCi</strong>, our mission is simple yet powerful:{" "}
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

          <div className="w-24 h-24 flex-shrink-0">
            <div className="w-full h-full rounded-full bg-gradient-to-br from-white via-yellow-200 to-blue-200 shadow-lg transform rotate-12">
              <div className="w-full h-full rounded-full bg-gradient-to-br from-white/80 via-yellow-100/80 to-blue-100/80 backdrop-blur-sm"></div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center mb-16">
          <div className="order-2 lg:order-1">
            <div className="rounded-2xl overflow-hidden shadow-xl">
              <img
                src="https://sp-ao.shortpixel.ai/client/to_auto,q_lossless,ret_img,w_851,h_451/https://www.orientbell.com/blog/wp-content/uploads/2024/02/850x450-Pix_2-13.jpg"
                alt="Team meeting at table"
                className="w-full h-80 lg:h-96 object-cover"
              />
            </div>
          </div>

          <div className="order-1 lg:order-2">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-[color:var(--color-text-light)] dark:text-[color:var(--color-text-dark)] mb-6 tracking-tight">
              Our Story
            </h2>

            <div className="text-lg text-[color:var(--color-text-light)] dark:text-[color:var(--color-text-dark)] leading-relaxed space-y-4">
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
                  From manufacturer to brand-builder, from Ambur to across the nation—FiCi is more than just footwear.
                  It’s a journey. And it’s just getting started.
                </strong>
              </p>
              <p>
                <strong>FiCi by NMF INTERNATIONAL — Crafted in Ambur, Since 2018.</strong>
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
      </div>
    </div>
  );
};

export default AboutPage;

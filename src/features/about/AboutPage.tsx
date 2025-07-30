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
            THE ELITE CLICK STORY
          </h1>
          
          <p className="text-lg md:text-xl text-[color:var(--color-text-light)] dark:text-[color:var(--color-text-dark)] max-w-4xl mx-auto leading-relaxed">
            At Elite Click, we revolutionize business in Dubai. Our passionate team simplifies company formation, 
            leveraging industry expertise for seamless success. Rooted in Dubai's thriving ecosystem, our vision 
            is to catalyze entrepreneurial growth, striving to be your go-to partner for innovation and prosperity.
          </p>
        </div>

        {/* Hero Section - Desktop Layout */}
        <div className="hidden lg:flex items-center justify-between mb-16">
          <div className="flex-1 pr-12">
            <h1 className="text-5xl font-bold text-[color:var(--color-text-light)] dark:text-[color:var(--color-text-dark)] mb-6 tracking-tight">
              THE ELITE CLICK STORY
            </h1>
            
            <p className="text-xl text-[color:var(--color-text-light)] dark:text-[color:var(--color-text-dark)] leading-relaxed">
              At Elite Click, we revolutionize business in Dubai. Our passionate team simplifies company formation, 
              leveraging industry expertise for seamless success. Rooted in Dubai's thriving ecosystem, our vision 
              is to catalyze entrepreneurial growth, striving to be your go-to partner for innovation and prosperity.
            </p>
          </div>
          
          {/* 3D Sphere Visual - Desktop */}
          <div className="w-24 h-24 flex-shrink-0">
            <div className="w-full h-full rounded-full bg-gradient-to-br from-white via-yellow-200 to-blue-200 shadow-lg transform rotate-12">
              <div className="w-full h-full rounded-full bg-gradient-to-br from-white/80 via-yellow-100/80 to-blue-100/80 backdrop-blur-sm"></div>
            </div>
          </div>
        </div>

        {/* Main Content Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center mb-16">
          {/* Left Column - Image */}
          <div className="order-2 lg:order-1">
            <div className="rounded-2xl overflow-hidden shadow-xl">
              <img 
                src="https://images.unsplash.com/photo-1552664730-d307ca884978?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80"
                alt="Team meeting at table"
                className="w-full h-80 lg:h-96 object-cover"
              />
            </div>
          </div>

          {/* Right Column - Content */}
          <div className="order-1 lg:order-2">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-[color:var(--color-text-light)] dark:text-[color:var(--color-text-dark)] mb-6 tracking-tight">
              COMMITTED TO YOUR VISION
            </h2>
            
            <p className="text-lg text-[color:var(--color-text-light)] dark:text-[color:var(--color-text-dark)] mb-8 leading-relaxed">
              At Elite Click, integrity, transparency, and dedication are the cornerstones of our ethos. 
              We pledge to be your reliable partner, guiding you with honesty, integrity, and a steadfast 
              commitment to your success.
            </p>
            
            <button className="inline-flex items-center px-6 py-3 md:px-8 md:py-4 bg-[color:var(--color-text-light)] dark:bg-[color:var(--color-text-dark)] text-[color:var(--color-text-dark)] dark:text-[color:var(--color-text-light)] rounded-lg font-semibold text-base md:text-lg shadow-lg hover:shadow-xl transition-all duration-200 group">
              <span>Let's Get Started</span>
              <svg className="w-4 h-4 md:w-5 md:h-5 ml-2 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </button>
          </div>
        </div>

        {/* Features Section */}
        <div className="text-center mb-12">
          <h3 className="text-3xl md:text-4xl lg:text-5xl font-bold text-[color:var(--color-text-light)] dark:text-[color:var(--color-text-dark)] mb-8 md:mb-12 tracking-tight">
            SETTING OURSELVES APART
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {/* Feature Card 1 */}
            <div className="bg-[color:var(--color-light1)] dark:bg-[color:var(--color-dark2)] p-6 md:p-8 rounded-2xl shadow-lg border border-[color:var(--color-secondary)] dark:border-gray-700 hover:shadow-xl transition-shadow duration-200">
              <div className="w-12 h-12 md:w-16 md:h-16 bg-[color:var(--color-accent)] rounded-full flex items-center justify-center mx-auto mb-4 md:mb-6">
                <svg className="w-6 h-6 md:w-8 md:h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h4 className="text-lg md:text-xl font-bold text-[color:var(--color-text-light)] dark:text-[color:var(--color-text-dark)] mb-3 md:mb-4">
                Diverse Service Portfolio
              </h4>
              <p className="text-sm md:text-base text-[color:var(--color-text-light)] dark:text-[color:var(--color-text-dark)] leading-relaxed">
                Comprehensive solutions covering all aspects of business formation and growth, from initial setup to ongoing support.
              </p>
            </div>

            {/* Feature Card 2 */}
            <div className="bg-[color:var(--color-light1)] dark:bg-[color:var(--color-dark2)] p-6 md:p-8 rounded-2xl shadow-lg border border-[color:var(--color-secondary)] dark:border-gray-700 hover:shadow-xl transition-shadow duration-200">
              <div className="w-12 h-12 md:w-16 md:h-16 bg-[color:var(--color-accent)] rounded-full flex items-center justify-center mx-auto mb-4 md:mb-6">
                <svg className="w-6 h-6 md:w-8 md:h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <h4 className="text-lg md:text-xl font-bold text-[color:var(--color-text-light)] dark:text-[color:var(--color-text-dark)] mb-3 md:mb-4">
                Exceptional Expertise
              </h4>
              <p className="text-sm md:text-base text-[color:var(--color-text-light)] dark:text-[color:var(--color-text-dark)] leading-relaxed">
                Deep industry knowledge and years of experience in Dubai's business landscape, ensuring expert guidance.
              </p>
            </div>

            {/* Feature Card 3 */}
            <div className="bg-[color:var(--color-light1)] dark:bg-[color:var(--color-dark2)] p-6 md:p-8 rounded-2xl shadow-lg border border-[color:var(--color-secondary)] dark:border-gray-700 hover:shadow-xl transition-shadow duration-200 md:col-span-2 lg:col-span-1">
              <div className="w-12 h-12 md:w-16 md:h-16 bg-[color:var(--color-accent)] rounded-full flex items-center justify-center mx-auto mb-4 md:mb-6">
                <svg className="w-6 h-6 md:w-8 md:h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h4 className="text-lg md:text-xl font-bold text-[color:var(--color-text-light)] dark:text-[color:var(--color-text-dark)] mb-3 md:mb-4">
                Excellence in Execution
              </h4>
              <p className="text-sm md:text-base text-[color:var(--color-text-light)] dark:text-[color:var(--color-text-dark)] leading-relaxed">
                Meticulous attention to detail and proven track record of successful business formations and growth strategies.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AboutPage; 
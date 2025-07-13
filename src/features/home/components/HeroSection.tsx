import React from 'react'
import heroImage from '../assets/heroImage.jpg'

const HeroSection: React.FC = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 overflow-hidden">
      

      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center text-center max-w-4xl mx-auto">
          {/* Hero Text Section */}
          <div className="mb-8 sm:mb-12 lg:mb-16 space-y-4 sm:space-y-6">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold text-gray-900 leading-tight">
              <span className="block">Crafted</span>
              <span className="block text-amber-600">Excellence</span>
            </h1>
            
            <p className="text-lg sm:text-xl lg:text-2xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
              Discover the perfect blend of style and comfort with our handcrafted leather shoes. 
              Every step tells a story of quality and craftsmanship.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center items-center pt-4">
              <button className="px-8 py-3 sm:px-10 sm:py-4 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl">
                Shop Collection
              </button>
              <button className="px-8 py-3 sm:px-10 sm:py-4 border-2 border-amber-600 text-amber-600 hover:bg-amber-600 hover:text-white font-semibold rounded-lg transition-all duration-300 transform hover:scale-105">
                Learn More
              </button>
            </div>
          </div>

          {/* Hero Image Section */}
          <div className="relative w-full max-w-4xl">
            <div className="relative">
              {/* Placeholder for the leather shoe image */}
              <div className="w-full h-64 sm:h-80 lg:h-96 xl:h-[500px] bg-gradient-to-br from-amber-200 to-amber-300 rounded-2xl shadow-2xl flex items-center justify-center">
                <img src={heroImage} alt="hero-image" className='w-full h-full object-cover rounded-2xl' />
              </div>
              
              {/* Floating elements around the image */}
              <div className="absolute -top-4 -left-4 w-8 h-8 bg-amber-400 rounded-full opacity-20 animate-pulse"></div>
              <div className="absolute -bottom-4 -right-4 w-6 h-6 bg-amber-300 rounded-full opacity-20 animate-pulse delay-1000"></div>
              <div className="absolute top-1/2 -right-6 w-4 h-4 bg-amber-200 rounded-full opacity-20 animate-pulse delay-500"></div>
            </div>
          </div>

          {/* Scroll indicator */}
          <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
            <div className="w-6 h-10 border-2 border-gray-400 rounded-full flex justify-center">
              <div className="w-1 h-3 bg-gray-400 rounded-full mt-2 animate-pulse"></div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default HeroSection
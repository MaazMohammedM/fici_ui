import React from "react";

const trustItems = [
  {
    icon: "🚚",
    title: "Free Shipping",
    description: "On orders above ₹999",
    color: "from-blue-500 to-blue-600"
  },
  {
    icon: "🛡️",
    title: "Premium Quality",
    description: "100% genuine leather",
    color: "from-green-500 to-green-600"
  },
  {
    icon: "🎧",
    title: "24/7 Support",
    description: "Dedicated customer service",
    color: "from-purple-500 to-purple-600"
  },
  {
    icon: "🏆",
    title: "Satisfaction Guaranteed",
    description: "3-day replacement policy",
    color: "from-orange-500 to-orange-600"
  }
];

const TrustStrip: React.FC = () => {
  return (
    <section className="w-full bg-white dark:bg-gray-900 border-y border-gray-200 dark:border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 py-6 sm:py-8">
          {trustItems.map((item, index) => (
            <div 
              key={index}
              className="flex flex-col items-center text-center space-y-2 sm:space-y-3 group"
            >
              {/* Icon container with gradient background */}
              <div className={`w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-gradient-to-r ${item.color} flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                <span className="text-xl sm:text-2xl">{item.icon}</span>
              </div>
              
              {/* Content */}
              <div className="space-y-1">
                <h3 className="font-semibold text-gray-900 dark:text-white text-sm sm:text-base">
                  {item.title}
                </h3>
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 text-center mx-auto">
                  {item.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TrustStrip;

import React from "react";
import { Truck, Shield, Headphones, Award } from "lucide-react";

const trustItems = [
  {
    icon: Truck,
    title: "Free Shipping",
    description: "On orders above ₹999",
    color: "from-blue-500 to-blue-600"
  },
  {
    icon: Shield,
    title: "Premium Quality",
    description: "100% genuine leather",
    color: "from-green-500 to-green-600"
  },
  {
    icon: Headphones,
    title: "24/7 Support",
    description: "Dedicated customer service",
    color: "from-purple-500 to-purple-600"
  },
  {
    icon: Award,
    title: "Satisfaction Guaranteed",
    description: "30-day return policy",
    color: "from-orange-500 to-orange-600"
  }
];

const TrustStrip: React.FC = () => {
  return (
    <section className="w-full bg-white dark:bg-gray-900 border-y border-gray-200 dark:border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8 py-8 sm:py-12">
          {trustItems.map((item, index) => (
            <div 
              key={index}
              className="flex flex-col items-center text-center space-y-3 group"
            >
              {/* Icon container with gradient background */}
              <div className={`w-16 h-16 rounded-full bg-gradient-to-r ${item.color} flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                <item.icon className="w-8 h-8" />
              </div>
              
              {/* Content */}
              <div className="space-y-1">
                <h3 className="font-semibold text-gray-900 dark:text-white text-base sm:text-lg">
                  {item.title}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 max-w-[150px]">
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

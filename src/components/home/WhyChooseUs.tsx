import React from "react";
import { HandHeart, Award, Users, Clock } from "lucide-react";

const features = [
  {
    icon: HandHeart,
    title: "Handcrafted Quality",
    description: "Each piece is meticulously crafted by skilled artisans using premium materials",
    color: "from-amber-500 to-orange-600"
  },
  {
    icon: Award,
    title: "Premium Materials",
    description: "We source only the finest genuine leather and materials for our products",
    color: "from-blue-500 to-indigo-600"
  },
  {
    icon: Users,
    title: "Customer First",
    description: "Your satisfaction is our priority with dedicated support and hassle-free returns",
    color: "from-green-500 to-emerald-600"
  },
  {
    icon: Clock,
    title: "Timeless Design",
    description: "Classic styles that never go out of fashion, built to last for years",
    color: "from-purple-500 to-pink-600"
  }
];

const WhyChooseUs: React.FC = () => {
  return (
    <section className="w-full py-16 sm:py-20 lg:py-24 bg-gradient-to-br from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6">
            Why Choose FICI
          </h2>
          <p className="text-lg sm:text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto leading-relaxed">
            We're committed to delivering exceptional quality and style in every piece we create. 
            Discover what makes us the preferred choice for discerning customers.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <div 
              key={index}
              className="text-center group"
            >
              {/* Icon Container */}
              <div className={`w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-r ${feature.color} flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                <feature.icon className="w-10 h-10" />
              </div>
              
              {/* Content */}
              <div className="space-y-4">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                  {feature.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default WhyChooseUs;

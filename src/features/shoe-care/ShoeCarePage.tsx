import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Shield, Truck, RefreshCw, Heart } from 'lucide-react';

const ShoeCarePage: React.FC = () => {
  const careTips = [
    {
      title: 'Regular Cleaning',
      description: 'Gently brush off dirt and debris after each use. Use a soft brush or cloth to maintain the material.'
    },
    {
      title: 'Proper Storage',
      description: 'Store shoes in a cool, dry place. Use shoe trees to maintain shape and absorb moisture.'
    },
    {
      title: 'Waterproofing',
      description: 'Apply a suitable waterproofing spray to protect against water damage and stains.'
    },
    {
      title: 'Rotation',
      description: 'Rotate between multiple pairs to allow shoes to air out and maintain their shape.'
    }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-gray-900 to-gray-700 rounded-3xl text-white p-8 md:p-12 mb-12">
        <h1 className="text-4xl md:text-5xl font-bold mb-4">Shoe Care Guide</h1>
        <p className="text-xl md:text-2xl text-gray-200 max-w-3xl">
          Keep your favorite footwear looking fresh and lasting longer with our expert care tips and products.
        </p>
      </div>

      {/* Main Content */}
      <div className="grid md:grid-cols-3 gap-8 mb-12">
        {/* Care Tips */}
        <div className="md:col-span-2">
          <h2 className="text-2xl font-bold mb-6">Essential Shoe Care Tips</h2>
          <div className="space-y-6">
            {careTips.map((tip, index) => (
              <div key={index} className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
                <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">{tip.title}</h3>
                <p className="text-gray-600 dark:text-gray-300">{tip.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Links */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
            <h3 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Quick Links</h3>
            <ul className="space-y-3">
              <li>
                <Link to="/products?category=cleaning" className="flex items-center text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 transition-colors">
                  <ChevronRight className="w-4 h-4 mr-2" />
                  Cleaning Products
                </Link>
              </li>
              <li>
                <Link to="/products?category=care-kits" className="flex items-center text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 transition-colors">
                  <ChevronRight className="w-4 h-4 mr-2" />
                  Care Kits
                </Link>
              </li>
              <li>
                <Link to="/contact" className="flex items-center text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 transition-colors">
                  <ChevronRight className="w-4 h-4 mr-2" />
                  Ask an Expert
                </Link>
              </li>
            </ul>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
            <h3 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Why Care Matters</h3>
            <ul className="space-y-4">
              <li className="flex items-start">
                <Shield className="w-5 h-5 text-green-500 mt-0.5 mr-3 flex-shrink-0" />
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white">Extended Lifespan</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Proper care can double the life of your shoes</p>
                </div>
              </li>
              <li className="flex items-start">
                <RefreshCw className="w-5 h-5 text-green-500 mt-0.5 mr-3 flex-shrink-0" />
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white">Better Performance</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Well-maintained shoes perform better</p>
                </div>
              </li>
              <li className="flex items-start">
                <Heart className="w-5 h-5 text-green-500 mt-0.5 mr-3 flex-shrink-0" />
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white">Eco-Friendly</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Reduce waste by making your shoes last longer</p>
                </div>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-gradient-to-r from-green-600 to-green-700 rounded-3xl text-white p-8 md:p-12 text-center">
        <Truck className="w-12 h-12 mx-auto mb-4" />
        <h2 className="text-2xl md:text-3xl font-bold mb-4">Need Professional Help?</h2>
        <p className="text-lg text-green-100 max-w-2xl mx-auto mb-6">
          Try our professional shoe care service and get your favorite pairs looking brand new.
        </p>
        <button className="bg-white text-green-700 hover:bg-gray-100 px-6 py-3 rounded-full font-medium transition-colors">
          Book a Service
        </button>
      </div>
    </div>
  );
};

export default ShoeCarePage;

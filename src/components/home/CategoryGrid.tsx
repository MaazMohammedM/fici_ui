import React from "react";
import { Link } from "react-router-dom";
import { useProductStore } from "@store/productStore";
import type { Category } from "../../types/product";

// Import category images
import shoesImage from "@/assets/1000876119.jpg";
import sandalsImage from "@/assets/1000876133.jpg";
import bagsImage from "@/assets/1000250076.jpg";
import accessoriesImage from "@/assets/1000876149.png";

const categories: Category[] = [
  { id: "Shoes", name: "Shoes", image: shoesImage, count: 0 },
  { id: "Sandals", name: "Sandals", image: sandalsImage, count: 0 },
  { id: "Bags", name: "Bags", image: bagsImage, count: 0 },
  { id: "Accessories", name: "Accessories", image: accessoriesImage, count: 0 },
];

const CategoryGrid: React.FC = () => {
  const { products } = useProductStore();

  const categoriesWithCount = categories.map((category) => ({
    ...category,
    count: products.filter((product) => product.sub_category === category.id).length,
  }));

  return (
    <section className="w-full py-16 sm:py-20 lg:py-24 bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row justify-between items-center mb-8 sm:mb-12 lg:mb-16">
          <div className="flex-1 text-center sm:text-left">
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white mb-3 sm:mb-4">
              Shop by Category
            </h2>
            <p className="text-base sm:text-lg lg:text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto sm:mx-0">
              Explore our curated collections of premium leather products
            </p>
          </div>
          <div className="w-full flex justify-end mt-4 sm:mt-0 sm:w-auto">
            <Link
              to="/products"
              className="inline-flex items-center gap-2 bg-black dark:bg-white text-white dark:text-black px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-800 dark:hover:bg-gray-200 transition-all duration-300 hover:scale-105 shadow-lg"
            >
              See All
            </Link>
          </div>
        </div>

        {/* Category Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 lg:gap-8">
          {categoriesWithCount.map((category, index) => (
            <Link
              key={category.id}
              to={`/products?sub_category=${category.id}`}
              className="group block"
            >
              <div className="relative overflow-hidden rounded-lg sm:rounded-xl lg:rounded-2xl bg-white dark:bg-gray-800 shadow-sm hover:shadow-xl transition-all duration-300 group-hover:scale-105">
                {/* Image Container */}
                <div className="aspect-square sm:aspect-[4/3] lg:aspect-[3/2] overflow-hidden">
                  <img
                    src={category.image}
                    alt={category.name}
                    className="w-full h-full object-cover object-center transition-transform duration-700 group-hover:scale-110"
                    loading="lazy"
                    decoding="async"
                  />
                  
                  {/* Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </div>
                
                {/* Content */}
                <div className="absolute bottom-0 left-0 right-0 p-2 sm:p-3 lg:p-4 bg-gradient-to-t from-black/80 to-transparent">
                  <div className="flex items-center justify-between text-white">
                    <div className="flex-1 min-w-0 pr-2">
                      <h3 className="text-xs sm:text-sm lg:text-base font-bold mb-1 truncate">{category.name}</h3>
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

export default CategoryGrid;

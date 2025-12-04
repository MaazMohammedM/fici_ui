import React from "react";
import { Link } from "react-router-dom";
import { useProductStore } from "@store/productStore";
import type { Category } from "../../../types/product";

// Import category images
import shoesImage from "@/assets/1000876119.jpg";
import sandalsImage from "@/assets/1000876133.jpg";
import bagsImage from "@/assets/1000876107.jpg";
import accessoriesImage from "@/assets/1000876149.png";

const categories: Category[] = [
  { id: "Shoes", name: "Shoes", image: shoesImage, count: 0 },
  { id: "Sandals", name: "Sandals", image: sandalsImage, count: 0 },
  { id: "Bags", name: "Bags", image: bagsImage, count: 0 },
  { id: "Accessories", name: "Accessories", image: accessoriesImage, count: 0 },
];

const PopularCategoriesSection: React.FC = () => {
  const { products } = useProductStore();

  const categoriesWithCount = categories.map((category) => ({
    ...category,
    count: products.filter((product) => product.sub_category === category.id).length,
  }));

  return (
    <section className="w-full">
      {/* Compact tech-premium header */}
      <div className="text-center mb-6 sm:mb-8 lg:mb-10">
        <div className="space-y-2">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600 bg-clip-text text-transparent bg-300% animate-gradient">
            Shop by Category
          </h2>
          <p className="text-base sm:text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
            Explore curated collections of premium footwear
          </p>
        </div>
        
        {/* Compact decorative elements */}
        <div className="flex items-center justify-center gap-2 mt-4">
          <div className="h-0.5 w-12 bg-gradient-to-r from-transparent via-purple-500 to-transparent"></div>
          <div className="w-2 h-2 rounded-full bg-gradient-to-r from-purple-500 to-pink-500"></div>
          <div className="h-0.5 w-12 bg-gradient-to-l from-transparent via-purple-500 to-transparent"></div>
        </div>
      </div>

      {/* Tailwind grid layout - 2 mobile, 3 tablet, 4 desktop */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4 lg:gap-6">
        {categoriesWithCount.map((category, index) => (
          <Link
            key={category.id}
            to={`/products?sub_category=${category.id}`}
            className="animate-fade-in-up"
            style={{
              animationDelay: `${index * 150}ms` 
            }}
          >
            {/* Tech-premium glassmorphism card */}
            <div className="relative aspect-[16/10] w-full overflow-hidden bg-gradient-to-br from-white/10 to-white/5 dark:from-black/20 dark:to-black/10 backdrop-blur-xl rounded-3xl border border-white/20 dark:border-white/10 shadow-[inset_0_1px_0_rgba(255,255,255,0.1),0_8px_32px_rgba(0,0,0,0.1)] hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.2),0_12px_40px_rgba(0,0,0,0.15)] transition-all duration-300">
              {/* Image with premium loading */}
              <img
                src={category.image}
                alt={category.name}
                className="w-full h-full object-cover object-center transition-all duration-700 group-hover:scale-105 group-hover:brightness-110"
                loading="lazy"
                decoding="async"
              />
                
              {/* Tech-premium glassmorphism overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 backdrop-blur-sm"></div>
                
              {/* Category count badge */}
              {category.count > 0 && (
                <div className="absolute top-4 right-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white px-3 py-1.5 rounded-full text-sm font-semibold shadow-lg transform translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300 delay-100">
                  {category.count} items
                </div>
              )}
                
              {/* Tech-premium text overlay
              <div className="absolute inset-0 flex items-end p-4 sm:p-6">
                <div className="space-y-3">
                  <h3 className="text-2xl sm:text-3xl font-black text-white drop-shadow-[0_4px_16px_rgba(0,0,0,0.8)] transform transition-transform duration-300 group-hover:scale-105">
                    <span className="bg-gradient-to-r from-white via-purple-100 to-pink-100 bg-clip-text text-transparent">
                      {category.name}
                    </span>
                  </h3>
                  <div className="flex items-center gap-2 text-white/90 text-sm font-medium transform translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300 delay-150">
                    <span>Explore Collection</span>
                    <svg className="w-4 h-4 transform group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                  </div>
                </div>
              </div> */}
                
              {/* Tech-premium shimmer effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out pointer-events-none"></div>
              
              {/* Tech-premium bottom section */}
              <div className="p-4 bg-gradient-to-b from-transparent to-white/10 dark:to-black/20 backdrop-blur-sm rounded-b-3xl border-t border-white/10 dark:border-white/5">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
                    {category.count > 0 ? `${category.count} products` : 'New Collection'}
                  </span>
                  <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center text-white transform group-hover:rotate-45 transition-transform duration-300 shadow-lg">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
};

export default PopularCategoriesSection;
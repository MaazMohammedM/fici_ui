import React from "react";
import { Link } from "react-router-dom";
import { useProductStore } from "@store/productStore";
import type { Category } from "../../../types/product";

// Import category images
import shoesImage from "@/assets/1000805156_pc.jpg";
import sandalsImage from "@/assets/1000805147_pc.jpg";
import bagsImage from "@/assets/1000805157_pc.jpg";
import accessoriesImage from "@/assets/1000805146_pc.jpg";

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
    <section className="bg-gradient-light dark:bg-gradient-dark py-12 lg:py-20 px-4 lg:px-16">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl lg:text-4xl font-bold text-primary dark:text-secondary mb-3">
            Shop by Category
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            Discover our premium collection of footwear and accessories
          </p>
        </div>

        {/* Mobile: scrollable */}
        <div className="flex md:hidden items-stretch gap-4 w-full overflow-x-auto pb-6 scrollbar-hide -mx-4 px-4 snap-x snap-mandatory">
          {categoriesWithCount.map((category) => (
            <Link
              key={category.id}
              to={`/products?sub_category=${category.id}`}
              className="flex-shrink-0 w-[85%] sm:w-72 rounded-2xl bg-white dark:bg-dark2 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02] overflow-hidden group snap-center mx-1"
            >
              <div className="relative aspect-[4/3] w-full overflow-hidden">
                <img
                  src={category.image}
                  alt={category.name}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent flex items-end p-5">
                  <h3 className="text-xl font-extrabold text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
                    <span className="bg-gradient-to-r from-white to-gray-200 bg-clip-text text-transparent">
                      {category.name}
                    </span>
                  </h3>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Tablet & Desktop: grid */}
        <div className="hidden md:grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
          {categoriesWithCount.map((category) => (
            <Link
              key={category.id}
              to={`/products?sub_category=${category.id}`}
              className="group relative overflow-hidden rounded-2xl bg-white dark:bg-dark2 shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 h-full flex flex-col"
            >
              <div className="relative aspect-[4/3] w-full overflow-hidden">
                <img
                  src={category.image}
                  alt={category.name}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent flex items-end p-5">
                  <h3 className="text-xl font-extrabold text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
                    <span className="bg-gradient-to-r from-white to-gray-200 bg-clip-text text-transparent"/>
                    {category.name}
                  </h3>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};
export default PopularCategoriesSection;
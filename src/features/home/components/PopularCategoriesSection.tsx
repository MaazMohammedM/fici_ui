import React from "react";
import { Link } from "react-router-dom";
import { useProductStore } from "@store/productStore";
import type { Category } from "../../../types/product";

const categories: Category[] = [
  { id: "shoes", name: "Shoes", image: "/images/shoes-category.jpg", count: 0 },
  { id: "sandals", name: "Sandals", image: "/images/sandals-category.jpg", count: 0 },
  { id: "chappals", name: "Chappals", image: "/images/chappals-category.jpg", count: 0 },
];

const PopularCategoriesSection: React.FC = () => {
  const { products } = useProductStore();

  const categoriesWithCount = categories.map((category) => ({
    ...category,
    count: products.filter((product) => product.sub_category === category.id).length,
  }));

  return (
    <section className="bg-gradient-light dark:bg-gradient-dark py-8 lg:py-16 px-4 lg:px-16">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-2xl lg:text-3xl font-bold text-primary dark:text-secondary mb-6 lg:mb-8 text-center">
          Shop by Category
        </h2>

        {/* Mobile: scrollable */}
        <div className="flex md:hidden items-start gap-4 w-full overflow-x-auto pb-4 scrollbar-hide">
          {categoriesWithCount.map((category) => (
            <Link
              key={category.id}
              to={`/products?sub_category=${category.id}`}
              className="flex-shrink-0 w-64 sm:w-72 rounded-2xl bg-white dark:bg-dark2 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
            >
              <div className="p-6 text-center">
                <h3 className="text-xl font-bold text-primary dark:text-secondary mb-2">
                  {category.name}
                </h3>
                <p className="text-gray-600 dark:text-gray-400">{category.count} Products</p>
              </div>
            </Link>
          ))}
        </div>

        {/* Desktop: grid */}
        <div className="hidden md:grid grid-cols-3 gap-6 lg:gap-8">
          {categoriesWithCount.map((category) => (
            <Link
              key={category.id}
              to={`/products?sub_category=${category.id}`}
              className="group relative overflow-hidden rounded-2xl bg-white dark:bg-dark2 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
            >
              <div className="p-6 text-center">
                <h3 className="text-xl lg:text-2xl font-bold text-primary dark:text-secondary mb-2">
                  {category.name}
                </h3>
                <p className="text-gray-600 dark:text-gray-400">{category.count} Products</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

export default PopularCategoriesSection;
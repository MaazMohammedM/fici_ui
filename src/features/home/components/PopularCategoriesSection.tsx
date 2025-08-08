import React from "react";
import { Link } from "react-router-dom";
import { useProductStore } from "@store/productStore";
import type { Category } from "../../../types/product";

const categories: Category[] = [
  {
    id: "shoes",
    name: "Shoes",
    image: "/images/shoes-category.jpg",
    count: 0
  },
  {
    id: "sandals",
    name: "Sandals",
    image: "/images/sandals-category.jpg",
    count: 0
  },
  {
    id: "chappals",
    name: "Chappals",
    image: "/images/chappals-category.jpg",
    count: 0
  }
];

const PopularCategoriesSection: React.FC = () => {
  const { products } = useProductStore();

  // Calculate category counts
  const categoriesWithCount = categories.map(category => ({
    ...category,
    count: products.filter(product => product.category === category.id).length
  }));

  return (
    <section className="bg-gradient-light dark:bg-gradient-dark py-8 lg:py-16 px-4 lg:px-16">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-2xl lg:text-3xl font-bold text-primary dark:text-secondary mb-6 lg:mb-8 text-center">
          Shop by Category
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
          {categoriesWithCount.map((category) => (
            <Link
              key={category.id}
              to={`/products?category=${category.id}`}
              className="group relative overflow-hidden rounded-2xl bg-white dark:bg-dark2 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
            >
              <div className="aspect-square relative">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-accent/20 group-hover:from-primary/30 group-hover:to-accent/30 transition-all duration-300" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <h3 className="text-xl lg:text-2xl font-bold text-primary dark:text-secondary mb-2">
                      {category.name}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      {category.count} Products
                    </p>
                  </div>
                </div>
              </div>
              <div className="p-4 lg:p-6">
                <div className="flex items-center justify-between">
                  <span className="text-base lg:text-lg font-semibold text-primary dark:text-secondary">
                    {category.name}
                  </span>
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    {category.count} items
                  </span>
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
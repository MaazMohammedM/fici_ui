// src/features/product/hooks/useProductFilters.ts
import { useProductStore } from '../../store/productStore';

export const useProductFilters = () => {
  const {
    selectedCategory,
    selectedGender,
    selectedPriceRange,
    searchQuery,
    filterProducts,
    searchProducts,
    clearFilters,
  } = useProductStore();

  const handleFilterChange = (filterType: string, value: string) => {
    const currentFilters = {
      category: selectedCategory,
      gender: selectedGender,
      priceRange: selectedPriceRange,
      search: searchQuery,
    };
    currentFilters[filterType as keyof typeof currentFilters] = value;
    filterProducts(currentFilters);
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    searchProducts(e.target.value);
  };

  return {
    handleFilterChange,
    handleSearch,
    clearFilters,
  };
};
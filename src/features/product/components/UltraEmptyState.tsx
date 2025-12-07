import React from "react";
import { SearchX, Sparkles, Package, ArrowLeft, RefreshCw, XCircle, TrendingUp, Star, Zap } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface UltraEmptyStateProps {
  variant?: 'comingSoon' | 'noResults' | 'error';
  title?: string;
  description?: string;
  showBackButton?: boolean;
  showClearFiltersButton?: boolean;
  showBrowseAllButton?: boolean;
  showRefreshButton?: boolean;
  suggestedTags?: string[];
  onClearFilters?: () => void;
  onBrowseAll?: () => void;
  onGoBack?: () => void;
  onRefresh?: () => void;
}

const UltraEmptyState: React.FC<UltraEmptyStateProps> = ({
  variant = 'noResults',
  title,
  description,
  showBackButton = false,
  showClearFiltersButton = false,
  showBrowseAllButton = false,
  showRefreshButton = false,
  suggestedTags = [],
  onClearFilters,
  onBrowseAll,
  onGoBack,
  onRefresh,
}) => {
  const navigate = useNavigate();

  // Default content based on variant
  const getDefaultContent = () => {
    switch (variant) {
      case 'comingSoon':
        return {
          icon: <Sparkles className="w-12 h-12" />,
          title: 'New Products Coming Soon',
          description: 'We\'re constantly updating our collection with the latest styles. Check back soon for exciting new arrivals!',
          iconBg: 'bg-gradient-to-br from-purple-500 to-pink-500',
          accentColor: 'purple',
        };
      case 'error':
        return {
          icon: <XCircle className="w-12 h-12" />,
          title: 'Something Went Wrong',
          description: 'We encountered an error while loading products. Please try again.',
          iconBg: 'bg-gradient-to-br from-red-500 to-orange-500',
          accentColor: 'red',
        };
      case 'noResults':
      default:
        return {
          icon: <SearchX className="w-12 h-12" />,
          title: 'No Products Found',
          description: 'We couldn\'t find any products matching your criteria. Try adjusting your filters or search terms.',
          iconBg: 'bg-gradient-to-br from-blue-500 to-cyan-500',
          accentColor: 'blue',
        };
    }
  };

  const content = getDefaultContent();
  const displayTitle = title || content.title;
  const displayDescription = description || content.description;

  return (
    <div className="flex items-center justify-center min-h-[500px] py-12 px-4">
      <div className="max-w-2xl w-full">
        {/* Main Card */}
        <div className="relative bg-white dark:bg-gray-800 rounded-3xl border border-gray-200 dark:border-gray-700 shadow-xl overflow-hidden">
          {/* Animated gradient background */}
          <div className="absolute inset-0 bg-gradient-to-br from-gray-50 via-white to-gray-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 opacity-50"></div>
          
          {/* Floating orbs for visual appeal */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-purple-500/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
          
          <div className="relative z-10 p-8 sm:p-12">
            <div className="flex flex-col items-center text-center">
              {/* Animated Icon Container */}
              <div className="relative mb-6 group">
                {/* Pulsing ring effect */}
                <div className={`absolute inset-0 ${content.iconBg} rounded-2xl blur-xl opacity-30 group-hover:opacity-50 transition-opacity duration-300 animate-pulse`}></div>
                
                {/* Icon */}
                <div className={`relative ${content.iconBg} p-5 rounded-2xl text-white shadow-lg transform transition-all duration-300 group-hover:scale-110 group-hover:rotate-3`}>
                  {content.icon}
                </div>

                {/* Decorative sparkles */}
                {variant === 'noResults' && (
                  <>
                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-400 rounded-full animate-ping"></div>
                    <div className="absolute -bottom-1 -left-1 w-2 h-2 bg-blue-400 rounded-full animate-ping" style={{ animationDelay: '0.5s' }}></div>
                  </>
                )}
              </div>

              {/* Title with gradient */}
              <h2 className="text-3xl sm:text-4xl font-bold mb-3 bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 dark:from-white dark:via-gray-100 dark:to-white bg-clip-text text-transparent">
                {displayTitle}
              </h2>

              {/* Description */}
              <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-md leading-relaxed text-lg">
                {displayDescription}
              </p>

              {/* Suggested Tags with icons */}
              {suggestedTags.length > 0 && (
                <div className="mb-8 w-full">
                  <div className="flex items-center justify-center gap-2 mb-4">
                    <Zap className="w-4 h-4 text-yellow-500" />
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Try searching for:
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2 justify-center">
                    {suggestedTags.map((tag, index) => (
                      <button
                        key={index}
                        onClick={() => navigate(`/products?q=${encodeURIComponent(tag)}`)}
                        className="group relative px-5 py-2.5 bg-gradient-to-r from-white to-gray-50 dark:from-gray-700 dark:to-gray-600 border border-gray-200 dark:border-gray-600 rounded-full text-sm font-medium text-gray-700 dark:text-gray-200 hover:border-primary dark:hover:border-primary transition-all duration-300 hover:scale-105 hover:shadow-lg overflow-hidden"
                      >
                        {/* Hover effect overlay */}
                        <div className="absolute inset-0 bg-gradient-to-r from-primary/0 via-primary/5 to-primary/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
                        <span className="relative flex items-center gap-1.5">
                          <TrendingUp className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                          {tag}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-3 justify-center w-full">
                {showClearFiltersButton && onClearFilters && (
                  <button
                    onClick={onClearFilters}
                    className="group relative px-8 py-3 bg-gradient-to-r from-primary to-primary/90 text-white rounded-xl font-medium transition-all duration-300 hover:scale-105 hover:shadow-xl overflow-hidden"
                  >
                    {/* Shimmer effect */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
                    <span className="relative flex items-center gap-2">
                      <XCircle className="w-4 h-4" />
                      Clear All Filters
                    </span>
                  </button>
                )}

                {showRefreshButton && onRefresh && (
                  <button
                    onClick={onRefresh}
                    className="group relative px-8 py-3 bg-gradient-to-r from-primary to-primary/90 text-white rounded-xl font-medium transition-all duration-300 hover:scale-105 hover:shadow-xl overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
                    <span className="relative flex items-center gap-2">
                      <RefreshCw className="w-4 h-4 group-hover:rotate-180 transition-transform duration-500" />
                      Try Again
                    </span>
                  </button>
                )}

                {showBrowseAllButton && onBrowseAll && (
                  <button
                    onClick={onBrowseAll}
                    className="group px-8 py-3 bg-white dark:bg-gray-700 border-2 border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-200 rounded-xl font-medium transition-all duration-300 hover:scale-105 hover:border-primary dark:hover:border-primary hover:shadow-lg"
                  >
                    <span className="flex items-center gap-2">
                      <Package className="w-4 h-4 group-hover:scale-110 transition-transform" />
                      Browse All Products
                    </span>
                  </button>
                )}

                {showBackButton && onGoBack && (
                  <button
                    onClick={onGoBack}
                    className="group px-8 py-3 bg-white dark:bg-gray-700 border-2 border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-200 rounded-xl font-medium transition-all duration-300 hover:scale-105 hover:border-gray-300 dark:hover:border-gray-500 hover:shadow-lg"
                  >
                    <span className="flex items-center gap-2">
                      <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                      Go Back
                    </span>
                  </button>
                )}
              </div>

              {/* Bottom decorative elements */}
              {variant === 'noResults' && (
                <div className="mt-8 flex items-center gap-6 text-sm text-gray-400 dark:text-gray-500">
                  <div className="flex items-center gap-1.5">
                    <Star className="w-4 h-4 fill-current text-yellow-400" />
                    <span>Quality Products</span>
                  </div>
                  <div className="w-1 h-1 rounded-full bg-gray-300 dark:bg-gray-600"></div>
                  <div className="flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4" />
                    <span>New Arrivals Daily</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Optional hint text below card */}
        {variant === 'noResults' && (
          <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-6 animate-fade-in">
            💡 <span className="font-medium">Pro tip:</span> Try using broader search terms or removing some filters
          </p>
        )}
      </div>
    </div>
  );
};

export default UltraEmptyState;
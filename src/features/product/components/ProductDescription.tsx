import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface ProductDescriptionProps {
  description: string;
}

const ProductDescription: React.FC<ProductDescriptionProps> = ({ description }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [shouldShowToggle, setShouldShowToggle] = useState(false);
  const descriptionRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    const checkDescriptionHeight = () => {
      if (descriptionRef.current) {
        const lineHeight = 24; // Approximate line height in pixels
        const maxHeight = lineHeight * 3; // 3 lines
        setShouldShowToggle(descriptionRef.current.scrollHeight > maxHeight);
      }
    };

    checkDescriptionHeight();
    window.addEventListener('resize', checkDescriptionHeight);
    return () => window.removeEventListener('resize', checkDescriptionHeight);
  }, [description]);

  return (
    <div className="bg-white dark:bg-dark2 rounded-xl shadow-sm p-6">
      <h2 className="text-xl font-semibold mb-3 text-gray-900 dark:text-white">Description</h2>

      <div className="relative">
        <p
          ref={descriptionRef}
          className={`text-gray-600 dark:text-gray-300 transition-all duration-300 ${
            !isExpanded && shouldShowToggle ? 'line-clamp-3' : ''
          }`}
        >
          {description}
        </p>

        {shouldShowToggle && (
          <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2">
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="flex items-center justify-center w-8 h-8 bg-white dark:bg-dark2 border border-gray-200 dark:border-gray-700 rounded-full shadow-sm hover:shadow-md transition-all duration-200 group"
            >
              {isExpanded ? (
                <ChevronUp className="w-4 h-4 text-gray-600 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white transition-colors" />
              ) : (
                <ChevronDown className="w-4 h-4 text-gray-600 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white transition-colors" />
              )}
            </button>
          </div>
        )}
      </div>

      {/* Gradient overlay for smooth transition */}
      {!isExpanded && shouldShowToggle && (
        <div className="absolute bottom-0 left-0 right-0 h-6 bg-gradient-to-t from-white dark:from-dark2 to-transparent pointer-events-none" />
      )}
    </div>
  );
};

export default ProductDescription;

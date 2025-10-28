import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface ProductDescriptionProps {
  description: string;
  className?: string;
}

const ProductDescription: React.FC<ProductDescriptionProps> = ({ description, className = '' }) => {
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
    <div className={`pt-3 border-t border-gray-200 dark:border-gray-700 ${className}`}>
      <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3">Description</h3>
      <div className="relative">
        <p
          ref={descriptionRef}
          className={`text-sm text-gray-600 dark:text-gray-300 leading-relaxed transition-all duration-300 ${
            !isExpanded && shouldShowToggle ? 'line-clamp-3' : ''
          }`}
        >
          {description}
        </p>

        {shouldShowToggle && (
          <div className="mt-2 flex justify-center">
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
    </div>
  );
};

export default ProductDescription;

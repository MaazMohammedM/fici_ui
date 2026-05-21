import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface ContentSectionProps {
  title: string;
  children: React.ReactNode;
  initialExpanded?: boolean;
  maxPreviewHeight?: number;
  className?: string;
  showReadMore?: boolean;
  previewLength?: number;
}

const ContentSection: React.FC<ContentSectionProps> = ({
  title,
  children,
  initialExpanded = false,
  maxPreviewHeight = 200,
  className = '',
  showReadMore = true,
  previewLength = 300
}) => {
  const [isExpanded, setIsExpanded] = useState(initialExpanded);
  
  // Convert children to text for preview calculation
  const getTextContent = (element: React.ReactNode): string => {
    if (typeof element === 'string') return element;
    if (typeof element === 'number') return element.toString();
    if (Array.isArray(element)) return element.map(getTextContent).join('');
    if (React.isValidElement(element)) {
      return getTextContent(element.props.children);
    }
    return '';
  };

  const textContent = getTextContent(children);
  const shouldShowReadMore = showReadMore && textContent.length > previewLength;

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <div className={`bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden ${className}`}>
      {/* Section Header */}
      <div className="px-6 py-4 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 border-b border-gray-200 dark:border-gray-600">
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
          {title}
        </h3>
      </div>

      {/* Content Area */}
      <div className="relative">
        <div 
          className={`px-6 py-4 text-gray-700 dark:text-gray-300 leading-relaxed ${
            !isExpanded && shouldShowReadMore ? 'max-h-[200px] overflow-hidden' : ''
          }`}
          style={
            !isExpanded && shouldShowReadMore 
              ? { maxHeight: `${maxPreviewHeight}px` } 
              : {}
          }
        >
          <div className={`prose prose-sm max-w-none dark:prose-invert ${
            !isExpanded && shouldShowReadMore ? 'relative' : ''
          }`}>
            {children}
            
            {/* Fade overlay when collapsed */}
            {!isExpanded && shouldShowReadMore && (
              <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-white dark:from-gray-900 to-transparent pointer-events-none" />
            )}
          </div>
        </div>

        {/* Read More/Less Button */}
        {shouldShowReadMore && (
          <div className="px-6 pb-4">
            <button
              onClick={toggleExpanded}
              className="flex items-center gap-2 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded px-3 py-1"
              aria-expanded={isExpanded}
              aria-label={isExpanded ? 'Show less content' : 'Show more content'}
            >
              {isExpanded ? (
                <>
                  <ChevronUp className="w-4 h-4" />
                  Show Less
                </>
              ) : (
                <>
                  <ChevronDown className="w-4 h-4" />
                  Read More
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ContentSection;

import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { X } from 'lucide-react';

interface SizeData {
  size: number;
  uk: number;
  us: number;
  eu: number;
  footLength: number;
}

interface SizeGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  gender: 'men' | 'women';
  subCategory?: string;
}

const MEN_SIZE_DATA: SizeData[] = [
  { size: 39, uk: 6, us: 7, eu: 39, footLength: 25 },
  { size: 40, uk: 7, us: 8, eu: 40, footLength: 25.5 },
  { size: 41, uk: 8, us: 9, eu: 41, footLength: 26 },
  { size: 42, uk: 9, us: 10, eu: 42, footLength: 26.5 },
  { size: 43, uk: 10, us: 11, eu: 43, footLength: 27 },
  { size: 44, uk: 11, us: 12, eu: 44, footLength: 27.5 },
  { size: 45, uk: 12, us: 13, eu: 45, footLength: 28 },
  { size: 46, uk: 13, us: 14, eu: 46, footLength: 28.5 },
  { size: 47, uk: 14, us: 15, eu: 47, footLength: 29 },
];

const WOMEN_SIZE_DATA: SizeData[] = [
  { size: 35, uk: 2, us: 4, eu: 35, footLength: 22.5 },
  { size: 36, uk: 3, us: 5, eu: 36, footLength: 23 },
  { size: 37, uk: 4, us: 6, eu: 37, footLength: 23.5 },
  { size: 38, uk: 5, us: 7, eu: 38, footLength: 24 },
  { size: 39, uk: 6, us: 8, eu: 39, footLength: 24.5 },
  { size: 40, uk: 7, us: 9, eu: 40, footLength: 25 },
  { size: 41, uk: 8, us: 10, eu: 41, footLength: 25.5 },
  { size: 42, uk: 9, us: 11, eu: 42, footLength: 26 },
  { size: 43, uk: 10, us: 12, eu: 43, footLength: 26.5 },
];

const SizeGuideModal: React.FC<SizeGuideModalProps> = ({ isOpen, onClose, gender, subCategory }) => {
  // State for portal container
  const [portalContainer, setPortalContainer] = useState<HTMLDivElement | null>(null);
  
  // Derived state
  const isFootwear = subCategory === 'Shoes' || subCategory === 'Sandals';
  const currentSizeData = gender === 'men' ? MEN_SIZE_DATA : WOMEN_SIZE_DATA;

  // Initialize portal container on mount
  useEffect(() => {
    if (typeof document === 'undefined') return;
    
    const div = document.createElement('div');
    div.style.position = 'fixed';
    div.style.top = '0';
    div.style.left = '0';
    div.style.width = '100%';
    div.style.height = '0';
    div.style.overflow = 'visible';
    div.style.zIndex = '9999';
    document.body.appendChild(div);
    setPortalContainer(div);

    return () => {
      if (div && div.parentNode) {
        div.parentNode.removeChild(div);
      }
    };
  }, []);

  // Handle body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
      document.documentElement.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
      document.documentElement.style.overflow = 'unset';
    };
  }, [isOpen]);

  // Don't render if not open or portal container not ready
  if (!isOpen || !portalContainer) return null;

  // Use React Portal to render the modal outside the normal DOM hierarchy
  return ReactDOM.createPortal(
    <div className="fixed inset-0 z-[9999]">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 dark:bg-black/70 backdrop-blur-sm transition-opacity duration-300"
        onClick={onClose}
        aria-hidden="true"
      />
      
      {/* Modal content */}
      <div className="fixed inset-0 flex items-center justify-center p-2 sm:p-4">
        <div 
          className="bg-white dark:bg-dark2 rounded-xl shadow-2xl w-full max-w-4xl max-h-[95vh] sm:max-h-[90vh] my-4 sm:my-8 mx-2 sm:mx-4 flex flex-col overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
          role="dialog"
          aria-modal="true"
        >
        <div className="p-4 sm:p-6 overflow-y-auto flex-1">
          <div className="sticky top-0 bg-white dark:bg-dark2 z-10 pb-4">
            <div className="flex items-center justify-between">
              <h2 id="size-guide-title" className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                {gender === 'men' ? "Men's" : "Women's"} {isFootwear ? 'Shoe' : 'Size'} Guide
              </h2>
              <button
                onClick={onClose}
                className="p-1.5 -mr-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-primary/50"
                aria-label="Close size guide"
              >
                <X className="w-6 h-6 text-gray-500" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="space-y-6">
            {/* Measurement Guide */}
            <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-xl p-4 sm:p-6 shadow-sm">
              <h3 id="measurement-guide" className="text-lg font-semibold mb-3 text-gray-900 dark:text-white">
                How to Measure Your Foot
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                <div className="space-y-3">
                  {[
                    'Place your foot on a piece of paper.',
                    'Mark the longest part of your foot (heel to toe).',
                    'Measure the distance between the two points in centimeters.',
                    'Use the chart below to find your perfect size.'
                  ].map((step, index) => (
                    <div key={index} className="flex items-start">
                      <span className="flex-shrink-0 w-6 h-6 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-200 flex items-center justify-center text-sm font-medium mr-3 mt-0.5">
                        {index + 1}
                      </span>
                      <p className="text-sm text-gray-700 dark:text-gray-300">
                        {step}
                      </p>
                    </div>
                  ))}
                </div>
                <div className="bg-white dark:bg-gray-800/50 rounded-lg p-4 border border-amber-100 dark:border-amber-900/30 flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-24 h-24 sm:w-32 sm:h-32 bg-gradient-to-br from-amber-100 to-orange-100 dark:from-amber-900/20 dark:to-orange-900/20 rounded-full mx-auto mb-3 flex items-center justify-center shadow-inner">
                      <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-white dark:bg-gray-700 shadow-sm flex items-center justify-center">
                        <span className="text-xs sm:text-sm text-center text-amber-700 dark:text-amber-300 px-2">
                          Foot Measurement
                        </span>
                      </div>
                    </div>
                    <p className="text-xs text-amber-700/80 dark:text-amber-300/80">
                      Measure your foot length in cm
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Size Chart */}
            <div className="bg-white dark:bg-gray-800/50 rounded-xl p-4 sm:p-6 shadow-sm border border-gray-100 dark:border-gray-700/50">
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1" id="size-chart">
                  {gender === 'men' ? "Men's" : "Women's"} {subCategory} Size Chart
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Our {gender === 'men' ? "men's" : "women's"} {subCategory?.toLowerCase()} are available in sizes {gender === 'men' ? '39-47' : '35-43'}.
                </p>
              </div>
              
              <div className="overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-700/50">
                      <tr>
                        <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Size</th>
                        <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">UK</th>
                        <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">US</th>
                        <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">EU</th>
                        <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          <span className="hidden sm:inline">Foot</span> Length
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-dark2 divide-y divide-gray-200 dark:divide-gray-700">
                      {currentSizeData.map((row, index) => (
                        <tr 
                          key={row.size} 
                          className={index % 2 === 0 ? 'bg-white dark:bg-dark2' : 'bg-gray-50 dark:bg-gray-800/30 hover:bg-gray-50/80 dark:hover:bg-gray-800/50 transition-colors'}
                        >
                          <td className="px-3 py-3 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                            {row.size}
                          </td>
                          <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                            {row.uk}
                          </td>
                          <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                            {row.us}
                          </td>
                          <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                            {row.eu}
                          </td>
                          <td className="px-3 py-3 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                            {row.footLength} cm
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Additional Tips */}
            <div className="bg-blue-50/80 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/50 rounded-xl p-4 sm:p-6 shadow-sm">
              <div className="flex items-start">
                <div className="flex-shrink-0 h-6 w-6 text-blue-500 dark:text-blue-400 mr-3 mt-0.5">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <h4 className="text-base font-semibold text-blue-900 dark:text-blue-100 mb-2">
                    Sizing Tips & Notes
                  </h4>
                  <ul className="space-y-2 text-sm text-blue-800/90 dark:text-blue-200/90">
                    <li className="flex items-start">
                      <span className="text-blue-500 mr-2">•</span>
                      <span>Measure your feet in the evening when they are at their largest</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-blue-500 mr-2">•</span>
                      <span>If you're between sizes, we recommend choosing the larger size</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-blue-500 mr-2">•</span>
                      <span>Consider the type of socks you'll be wearing with the shoes</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-blue-500 mr-2">•</span>
                      <span>Different shoe styles may fit differently - check product-specific notes</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Footer */}
        <div className="p-4 sm:p-6 border-t border-gray-100 dark:border-gray-700/50 bg-gray-50/50 dark:bg-gray-800/30 rounded-b-xl">
          <button
            onClick={onClose}
            className="w-full sm:w-auto bg-primary hover:bg-primary-active text-white px-6 py-3 rounded-lg font-semibold transition-all duration-200 transform hover:scale-[1.02] active:scale-95 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:ring-offset-2"
          >
            Got it, thanks!
          </button>
          </div>
        </div>
      </div>
    </div>,
    portalContainer
  );
};

export default SizeGuideModal;

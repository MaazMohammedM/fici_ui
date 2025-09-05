import React from 'react';
import { X } from 'lucide-react';

interface SizeGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  gender: 'men' | 'women';
}

const SizeGuideModal: React.FC<SizeGuideModalProps> = ({ isOpen, onClose, gender }) => {
  if (!isOpen) return null;

  const menSizeData = [
    { size: 40, uk: 6, us: 7, eu: 40, footLength: 25.5 },
    { size: 41, uk: 7, us: 8, eu: 41, footLength: 26 },
    { size: 42, uk: 8, us: 9, eu: 42, footLength: 27 },
    { size: 43, uk: 9, us: 10, eu: 43, footLength: 28 },
    { size: 44, uk: 10, us: 11, eu: 44, footLength: 28.5 },
    { size: 45, uk: 11, us: 12, eu: 45, footLength: 29.5 },
  ];

  const womenSizeData = [
    { size: 36, uk: 3, us: 5, eu: 36, footLength: 23 },
    { size: 37, uk: 4, us: 6, eu: 37, footLength: 23.5 },
    { size: 38, uk: 5, us: 7, eu: 38, footLength: 24 },
    { size: 39, uk: 6, us: 8, eu: 39, footLength: 24.5 },
    { size: 40, uk: 7, us: 9, eu: 40, footLength: 25 },
    { size: 41, uk: 8, us: 10, eu: 41, footLength: 25.5 },
  ];

  const currentSizeData = gender === 'men' ? menSizeData : womenSizeData;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
      <div className="bg-white dark:bg-dark2 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Size Guide - {gender === 'men' ? 'Men' : 'Women'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="w-6 h-6 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Category Header */}
          <div className="bg-gradient-to-r from-amber-100 to-orange-100 dark:from-amber-900/20 dark:to-orange-900/20 rounded-lg p-4 mb-6">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              SHOE & SANDAL
            </h3>
            <h4 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-3">
              HOW TO MEASURE?
            </h4>
            <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
              Place your foot on a flat surface with your heel against a straight edge. 
              Place a ruler beside your foot touching the straight edge your heel is 
              also touching, then take the length in centimetres from the tip of your longest 
              toe to your heel. Please be aware that your longest toe may not always be 
              your big toe.
            </p>
          </div>

          {/* Measurement Illustration */}
          <div className="flex flex-col lg:flex-row gap-6 mb-6">
            <div className="flex-1">
              <div className="bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 rounded-lg p-6 h-48 flex items-center justify-center">
                <div className="text-center">
                  <div className="w-32 h-20 bg-amber-200 dark:bg-amber-800 rounded-full mb-4 mx-auto flex items-center justify-center">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Foot Outline
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    Measure from heel to longest toe
                  </p>
                </div>
              </div>
            </div>

            {/* Size Chart */}
            <div className="flex-1">
              <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-4 text-center">
                SIZE CHART
              </h4>
              
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-gray-300 dark:border-gray-600">
                  <thead>
                    <tr className="bg-gray-100 dark:bg-gray-700">
                      <th className="border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm font-semibold">Size</th>
                      <th className="border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm font-semibold">UK</th>
                      <th className="border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm font-semibold">US</th>
                      <th className="border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm font-semibold">EU</th>
                      <th className="border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm font-semibold">
                        Foot Length<br/>(in cm)
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentSizeData.map((row, index) => (
                      <tr key={row.size} className={index % 2 === 0 ? 'bg-white dark:bg-dark2' : 'bg-gray-50 dark:bg-gray-800'}>
                        <td className="border border-gray-300 dark:border-gray-600 px-3 py-2 text-center font-semibold">{row.size}</td>
                        <td className="border border-gray-300 dark:border-gray-600 px-3 py-2 text-center">{row.uk}</td>
                        <td className="border border-gray-300 dark:border-gray-600 px-3 py-2 text-center">{row.us}</td>
                        <td className="border border-gray-300 dark:border-gray-600 px-3 py-2 text-center">{row.eu}</td>
                        <td className="border border-gray-300 dark:border-gray-600 px-3 py-2 text-center font-semibold">{row.footLength}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Additional Tips */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
              📏 Sizing Tips
            </h4>
            <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
              <li>• Measure your feet in the evening when they are at their largest</li>
              <li>• If you're between sizes, we recommend choosing the larger size</li>
              <li>• Consider the type of socks you'll be wearing with the shoes</li>
              <li>• Different shoe styles may fit differently - check product-specific notes</li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 dark:border-gray-700 text-center">
          <button
            onClick={onClose}
            className="bg-primary hover:bg-primary-active text-white px-6 py-3 rounded-lg font-semibold transition-colors"
          >
            Got it, thanks!
          </button>
        </div>
      </div>
    </div>
  );
};

export default SizeGuideModal;

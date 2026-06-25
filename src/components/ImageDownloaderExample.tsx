import React from 'react';
import { Download } from 'lucide-react';
import { useImageDownloader } from '../hooks/useImageDownloader';

/**
 * Example component showing how to use the reusable ImageDownloader
 */
const ImageDownloaderExample: React.FC = () => {
  const { downloadImage, isDownloading, progress, error, result } = useImageDownloader();

  const handleDownloadExample = async () => {
    try {
      const downloadResult = await downloadImage(
        'example-element', 
        'example-dashboard.png',
        {
          quality: 0.9,
          scale: 1.5,
          onProgress: (progress) => console.log('Progress:', progress),
          onComplete: (result) => {
            if (result.success) {
              console.log('Download completed:', result);
            } else {
              console.error('Download failed:', result.error);
            }
          }
        }
      );
      
      console.log('Final result:', downloadResult);
    } catch (err) {
      console.error('Download error:', err);
    }
  };

  return (
    <div className="p-6 max-w-md mx-auto">
      <h2 className="text-xl font-bold mb-4">Image Downloader Example</h2>
      
      <div className="space-y-4">
        <button
          onClick={handleDownloadExample}
          disabled={isDownloading}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Download className="w-4 h-4" />
          {isDownloading ? 'Downloading...' : 'Download Example'}
        </button>

        {isDownloading && (
          <div className="p-3 bg-blue-100 text-blue-800 rounded-lg">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              <span>{progress}</span>
            </div>
          </div>
        )}

        {error && (
          <div className="p-3 bg-red-100 text-red-800 rounded-lg">
            Error: {error}
          </div>
        )}

        {result && (
          <div className="p-3 bg-green-100 text-green-800 rounded-lg">
            Success! File size: {(result.blobSize || 0).toFixed(2)}MB
          </div>
        )}
      </div>

      {/* Example element to capture */}
      <div 
        id="example-element" 
        className="mt-6 p-4 bg-white border-2 border-gray-300 rounded-lg shadow-lg"
        style={{ width: '400px', height: '300px' }}
      >
        <h3 className="text-lg font-semibold mb-2">Example Dashboard</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-blue-50 p-3 rounded">
            <div className="text-2xl font-bold text-blue-600">1,234</div>
            <div className="text-sm text-gray-600">Total Visits</div>
          </div>
          <div className="bg-green-50 p-3 rounded">
            <div className="text-2xl font-bold text-green-600">567</div>
            <div className="text-sm text-gray-600">Orders</div>
          </div>
        </div>
        <p className="mt-4 text-gray-700">This is an example element that can be captured as an image using the ImageDownloader component.</p>
      </div>
    </div>
  );
};

export default ImageDownloaderExample;

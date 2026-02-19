import { useState, useCallback } from 'react';
import ImageDownloader, { type ImageDownloadOptions, type ImageDownloadResult } from '../components/ImageDownloader';

export interface UseImageDownloaderReturn {
  downloadImage: (elementId: string, filename?: string, options?: Partial<ImageDownloadOptions>) => Promise<ImageDownloadResult>;
  isDownloading: boolean;
  progress: string;
  error: string | null;
  result: ImageDownloadResult | null;
  reset: () => void;
}

export const useImageDownloader = (): UseImageDownloaderReturn => {
  const [isDownloading, setIsDownloading] = useState(false);
  const [progress, setProgress] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ImageDownloadResult | null>(null);

  const reset = useCallback(() => {
    setIsDownloading(false);
    setProgress('');
    setError(null);
    setResult(null);
  }, []);

  const downloadImage = useCallback(async (
    elementId: string, 
    filename?: string, 
    options?: Partial<ImageDownloadOptions>
  ): Promise<ImageDownloadResult> => {
    setIsDownloading(true);
    setProgress('Preparing download...');
    setError(null);
    setResult(null);

    try {
      const downloadOptions: ImageDownloadOptions = {
        elementId,
        filename: filename || `dashboard-${new Date().toISOString().split('T')[0]}.png`,
        onProgress: setProgress,
        onComplete: (result) => {
          setResult(result);
          if (!result.success) {
            setError(result.error || 'Download failed');
          }
        },
        onError: (error) => {
          setError(error.message);
        },
        ...options
      };

      const result = await ImageDownloader.downloadAsImage(downloadOptions);
      setProgress('Download completed!');
      setTimeout(() => setIsDownloading(false), 1000);
      
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      setIsDownloading(false);
      
      return {
        success: false,
        error: errorMessage
      };
    }
  }, []);

  return {
    downloadImage,
    isDownloading,
    progress,
    error,
    result,
    reset
  };
};

export default useImageDownloader;

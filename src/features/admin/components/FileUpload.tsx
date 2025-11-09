import React, { useState, useCallback } from 'react';
import { Upload, X, Star } from 'lucide-react';

interface FileUploadProps {
  files: FileList | null;
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  error?: string;
  disabled?: boolean;
  selectedThumbnail?: number;
  onThumbnailSelect?: (index: number) => void;
  currentImages?: string[];
  onRemoveCurrentImage?: (index: number) => void;
}

const FileUpload: React.FC<FileUploadProps> = ({
  files,
  onChange,
  error,
  disabled,
  selectedThumbnail = 0,
  onThumbnailSelect,
  currentImages = [],
  onRemoveCurrentImage
}) => {
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);

  React.useEffect(() => {
    if (files && files.length > 0) {
      const urls = Array.from(files).map((file) => URL.createObjectURL(file));
      setPreviewUrls(urls);

      return () => urls.forEach((url) => URL.revokeObjectURL(url));
    } else {
      setPreviewUrls([]);
    }
  }, [files]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    onChange(event);
  };

  const getTotalImages = () => currentImages.length + (files?.length || 0);
  const getSelectedThumbnailInfo = () => {
    if (selectedThumbnail < currentImages.length) {
      return { type: 'current', index: selectedThumbnail };
    }
    return { type: 'new', index: selectedThumbnail - currentImages.length };
  };

  return (
    <div className="space-y-4">
      <label className="block text-sm font-medium text-gray-700 dark:text-white">
        Upload Product Images (min 1, max 5) *
      </label>
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 hover:border-primary transition-colors">
        <input
          type="file"
          accept="image/*"
          multiple
          onChange={handleFileChange}
          disabled={disabled}
          className="hidden"
          id="file-upload"
        />
        <label htmlFor="file-upload" className="cursor-pointer">
          <div className="text-center">
            <Upload className="mx-auto h-12 w-12 text-gray-400" />
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              Click to upload images or drag and drop
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-500">
              PNG, JPG, GIF up to 5MB each (maximum 5 images)
            </p>
          </div>
        </label>
      </div>
      {currentImages.length > 0 && (
        <div className="space-y-3">
          <p className="text-sm font-medium text-gray-700 dark:text-white">
            Current Images ({currentImages.length}):
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {currentImages.map((imageUrl, index) => (
              <div key={`current-${index}`} className="relative group">
                <img
                  src={imageUrl}
                  alt={`Current ${index + 1}`}
                  className={`w-full h-20 object-cover rounded border-2 cursor-pointer transition-all ${
                    selectedThumbnail === index
                      ? 'border-green-500 ring-2 ring-green-200'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => onThumbnailSelect?.(index)}
                />
                <div className="absolute top-1 left-1 bg-black/70 text-white text-xs px-1 rounded">
                  {index + 1}
                </div>
                {selectedThumbnail === index && (
                  <div className="absolute top-1 right-1 bg-green-500 text-white rounded-full p-1">
                    <Star size={12} fill="currentColor" />
                  </div>
                )}
                {onRemoveCurrentImage && (
                  <button
                    type="button"
                    onClick={() => onRemoveCurrentImage(index)}
                    className="absolute bottom-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X size={12} />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
      {files && files.length > 0 && (
        <div className="space-y-3">
          <p className="text-sm font-medium text-gray-700 dark:text-white">
            New Images ({files.length}/5 maximum):
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {Array.from(files).map((file, index) => (
              <div key={`new-${index}`} className="relative group">
                <img
                  src={previewUrls[index]}
                  alt={`Preview ${index + 1}`}
                  className={`w-full h-20 object-cover rounded border-2 cursor-pointer transition-all ${
                    selectedThumbnail === currentImages.length + index
                      ? 'border-green-500 ring-2 ring-green-200'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => onThumbnailSelect?.(currentImages.length + index)}
                />
                <div className="absolute top-1 left-1 bg-black/70 text-white text-xs px-1 rounded">
                  {currentImages.length + index + 1}
                </div>
                {selectedThumbnail === currentImages.length + index && (
                  <div className="absolute top-1 right-1 bg-green-500 text-white rounded-full p-1">
                    <Star size={12} fill="currentColor" />
                  </div>
                )}
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 truncate">
                  {file.name}
                </p>
                <p className="text-xs text-gray-500">
                  {(file.size / 1024 / 1024).toFixed(2)}MB
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
      {error && <p className="text-red-500 text-sm">{error}</p>}
    </div>
  );
};

export default FileUpload;
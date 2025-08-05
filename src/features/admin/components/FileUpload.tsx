import React from 'react';
import { Upload } from 'lucide-react';

interface FileUploadProps {
  files: FileList | null;
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  error?: string;
  disabled?: boolean;
}

const FileUpload: React.FC<FileUploadProps> = ({ files, onChange, error, disabled }) => {
  const fileArray = files ? Array.from(files) : [];

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-gray-700 dark:text-white">
        Upload Product Images (min 1)
      </label>
      
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 hover:border-primary transition-colors">
        <input
          type="file"
          accept="image/*"
          multiple
          onChange={onChange}
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

      {fileArray.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-gray-700 dark:text-white">
            Selected Files ({fileArray.length}/5 maximum):
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {fileArray.map((file, index) => (
              <div key={index} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded">
                <span className="text-sm truncate">{file.name}</span>
                <span className="text-xs text-gray-500">
                  {(file.size / 1024 / 1024).toFixed(2)}MB
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {error && (
        <p className="text-red-500 text-sm">{error}</p>
      )}
    </div>
  );
};

export default FileUpload; 
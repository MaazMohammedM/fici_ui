import React, { useState } from 'react';
import type { Product } from '../../../types/product';
import fallbackImage from '../../../assets/Fici Logo.png';

interface ProductImageGalleryProps {
  selectedVariant: Product | undefined;
  productName: string;
}

const ProductImageGallery: React.FC<ProductImageGalleryProps> = ({ selectedVariant, productName }) => {
  const [selectedImage, setSelectedImage] = useState(0);

  if (!selectedVariant) return null;

  const images = selectedVariant.images && selectedVariant.images.length > 0 
    ? selectedVariant.images 
    : [selectedVariant.thumbnail_url || fallbackImage];

  return (
    <div className="space-y-4">
      <div className="aspect-square bg-white dark:bg-dark2 rounded-2xl overflow-hidden">
        <img
          src={images[selectedImage] || images[0]}
          alt={productName}
          className="w-full h-full object-cover"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.src = fallbackImage;
          }}
        />
      </div>
      {images.length > 1 && (
        <div className="flex space-x-2 overflow-x-auto">
          {images.map((image, index) => (
            <button
              key={index}
              onClick={() => setSelectedImage(index)}
              className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 ${
                index === selectedImage ? 'border-accent' : 'border-gray-200 dark:border-gray-700'
              }`}
            >
              <img
                src={image}
                alt={`${productName} ${index + 1}`}
                className="w-full h-full object-cover"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = fallbackImage;
                }}
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default ProductImageGallery; 
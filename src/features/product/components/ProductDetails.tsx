import React, { useState } from 'react';
import { Heart, Share2, ChevronDown, ChevronUp } from 'lucide-react';
import type { Product, ProductDetail } from '../../../types/product';
import StarComponent from 'Utils/StarComponent';

interface ProductDetailsProps {
  currentProduct: ProductDetail;
  selectedVariant: Product | undefined;
  selectedColor: string;
  selectedSize: string;
  quantity: number;
  availableSizes: string[];
  onColorChange: (color: string) => void;
  onSizeChange: (size: string) => void;
  onQuantityChange: (quantity: number) => void;
  onAddToCart: () => void;
  onBuyNow: () => void;
}

const ProductDetails: React.FC<ProductDetailsProps> = ({
  currentProduct,
  selectedVariant,
  selectedColor,
  selectedSize,
  quantity,
  availableSizes,
  onColorChange,
  onSizeChange,
  onQuantityChange,
  onAddToCart,
  onBuyNow
}) => {
  const [expandedSections, setExpandedSections] = useState({
    details: true,
    shipping: false
  });

  const toggleSection = (section: 'details' | 'shipping') => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-primary dark:text-secondary mb-2">
          {currentProduct.name}
        </h1>
        <div className="flex items-center space-x-4 mb-4">
          <div className="flex items-center space-x-2">
            <StarComponent rating={4.8} />
            <span className="text-sm text-gray-600 dark:text-gray-400">4.8/5 Star rating</span>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center space-x-4">
          <span className="text-3xl font-bold text-primary">
            ₹{selectedVariant?.discount_price}
          </span>
          {selectedVariant && parseFloat(selectedVariant.mrp_price) > parseFloat(selectedVariant.discount_price) && (
            <>
              <span className="text-xl text-gray-500 line-through">
                ₹{selectedVariant.mrp_price}
              </span>
              <span className="bg-red-100 text-red-800 px-2 py-1 rounded text-sm font-medium">
                {selectedVariant.discount_percentage}% OFF
              </span>
            </>
          )}
        </div>

        {currentProduct.description && (
          <div className="text-gray-600 dark:text-gray-400 space-y-2">
            <p>{currentProduct.description}</p>
          </div>
        )}

        {/* Color Selection */}
        {currentProduct.variants.length > 1 && (
          <div>
            <h3 className="text-lg font-semibold text-primary dark:text-secondary mb-2">Color</h3>
            <div className="flex space-x-2">
              {currentProduct.variants.map((variant) => (
                <button
                  key={variant.color}
                  onClick={() => onColorChange(variant.color)}
                  className={`w-8 h-8 rounded-full border-2 ${
                    selectedColor === variant.color
                      ? 'border-accent'
                      : 'border-gray-300 dark:border-gray-600'
                  }`}
                  style={{ backgroundColor: variant.color.toLowerCase() }}
                  title={variant.color}
                />
              ))}
            </div>
          </div>
        )}

        {/* Size Selection */}
        <div>
          <h3 className="text-lg font-semibold text-primary dark:text-secondary mb-2">Size</h3>
          <div className="flex flex-wrap gap-2">
            {availableSizes.map((size) => (
              <button
                key={size}
                onClick={() => onSizeChange(size)}
                className={`px-4 py-2 rounded-lg border-2 transition-colors ${
                  selectedSize === size
                    ? 'border-accent bg-accent text-white'
                    : 'border-gray-300 dark:border-gray-600 hover:border-accent'
                }`}
              >
                {size}
              </button>
            ))}
          </div>
        </div>

        {/* Quantity */}
        <div>
          <h3 className="text-lg font-semibold text-primary dark:text-secondary mb-2">Quantity</h3>
          <div className="flex items-center space-x-4">
            <button
              onClick={() => onQuantityChange(Math.max(1, quantity - 1))}
              className="w-8 h-8 rounded-full border border-gray-300 dark:border-gray-600 flex items-center justify-center hover:bg-gray-50 dark:hover:bg-gray-800"
            >
              -
            </button>
            <span className="text-lg font-semibold">{quantity}</span>
            <button
              onClick={() => onQuantityChange(quantity + 1)}
              className="w-8 h-8 rounded-full border border-gray-300 dark:border-gray-600 flex items-center justify-center hover:bg-gray-50 dark:hover:bg-gray-800"
            >
              +
            </button>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-4">
          <button
            onClick={onAddToCart}
            className="flex-1 bg-primary text-white py-3 px-6 rounded-lg font-semibold hover:bg-primary-active transition-colors"
          >
            Add to Cart
          </button>
          <button
            onClick={onBuyNow}
            className="flex-1 bg-accent text-white py-3 px-6 rounded-lg font-semibold hover:bg-accent/80 transition-colors"
          >
            Buy Now
          </button>
        </div>

        {/* Share Buttons */}
        <div className="flex space-x-4">
          <button className="flex items-center space-x-2 text-gray-600 dark:text-gray-400 hover:text-primary">
            <Share2 className="w-5 h-5" />
            <span>Share</span>
          </button>
          <button className="flex items-center space-x-2 text-gray-600 dark:text-gray-400 hover:text-red-500">
            <Heart className="w-5 h-5" />
            <span>Wishlist</span>
          </button>
        </div>

        {/* Payment Methods */}
        <div className="border-t pt-4">
          <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">We Accept</h4>
          <div className="flex space-x-2">
            <span className="text-xs bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">Mastercard</span>
            <span className="text-xs bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">Visa</span>
            <span className="text-xs bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">PayPal</span>
            <span className="text-xs bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">Google Pay</span>
          </div>
        </div>

        {/* Returns Policy */}
        <div className="border-t pt-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600 dark:text-gray-400">30-days Free Returns</span>
            <button className="text-sm text-accent hover:text-accent/80">Read More →</button>
          </div>
        </div>
      </div>

      {/* Collapsible Sections */}
      <div className="space-y-4">
        {/* Details Section */}
        <div className="border border-gray-200 dark:border-gray-700 rounded-lg">
          <button
            onClick={() => toggleSection('details')}
            className="w-full px-4 py-3 flex items-center justify-between text-left"
          >
            <span className="font-semibold text-primary dark:text-secondary">Details</span>
            {expandedSections.details ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </button>
          {expandedSections.details && (
            <div className="px-4 pb-4 space-y-2">
              <p className="text-sm text-gray-600 dark:text-gray-400">• Premium leather construction</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">• Handcrafted with attention to detail</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">• Comfortable and durable design</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">• Available in multiple sizes and colors</p>
            </div>
          )}
        </div>

        {/* Shipping & Returns Section */}
        <div className="border border-gray-200 dark:border-gray-700 rounded-lg">
          <button
            onClick={() => toggleSection('shipping')}
            className="w-full px-4 py-3 flex items-center justify-between text-left"
          >
            <span className="font-semibold text-primary dark:text-secondary">Shipping & Returns</span>
            {expandedSections.shipping ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </button>
          {expandedSections.shipping && (
            <div className="px-4 pb-4 space-y-2">
              <p className="text-sm text-gray-600 dark:text-gray-400">• Free shipping on orders above ₹999</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">• 30-day return policy</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">• Secure packaging</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">• Customer support available</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductDetails; 
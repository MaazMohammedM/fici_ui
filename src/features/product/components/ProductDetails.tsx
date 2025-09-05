import React, { useState } from 'react';
import { Heart, Share2, ChevronDown, ChevronUp, Check, Ruler } from 'lucide-react';
import StarComponent from '../../../utils/StarComponent';
import SizeGuideModal from '../../../components/ui/SizeGuideModal';
import ShareModal from './ShareModal';
import type { Product, ProductDetail } from '../../../types/product';

// Helper function to get color values for display
const getColorValue = (colorName: string): string => {
  const colorMap: Record<string, string> = {
    black: '#000000',
    white: '#FFFFFF',
    brown: '#8B4513',
    tan: '#D2B48C',
    navy: '#000080',
    blue: '#0000FF',
    red: '#FF0000',
    green: '#008000',
    gray: '#808080',
    grey: '#808080',
    beige: '#F5F5DC',
    cream: '#FFFDD0',
    pink: '#FFC0CB',
    yellow: '#FFFF00',
    orange: '#FFA500',
    purple: '#800080',
    silver: '#C0C0C0',
    gold: '#FFD700',
    maroon: '#800000',
    olive: '#808000',
    lime: '#00FF00',
    aqua: '#00FFFF',
    teal: '#008080',
    fuchsia: '#FF00FF',
  };
  return colorMap[colorName.toLowerCase()] || '#6B7280';
};

interface ProductDetailsProps {
  currentProduct: ProductDetail;
  selectedVariant: Product | undefined;
  // now track by article id
  selectedArticleId: string;
  selectedSize: string;
  quantity: number;
  availableSizes: string[];
  fullSizeRange: string[];
  onColorChange: (articleId: string) => void; // pass article_id so page can fetch variant
  onSizeChange: (size: string) => void;
  onQuantityChange: (quantity: number) => void;
  onAddToCart: () => void;
  onBuyNow: () => void;
  onWhatsAppContact: (size: string) => void;
}

const ProductDetails: React.FC<ProductDetailsProps> = ({
  currentProduct,
  selectedVariant,
  selectedArticleId,
  selectedSize,
  quantity,
  availableSizes,
  fullSizeRange,
  onColorChange,
  onSizeChange,
  onQuantityChange,
  onAddToCart,
  onBuyNow,
  onWhatsAppContact
}) => {
  const [expandedSections, setExpandedSections] = useState({
    details: true,
    shipping: false,
    care: false
  });
  const [showSizeGuide, setShowSizeGuide] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);

  const toggleSection = (section: 'details' | 'shipping' | 'care') => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  // display color label (prefer selectedVariant color)
  const displayColorLabel = selectedVariant?.color || (currentProduct.variants[0]?.color ?? '');

  // Get care instructions based on product sub_category
  const getCareInstructions = (subCategory: string) => {
    const category = subCategory.toLowerCase();
    
    const careInstructions: Record<string, string[]> = {
      'shoes': [
        'Clean with a soft, damp cloth',
        'Use leather conditioner monthly',
        'Store in a cool, dry place',
        'Use shoe trees to maintain shape',
        'Avoid direct sunlight and heat',
        'Rotate wear to extend lifespan'
      ],
      'sandals': [
        'Rinse with clean water after use',
        'Air dry away from direct sunlight',
        'Clean straps with mild soap',
        'Store in a ventilated area',
        'Avoid prolonged exposure to water',
        'Check and tighten straps regularly'
      ],
      'bags': [
        'Clean with appropriate leather/fabric cleaner',
        'Store in dust bag when not in use',
        'Avoid overloading to maintain shape',
        'Keep away from sharp objects',
        'Condition leather bags regularly',
        'Handle with clean hands'
      ],
      'wallets': [
        'Clean with soft, dry cloth',
        'Condition leather monthly',
        'Avoid overstuffing with cards/cash',
        'Store in a dry place',
        'Keep away from extreme temperatures',
        'Handle gently to prevent cracking'
      ],
      'belts': [
        'Clean with leather cleaner',
        'Store hanging or flat',
        'Rotate between different belts',
        'Avoid excessive bending',
        'Condition regularly to prevent cracking',
        'Keep buckle clean and dry'
      ]
    };

    // Find matching category or return general care instructions
    for (const [key, instructions] of Object.entries(careInstructions)) {
      if (category.includes(key)) {
        return instructions;
      }
    }

    // Default care instructions for leather products
    return [
      'Clean with appropriate cleaner',
      'Store in a cool, dry place',
      'Avoid direct sunlight and heat',
      'Handle with care',
      'Keep away from sharp objects',
      'Regular maintenance recommended'
    ];
  };

  const careInstructions = getCareInstructions(currentProduct.sub_category || '');

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
            <h3 className="text-lg font-semibold mb-2 text-primary dark:text-secondary">
              Color: <span className="font-normal capitalize text-accent">{displayColorLabel}</span>
            </h3>

            <div className="flex flex-wrap gap-3">
              {currentProduct.variants.map((variant) => {
                // derive color label (either from article_id suffix or variant.color)
                const colorLabel = variant.article_id.split('_')[1] || variant.color;
                const isSelected = variant.article_id === selectedArticleId;

                return (
                  <button
                    key={variant.article_id}
                    onClick={() => onColorChange(variant.article_id)}
                    title={colorLabel}
                    className={`relative flex items-center justify-center w-12 h-12 rounded-full transition-transform transform ${
                      isSelected
                        ? 'scale-110 ring-2 ring-accent/40 shadow-lg'
                        : 'hover:scale-105'
                    }`}
                    aria-pressed={isSelected}
                  >
                    <span
                      className="block w-10 h-10 rounded-full border"
                      style={{
                        backgroundColor: getColorValue(colorLabel),
                        borderColor: isSelected ? 'rgba(0,0,0,0.06)' : undefined
                      }}
                    />
                    {isSelected && (
                      <Check className="absolute w-4 h-4 text-white" />
                    )}
                    {/* visually hidden label for accessibility */}
                    <span className="sr-only">{colorLabel}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Size Selection */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-semibold text-primary dark:text-secondary">Size</h3>
            <button
              onClick={() => setShowSizeGuide(true)}
              className="flex items-center space-x-1 text-sm text-accent hover:text-accent/80 transition-colors"
            >
              <Ruler className="w-4 h-4" />
              <span>Size Guide</span>
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {fullSizeRange.map((size) => {
              const isAvailable = availableSizes.includes(size);
              const isSelected = selectedSize === size;
              
              return (
                <button
                  key={size}
                  onClick={() => {
                    if (isAvailable) {
                      onSizeChange(size);
                    } else {
                      onWhatsAppContact(size);
                    }
                  }}
                  className={`px-4 py-2 rounded-lg border-2 transition-colors relative ${
                    isSelected && isAvailable
                      ? 'border-accent bg-accent text-white'
                      : isAvailable
                      ? 'border-gray-300 dark:border-gray-600 hover:border-accent'
                      : 'border-red-200 bg-red-50 text-red-600 hover:bg-red-100 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400'
                  }`}
                  title={!isAvailable ? 'Click to contact us on WhatsApp for availability' : ''}
                >
                  {size}
                  {!isAvailable && (
                    <span className="absolute -top-1 -right-1 text-xs bg-red-500 text-white rounded-full w-4 h-4 flex items-center justify-center">
                      !
                    </span>
                  )}
                </button>
              );
            })}
          </div>
          
          {/* Out of stock message */}
          <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            <span className="text-red-500">Out of stock sizes:</span> Click to contact us on WhatsApp for availability
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

        {/* Share & Wishlist */}
        <div className="flex space-x-4">
          <button 
            onClick={() => setShowShareModal(true)}
            className="flex items-center space-x-2 text-gray-600 dark:text-gray-400 hover:text-primary transition-colors"
          >
            <Share2 className="w-5 h-5" />
            <span>Share</span>
          </button>
          <button className="flex items-center space-x-2 text-gray-600 dark:text-gray-400 hover:text-red-500 transition-colors">
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
        {/* Details */}
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

        {/* Shipping */}
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

        {/* Care Instructions */}
        <div className="border border-gray-200 dark:border-gray-700 rounded-lg">
          <button
            onClick={() => toggleSection('care')}
            className="w-full px-4 py-3 flex items-center justify-between text-left"
          >
            <span className="font-semibold text-primary dark:text-secondary">Care Instructions</span>
            {expandedSections.care ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </button>
          {expandedSections.care && (
            <div className="px-4 pb-4 space-y-2">
              {careInstructions.map((instruction, index) => (
                <p key={index} className="text-sm text-gray-600 dark:text-gray-400">
                  • {instruction}
                </p>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Size Guide Modal */}
      <SizeGuideModal
        isOpen={showSizeGuide}
        onClose={() => setShowSizeGuide(false)}
        gender="men" // You can make this dynamic based on product category
      />

      {/* Share Modal */}
      <ShareModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        productName={currentProduct.name}
        productUrl={window.location.href}
        productImage={selectedVariant?.thumbnail_url}
        productPrice={selectedVariant?.discount_price}
      />
    </div>
  );
};

export default ProductDetails;
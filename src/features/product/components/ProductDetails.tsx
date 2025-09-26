import React, { useState } from "react";
import type { Product, ProductDetail } from "../../../types/product";
import ProductColorSelector from "@features/product/sections/ProductColorSelector";
import ProductSizeSelector from "@features/product/sections/ProductSizeSelector";
import ProductQuantitySelector from "@features/product/sections/ProductQuantitySelector";
import ProductActionButtons from "@features/product/sections/ProductActionsButton";
import SizeGuideModal from "../../../components/ui/SizeGuideModal";
import ShareModal from "./ShareModal";

interface ProductDetailsProps {
  currentProduct: ProductDetail;
  selectedVariant: Product | undefined;
  selectedArticleId: string;
  selectedSize: string;
  quantity: number;
  availableSizes: string[];
  fullSizeRange: string[];
  onColorChange: (articleId: string) => void;
  onSizeChange: (size: string) => void;
  onQuantityChange: (quantity: number) => void;
  onAddToCart: () => void;
  onBuyNow: () => void;
  onWishlistToggle: () => void;
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
  onWhatsAppContact,
}) => {
  const [showSizeGuide, setShowSizeGuide] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);

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

  console.log("Care instruction ",careInstructions)

  // Extract brand and product name
  const [brand, ...nameParts] = currentProduct.name.split(' ');
  const productName = nameParts.join(' ');

  return (
    <div className="space-y-6">
      {/* Brand and Category */}
      <div className="space-y-1">
        <p className="text-sm font-medium text-gray-500">{brand}</p>
        <h1 className="text-2xl font-bold text-gray-900">{productName}</h1>
        <div className="flex items-center space-x-2">
          <div className="flex items-center">
            {[1, 2, 3, 4, 5].map((star) => (
              <svg
                key={star}
                className={`w-5 h-5 ${star <= 4 ? 'text-yellow-400' : 'text-gray-300'}`}
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            ))}
          </div>
          <span className="text-sm text-gray-500">(24 reviews)</span>
        </div>
      </div>

      {/* Price */}
      <div className="mt-4">
        <div className="flex items-baseline space-x-2">
          <span className="text-3xl font-bold text-gray-900">
            ₹{Number(selectedVariant?.discount_price || 0).toLocaleString('en-IN')}
          </span>
          {selectedVariant?.mrp && Number(selectedVariant.mrp) > Number(selectedVariant.discount_price || 0) && (
            <>
              <span className="text-lg text-gray-500 line-through">
                ₹{Number(selectedVariant.mrp).toLocaleString('en-IN')}
              </span>
              <span className="ml-2 text-sm font-medium text-green-600">
                {Math.round(((Number(selectedVariant.mrp) - Number(selectedVariant.discount_price || 0)) / Number(selectedVariant.mrp)) * 100)}% off
              </span>
            </>
          )}
        </div>
        <p className="text-sm text-green-600 mt-1">Inclusive of all taxes</p>
      </div>

      {/* Color Selector */}
      <div className="pt-4 border-t border-gray-200">
        <h3 className="text-sm font-medium text-gray-900">Color</h3>
        <ProductColorSelector
          currentProduct={currentProduct}
          selectedArticleId={selectedArticleId}
          selectedVariant={selectedVariant}
          onColorChange={onColorChange}
        />
      </div>

      {/* Size Selector */}
      <div className="pt-4 border-t border-gray-200">
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-sm font-medium text-gray-900">Size</h3>
          <button 
            type="button" 
            onClick={() => setShowSizeGuide(true)}
            className="text-sm font-medium text-accent hover:text-accent/80"
          >
            Size Guide
          </button>
        </div>
        <ProductSizeSelector
          fullSizeRange={fullSizeRange}
          availableSizes={availableSizes}
          selectedSize={selectedSize}
          onSizeChange={onSizeChange}
          onWhatsAppContact={onWhatsAppContact}
          onShowSizeGuide={() => setShowSizeGuide(true)}
        />
      </div>

      {/* Quantity Selector */}
      <div className="pt-4 border-t border-gray-200">
        <h3 className="text-sm font-medium text-gray-900 mb-3">Quantity</h3>
        <ProductQuantitySelector
          quantity={quantity}
          onQuantityChange={onQuantityChange}
        />
      </div>

      {/* Action Buttons */}
      <div className="pt-4 space-y-3">
        <ProductActionButtons
          onAddToCart={onAddToCart}
          onBuyNow={onBuyNow}
        />
        
        {/* Secure Checkout Badge */}
        <div className="flex items-center justify-center space-x-2 py-2">
          <svg className="h-5 w-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
          <span className="text-xs text-gray-500">Secure Checkout</span>
        </div>
      </div>

      {/* Product Highlights */}
      <div className="pt-4 border-t border-gray-200">
        <h3 className="text-sm font-medium text-gray-900 mb-3">Product Highlights</h3>
        <ul className="space-y-2 text-sm text-gray-600">
          <li className="flex items-start">
            <svg className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span>Premium quality {currentProduct.sub_category?.toLowerCase() || 'product'}</span>
          </li>
          <li className="flex items-start">
            <svg className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span>Free shipping on orders above ₹999</span>
          </li>
          <li className="flex items-start">
            <svg className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span>Easy 15-day returns</span>
          </li>
        </ul>
      </div>

      {/* Care Instructions */}
      <div className="pt-4 border-t border-gray-200">
        <h3 className="text-sm font-medium text-gray-900 mb-3">Care Instructions</h3>
        <div className="grid grid-cols-2 gap-2">
          {careInstructions.slice(0, 4).map((instruction, index) => (
            <div key={index} className="flex items-start">
              <svg className="h-4 w-4 text-gray-400 mt-0.5 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span className="text-xs text-gray-600">{instruction}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Share & More */}
      <div className="pt-4 border-t border-gray-200">
        <div className="flex items-center justify-between">
          <button 
            onClick={() => setShowShareModal(true)}
            className="flex items-center text-sm font-medium text-gray-700 hover:text-accent"
          >
            <svg className="h-5 w-5 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
            </svg>
            Share
          </button>
          <button className="flex items-center text-sm font-medium text-gray-700 hover:text-accent">
            <svg className="h-5 w-5 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
            Save for later
          </button>
          <button className="flex items-center text-sm font-medium text-gray-700 hover:text-accent">
            <svg className="h-5 w-5 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            Add to cart
          </button>
        </div>
      </div>

      {/* Modals */}
      <SizeGuideModal
        isOpen={showSizeGuide}
        onClose={() => setShowSizeGuide(false)}
        gender="men"
      />
      <ShareModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        productName={currentProduct.name}
        productUrl={window.location.href}
        productImage={selectedVariant?.thumbnail_url}
        productPrice={String(selectedVariant?.discount_price || '')}
      />
    </div>
  );
};

export default ProductDetails;
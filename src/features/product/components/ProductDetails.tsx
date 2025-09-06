import React, { useState } from "react";
import type { Product, ProductDetail } from "../../../types/product";
import ProductTitleRating from '@features/product/sections/ProductTitleRating';
import ProductPrice from "@features/product/sections/ProductPrice";
import ProductDescription from "@features/product/sections/ProductDescription";
import ProductColorSelector from "@features/product/sections/ProductColorSelector";
import ProductSizeSelector from "@features/product/sections/ProductSizeSelector";
import ProductQuantitySelector from "@features/product/sections/ProductQuantitySelector";
import ProductActionButtons from "@features/product/sections/ProductActionsButton";
import ProductExtras from "@features/product/sections/ProductExtras";
import PaymentMethods from "@features/product/sections/PaymentMethods";
import ReturnsPolicy from "@features/product/sections/ReturnsPolicy";
import CollapsibleSections from "@features/product/sections/CollapsibleSections";
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
  return (
    <div className="space-y-6">
      <ProductTitleRating currentProduct={currentProduct} />
      <ProductPrice selectedVariant={selectedVariant} />
      <ProductDescription description={currentProduct.description} />

      <ProductColorSelector
        currentProduct={currentProduct}
        selectedArticleId={selectedArticleId}
        selectedVariant={selectedVariant}
        onColorChange={onColorChange}
      />

      <ProductSizeSelector
        fullSizeRange={fullSizeRange}
        availableSizes={availableSizes}
        selectedSize={selectedSize}
        onSizeChange={onSizeChange}
        onWhatsAppContact={onWhatsAppContact}
        onShowSizeGuide={() => setShowSizeGuide(true)}
      />

      <ProductQuantitySelector
        quantity={quantity}
        onQuantityChange={onQuantityChange}
      />

      <ProductActionButtons
        onAddToCart={onAddToCart}
        onBuyNow={onBuyNow}
      />

      <ProductExtras onShare={() => setShowShareModal(true)} />

      <PaymentMethods />
      <ReturnsPolicy />

      <CollapsibleSections subCategory={currentProduct.sub_category} />

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
        productPrice={selectedVariant?.discount_price}
      />
    </div>
  );
};

export default ProductDetails;
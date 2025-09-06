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
import React, { useState, useMemo, useEffect } from "react";
import type { Product, ProductDetail } from "../../../types/product";
import {
  getActiveProductDiscountsForProducts,
  applyProductDiscountToPrice,
  getActiveCheckoutRule,
  type ProductDiscountRule,
  type CheckoutRule,
} from "@lib/discounts";
import ProductColorSelector from "@features/product/sections/ProductColorSelector";
import ProductSizeSelector from "@features/product/sections/ProductSizeSelector";
import ProductQuantitySelector from "@features/product/sections/ProductQuantitySelector";
import ProductActionButtons from "@features/product/sections/ProductActionButtons";
import SizeGuideModal from "../../../components/ui/SizeGuideModal";
import ShareModal from "./ShareModal";
import ProductDescription from "./ProductDescription";

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
  isWishlisted: boolean;
  isBag?: boolean;
  isOutOfStock?: boolean;
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
  onWishlistToggle,
  isWishlisted,
  isBag = false,
  isOutOfStock = false,
}) => {
  const [showSizeGuide, setShowSizeGuide] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);

  // Memoized care instructions based on product sub_category
  const careInstructions = useMemo(() => {
    const category = (currentProduct.sub_category || '').toLowerCase();

    const careInstructionsMap: Record<string, string[]> = {
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
    for (const [key, instructions] of Object.entries(careInstructionsMap)) {
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
  }, [currentProduct.sub_category]);

  const [productOfferRule, setProductOfferRule] = useState<ProductDiscountRule | null>(null);
  const [productOfferLoading, setProductOfferLoading] = useState(false);

  useEffect(() => {
    const pid = selectedVariant?.product_id;
    if (!pid) {
      setProductOfferRule(null);
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        setProductOfferLoading(true);
        const map = await getActiveProductDiscountsForProducts([pid]);
        if (!cancelled) {
          setProductOfferRule(map[pid] || null);
        }
      } catch {
        if (!cancelled) {
          setProductOfferRule(null);
        }
      } finally {
        if (!cancelled) {
          setProductOfferLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [selectedVariant?.product_id]);

  const {
    displayPrice,
    basePriceForDisplay,
    savingsAmount,
    hasOffer,
    offerLabel,
  } = useMemo(() => {
    const numericPrice = Number(selectedVariant?.discount_price || 0);
    const numericMrp = Number(
      (selectedVariant as any)?.mrp_price ?? (selectedVariant as any)?.mrp ?? 0
    );

    if (!productOfferRule) {
      const showMrp = numericMrp > numericPrice;
      const basePrice = showMrp ? numericMrp : numericPrice;
      const savings =
        showMrp && basePrice > numericPrice ? basePrice - numericPrice : 0;
      return {
        displayPrice: numericPrice,
        basePriceForDisplay: showMrp ? basePrice : 0,
        savingsAmount: savings,
        hasOffer: false,
        offerLabel: "",
      };
    }

    const discountedPrice = applyProductDiscountToPrice(
      numericPrice,
      numericMrp || undefined,
      productOfferRule
    );
    const baseForSavings =
      productOfferRule.base === "mrp" && numericMrp
        ? numericMrp
        : numericPrice;
    const savings = Math.max(0, baseForSavings - discountedPrice);

    let label = "";
    if (productOfferRule.mode === "percent") {
      label = `Get ${productOfferRule.value}% off`;
      if (productOfferRule.max_discount_cap != null) {
        label += ` up to ₹${Number(
          productOfferRule.max_discount_cap
        ).toLocaleString("en-IN")}`;
      }
      if (productOfferRule.base === "mrp" && numericMrp) {
        label += " on MRP";
      }
    } else {
      label = `Flat ₹${Number(
        productOfferRule.value
      ).toLocaleString("en-IN")} off`;
    }

    return {
      displayPrice: discountedPrice,
      basePriceForDisplay: baseForSavings,
      savingsAmount: savings,
      hasOffer: true,
      offerLabel: label,
    };
  }, [selectedVariant, productOfferRule]);

  const [checkoutRule, setCheckoutRule] = useState<CheckoutRule | null>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const rule = await getActiveCheckoutRule();
        if (!cancelled) {
          setCheckoutRule(rule);
        }
      } catch {
        if (!cancelled) {
          setCheckoutRule(null);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const checkoutOfferLabel = useMemo(() => {
    if (!checkoutRule) return "";

    const kind = (checkoutRule.rule_type || checkoutRule.type) as
      | "percent"
      | "amount"
      | undefined;
    if (!kind) return "";

    let baseText = "";
    if (kind === "percent") {
      const pct = Number(checkoutRule.percent) || 0;
      baseText = `Extra ${pct}% off`;
      if (checkoutRule.max_discount_cap != null) {
        baseText += ` up to ₹${Number(
          checkoutRule.max_discount_cap
        ).toLocaleString("en-IN")}`;
      }
    } else {
      const amt = Number(checkoutRule.amount) || 0;
      if (!amt) return "";
      baseText = `Flat ₹${amt.toLocaleString("en-IN")} off`;
    }

    let suffix = " on prepaid orders";
    if (checkoutRule.min_order && Number(checkoutRule.min_order) > 0) {
      suffix += ` on orders above ₹${Number(
        checkoutRule.min_order
      ).toLocaleString("en-IN")}`;
    }

    return `${baseText}${suffix}`;
  }, [checkoutRule]);

  const hasCheckoutOffer = !!checkoutOfferLabel;

  return (
    <div className="space-y-6">
      {/* Brand and Category */}
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {selectedVariant?.name || currentProduct.name}
          </h1>
        </div>
      </div>

      {/* Price & Offers */}
      <div className="mt-4 space-y-1">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-3xl font-bold text-gray-900 dark:text-white">
            ₹{displayPrice.toLocaleString("en-IN")}
          </span>
          {basePriceForDisplay > displayPrice && (
            <>
              <span className="text-lg text-gray-500 dark:text-gray-400 line-through">
                ₹{basePriceForDisplay.toLocaleString("en-IN")}
              </span>
              {savingsAmount > 0 && (
                <span className="text-sm bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 px-2 py-1 rounded font-medium">
                  Save ₹{savingsAmount.toLocaleString("en-IN")}
                </span>
              )}
            </>
          )}
        </div>
        <p className="text-sm text-green-600 dark:text-green-400">
          Inclusive of all taxes
        </p>
        {productOfferLoading && !hasOffer && !hasCheckoutOffer && (
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Checking available offers...
          </p>
        )}
        {(hasOffer || hasCheckoutOffer) && (
          <div className="mt-2 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-lg p-3 text-sm text-green-800 dark:text-green-200">
            <p className="font-semibold mb-1">Available Offers</p>
            <ul className="space-y-1 text-xs sm:text-sm">
              {hasOffer && (
                <li className="flex items-start gap-1.5">
                  <svg
                    className="w-3.5 h-3.5 mt-0.5 text-green-500 flex-shrink-0"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 00-1.414 0L8 12.586 4.707 9.293A1 1 0 003.293 10.707l4 4a1 1 0 001.414 0l8-8a1 1 0 000-1.414z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span>{offerLabel}</span>
                </li>
              )}
              {hasCheckoutOffer && (
                <li className="flex items-start gap-1.5">
                  <svg
                    className="w-3.5 h-3.5 mt-0.5 text-green-500 flex-shrink-0"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 00-1.414 0L8 12.586 4.707 9.293A1 1 0 003.293 10.707l4 4a1 1 0 001.414 0l8-8a1 1 0 000-1.414z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span>{checkoutOfferLabel}</span>
                </li>
              )}
            </ul>
          </div>
        )}
        {!hasOffer && !hasCheckoutOffer && !productOfferLoading && (
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            No special offers currently available on this product.
          </p>
        )}
      </div>

      {/* Color Selector */}
      <div className="pt-3 border-t border-gray-200">
        <ProductColorSelector
          currentProduct={currentProduct}
          selectedVariant={selectedVariant}
          selectedArticleId={selectedArticleId}
          onColorChange={onColorChange}
        />
      </div>

      {/* Size Selector - Only show if a variant/color is selected */}
      {selectedVariant && (
        <div className="pt-3 border-t border-gray-200">
          <ProductSizeSelector
            fullSizeRange={fullSizeRange}
            availableSizes={availableSizes}
            selectedSize={selectedSize}
            onSizeChange={onSizeChange}
            onWhatsAppContact={onWhatsAppContact}
            onShowSizeGuide={() => setShowSizeGuide(true)}
            isBag={isBag}
            isOutOfStock={isOutOfStock}
            gender={currentProduct.gender?.toLowerCase() as 'men' | 'women' | undefined}
            subCategory={currentProduct.sub_category}
          />
        </div>
      )}

      {/* Quantity Selector - Only show if a size is selected */}
      {selectedSize && (
        <div className="pt-3 border-t border-gray-200">
          <ProductQuantitySelector
            quantity={quantity}
            onQuantityChange={onQuantityChange}
            maxQuantity={10}
          />
        </div>
      )}

      {/* Action Buttons and Trust Badge */}
      <div className="pt-3 space-y-3">
        <ProductActionButtons
          onAddToCart={onAddToCart}
          onBuyNow={onBuyNow}
          isOutOfStock={isOutOfStock}
          isBag={isBag}
        />

        <div className="flex items-center justify-center space-x-2 py-2 px-2">
          <svg className="h-5 w-5 text-green-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.02-.382-3.016z" />
          </svg>
          <span className="text-xs text-gray-500 dark:text-gray-400 text-center">Secure Checkout with Razorpay</span>
        </div>
      </div>

      {/* Product Description */}
      {currentProduct.description && (
        <ProductDescription
          description={currentProduct.description}
        />
      )}

      {/* Product Highlights */}
      <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
        <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3">Product Highlights</h3>
        <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
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
            <span>Easy 3-days returns</span>
          </li>
        </ul>
      </div>

      {/* Care Instructions */}
      <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
        <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3">Care Instructions</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {careInstructions.slice(0, 4).map((instruction, index) => (
            <div key={index} className="flex items-start">
              <svg className="h-4 w-4 text-gray-400 dark:text-gray-500 mt-0.5 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span className="text-xs text-gray-600 dark:text-gray-400">{instruction}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Share & More */}
      <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-center sm:justify-start">
          <button
            onClick={() => setShowShareModal(true)}
            className="flex items-center text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-accent transition-colors px-3 py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800"
          >
            <svg className="h-5 w-5 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
            </svg>
            Share this Product
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
        productName={selectedVariant?.name || currentProduct.name}
        productUrl={window.location.href}
        productImage={selectedVariant?.thumbnail_url}
        productPrice={String(selectedVariant?.discount_price || '')}
      />
    </div>
  );
};

export default ProductDetails;
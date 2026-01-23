import React, { useState, useMemo, useEffect } from "react";
import type { Product, ProductDetail } from "../../../types/product";
import { hasValidSizePrices, parseProductSizes } from "@lib/productAvailability";
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
import PincodeSearch from "./PincodeSearch";
import razorpayPayments from "../../../assets/razorpay-with-all-cards-upi-seeklogo.png";

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
  productOfferRule?: ProductDiscountRule | null;
  productOfferLoading?: boolean;
  showError?: (message: string) => void;
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
  isWishlisted,
  isBag = false,
  isOutOfStock = false,
  productOfferRule,
  productOfferLoading,
  showError,
}) => {
  const [showSizeGuide, setShowSizeGuide] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [availableQuantities, setAvailableQuantities] = useState<Record<string, number>>({});
  const [maxQuantity, setMaxQuantity] = useState(0);

  // Extract product details
  const gender = currentProduct.gender?.toLowerCase() as 'men' | 'women' | undefined;
  const subCategory = currentProduct.sub_category;
  const category = currentProduct.category;
  const sizePrices = selectedVariant?.size_prices || null;
  const discountPrice = selectedVariant?.discount_price ? Number(selectedVariant.discount_price) : null;

  // Handle size change
  const handleSizeChange = (size: string) => {
    onSizeChange(size);
    // Update max quantity when size changes
    if (availableQuantities[size]) {
      setMaxQuantity(availableQuantities[size]);
      // Reset quantity to 1 when size changes if needed
      if (quantity > availableQuantities[size]) {
        onQuantityChange(1);
      }
    } else {
      setMaxQuantity(0);
    }
  };

  // Handle show size guide
  const handleShowSizeGuide = () => {
    setShowSizeGuide(true);
  };

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

  useEffect(() => {
    if (selectedVariant) {
      const sizes = parseProductSizes(selectedVariant.sizes);
      setAvailableQuantities(sizes);
      
      // Update max quantity based on selected size
      if (selectedSize && sizes[selectedSize]) {
        setMaxQuantity(sizes[selectedSize]);
      } else {
        setMaxQuantity(0);
      }
    }
  }, [selectedVariant, selectedSize]);

  useEffect(() => {
    const pid = selectedVariant?.product_id;
    if (!pid) {
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        // The props are already managed by the parent component
        // No need to set local state here
      } catch {
        if (!cancelled) {
          // Handle error if needed
        }
      } finally {
        if (!cancelled) {
          // Handle cleanup if needed
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
    shouldShowOnlyMrp,
  } = useMemo(() => {
    const numericPrice = Number(selectedVariant?.discount_price || 0);
    const numericMrp = Number(
      selectedVariant?.mrp_price ?? selectedVariant?.mrp ?? 0
    );
    
    // Check if size_prices exists and has valid values
    const hasSizePrices = hasValidSizePrices(selectedVariant?.size_prices);

    // If size_prices exists, show only MRP in main pricing section
    if (hasSizePrices) {
      return {
        displayPrice: numericMrp,
        basePriceForDisplay: 0,
        savingsAmount: 0,
        hasOffer: false,
        offerLabel: "",
        shouldShowOnlyMrp: true,
      };
    }

    // Always show normal pricing (MRP vs discount price) without applying product discounts
    const showMrp = numericMrp > numericPrice;
    const basePrice = showMrp ? numericMrp : numericPrice;
    const savings =
      showMrp && basePrice > numericPrice ? basePrice - numericPrice : 0;

    // Generate offer label if product discount exists, but don't apply to pricing
    let offerLabel = "";
    let hasProductOffer = false;
    
    if (productOfferRule) {
      hasProductOffer = true;
      if (productOfferRule.mode === "percent") {
        offerLabel = `Get ${productOfferRule.value}% off`;
        if (productOfferRule.max_discount_cap != null) {
          offerLabel += ` up to ₹${Number(
            productOfferRule.max_discount_cap
          ).toLocaleString("en-IN")}`;
        }
        if (productOfferRule.base === "mrp" && numericMrp) {
          offerLabel += " on MRP";
        }
      } else {
        offerLabel = `Flat ₹${Number(
          productOfferRule.value
        ).toLocaleString("en-IN")} off`;
      }
    }

    return {
      displayPrice: numericPrice,
      basePriceForDisplay: showMrp ? basePrice : 0,
      savingsAmount: savings,
      hasOffer: hasProductOffer,
      offerLabel: offerLabel,
      shouldShowOnlyMrp: false,
    };
  }, [
    selectedVariant,
    productOfferRule,
  ]);

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
          {shouldShowOnlyMrp ? (
            // Show only MRP when size_prices exists
            <span className="text-3xl font-bold text-gray-900 dark:text-white">
              MRP ₹{displayPrice.toLocaleString("en-IN")}
            </span>
          ) : (
            // Show normal pricing when no size_prices
            <>
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
      </div>
      
      {/* Exchange Policy Notice */}
      <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
        <div className="flex items-start gap-2">
          <div>
            <p className="mt-1 text-sm sm:text-base text-amber-700 dark:text-amber-300">
              Exchange only, no returns or refunds.
            </p>
          </div>
        </div>
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
            onSizeChange={handleSizeChange}
            onWhatsAppContact={onWhatsAppContact}
            onShowSizeGuide={handleShowSizeGuide}
            isBag={isBag}
            isOutOfStock={isOutOfStock}
            gender={gender}
            subCategory={subCategory}
            category={category}
            sizePrices={sizePrices}
            discountPrice={discountPrice}
            availableQuantities={availableQuantities}
            currentQuantity={quantity}
            onQuantityChange={onQuantityChange}
          />
        </div>
      )}

      {/* Pincode Search */}
      <PincodeSearch />

      {/* Quantity Selector - Only show if a size is selected */}
      {selectedSize && (
        <div className="pt-3 border-t border-gray-200">
          <ProductQuantitySelector
            quantity={quantity}
            maxQuantity={maxQuantity}
            onQuantityChange={onQuantityChange}
            disabled={!selectedSize || isOutOfStock}
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
          selectedSize={selectedSize}
          quantity={quantity}
          availableQuantity={maxQuantity}
          selectedVariant={selectedVariant}
          showError={showError}
        />

        <div className="flex items-center justify-center space-x-2 py-2 px-2">
          <svg className="h-5 w-5 text-green-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.02-.382-3.016z" />
          </svg>
          <span className="text-xs text-gray-500 dark:text-gray-400 text-center">Secure Checkout with Razorpay</span>
        </div>
      </div>

                  <div className="w-full max-w-xs mx-auto">
                    <img
                      src={razorpayPayments}
                      alt="Payment methods: Cards, UPI and Razorpay"
                      className="h-10 sm:h-12 md:h-14 lg:h-16 w-full object-contain dark:invert dark:brightness-90 dark:contrast-125"
                      loading="lazy"
                    />
                  </div>
      {/* Product Description */}
      {currentProduct.description && (
        <ProductDescription
          description={currentProduct.description}
        />
      )}
{/* 
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
            <span>Easy 3-days replacement</span>
          </li>
        </ul>
      </div>

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
 */}
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
        gender={gender}
        subCategory={subCategory}
      />
      <ShareModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        productName={selectedVariant?.name || currentProduct.name}
        productUrl={`${typeof window !== 'undefined' ? window.location.origin : ''}/products/${selectedArticleId}`}
        productImage={selectedVariant?.thumbnail_url}
        productPrice={String(selectedVariant?.discount_price || '')}
      />
    </div>
  );
};

export default ProductDetails;
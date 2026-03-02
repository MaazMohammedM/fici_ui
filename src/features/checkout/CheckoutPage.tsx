// src/pages/CheckoutPage.tsx
import React, {
  useCallback,
  useMemo,
  useState,
  useEffect,
  useRef,
} from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { ArrowLeft, Shield, Phone, Plus } from "lucide-react";
import { OtpFlow } from "@/components/otp";
import AddressCard from "./components/AddressForm";
import GuestAddressForm from "./components/GuestAddressForm";
 import OrderSummary from "./components/OrderSummary";
import PaymentStatusModal from "./modal/PaymentStatusModal";
import GuestCheckoutForm from "./components/GuestCheckoutForm";
import PhoneUpdateWithOtp from "@/components/PhoneUpdateWithOtp";
import CheckoutSummary from "./components/CheckoutSummary";
import CheckoutAddressSection from "./components/CheckoutAddressSection";
import CheckoutPaymentSection from "./components/CheckoutPaymentSection";
import CheckoutActions from "./components/CheckoutActions";
import { db, collection, doc, getDoc, getDocs, query, where, updateDoc } from "@lib/firebase";
import { firebaseHelpers } from "@lib/firebaseUtils";
import { httpsCallable, functions } from "@lib/firebase";
import { 
  getOtpIdentity, 
  getNonEditableIdentityFields, 
  shouldShowMissingPhoneMessage,
  getMissingPhoneMessage,
  validateOtpIdentity,
  getOtpContact,
  type OtpIdentity,
  type IdentityFields 
} from "@utils/otpIdentity";
import { 
  isCurrentIdentityVerified, 
  shouldRequireOtpVerification,
  getVerificationStatus, 
  markCurrentIdentityVerified
} from "@utils/identityVerification";
import type { Address } from "./components/AddressForm";
import type { GuestContactInfo } from "../../types/guest";
import razorpayPayments from "../../assets/razorpay-with-all-cards-upi-seeklogo.png";
import {
  getActiveCheckoutRule,
  calculateCheckoutDiscount,
  getActiveProductDiscountsForProducts,
  applyProductDiscountToPrice,
  type ProductDiscountRule,
  type CheckoutRule,
} from "@lib/discounts";
import { usePincodeStore } from "@store/pincodeStore";
import { useAuthStore } from "@store/authStore";
import { useCartStore } from "@store/cartStore";
import { usePaymentStore } from "@store/paymentStore";
import { useThemeStore } from "@store/themeStore";
import { useWishlistStore } from "@store/wishlistStore";
import AlertModal from "@components/ui/AlertModal";
import { clearIdentityVerification } from "@utils/identityVerification";
import { validateCartItemStock } from "@lib/stock/stockValidator";

// Payment method type for consistency
export type PaymentMethod = "razorpay" | "cod";

const getRazorpayKey = () => {
  if (
    typeof window !== "undefined" &&
    (window as any).__RAZORPAY_KEY__
  )
    return (window as any).__RAZORPAY_KEY;
  if (
    typeof process !== "undefined" &&
    (process as any).env?.REACT_APP_RAZORPAY_KEY_ID
  )
    return (process as any).env.REACT_APP_RAZORPAY_KEY_ID;
  if (
    typeof import.meta !== "undefined" &&
    (import.meta as any).env?.VITE_RAZORPAY_KEY_ID
  )
    return (import.meta as any).env.VITE_RAZORPAY_KEY_ID;
  return "rzp_test_R5h4s0BLbxYV33";
};

const loadRazorpayScript = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    if ((window as any).Razorpay) return resolve();
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () =>
      reject(new Error("Razorpay SDK failed to load"));
    document.head.appendChild(script);
  });
};

const CHECKOUT_DRAFT_KEY = "checkoutDraft";
const CHECKOUT_SESSION_KEY = "checkoutSessionId";

const CheckoutPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { items: cartItems, getCartTotal, clearCart, removeFromCart } = useCartStore();
  const { savePaymentDetails } = usePaymentStore(); // currently unused but kept for behavior
  const { mode, initializeTheme } = useThemeStore(); // Add theme store to respond to theme changes
  const { addToWishlist } = useWishlistStore();
  const user = useAuthStore((state) => state.user);
  const userProfile = useAuthStore((state) => state.userProfile);
  const setUserProfile = useAuthStore((state) => state.setUserProfile);
  const isGuest = useAuthStore((state) => state.isGuest);
  const guestInfo = useAuthStore((state) => state.guestContactInfo);
  const setGuestInfo = useAuthStore((state) => state.updateGuestContactInfo);
  const guestContactInfo = useAuthStore((state) => state.guestContactInfo);
  const guestSession = useAuthStore((state) => state.guestSession);
  const createGuestSession = useAuthStore(
    (state) => state.createGuestSession
  );
  const clearGuestSessionState = useAuthStore((state) => state.clearGuestSession);
  const getAuthenticationType = useAuthStore(
    (state) => state.getAuthenticationType
  );

  const [selectedAddress, setSelectedAddress] = useState<Address | null>(
    null
  );
  const [selectedPayment, setSelectedPayment] =
    useState<PaymentMethod>("razorpay"); // Default to Razorpay
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<
    "success" | "failed" | "pending" | null
  >(null);
  const [currentOrderId, setCurrentOrderId] = useState<string | null>(
    null
  );
  const currentOrderIdRef = useRef<string | null>(null);
  const [showPaymentStatus, setShowPaymentStatus] = useState(false);
  const [codConfirmOpen, setCodConfirmOpen] = useState(false);
  const [codWarningShown, setCodWarningShown] = useState(false);

  const [productDiscounts, setProductDiscounts] = useState<
    Record<string, ProductDiscountRule>
  >({});
  const [checkoutRule, setCheckoutRule] = useState<CheckoutRule | null>(
    null
  );

  // Additional missing state variables
  const [showPhoneUpdate, setShowPhoneUpdate] = useState(false);
  const [showGuestForm, setShowGuestForm] = useState(false);
  const [isIdentityVerified, setIsIdentityVerified] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState<any>(null);
  const [codOtpTriggered, setCodOtpTriggered] = useState(false);
  const [otpValue, setOtpValue] = useState('');
  const [otpError, setOtpError] = useState('');
  // Unique checkout session id used to scope OTP verification to this checkout attempt
  const [checkoutSessionId, setCheckoutSessionId] = useState<string | null>(() => {
    // Always generate a fresh session ID on component mount to ensure OTP is scoped per checkout attempt
    const fresh = crypto.randomUUID();
    sessionStorage.setItem(CHECKOUT_SESSION_KEY, fresh);
    return fresh;
  });

  // Navigation warning modal state
  const [navigationWarning, setNavigationWarning] = useState<{
    isOpen: boolean;
    message: string;
    onConfirm: () => void;
    onCancel: () => void;
  }>({
    isOpen: false,
    message: "",
    onConfirm: () => {},
    onCancel: () => {},
  });

  const [showOtpVerification, setShowOtpVerification] = useState(false);
  const [showOtpVerificationPage, setShowOtpVerificationPage] = useState(false);

  const [alertModal, setAlertModal] = useState<{
    isOpen: boolean;
    message: string;
    type?: "info" | "warning" | "error" | "success";
  }>({
    isOpen: false,
    message: "",
    type: "info",
  });

  const [prepaidDiscountAmount, setPrepaidDiscountAmount] = useState(0);
  const [productDetails, setProductDetails] = useState<Record<string, any>>({});
  const [validationResults, setValidationResults] = useState<Record<string, any>>({});

  // Reset guest form state when guest session is cleared
  useEffect(() => {
    if (isGuest && !guestSession && !guestInfo && !showGuestForm) {
      setShowGuestForm(true);
      setSelectedAddress(null);
    }
  }, [isGuest, guestSession, guestInfo, showGuestForm]);

  // Load product details for cart validation
  useEffect(() => {
    const loadProductDetails = async () => {
      if (!cartItems.length) return;

      // Debug logging for cart items
      console.log('Processing cart items:', cartItems.map(item => ({
        cartItemId: item.id,
        productId: item.product_id,
        productName: item.name,
        size: item.size,
        quantity: item.quantity
      })));

      const productIds = Array.from(new Set(cartItems.map(item => item.product_id).filter(Boolean)));
      
      console.log('Fetching product details for IDs:', productIds);
      
      if (productIds.length === 0) return;

      try {
        // Build proper query for multiple product IDs using Firebase
        const productsQuery = query(
          collection(db, 'products'),
          where('product_id', 'in', productIds)
        );
        
        const querySnapshot = await getDocs(productsQuery);
        const products = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() as any }));

        if (products.length === 0) {
          console.error('No products found');
          return;
        }

        console.log('Products returned from database:', products.map(p => ({
          productId: p.product_id,
          productName: p.name,
          articleId: p.article_id
        })));

        // Create a mapping from product_id to product details for easier lookup
        const productMap = products.reduce((acc, product) => {
          acc[product.product_id] = product;
          return acc;
        }, {});

        // Now map each cart item to its product details
        const details = cartItems.reduce((acc, cartItem) => {
          const product = productMap[cartItem.product_id];
          
          // Debug logging for product mapping
          console.log('Mapping product to cart:', {
            cartItemId: cartItem.id,
            productId: cartItem.product_id,
            productName: cartItem.name,
            foundProduct: !!product,
            productNameFromDb: product?.name
          });
          
          if (product) {
            acc[cartItem.id] = product;
          }
          return acc;
        }, {});

        setProductDetails(details);

        // Validate cart items
        const invalidItems = cartItems.filter(item => {
          const product = details[item.id];
          if (!product) {
            console.warn(`Product details not found for cart item ${item.id}, product_id: ${item.product_id}`);
            return true; // Mark as invalid if product details not found
          }
          
          const stock = validateCartItemStock(product, {
            size: item.size,
            quantity: item.quantity,
          });
          
          // Debug logging for troubleshooting
          if (!stock.isActive || !stock.selectedSizeInStock || stock.issues.length > 0) {
            console.warn(`Item validation failed:`, {
              cartItemId: item.id,
              productName: item.name,
              productId: item.product_id,
              selectedSize: item.size,
              requestedQuantity: item.quantity,
              productSizes: product.sizes,
              stock,
              parsedSizes: JSON.parse(product.sizes || '{}')
            });
          }
          
          return !stock.isActive || !stock.selectedSizeInStock || stock.issues.length > 0;
        });
        
        setValidationResults(
          cartItems.reduce((acc, item) => {
            const product = details[item.id];
            const stock = validateCartItemStock(product, {
              size: item.size,
              quantity: item.quantity,
            });
            
            acc[item.id] = {
              isValid: stock.isActive && stock.selectedSizeInStock && stock.issues.length === 0,
              isInactive: !stock.isActive,
              isOutOfStock: !stock.selectedSizeInStock || stock.issues.length > 0,
              errors: []
            };
            
            if (!product) {
              acc[item.id].errors.push('Product information not found');
            } else {
              if (!stock.isActive) acc[item.id].errors.push('Product is no longer available');
              if (!stock.selectedSizeInStock || stock.issues.length > 0) {
                if (!item.size) {
                  acc[item.id].errors.push('No size selected');
                } else {
                  if (stock.issues.includes('SIZE_OUT_OF_STOCK')) {
                    acc[item.id].errors.push(`Size ${item.size} is out of stock`);
                  } else if (stock.issues.includes('QUANTITY_EXCEEDED')) {
                    acc[item.id].errors.push(`Only ${stock.availableQty} available in size ${item.size}, but you requested ${item.quantity}`);
                  } else {
                    acc[item.id].errors.push(`Size ${item.size} is not available`);
                  }
                }
              }
            }
            
            return acc;
          }, {} as Record<string, any>)
        );

      } catch (error) {
        console.error('Error loading product details:', error);
      }
    };

    loadProductDetails();
  }, [cartItems]);

  // Cart verification modal state
  const [showCartVerification, setShowCartVerification] = useState(false);

  // Show cart verification on page load if there are items
  useEffect(() => {
    if (cartItems.length > 0) {
      setShowCartVerification(true);
    }
  }, [cartItems.length]);

  // Derived label for checkout-level offer (prepaid)
  const checkoutOfferLabel = useMemo(() => {
    if (!checkoutRule) return "";

    const kind = (checkoutRule.rule_type || checkoutRule.type) as
      | "percent"
      | "amount"
      | undefined;
    if (!kind) return "";

    if (kind === "amount") {
      const amt = Number(checkoutRule.amount) || 0;
      if (!amt) return "";
      let label = `Flat ₹${amt.toLocaleString(
        "en-IN"
      )} off on prepaid orders`;
      if (checkoutRule.min_order && Number(checkoutRule.min_order) > 0) {
        label += ` on orders above ₹${Number(
          checkoutRule.min_order
        ).toLocaleString("en-IN")}`;
      }
      return label;
    }

    const pct = Number(checkoutRule.percent) || 0;
    if (!pct) return "";
    let label = `Extra ${pct}% off`;
    if (checkoutRule.max_discount_cap != null) {
      label += ` up to ₹${Number(
        checkoutRule.max_discount_cap
      ).toLocaleString("en-IN")}`;
    }
    label += " on prepaid orders";
    if (checkoutRule.min_order && Number(checkoutRule.min_order) > 0) {
      label += ` on orders above ₹${Number(
        checkoutRule.min_order
      ).toLocaleString("en-IN")}`;
    }
    return label;
  }, [checkoutRule]);

  // Check if user has unsaved changes (has items in cart and hasn't completed order)
  const hasUnsavedChanges = useMemo(() => {
    return cartItems.length > 0 && !paymentStatus;
  }, [cartItems.length, paymentStatus]);

  // Generic alert
  const showAlert = (
    message: string,
    type: "info" | "warning" | "error" | "success" = "info"
  ) => {
    setAlertModal({
      isOpen: true,
      message,
      type,
    });
  };

  // Handle navigation attempts
  const handleNavigationAttempt = useCallback(
    (callback: () => void) => {
      if (hasUnsavedChanges) {
        setNavigationWarning({
          isOpen: true,
          message:
            "You have items in your cart and haven't completed your order. Are you sure you want to leave? Your progress will be lost.",
          onConfirm: callback,
          onCancel: () =>
            setNavigationWarning((prev) => ({
              ...prev,
              isOpen: false,
            })),
        });
      } else {
        callback();
      }
    },
    [hasUnsavedChanges]
  );

  // Handle browser back button and page unload
  useEffect(() => {
    if (!hasUnsavedChanges) return;

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      // Clear guest session data when leaving the page
      if (isGuest) {
        const { clearGuestSession } = useAuthStore.getState();
        clearGuestSession();
      }
      
      e.preventDefault();
      e.returnValue =
        "You have unsaved changes. Are you sure you want to leave?";
      return e.returnValue;
    };

    const handlePopState = (e: PopStateEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        window.history.pushState(null, "", window.location.pathname);
        setNavigationWarning({
          isOpen: true,
          message:
            "You have items in your cart and haven't completed your order. Are you sure you want to go back? Your progress will be lost.",
          onConfirm: () => window.history.back(),
          onCancel: () =>
            setNavigationWarning((prev) => ({
              ...prev,
              isOpen: false,
            })),
        });
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    window.addEventListener("popstate", handlePopState);
    window.history.pushState(null, "", window.location.pathname);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      window.removeEventListener("popstate", handlePopState);
    };
  }, [hasUnsavedChanges, isGuest]);

  // Handle guest data cleanup on page unload (even without unsaved changes)
  useEffect(() => {
    if (!isGuest) return;

    const handlePageHide = () => {
      // Clear guest session data when page is hidden (navigation, tab close, etc.)
      const { clearGuestSession } = useAuthStore.getState();
      clearGuestSession();
    };

    window.addEventListener("pagehide", handlePageHide);

    return () => {
      window.removeEventListener("pagehide", handlePageHide);
    };
  }, [isGuest]);

// Update the subtotal calculation to use discount_price when available
const subtotal = useMemo(() => {
  return cartItems.reduce((sum, item) => {
    const price = item.discount_price || item.price ;
    return sum + price * item.quantity;
  }, 0);
}, [cartItems]);

  // Calculate original price total (sum of item.price, not item.mrp)
  const originalPriceTotal = useMemo(() => {
    return cartItems.reduce((sum, item) => {
      return sum + item.price * item.quantity;
    }, 0);
  }, [cartItems]);

  // Calculate MRP total (without any discounts - uses item.mrp if available, otherwise item.price)
  const mrpTotal = useMemo(() => {
    return cartItems.reduce((sum, item) => {
      const base = item.mrp ?? item.price;
      return sum + base * item.quantity;
    }, 0);
  }, [cartItems]);

// Calculate product savings only when there are active product discounts
const productSavings = useMemo(() => {
  if (!cartItems.length || Object.keys(productDiscounts).length === 0) return 0;
  
  const totalSavings = cartItems.reduce((sum, item) => {
    // Only calculate savings if there's an active discount for this product
    if (productDiscounts[item.id]) {
      // Convert string prices to numbers
      const mrp = item.mrp;
      const discountPrice = item.discount_price;
      const price = item.price;
      
      // Use the lower of discount_price or price, but only if it's actually a discount
      const discountedPrice = discountPrice > 0 && discountPrice < mrp ? discountPrice : price;
      
      // Only show savings if the discounted price is actually less than MRP
      if (discountedPrice < mrp) {
        const originalLine = mrp * item.quantity;
        const lineSubtotal = discountedPrice * item.quantity;
        return sum + (originalLine - lineSubtotal);
      }
    }
    return sum;
  }, 0);
  
  return totalSavings;
}, [cartItems, productDiscounts]);

  // Calculate checkout discount (only for online payments)
  // Calculate on subtotal (after product discounts) for standard e-commerce behavior
  const checkoutDiscount = useMemo(() => {
    if (selectedPayment !== "razorpay") return 0;
    // Calculate checkout discount on the discounted subtotal (after product discounts)
    return checkoutRule ? calculateCheckoutDiscount(checkoutRule, subtotal) : 0;
  }, [checkoutRule, subtotal, selectedPayment]);

  // State for delivery charge calculation
  const [deliveryCharge, setDeliveryCharge] = useState(0);

  // Determine which discount to apply: only the bigger one, prefer prepaid when equal
  const discountType = useMemo(() => {
    if (checkoutDiscount > productSavings) {
      return 'prepaid';
    } else if (productSavings > checkoutDiscount) {
      return 'product';
    } else {
      // Equal amounts - prefer prepaid discount
      return 'prepaid';
    }
  }, [checkoutDiscount, productSavings]);

  // Calculate final total amount with only the selected discount
  const totalAmount = useMemo(() => {
    let finalSubtotal;
    
    if (discountType === 'prepaid') {
      // Use MRP total and apply only prepaid discount
      finalSubtotal = subtotal;
      if (selectedPayment === "razorpay" && checkoutRule) {
        const checkoutDiscountAmount = calculateCheckoutDiscount(checkoutRule, finalSubtotal);
        finalSubtotal = Math.max(0, finalSubtotal - checkoutDiscountAmount);
      }
    } else {
      // Use subtotal (product discounts already applied)
      finalSubtotal = subtotal;
    }
    
    return Math.max(0, finalSubtotal + deliveryCharge);
  }, [discountType, mrpTotal, subtotal, deliveryCharge, selectedPayment, checkoutRule]);
  const [deliveryTime, setDeliveryTime] = useState<string | null>(null);
  const [codAvailable, setCodAvailable] = useState(true);
  const [prevCodAvailable, setPrevCodAvailable] = useState(true);
  const [isPincodeServiceable, setIsPincodeServiceable] = useState(true);

  // Zustand store for pincode operations
  const { fetchDetails } = usePincodeStore();

  // Calculate delivery charge and other pincode-based details (excluding COD availability)
  useEffect(() => {
    const calculateDeliveryDetails = async () => {
      if (!selectedAddress?.pincode) {
        setDeliveryCharge(0);
        setDeliveryTime(null);
        // Don't set COD availability here - it's handled separately
        return;
      }

      try {
        // Fetch pincode details using the store (with caching)
        const details = await fetchDetails(selectedAddress.pincode);
        
        if (details) {
          // Check if pincode is serviceable
          if (details.is_serviceable === false) {
            setDeliveryCharge(0);
            setDeliveryTime(null);
            setIsPincodeServiceable(false);
            return;
          }
          
          // Use the details from the store
          const shippingFee = details.shipping_fee || 0;
          const freeShippingThreshold = details.free_shipping_threshold || 999;
          
          const finalDeliveryCharge = subtotal >= freeShippingThreshold ? 0 : shippingFee;
          setDeliveryCharge(finalDeliveryCharge);
          setDeliveryTime(details.delivery_time || null);
          setIsPincodeServiceable(true);
        } else {
          setDeliveryCharge(0);
          setDeliveryTime(null);
          setIsPincodeServiceable(true);
        }
      } catch (error) {
        console.error('Error calculating delivery details:', error);
        setDeliveryCharge(0);
        setDeliveryTime(null);
      }
    };

    calculateDeliveryDetails();
  }, [selectedAddress?.pincode, subtotal, fetchDetails]);

  // Separate useEffect for COD availability to prevent infinite loops
  useEffect(() => {
    const checkCodAvailability = async () => {
      if (!selectedAddress?.pincode) {
        setCodAvailable(true);
        setIsPincodeServiceable(true);
        return;
      }

      try {
        const details = await fetchDetails(selectedAddress.pincode);
        if (details) {
          // Set serviceability state
          setIsPincodeServiceable(details.is_serviceable !== false);
          // Only allow COD if pincode is serviceable AND COD is allowed
          setCodAvailable(details.is_serviceable !== false && details.cod_allowed !== false);
        } else {
          setIsPincodeServiceable(true);
          setCodAvailable(true);
        }
      } catch (error) {
        console.error('Error checking COD availability:', error);
        setCodAvailable(true);
        setIsPincodeServiceable(true);
      }
    };

    checkCodAvailability();
  }, [selectedAddress?.pincode, fetchDetails]); // Don't include subtotal

  // Auto-switch to online payment if COD becomes unavailable
  useEffect(() => {
    // Only switch if COD was previously available and now is unavailable
    // AND the current payment method is COD
    if (prevCodAvailable && !codAvailable && selectedPayment === "cod") {
      setSelectedPayment("razorpay");
      showAlert("COD is not available for this pincode. Switched to online payment.", "info");
    }
  }, [codAvailable, selectedPayment]); // Remove prevCodAvailable to prevent loop

  // Update previous COD availability separately
  useEffect(() => {
    setPrevCodAvailable(codAvailable);
  }, [codAvailable]);

  // Validate COD payment method
  const validateCODPayment = useCallback(() => {
    if (selectedPayment === "cod" && !codAvailable) {
      showAlert("COD is not available for this pincode. Please choose online payment.", "error");
      return false;
    }
    return true;
  }, [selectedPayment, codAvailable]);

  
  // Calculate display values for OrderSummary
  const displaySubtotal = useMemo(() => {
    // Show the price after applying the selected discount
    if (discountType === 'prepaid') {
      // For prepaid discount, show the price after prepaid discount is applied
      let discountedSubtotal = subtotal;
      if (selectedPayment === "razorpay" && checkoutRule) {
        const checkoutDiscountAmount = calculateCheckoutDiscount(checkoutRule, discountedSubtotal);
        discountedSubtotal = Math.max(0, discountedSubtotal - checkoutDiscountAmount);
      }
      return discountedSubtotal;
    } else {
      // For product discount, show the price after product discounts
      return subtotal;
    }
  }, [discountType, mrpTotal, subtotal, selectedPayment, checkoutRule]);

  const displayMRPTotal = useMemo(() => {
    // Always show the MRP total
    return mrpTotal;
  }, [mrpTotal]);

  const displaySavings = useMemo(() => {
    // Calculate total savings from MRP to current discounted price
    // This shows the actual savings the customer gets (MRP - discounted price)
    const totalSavings = mrpTotal - subtotal;
    return Math.max(0, totalSavings); // Ensure no negative savings
  }, [mrpTotal, subtotal]);

  // Check if dark mode is active
  const isDarkMode = mode === 'dark';
  
    const handlePhoneUpdateSuccess = (newPhone: string) => {
    // Update local state
    setUserProfile(prev => prev ? { ...prev, phone_number: newPhone } : null);
    setShowPhoneUpdate(false);
    showAlert('Phone number updated successfully!', 'success');
  };

  const getContactInfo = () => {
    if (user) {
      return {
        email:
          user.email ||
          (selectedAddress as any)?.email ||
          userProfile?.email ||
          "",
        phone:
          userProfile?.phone_number ||
          (user as any).phone ||
          (selectedAddress as any)?.phone ||
          "",
      };
    } else if (guestInfo) {
      return {
        email: guestInfo.email,
        phone: guestInfo.phone,
      };
    }
    return { email: "", phone: "" };
  };

  // Load draft and handle default address selection for signed-in users
  useEffect(() => {
    const saved = sessionStorage.getItem(CHECKOUT_DRAFT_KEY);
    let draftAddress = null;
    
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed?.selectedAddress) {
          // Only load the draft address if it belongs to the current user or if it's a guest address
          const address = parsed.selectedAddress;
          const isCurrentUserAddress = user && address.email === user.email;
          const isGuestAddress = !user && guestInfo && address.email === guestInfo.email;
          
          // For signed-in users, be more lenient about email matching
          if (user && address.email && !address.email.includes('guest')) {
            // Allow any non-guest address for signed-in users
            draftAddress = address;
            setSelectedAddress(address);
          } else if (isGuestAddress) {
            // For guests, only allow guest addresses
            draftAddress = address;
            setSelectedAddress(address);
          } else if (isCurrentUserAddress) {
            // Exact match case
            draftAddress = address;
            setSelectedAddress(address);
          } else {
            // Clear the draft if it doesn't belong to the current user type
            sessionStorage.removeItem(CHECKOUT_DRAFT_KEY);
          }
        }
        if (parsed?.selectedPayment) {
          setSelectedPayment(parsed.selectedPayment);
        }
      } catch (error) {
        console.error("Error parsing checkout draft:", error);
        sessionStorage.removeItem(CHECKOUT_DRAFT_KEY);
      }
    }
    
    // For signed-in users, if no draft address exists, try to load default address from user profile
    if (user && !draftAddress) {
      loadDefaultAddress();
    }
  }, [user, guestInfo]); // Remove selectedPayment to prevent infinite loop


  // Function to load default address for signed-in users
  const loadDefaultAddress = async () => {
    if (!user || !user.uid) {
      console.warn('User or user.uid is undefined, cannot load default address');
      return;
    }
    
    try {
      const userDoc = await firebaseHelpers.getDocumentWithId('user_profiles', user.uid);
      
      if (userDoc?.addresses && Array.isArray(userDoc.addresses) && userDoc.addresses.length > 0) {
        const addresses = userDoc.addresses;
        
        // Find default address with valid pincode
        const defaultAddress = addresses.find(addr => 
          addr.is_default && 
          addr.pincode && 
          addr.pincode.trim() !== ""
        );
        
        if (defaultAddress) {
          setSelectedAddress(defaultAddress);
          // Save to draft
          const draftData = { selectedAddress: defaultAddress, selectedPayment };
          sessionStorage.setItem(CHECKOUT_DRAFT_KEY, JSON.stringify(draftData));
        } else if (addresses.length === 1) {
          // If only one address and no default, select it if it has valid pincode
          const singleAddress = addresses[0];
          if (singleAddress.pincode && singleAddress.pincode.trim() !== "") {
            setSelectedAddress(singleAddress);
            // Save to draft
            const draftData = { selectedAddress: singleAddress, selectedPayment };
            sessionStorage.setItem(CHECKOUT_DRAFT_KEY, JSON.stringify(draftData));
          }
        }
      } else {
        console.warn('No addresses found for user:', user.uid, 'User profile data:', userDoc);
        console.info('User needs to add addresses in their profile');
      }
    } catch (error) {
      console.error("Error loading default address:", error);
      // If user_profiles collection doesn't exist or permission denied, continue without address
      console.info('Continuing without default address - user can add address during checkout');
    }
  };

  // Additional effect to restore address after OTP verification
  useEffect(() => {
    if (!showOtpVerification && isIdentityVerified && !selectedAddress) {
      const saved = sessionStorage.getItem(CHECKOUT_DRAFT_KEY);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (parsed?.selectedAddress) {
            const address = parsed.selectedAddress;
            const isCurrentUserAddress = user && address.email === user.email;
            const isGuestAddress = !user && guestInfo && address.email === guestInfo.email;
            
            if (isCurrentUserAddress || isGuestAddress) {
              setSelectedAddress(address);
            }
          }
        } catch (error) {
          console.error("Error restoring address after OTP:", error);
        }
      }
      
      // Fallback: Check sessionStorage directly for guest addresses
      if (!selectedAddress && !user && guestInfo) {
        const guestSessionId = useAuthStore.getState().guestSession?.guest_session_id;
        if (guestSessionId) {
          const stored = sessionStorage.getItem(`guest_addresses_${guestSessionId}`);
          if (stored) {
            try {
              const addresses = JSON.parse(stored);
              if (addresses.length > 0) {
                // Use the most recent address (last in array)
                const latestAddress = addresses[addresses.length - 1];
                if (latestAddress.email === guestInfo.email) {
                  setSelectedAddress(latestAddress);
                  // Update the draft with this address
                  const draftData = { selectedAddress: latestAddress, selectedPayment };
                  sessionStorage.setItem(
                    CHECKOUT_DRAFT_KEY,
                    JSON.stringify(draftData)
                  );
                }
              }
            } catch (error) {
              console.error("Error parsing guest addresses from sessionStorage:", error);
            }
          }
        }
      }
    }
  }, [showOtpVerification, isIdentityVerified, user, guestInfo]); // Remove selectedPayment to prevent infinite loop

  // Clear selected address when user changes to prevent showing addresses from previous accounts
  // Only validate address ownership if we have a user and the address has an email
  useEffect(() => {
    if (selectedAddress && selectedAddress.email) {
      // If we have a selected address with an email, verify it belongs to current user/guest
      const isCurrentUserAddress = user && selectedAddress.email === user.email;
      const isGuestAddress = !user && guestInfo && selectedAddress.email === guestInfo.email;
      
      // For signed-in users, be more lenient - allow addresses without exact email match
        // voluntary since users haul updated email Mighty have addresses with different emails
        if (user && !isCurrentUserAddress) {
          // Don't clear the address for signed-in users - they might have legitimate addresses with different emails
          // Only clear if it's clearly a guest address when we have a signed-in user
          if (!selectedAddress.email || selectedAddress.email.includes('guest')) {
            setSelectedAddress(null);
            sessionStorage.removeItem(CHECKOUT_DRAFT_KEY);
          }
        } else if (!user && !isGuestAddress && selectedAddress.email) {
          // For guests, be stricter - only allow guest addresses
          setSelectedAddress(null);
          sessionStorage.removeItem(CHECKOUT_DRAFT_KEY);
        }
    }
  }, [user, guestInfo]); // Remove selectedAddress dependency completely

  // Cart verification handlers
  const handleMoveToWishlist = (item: typeof cartItems[0]) => {
    // Convert cart item to wishlist item format
    const wishlistItem = {
      article_id: item.article_id,
      name: item.name,
      price: item.price,
      images: [item.thumbnail_url || item.image],
      color: String(item.color),
      size: item.size,
      discount_percentage: item.discount_percentage,
      thumbnail_url: item.thumbnail_url,
      // Add other required fields for wishlist
      category: '',
      sub_category: '',
      description: '',
      gender: 'unisex' as const,
      mrp_price: String(item.mrp),
      discount_price: String(item.price),
      created_at: new Date().toISOString(),
      sizes: {},
      product_id: item.product_id,
      addedAt: new Date().toISOString()
    };
    
    addToWishlist(wishlistItem);
    removeFromCart(item.id);
  };

  const handleRemoveFromCart = (item: typeof cartItems[0]) => {
    removeFromCart(item.id);
  };

  const handleProceedToCheckout = () => {
    setShowCartVerification(false);
  };

  const handleCloseCartVerification = () => {
    setShowCartVerification(false);
  };

  // Load active product discounts when cart items change
  useEffect(() => {
    const fetchProductDiscounts = async () => {
      const productIds = Array.from(
        new Set(cartItems.map(item => item.product_id).filter(Boolean))
      );
      
      if (productIds.length === 0) {
        setProductDiscounts({});
        return;
      }
      
      try {
        const discounts = await getActiveProductDiscountsForProducts(productIds);
        setProductDiscounts(discounts);
      } catch (error) {
        console.error('Error fetching product discounts:', error);
        setProductDiscounts({});
      }
    };

    fetchProductDiscounts();
  }, [cartItems]);

  // Load active checkout rule when subtotal changes
  useEffect(() => {
    let isMounted = true;

    const fetchCheckoutRule = async () => {
      try {
        const rule = await getActiveCheckoutRule();
        if (isMounted) {
          setCheckoutRule(rule);
          if (rule) {
            const discount = calculateCheckoutDiscount(rule, subtotal);
            setPrepaidDiscountAmount(discount);
          } else {
            setPrepaidDiscountAmount(0);
          }
        }
      } catch (error) {
        console.error('Error fetching checkout rule:', error);
        if (isMounted) {
          setCheckoutRule(null);
          setPrepaidDiscountAmount(0);
        }
      }
    };

    fetchCheckoutRule();
    return () => {
      isMounted = false;
    };
  }, [subtotal]);

  // Persist draft with debouncing to prevent excessive writes during typing
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      const draftData = { selectedAddress, selectedPayment };
      sessionStorage.setItem(
        CHECKOUT_DRAFT_KEY,
        JSON.stringify(draftData)
      );
    }, 500); // 500ms debounce

    return () => clearTimeout(timeoutId);
  }, [selectedAddress, selectedPayment]);

  // Reset OTP verification when payment method changes
  useEffect(() => {
    if (selectedPayment !== "cod") {
      setShowOtpVerification(false);
      setOtpValue("");
    }
  }, [selectedPayment]);

  // Redirect after login
  useEffect(() => {
    const redirectPath = sessionStorage.getItem(
      "redirectAfterLogin"
    );
    if (user && redirectPath) {
      if (redirectPath === "/checkout") {
        navigate("/checkout", { replace: true });
      }
      sessionStorage.removeItem("redirectAfterLogin");
    }
  }, [user, navigate]);

  // Memoize guest address prop to prevent unnecessary re-renders
  const guestAddressProp = useMemo(() => {
    // Always return at least an empty object to ensure the form is controlled
    if (!guestInfo && !selectedAddress) return {};
    
    // Create a base address object with all necessary fields
    const baseAddress = {
      id: selectedAddress?.id || `guest-${Date.now()}`,
      name: '',
      email: '',
      phone: '',
      address: '',
      city: '',
      state: '',
      pincode: '',
      district: '',
      landmark: '',
      is_default: true,
    };

    // Merge with selected address if it exists
    const merged = {
      ...baseAddress,
      ...selectedAddress,
      ...guestInfo, // Guest info takes precedence
    };

    // Ensure we have a valid ID
    if (!merged.id) {
      merged.id = `guest-${Date.now()}`;
    }

    return merged;
  }, [guestInfo, selectedAddress]);

  // Check identity verification status for current checkout session
  useEffect(() => {
    const checkVerification = () => {
      const currentStatus = getVerificationStatus();
      // Verify OTP is valid for THIS specific checkout session
      const verified = isCurrentIdentityVerified(checkoutSessionId);
      setVerificationStatus(currentStatus);
      setIsIdentityVerified(verified);
    };

    checkVerification();
    
    // Set up interval to check verification status (for session changes)
    const interval = setInterval(checkVerification, 1000);
    return () => clearInterval(interval);
  }, [checkoutSessionId]);

  // Fetch user profile data for registered users
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!user || !user.uid) {
        console.warn('User or user.uid is undefined, cannot fetch user profile');
        return;
      }

      try {
        const userProfileData = await firebaseHelpers.getDocumentWithId('user_profiles', user.uid);

        if (userProfileData) {
          setUserProfile(userProfileData);
          console.log('User profile loaded successfully for:', user.email);
        } else {
          console.warn('No user profile found for:', user.uid);
        }
      } catch (error) {
        console.error('Error fetching user profile:', error);
      }
    };

    fetchUserProfile();
  }, [user]);

  // Handle COD OTP verification
  const handleCodOtpRequired = () => {
    setCodOtpTriggered(true);
  };

  const handleOtpVerified = (codAuthToken: string) => {
    setCodOtpTriggered(false);
    setIsIdentityVerified(true);
    // Mark identity as verified for THIS specific checkout session
    markCurrentIdentityVerified(checkoutSessionId);
    // You can store the codAuthToken if needed for future requests
  };

  const validateShipping = useCallback(() => {
    
    if (!selectedAddress) {
      return false;
    }
    
    // Base required fields for all addresses
    const required = ['name', 'phone', 'address', 'city', 'state', 'pincode'];
    
    // For guest addresses, also check district (required in GuestAddressForm)
    if (!user && selectedAddress.district) {
      required.push('district');
    }
    
    
    const validationResults = required.map((field) => {
      const value = (selectedAddress as any)[field];
      const isValid = !!value && !!value.trim();
      return { field, value, isValid };
    });
    
    const allValid = validationResults.every(result => result.isValid);
    
    return allValid;
  }, [selectedAddress, user]);

  const handlePaymentSuccess = async (
    response: any,
    orderId: string,
    amountRupees: number
  ) => {
    try {
      // Create unique guest session per order for guests
      if (isGuest && !guestSession && guestInfo) {
        await createGuestSession(guestInfo);
      }

      setCurrentOrderId(orderId);
      setPaymentStatus("success");
      setShowPaymentStatus(true);
      
      // Guest session will be cleared when modal is closed
      // Cart cleared after modal close
    } catch (err) {
      console.error("Error in handlePaymentSuccess:", err);
      setPaymentStatus("failed");
      setShowPaymentStatus(true);
    }
  };

  const handlePaymentFailure = async (err: any) => {
    console.error("Payment failed:", err);
    
    setPaymentStatus("failed");
    setShowPaymentStatus(true);

    const orderIdToUse =
      currentOrderIdRef.current || currentOrderId;

    if (orderIdToUse) {
      try {

        // Find orders by order_id field using Firebase
        const ordersQuery = query(
          collection(db, 'orders'),
          where('order_id', '==', orderIdToUse)
        );
        const orderSnapshot = await getDocs(ordersQuery);
        
        if (!orderSnapshot.empty) {
          const orderDoc = orderSnapshot.docs[0];
          await updateDoc(orderDoc.ref, {
            status: "cancelled",
            payment_status: "failed",
            cancelled_at: new Date().toISOString(),
            comments: "Payment cancelled by user"
          });
        }

        // Find order items by order_id field using Firebase
        const orderItemsQuery = query(
          collection(db, 'order_items'),
          where('order_id', '==', orderIdToUse)
        );
        const orderItemsSnapshot = await getDocs(orderItemsQuery);
        
        // Update all order items for this order
        const updatePromises = orderItemsSnapshot.docs.map(itemDoc => 
          updateDoc(itemDoc.ref, {
            item_status: "cancelled",
            cancel_reason: "Payment cancelled by user"
          })
        );
        
        await Promise.all(updatePromises);

        // Find payments by order_id field using Firebase
        const paymentsQuery = query(
          collection(db, 'payments'),
          where('order_id', '==', orderIdToUse)
        );
        const paymentsSnapshot = await getDocs(paymentsQuery);
        
        if (!paymentsSnapshot.empty) {
          const paymentDoc = paymentsSnapshot.docs[0];
          await updateDoc(paymentDoc.ref, {
            payment_status: "failed",
            updated_at: new Date().toISOString()
          });
        }

      } catch (dbError) {
        console.error(
          "❌ Error updating database for failed payment:",
          dbError
        );
      }
    } else {
      console.warn(
        "⚠️ No currentOrderId available for database update - order may not have been created yet"
      );
    }
  };

  // Load and persist guest info from sessionStorage
  useEffect(() => {
    if (!user && !guestInfo) {
      const savedGuestEmail = sessionStorage.getItem("guestEmail");
      const savedGuestSession = useAuthStore.getState().guestSession;
      
      if (savedGuestEmail && savedGuestSession) {
        const guestInfo: GuestContactInfo = {
          name: savedGuestSession.name || '',
          email: savedGuestEmail,
          phone: savedGuestSession.phone || ''
        };
        setGuestInfo(guestInfo);
      }
    }
  }, [user, guestInfo]);

  const handleGuestInfoSubmit = async (
    contactInfo: GuestContactInfo
  ) => {
    try {
      const guestSession = await createGuestSession(
        contactInfo
      );
      if (guestSession) {
        setGuestInfo(contactInfo);
        setShowGuestForm(false);

        const guestAddress = {
          name: contactInfo.name,
          email: contactInfo.email,
          phone: contactInfo.phone,
          address: "",
          city: "",
          state: "",
          pincode: "",
          country: "India",
          is_default: false,
          address_type: "home",
        } as any;

        setSelectedAddress(guestAddress);
        sessionStorage.setItem(
          "guestEmail",
          contactInfo.email
        );
      }
    } catch (error) {
      console.error(
        "Guest session creation failed:",
        error
      );
      showAlert(
        "Failed to create guest session. Please try again.",
        "error"
      );
    }
  };

  const handleSignInRedirect = () => {
    sessionStorage.setItem(
      "redirectAfterLogin",
      location.pathname
    );
    navigate("/auth/signin");
  };

    const handleSignUpRedirect = () => {
    sessionStorage.setItem(
      "redirectAfterLogin",
      location.pathname
    );
    navigate("/auth/signup");
  };

  const handleBackToGuestForm = () => {
    setGuestInfo(null);
    setShowGuestForm(true);
    clearGuestSessionState();
  };

  const handleRetryPayment = () => {
    setPaymentStatus(null);
    setShowPaymentStatus(false);
    handlePlaceOrder();
  };

  const closePaymentModal = () => {
    const wasSuccess = paymentStatus === "success";
    setPaymentStatus(null);
    setCurrentOrderId(null);
    currentOrderIdRef.current = null;
    if (wasSuccess) {
      clearCart();
      // Reset checkout-specific state after a successful order
      setSelectedAddress(null);
      setSelectedPayment("razorpay");
      setIsIdentityVerified(false);
      setCodOtpTriggered(false);
      setOtpValue("");
      setOtpError("");
      clearIdentityVerification();
      sessionStorage.removeItem(CHECKOUT_DRAFT_KEY);
      sessionStorage.removeItem(CHECKOUT_SESSION_KEY);
      
      if (!user && guestSession) {
        clearGuestSessionState();
      }

      const freshSessionId = crypto.randomUUID();
      sessionStorage.setItem(CHECKOUT_SESSION_KEY, freshSessionId);
      setCheckoutSessionId(freshSessionId);
    }
  };

  const handlePlaceOrder = async () => {
    const authType = getAuthenticationType();

    // Check if we have required contact information (either user or guest)
    if (authType === "none") {
      showAlert(
        "Please provide your contact information or sign in",
        "warning"
      );
      return;
    }

    if (authType === "guest" && !guestInfo) {
      showAlert(
        "Please provide your contact information",
        "warning"
      );
      return;
    }

    // Validate shipping address
    if (!validateShipping()) {
      showAlert("Please fill/choose a shipping address", "warning");
      return;
    }

    // Validate COD payment availability
    if (!validateCODPayment()) {
      return;
    }

    // For COD payments, verify identity
    if (selectedPayment === "cod" && !isIdentityVerified) {
      return;
    }

    // For guest users, ensure we have mobile number (mandatory for guest checkout)
    if (authType === "guest" && guestInfo && !guestInfo.phone?.trim()) {
      showAlert(
        "Mobile number is required for guest checkout",
        "warning"
      );
      return;
    }

    // Validate cart items before placing order
    const invalidItems = cartItems.filter(item => {
      const product = productDetails[item.id];
      if (!product) {
        console.warn(`Product details not found for cart item ${item.id}, product_id: ${item.product_id}`);
        return true; // Mark as invalid if product details not found
      }
      
      const stock = validateCartItemStock(product, {
        size: item.size,
        quantity: item.quantity,
      });
      
      // Debug logging for troubleshooting
      if (!stock.isActive || !stock.selectedSizeInStock || stock.issues.length > 0) {
        console.warn(`Item validation failed:`, {
          cartItemId: item.id,
          productName: item.name,
          productId: item.product_id,
          selectedSize: item.size,
          requestedQuantity: item.quantity,
          productSizes: product.sizes,
          stock,
          parsedSizes: JSON.parse(product.sizes || '{}')
        });
      }
      
      return !stock.isActive || !stock.selectedSizeInStock || stock.issues.length > 0;
    });
    
    if (invalidItems.length > 0) {
      const invalidItemsList = invalidItems.map(item => {
        const product = productDetails[item.id];
        const stock = validateCartItemStock(product, {
          size: item.size,
          quantity: item.quantity,
        });
        const errors = [];
        
        if (!product) {
          errors.push('Product information not found');
        } else {
          if (!stock.isActive) errors.push('Product is no longer available');
          if (!stock.selectedSizeInStock || stock.issues.length > 0) {
            if (!item.size) {
              errors.push('No size selected');
            } else {
              if (stock.issues.includes('SIZE_OUT_OF_STOCK')) {
                errors.push(`Size ${item.size} is out of stock`);
              } else if (stock.issues.includes('QUANTITY_EXCEEDED')) {
                errors.push(`Only ${stock.availableQty} available in size ${item.size}, but you requested ${item.quantity}`);
              } else {
                errors.push(`Size ${item.size} is not available`);
              }
            }
          }
        }
        
        return `"${item.name}" (Size: ${item.size || 'Not selected'}, Qty: ${item.quantity}): ${errors.join(', ')}`;
      }).join('\n');
      
      showAlert(
        `Some items in your cart are no longer available:\n\n${invalidItemsList}\n\nPlease remove these items or update your cart before proceeding.`,
        "error"
      );
      setIsProcessing(false);
      return;
    }

    setIsProcessing(true);
    try {
      const orderId = crypto.randomUUID();

      const totalMRP = cartItems.reduce(
        (sum, item) => sum + item.mrp * item.quantity,
        0
      );
      // Calculate total discount based on selected discount type
      const totalDiscount = discountType === 'prepaid' ? checkoutDiscount : productSavings;

      // Calculate the actual subtotal as the sum of items' prices before any discounts
      const actualSubtotal = cartItems.reduce((sum, item) => {
        return sum + (item.discount_price || item.price) * item.quantity;
      }, 0);

      const orderData = {
        total_amount: mrpTotal,
        order_id: orderId,
        payment_method: selectedPayment,
        subtotal: actualSubtotal, // Use the actual calculated subtotal
        discount: totalDiscount,
        delivery_charge: deliveryCharge,
        effective_amount: totalAmount, // Total amount payable
        items: cartItems.map((i) => {
          const priceAtPurchase = i.discount_price || i.price;
          return {
            product_id: i.product_id,
            size: i.size,
            quantity: i.quantity,
            price_at_purchase: priceAtPurchase,
            thumbnail_url: i.thumbnail_url,
            product_name: i.name,
            product_thumbnail_url: i.thumbnail_url,
            color: i.color,
            mrp: i.mrp,
          };
        }),
        shipping_address: selectedAddress,
      };

      // Ensure guest session exists for guest checkout (both COD and prepaid)
      let currentGuestSession = guestSession;
      if (authType === "guest" && !currentGuestSession && guestInfo) {
        const created = await createGuestSession(guestInfo);
        if (created) {
          currentGuestSession = created;
        }
      }

      const invokeBody =
        authType === "user"
          ? { ...orderData, user_id: user!.uid }
          : {
              ...orderData,
              guest_session_id: currentGuestSession?.guest_session_id,
              guest_contact_info: guestInfo,
            };

      // Use HTTP fetch for create-order function
      const functionName = 'createOrder';
      
      // Use production URL (emulator disabled for now)
      const url = `https://asia-south1-fici-shoes.cloudfunctions.net/${functionName}`;
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(invokeBody),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (!data) {
        console.error("Error creating order: No data returned");
        throw new Error("Failed to create order");
      }

      const paymentOrder =
        typeof data === "string" ? JSON.parse(data) : data;

      const actualOrderId =
        paymentOrder.order_id || paymentOrder.id;
      if (actualOrderId) {
        setCurrentOrderId(actualOrderId);
        currentOrderIdRef.current = actualOrderId;
      }

      if (selectedPayment === "cod") {
        // Create unique guest session per order for guests
        if (isGuest && !guestSession && guestInfo) {
          await createGuestSession(guestInfo);
        }
        setPaymentStatus("success");
        setShowPaymentStatus(true);
        
        // Clear guest session after modal is closed, not immediately
        return;
      }

      const razorpayOrderId =
        paymentOrder.razorpay_order_id ||
        (paymentOrder.order &&
          paymentOrder.order.razorpay_order_id) ||
        (paymentOrder.data &&
          paymentOrder.data.razorpay_order_id);

      if (!razorpayOrderId) {
        console.error(
          "Invalid response from create-order. Missing razorpay_order_id. Full response:",
          JSON.stringify(paymentOrder, null, 2)
        );
        throw new Error(
          "Invalid response from payment gateway. Please try again."
        );
      }

      paymentOrder.razorpay_order_id = razorpayOrderId;

      try {
        await loadRazorpayScript();
        const key = paymentOrder.key || getRazorpayKey();
        if (!key) {
          throw new Error("Razorpay key not found");
        }

        const authTypeNow = getAuthenticationType();
        const customerName =
          authTypeNow === "user"
            ? (selectedAddress as any)?.name ||
              (user as any)?.user_metadata?.full_name
            : guestInfo?.name;
        const customerEmail =
          authTypeNow === "user"
            ? (selectedAddress as any)?.email ||
              user?.email
            : guestInfo?.email;
        const customerPhone =
          authTypeNow === "user"
            ? (selectedAddress as any)?.phone ||
              (user as any)?.phone
            : guestInfo?.phone;

        const options = {
          key,
          amount: Math.round(totalAmount * 100),
          currency: "INR",
          name: "FICI",
          description: `Order #${orderId}`,
          order_id: paymentOrder.razorpay_order_id,
          handler: (response: any) => {
            handlePaymentSuccess(
              {
                ...response,
                order_id: orderId,
                razorpay_order_id:
                  response.razorpay_order_id ||
                  paymentOrder.id,
              },
              orderId,
              totalAmount
            );
          },
          prefill: {
            name: customerName,
            email: customerEmail,
            contact: customerPhone,
          },
          notes: {
            order_id: orderId,
            source: "FICI Web",
          },
          theme: {
            color: "#3B82F6",
            hide_topbar: false,
          },
          modal: {
            ondismiss: () => {
              handlePaymentFailure({
                reason: "user_cancelled",
              });
            },
            escape: false,
            backdropclose: false,
          },
          retry: {
            enabled: true,
            max_count: 3,
          },
        };

        const rzp = new (window as any).Razorpay(options);
        rzp.on(
          "payment.failed",
          (response: any) => {
            handlePaymentFailure(
              response.error || {
                reason: "payment_failed",
              }
            );
          }
        );
        rzp.open();
      } catch (error) {
        console.error(
          "Error initializing Razorpay:",
          error
        );
        setPaymentStatus("failed");
        showAlert(
          "Failed to initialize payment. Please try again.",
          "error"
        );
      }
    } catch (err: any) {
      console.error("Place order error", err);
      setPaymentStatus("failed");
    } finally {
      setIsProcessing(false);
    }
  };

  // GUEST CONTACT FLOW (pre-checkout)
  if (!user && !guestInfo) {
    return (
      <div className="min-h-screen bg-gradient-light dark:bg-gradient-dark text-gray-900 dark:text-gray-100">
        <main className="max-w-2xl mx-auto px-4 py-6 sm:py-8">
          <header className="mb-4 sm:mb-6">
            <Link to="/cart">
              <button className="flex items-center gap-2 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors">
                <ArrowLeft className="w-4 h-4" />
                <span className="text-sm sm:text-base">
                  Back to Cart
                </span>
              </button>
            </Link>
          </header>

          <GuestCheckoutForm
            onGuestInfoSubmit={handleGuestInfoSubmit}
            onSignInClick={handleSignInRedirect}
            onSignUpClick={handleSignUpRedirect}
            loading={isProcessing}
          />
        </main>
      </div>
    );
  }

  // Guest loading state
  if (!user && isGuest && !guestInfo) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-light dark:bg-gradient-dark">
        <div className="text-center text-gray-800 dark:text-gray-100">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm sm:text-base">
            Loading checkout...
          </p>
        </div>
      </div>
    );
  }

  // No items in cart
  if (!cartItems.length) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-light dark:bg-gradient-dark">
        <div className="text-center">
          <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 dark:text-gray-100">
            Your cart is empty
          </h2>
          <button
            onClick={() => navigate("/products")}
            className="mt-4 bg-primary text-white px-6 py-2 rounded-lg hover:bg-primary-active transition-colors text-sm sm:text-base"
          >
            Continue Shopping
          </button>
        </div>
      </div>
    );
  }

  // COD OTP verification page
  if (codOtpTriggered) {
    const contact = getContactInfo();
    return (
      <div className="min-h-screen bg-gradient-light dark:bg-gradient-dark text-gray-900 dark:text-gray-100">
        <main className="max-w-2xl mx-auto px-4 py-6 sm:py-8">
          <header className="mb-4 sm:mb-6">
            <Link to="/cart">
              <button className="flex items-center gap-2 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors">
                <ArrowLeft className="w-4 h-4" />
                <span className="text-sm sm:text-base">
                  Back to Cart
                </span>
              </button>
            </Link>
          </header>

          <section className="bg-white dark:bg-dark2 rounded-2xl shadow-lg p-6">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Verify Your Contact Information
              </h2>
              <p className="text-gray-600 dark:text-gray-400 text-sm sm:text-base">
                For Cash on Delivery orders, we need to verify your
                contact information.
              </p>
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
              <div className="flex items-start gap-3">
                <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center mt-0.5">
                  <span className="text-white text-xs">
                    i
                  </span>
                </div>
                <div>
                  <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-1">
                    Why do we need this?
                  </h4>
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    We verify your contact information to ensure smooth
                    delivery and communication for your Cash on
                    Delivery order.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <OtpFlow
                purpose="cod_verification"
                onVerified={(codAuthToken) => {
                  // Preserve the current address before setting OTP verified
                  const currentAddress = selectedAddress;
                  setShowOtpVerification(false);
                  setCodOtpTriggered(false);
                  setIsIdentityVerified(true);
                  
                  // Ensure address is preserved after OTP verification
                  if (currentAddress) {
                    setSelectedAddress(currentAddress);
                    // Update the draft to include the address
                    const draftData = { selectedAddress: currentAddress, selectedPayment };
                    sessionStorage.setItem(
                      CHECKOUT_DRAFT_KEY,
                      JSON.stringify(draftData)
                    );
                  }
                }}
                onCancel={() => {
                  setShowOtpVerification(false);
                  setOtpError("");
                  setCodOtpTriggered(false);
                  window.scrollTo({
                    top: 0,
                    left: 0,
                    behavior: "smooth",
                  });
                }}
                prefilledMethod="email"
                userType={user ? "registered" : "guest"}
                initialEmail={guestInfo?.email || undefined}
                initialPhone={guestInfo?.phone || undefined}
                checkoutSessionId={checkoutSessionId || undefined}
              />

              <div className="text-center">
                <button
                  onClick={() => {
                    setCodOtpTriggered(false);
                    setSelectedPayment("razorpay");
                    window.scrollTo({
                      top: 0,
                      left: 0,
                      behavior: "smooth",
                    });
                  }}
                  className="text-xs sm:text-sm text-gray-600 hover:text-gray-800 dark:text-gray-300 dark:hover:text-white transition-colors"
                >
                  ← Back to payment options
                </button>
              </div>
            </div>
          </section>
        </main>
      </div>
    );
  }

  // MAIN CHECKOUT PAGE
  return (
    <>
      <div className="min-h-screen bg-white dark:bg-dark1 text-gray-900 dark:text-gray-100 transition-colors duration-200">
        <main className="max-w-7xl mx-auto px-4 py-4 sm:py-8">

          <section className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-8">
            {/* Left column: Address + Payment */}
            <section className="space-y-4 sm:space-y-8">
              <CheckoutAddressSection
                selectedAddress={selectedAddress}
                onAddressSelect={setSelectedAddress}
                userProfile={userProfile}
                onPhoneUpdateSuccess={handlePhoneUpdateSuccess}
                guestContactInfo={guestContactInfo}
                guestSession={guestSession}
                guestAddressProp={guestAddressProp}
                onBackToGuestForm={handleBackToGuestForm}
                isGuest={isGuest}
                guestInfo={guestInfo}
                hasUnsavedChanges={false}
                onNavigationAttempt={() => {}}
              />
              
              <CheckoutPaymentSection
                selectedPayment={selectedPayment}
                onPaymentSelect={(id) => {
                  if (
                    id === "cod" &&
                    !codWarningShown &&
                    prepaidDiscountAmount > 0
                  ) {
                    setCodConfirmOpen(true);
                  }
                  setSelectedPayment(id);
                }}
                prepaidDiscount={prepaidDiscountAmount}
                onCodOtpRequired={handleCodOtpRequired}
                codAvailable={codAvailable}
                isIdentityVerified={isIdentityVerified}
                checkoutSessionId={checkoutSessionId}
                isPincodeServiceable={isPincodeServiceable}
                checkoutRule={checkoutRule}
                checkoutOfferLabel={checkoutOfferLabel}
                subtotal={subtotal}
                codConfirmOpen={codConfirmOpen}
                setCodConfirmOpen={setCodConfirmOpen}
                codWarningShown={codWarningShown}
                setCodWarningShown={setCodWarningShown}
                showAlert={showAlert}
              />
            </section>

            {/* Right column: Order Summary */}
            <aside className="space-y-4 sm:space-y-8">
              <CheckoutSummary
                subtotal={subtotal}
                shipping={deliveryCharge}
                tax={0}
                total={totalAmount}
                savings={displaySavings}
                prepaidDiscount={discountType === 'prepaid' ? checkoutDiscount : 0}
                checkoutDiscount={0}
                productDiscount={discountType === 'product' ? productSavings : 0}
                mrpTotal={displayMRPTotal}
                darkMode={isDarkMode}
                productDiscounts={productDiscounts}
              />

              <CheckoutActions
                onPlaceOrder={handlePlaceOrder}
                isProcessing={isProcessing}
                selectedAddress={selectedAddress}
                selectedPayment={selectedPayment}
                isIdentityVerified={isIdentityVerified}
                totalAmount={totalAmount}
              />
            </aside>
          </section>
        </main>
      </div>

      {/* Payment status modal */}
      {showPaymentStatus && paymentStatus && (
        <PaymentStatusModal
          status={paymentStatus}
          orderId={currentOrderId || undefined}
          message={
            selectedPayment === "cod"
              ? "Your order is successful with Cash on Delivery."
              : `Your order is successful with Online Payment${
                  displaySavings > 0
                    ? ` • You saved ₹${displaySavings.toLocaleString(
                        "en-IN"
                      )}!`
                    : ""
                }`
          }
          savings={displaySavings}
          totalAmount={totalAmount}
          totalMrp={mrpTotal}
          prepaidDiscount={discountType === 'prepaid' ? checkoutDiscount : 0}
          paymentMethod={selectedPayment}
          onClose={() => {
            setShowPaymentStatus(false);
            setPaymentStatus(null);
            clearCart();
            
            // Clear guest session after successful order for both success and failure
            if (isGuest) {
              clearGuestSessionState();
              setShowGuestForm(true); // Reset to show guest form on next visit
            }
          }}
          onRetry={() => {
            setShowPaymentStatus(false);
            setPaymentStatus(null);
            handleRetryPayment();
          }}
        />
      )}

      {/* COD selection confirmation */}
      <AlertModal
        isOpen={codConfirmOpen}
        title="Save More with Online Payment"
        message={
          discountType === 'prepaid' && checkoutDiscount > 0
            ? `You can save an extra ₹${checkoutDiscount.toLocaleString(
                "en-IN"
              )} by paying online. Cash on Delivery does not include this checkout discount.`
            : discountType === 'product' && productSavings > 0
            ? `Product discounts of ₹${productSavings.toLocaleString(
                "en-IN"
              )} are already applied to your cart.`
            : "Online payments may include special offers and faster processing compared to Cash on Delivery."
        }
        type="warning"
        showCancel
        cancelText="Keep Cash on Delivery"
        confirmText="Move to Online Payment"
        onClose={() => {
          setCodConfirmOpen(false);
          setSelectedPayment("cod");
          setCodWarningShown(true);
        }}
        onConfirm={() => {
          setCodConfirmOpen(false);
          setSelectedPayment("razorpay");
          setCodWarningShown(true);
        }}
      />

      {/* Generic alert modal */}
      <AlertModal
        isOpen={alertModal.isOpen}
        message={alertModal.message}
        type={alertModal.type}
        onClose={() =>
          setAlertModal({
            isOpen: false,
            message: "",
            type: "info",
          })
        }
      />

      {/* Navigation warning modal */}
      {navigationWarning.isOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="card-modern animate-scale-in max-w-lg w-full overflow-hidden bg-white dark:bg-dark2 rounded-2xl shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between p-6 bg-orange-500 text-white">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                    />
                  </svg>
                </div>
                <h3 className="text-xl font-bold">
                  Warning
                </h3>
              </div>
            </div>

            {/* Content */}
            <div className="p-6">
              <p className="text-gray-800 dark:text-gray-100 text-sm sm:text-base leading-relaxed">
                {navigationWarning.message}
              </p>
            </div>

            {/* Footer */}
            <div className="flex justify-end gap-3 p-6 border-t bg-gray-50 dark:bg-dark3 dark:border-gray-700">
              <button
                onClick={navigationWarning.onCancel}
                className="px-6 py-2 text-sm font-semibold text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-dark2 transition-all duration-200"
              >
                Stay Here
              </button>
              <button
                onClick={() => {
                  navigationWarning.onConfirm();
                  setNavigationWarning((prev) => ({
                    ...prev,
                    isOpen: false,
                  }));
                }}
                className="px-6 py-2 text-sm font-semibold rounded-lg bg-red-600 hover:bg-red-700 text-white transition-all duration-200 hover:scale-105"
              >
                Leave Anyway
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cart Verification Modal */}
      <AlertModal
        isOpen={showCartVerification}
        title="Review Your Cart"
        message="Please review your cart items before proceeding to checkout. You can move items to wishlist or remove any items you don't want to purchase right now."
        type="info"
        cartItems={cartItems}
        onMoveToWishlist={handleMoveToWishlist}
        onRemoveFromCart={handleRemoveFromCart}
        onProceedToCheckout={handleProceedToCheckout}
        onClose={handleCloseCartVerification}
        showCancel={false}
      />
      
      {/* Phone Update Modal */}
      {showPhoneUpdate && (
        <PhoneUpdateWithOtp
          initialPhone={userProfile?.phone_number || ''}
          onSuccess={handlePhoneUpdateSuccess}
          variant="modal"
          isOpen={showPhoneUpdate}
          onClose={() => setShowPhoneUpdate(false)}
        />
      )}
    </>
  );
};

export default CheckoutPage;
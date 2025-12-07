// src/pages/CheckoutPage.tsx
import React, {
  useCallback,
  useMemo,
  useState,
  useEffect,
  useRef,
} from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { ArrowLeft, Shield } from "lucide-react";
import { OtpFlow } from "@/components/otp";
import AddressCard from "./components/AddressForm";
import GuestAddressForm from "./components/GuestAddressForm";
import PaymentMethods from "./components/PaymentMethods";
import OrderSummary from "./components/OrderSummary";
import PaymentStatusModal from "./modal/PaymentStatusModal";
import GuestCheckoutForm from "./components/GuestCheckoutForm";
import { supabase } from "@lib/supabase";
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
import { getShippingFee, getFreeShippingThreshold, isCODAvailable, getDeliveryTime } from "@lib/utils/pincodeUtils";
import { useAuthStore } from "@store/authStore";
import { useCartStore } from "@store/cartStore";
import { usePaymentStore } from "@store/paymentStore";
import { useThemeStore } from "@store/themeStore";
import AlertModal from "@components/ui/AlertModal";

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

const CheckoutPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { items: cartItems, getCartTotal, clearCart } = useCartStore();
  const { savePaymentDetails } = usePaymentStore(); // currently unused but kept for behavior
  const { mode } = useThemeStore(); // Add theme store to respond to theme changes
  const user = useAuthStore((state) => state.user);
  const isGuest = useAuthStore((state) => state.isGuest);
  const guestContactInfo = useAuthStore((state) => state.guestContactInfo);
  const guestSession = useAuthStore((state) => state.guestSession);
  const createGuestSession = useAuthStore(
    (state) => state.createGuestSession
  );
  const getAuthenticationType = useAuthStore(
    (state) => state.getAuthenticationType
  );

  const [selectedAddress, setSelectedAddress] = useState<Address | null>(
    null
  );
  const [selectedPayment, setSelectedPayment] =
    useState<string>("razorpay"); // Default to Razorpay
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
  const [otpValue, setOtpValue] = useState("");
  const [otpVerified, setOtpVerified] = useState(false);
  const [otpError, setOtpError] = useState("");
  const [showGuestForm, setShowGuestForm] = useState(false);
  const [showOtpVerificationPage, setShowOtpVerificationPage] =
    useState(false);
  const [guestInfo, setGuestInfo] = useState<GuestContactInfo | null>(
    null
  );
  const [codOtpTriggered, setCodOtpTriggered] = useState(false);

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
  }, [hasUnsavedChanges]);

  // Calculate subtotal after applying product discounts
  const subtotal = useMemo(() => {
    if (!cartItems.length) return 0;
    
    return cartItems.reduce((sum, item) => {
      const rule = productDiscounts[item.product_id];
      const discountedPrice = applyProductDiscountToPrice(
        item.price,
        item.mrp,
        rule
      );
      return sum + discountedPrice * item.quantity;
    }, 0);
  }, [cartItems, productDiscounts]);

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

  // Calculate product savings by summing individual line savings
  const productSavings = useMemo(() => {
    if (!cartItems.length) return 0;
    
    const totalSavings = cartItems.reduce((sum, item) => {
      const rule = productDiscounts[item.product_id];
      const discountedPrice = applyProductDiscountToPrice(
        item.price,
        item.mrp,
        rule
      );
      const baseForSavings =
        rule &&
        rule.base === "mrp" &&
        item.mrp != null
          ? item.mrp
          : item.price;
      const originalLine = baseForSavings * item.quantity;
      const lineSubtotal = discountedPrice * item.quantity;
      const lineSavings = Math.max(0, originalLine - lineSubtotal);
      
      return sum + lineSavings;
    }, 0);
    
    return totalSavings;
  }, [cartItems, productDiscounts]);

  // Calculate checkout discount (only for online payments)
  // Note: Calculate on MRP total for fair comparison with product discounts
  const checkoutDiscount = useMemo(() => {
    if (selectedPayment !== "razorpay") return 0;
    // Calculate checkout discount on MRP total, not on discounted subtotal
    return checkoutRule ? calculateCheckoutDiscount(checkoutRule, mrpTotal) : 0;
  }, [checkoutRule, mrpTotal, selectedPayment]);

  // Determine which discount is better: product discounts OR checkout discount
  const bestDiscountType = useMemo(() => {
    if (productSavings > checkoutDiscount) {
      return 'product';
    } else if (checkoutDiscount > productSavings) {
      return 'checkout';
    }
    return 'equal'; // When both are equal or zero
  }, [productSavings, checkoutDiscount]);

  // Calculate the maximum discount amount
  const maxDiscountAmount = useMemo(() => {
    return Math.max(productSavings, checkoutDiscount);
  }, [productSavings, checkoutDiscount]);

  // State for delivery charge calculation
  const [deliveryCharge, setDeliveryCharge] = useState(0);
  const [deliveryTime, setDeliveryTime] = useState<string | null>(null);
  const [codAvailable, setCodAvailable] = useState(true);

  // Zustand store for pincode operations
  const { fetchDetails } = usePincodeStore();

  // Calculate delivery charge and other pincode-based details
  useEffect(() => {
    const calculateDeliveryDetails = async () => {
      if (!selectedAddress?.pincode) {
        setDeliveryCharge(0);
        setDeliveryTime(null);
        setCodAvailable(true);
        return;
      }

      try {
        // Fetch pincode details using the store (with caching)
        const details = await fetchDetails(selectedAddress.pincode);
        
        if (details) {
          // Use the details from the store
          const shippingFee = details.shipping_fee || 0;
          const freeShippingThreshold = details.free_shipping_threshold || 999;
          
          // Free shipping if above threshold
          const finalDeliveryCharge = subtotal >= freeShippingThreshold ? 0 : shippingFee;
          setDeliveryCharge(finalDeliveryCharge);
          setDeliveryTime(details.delivery_time || null);
          setCodAvailable(details.cod_allowed !== false);
        } else {
          // Default values if no details found
          setDeliveryCharge(0);
          setDeliveryTime(null);
          setCodAvailable(true);
        }
      } catch (error) {
        console.error('Error calculating delivery details:', error);
        // Default values on error
        setDeliveryCharge(0);
        setDeliveryTime(null);
        setCodAvailable(true);
      }
    };

    calculateDeliveryDetails();
  }, [selectedAddress?.pincode, subtotal, fetchDetails]);

  // Validate COD payment method
  const validateCODPayment = useCallback(() => {
    if (selectedPayment === "cod" && !codAvailable) {
      showAlert("COD is not available for this pincode. Please choose online payment.", "error");
      return false;
    }
    return true;
  }, [selectedPayment, codAvailable]);

  // Calculate final total amount with maximum discount
  const totalAmount = useMemo(() => {
    if (bestDiscountType === 'product') {
      // Apply product discounts (already applied in subtotal)
      return Math.max(0, subtotal + deliveryCharge);
    } else if (bestDiscountType === 'checkout') {
      // Apply checkout discount instead of product discounts
      const subtotalWithoutProductDiscounts = mrpTotal; // Use MRP as base
      return Math.max(0, subtotalWithoutProductDiscounts + deliveryCharge - checkoutDiscount);
    } else {
      // Equal or zero - use product discounts by default
      return Math.max(0, subtotal + deliveryCharge);
    }
  }, [bestDiscountType, subtotal, mrpTotal, deliveryCharge, checkoutDiscount]);

  // Calculate display values for OrderSummary
  const displaySubtotal = useMemo(() => {
    // Always show the discounted price (after product discounts)
    return subtotal;
  }, [subtotal]);

  const displayMRPTotal = useMemo(() => {
    // Always show the MRP total
    return mrpTotal;
  }, [mrpTotal]);

  const displaySavings = useMemo(() => {
    if (bestDiscountType === 'product') {
      return productSavings;
    } else if (bestDiscountType === 'checkout') {
      return checkoutDiscount;
    }
    return maxDiscountAmount; // When equal
  }, [bestDiscountType, productSavings, checkoutDiscount, maxDiscountAmount]);

  // Check if dark mode is active
  const isDarkMode = useMemo(() => {
    if (typeof window !== 'undefined') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches || 
             document.documentElement.classList.contains('dark');
    }
    return false;
  }, []);
  const getContactInfo = () => {
    if (user) {
      return {
        email:
          user.email ||
          (selectedAddress as any)?.email ||
          "",
        phone:
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

  // Load draft
  useEffect(() => {
    const saved = sessionStorage.getItem(CHECKOUT_DRAFT_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed?.selectedAddress)
          setSelectedAddress(parsed.selectedAddress);
        if (parsed?.selectedPayment) {
          setSelectedPayment(parsed.selectedPayment);
        }
      } catch (error) {
        console.error("Error parsing checkout draft:", error);
      }
    }
  }, []);

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

  // Persist draft
  useEffect(() => {
    const draftData = { selectedAddress, selectedPayment };
    sessionStorage.setItem(
      CHECKOUT_DRAFT_KEY,
      JSON.stringify(draftData)
    );
  }, [selectedAddress, selectedPayment]);

  // Reset OTP verification when payment method changes
  useEffect(() => {
    if (selectedPayment !== "cod") {
      setOtpVerified(false);
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

  // After COD OTP verified
  useEffect(() => {
    if (!codOtpTriggered && otpVerified) {
      window.scrollTo({
        top: 0,
        left: 0,
        behavior: "smooth",
      });
    }
  }, [codOtpTriggered, otpVerified]);

  const validateShipping = useCallback(() => {
    if (!selectedAddress) return false;
    const required = [
      "name",
      "phone",
      "email",
      "address",
      "city",
      "state",
      "pincode",
    ];
    return required.every(
      (k) => !!(selectedAddress as any)[k]
    );
  }, [selectedAddress]);

  const handlePaymentSuccess = async (
    response: any,
    orderId: string,
    amountRupees: number
  ) => {
    try {
      console.log("Payment successful, response:", response);

      console.log("Payment successful for order:", orderId, {
        razorpay_order_id: response.razorpay_order_id,
        razorpay_payment_id: response.razorpay_payment_id,
        razorpay_signature: response.razorpay_signature,
        amount: amountRupees,
        currency: "INR",
      });

      setCurrentOrderId(orderId);
      setPaymentStatus("success");
      setShowPaymentStatus(true);
      // Cart cleared after modal close
    } catch (err) {
      console.error("Error in handlePaymentSuccess:", err);
      setPaymentStatus("failed");
      setShowPaymentStatus(true);
    }
  };

  const handlePaymentFailure = async (err: any) => {
    console.error("Payment failed:", err);
    console.log(
      "Current order ID when payment failed (state):",
      currentOrderId
    );
    console.log(
      "Current order ID when payment failed (ref):",
      currentOrderIdRef.current
    );

    setPaymentStatus("failed");
    setShowPaymentStatus(true);

    const orderIdToUse =
      currentOrderIdRef.current || currentOrderId;

    if (orderIdToUse) {
      try {
        console.log(
          "🔄 Updating database for failed payment, order ID:",
          orderIdToUse
        );

        const { error: orderError } = await supabase
          .from("orders")
          .update({
            status: "cancelled",
            payment_status: "failed",
            cancelled_at: new Date().toISOString(),
            comments: "Payment cancelled by user",
          })
          .eq("order_id", orderIdToUse);

        if (orderError) {
          console.error(
            "❌ Error updating order status:",
            orderError
          );
        }

        const { error: itemsError } = await supabase
          .from("order_items")
          .update({
            item_status: "cancelled",
            cancel_reason: "Payment cancelled by user",
          })
          .eq("order_id", orderIdToUse);

        if (itemsError) {
          console.error(
            "❌ Error updating order items status:",
            itemsError
          );
        }

        const { error: paymentError } = await supabase
          .from("payments")
          .update({
            payment_status: "failed",
            updated_at: new Date().toISOString(),
          })
          .eq("order_id", orderIdToUse);

        if (paymentError) {
          console.error(
            "❌ Error updating payment status:",
            paymentError
          );
        }

        console.log("✅ Database updated for failed payment");
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
    }
  };

  const handlePlaceOrder = async () => {
    const authType = getAuthenticationType();

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

    if (!validateShipping()) {
      showAlert("Please fill/choose a shipping address", "warning");
      return;
    }

    if (!validateCODPayment()) {
      return;
    }

    if (selectedPayment === "cod" && !otpVerified) {
      // User must complete OTP verification first
      return;
    }

    setIsProcessing(true);
    try {
      const orderId = crypto.randomUUID();

      const totalMRP = cartItems.reduce(
        (sum, item) => sum + item.mrp * item.quantity,
        0
      );
      const totalDiscount = totalMRP - subtotal;

      const orderData = {
        amount: totalAmount,
        order_id: orderId,
        payment_method: selectedPayment,
        items: cartItems.map((i) => {
          const effective =
            applyProductDiscountToPrice(
              i.price,
              i.mrp,
              productDiscounts[i.product_id]
            ) || i.price;
          return {
            product_id: i.product_id,
            article_id: i.article_id,
            name: i.name,
            color: i.color,
            size: i.size,
            quantity: i.quantity,
            price: effective,
            mrp: i.mrp,
            discount_percentage: i.discount_percentage,
            thumbnail_url: i.thumbnail_url,
          };
        }),
        subtotal,
        total_mrp: totalMRP,
        total_discount: totalDiscount,
        prepaid_discount: prepaidDiscountAmount,
        delivery_charge: deliveryCharge,
        shipping_address: selectedAddress,
        metadata: {
          payment_method: selectedPayment,
        },
      };

      const invokeBody =
        authType === "user"
          ? { ...orderData, user_id: user!.id }
          : {
              ...orderData,
              guest_session_id:
                guestSession?.guest_session_id,
              guest_contact_info: guestInfo,
            };

      const { data, error } = await supabase.functions.invoke(
        "create-order",
        {
          body: invokeBody,
        }
      );

      if (error) {
        console.error("Error creating order:", error);
        throw new Error(
          (error as any).message ||
            "Failed to create order"
        );
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
        setPaymentStatus("success");
        setShowPaymentStatus(true);
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
        const key = getRazorpayKey();
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
                  setOtpVerified(true);
                  setShowOtpVerification(false);
                  setCodOtpTriggered(false);
                  setTimeout(() => {
                    window.scrollTo({
                      top: 0,
                      left: 0,
                      behavior: "smooth",
                    });
                  }, 100);
                }}
                onCancel={() => {
                  setShowOtpVerification(false);
                  setOtpValue("");
                  setOtpError("");
                  setCodOtpTriggered(false);
                  window.scrollTo({
                    top: 0,
                    left: 0,
                    behavior: "smooth",
                  });
                }}
                prefilledContact={contact.email || contact.phone}
                prefilledMethod="email"
                userType={user ? "registered" : "guest"}
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
          {/* Header */}
          <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 mb-6 sm:mb-8">
            <div className="flex items-center gap-3 sm:gap-4">
              <button
                onClick={() =>
                  handleNavigationAttempt(() =>
                    navigate("/cart")
                  )
                }
                className="flex items-center gap-2 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors text-sm sm:text-base"
                aria-label="Back to cart"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back to Cart</span>
              </button>
            </div>
            {isGuest && guestInfo && (
              <div className="flex items-center gap-2 sm:gap-4">
                <span className="text-xs sm:text-sm text-gray-700 dark:text-gray-300">
                  <span className="font-medium">
                    Guest:
                  </span>{" "}
                  {guestInfo.email}
                </span>
                <button
                  onClick={handleBackToGuestForm}
                  className="text-xs sm:text-sm text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 transition-colors"
                >
                  Change Info
                </button>
              </div>
            )}
          </header>

          <section className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-8">
            {/* Left column: Address + Payment */}
            <section className="space-y-4 sm:space-y-8">
              {user ? (
                <AddressCard
                  selectedId={selectedAddress?.id}
                  onSelect={(addr) =>
                    setSelectedAddress(addr)
                  }
                />
              ) : (
                <GuestAddressForm
                  selectedAddress={{
                    ...selectedAddress,
                    ...(guestInfo
                      ? {
                          name: guestInfo.name,
                          email: guestInfo.email,
                          phone: guestInfo.phone,
                        }
                      : {}),
                  }}
                  onAddressSubmit={(addr) =>
                    setSelectedAddress(addr)
                  }
                  guest_session_id={
                    useAuthStore.getState()
                      .guestSession?.guest_session_id
                  }
                />
              )}

              {/* Delivery Information */}
              {selectedAddress?.pincode && (deliveryTime || !codAvailable) && (
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4 sm:p-5 shadow-sm">
                  <div className="space-y-2">
                    <h4 className="font-medium text-blue-900 dark:text-blue-100 flex items-center gap-2">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Delivery Information
                    </h4>
                    
                    {deliveryTime && (
                      <div className="text-sm text-blue-800 dark:text-blue-200">
                        <span className="font-medium">Estimated Delivery:</span> {deliveryTime}
                      </div>
                    )}
                    
                    {!codAvailable && (
                      <div className="text-sm text-red-600 dark:text-red-400 font-medium">
                        Cash on Delivery (COD) is not available for this pincode
                      </div>
                    )}
                    
                    {deliveryCharge > 0 ? (
                      <div className="text-sm text-blue-800 dark:text-blue-200">
                        <span className="font-medium">Shipping Fee:</span> ₹{deliveryCharge.toLocaleString("en-IN")}
                      </div>
                    ) : (
                      <div className="text-sm text-green-600 dark:text-green-400 font-medium">
                        Free Shipping for this order
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Checkout offer banner (prepaid rule) */}
              {checkoutRule && checkoutOfferLabel && (
                <div className="bg-green-50 dark:bg-dark3 border border-green-200 dark:border-green-700/50 rounded-xl p-4 sm:p-5 flex items-start gap-3 shadow-sm">
                  <div className="flex-shrink-0 mt-0.5">
                    <svg
                      className="w-5 h-5 text-green-600 dark:text-green-400"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      aria-hidden="true"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm sm:text-base font-semibold text-green-800 dark:text-green-200">
                      {checkoutOfferLabel}
                    </p>
                    {checkoutRule.min_order &&
                      subtotal < Number(checkoutRule.min_order) && (
                        <p className="mt-1 text-xs sm:text-sm text-green-700 dark:text-green-300">
                          Add ₹
                          {Math.max(
                            0,
                            Number(checkoutRule.min_order) - subtotal
                          ).toLocaleString("en-IN")}{" "}
                          more to unlock {checkoutOfferLabel}.
                        </p>
                      )}
                  </div>
                </div>
              )}

              {/* Payment Methods (updated onSelect) */}
              <PaymentMethods
                selected={selectedPayment}
                onSelect={(id) => {
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
                onCodOtpRequired={() => {
                  setCodOtpTriggered(true);
                }}
                otpVerified={otpVerified}
              />
            </section>

            {/* Right column: Items + Summary + CTA */}
            <aside className="lg:col-span-1 space-y-4 sm:space-y-6">
              {/* Items list */}
              <section className="bg-white dark:bg-dark2 rounded-2xl shadow-lg p-4 sm:p-6 transition-colors duration-200">
                <h3 className="font-semibold text-base sm:text-lg text-gray-900 dark:text-gray-100 mb-3 sm:mb-4">
                  Your Items
                </h3>
                <div className="space-y-3 sm:space-y-4 max-h-96 overflow-y-auto pr-1">
                  {cartItems.map((item: any) => {
                    const rule =
                      productDiscounts[item.product_id];
                    const discountedUnit =
                      applyProductDiscountToPrice(
                        item.price,
                        item.mrp,
                        rule
                      );
                    const effectiveUnit =
                      discountedUnit || item.price;
                    const baseForSavings =
                      rule &&
                      rule.base === "mrp" &&
                      item.mrp != null
                        ? item.mrp
                        : item.price;
                    const originalUnit = baseForSavings;
                    const originalLine =
                      originalUnit * item.quantity;
                    const lineSubtotal =
                      effectiveUnit * item.quantity;
                    const lineSavings = Math.max(
                      0,
                      originalLine - lineSubtotal
                    );

                    return (
                      <div
                        key={item.id}
                        className="flex items-center gap-3 sm:gap-4 border-b border-gray-100 dark:border-gray-800 pb-2 sm:pb-3 last:border-0"
                      >
                        <img
                          src={item.thumbnail_url}
                          alt={item.name}
                          className="w-12 h-12 sm:w-16 sm:h-16 rounded object-cover flex-shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm sm:text-base truncate text-gray-900 dark:text-gray-100">
                            {item.name}
                          </p>
                          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                            {item.size
                              ? `Size: ${item.size} • `
                              : ""}
                            Qty: {item.quantity}
                          </p>
                          <div className="flex items-center justify-between mt-1">
                            <div className="text-xs sm:text-sm text-gray-700 dark:text-gray-300">
                              {lineSavings > 0 ? (
                                <>
                                  <span className="line-through mr-1">
                                    ₹
                                    {originalUnit.toLocaleString(
                                      "en-IN"
                                    )}
                                  </span>
                                  <span className="font-semibold">
                                    ₹
                                    {effectiveUnit.toLocaleString(
                                      "en-IN"
                                    )}
                                  </span>
                                </>
                              ) : (
                                <span className="font-semibold">
                                  ₹
                                  {effectiveUnit.toLocaleString(
                                    "en-IN"
                                  )}
                                </span>
                              )}
                            </div>
                            <div className="font-semibold text-sm sm:text-base flex-shrink-0 text-gray-900 dark:text-gray-100">
                              ₹
                              {lineSubtotal.toLocaleString(
                                "en-IN"
                              )}
                            </div>
                          </div>
                          {lineSavings > 0 && (
                            <p className="text-[11px] sm:text-xs text-green-600 dark:text-green-400 mt-0.5">
                              You save ₹
                              {lineSavings.toLocaleString(
                                "en-IN"
                              )}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>

              {/* Order summary */}
              <OrderSummary
                items={cartItems}
                subtotal={displaySubtotal}
                shipping={deliveryCharge}
                tax={0}
                total={totalAmount}
                savings={displaySavings}
                prepaidDiscount={bestDiscountType === 'checkout' ? checkoutDiscount : 0}
                checkoutDiscount={0}
                productDiscount={bestDiscountType === 'product' ? productSavings : 0}
                mrpTotal={displayMRPTotal}
                darkMode={isDarkMode}
              />

              {/* Unlock offer hint (when rule exists but not yet eligible) */}
              {checkoutRule &&
                checkoutOfferLabel &&
                subtotal > 0 &&
                checkoutDiscount === 0 &&
                checkoutRule.min_order != null &&
                subtotal < Number(checkoutRule.min_order) && (
                  <div className="text-xs sm:text-sm text-green-700 dark:text-green-300 bg-green-50 dark:bg-dark3 border border-green-200 dark:border-green-700/50 rounded-lg p-3 shadow-sm">
                    <div className="flex items-start gap-2">
                      <svg
                        className="w-4 h-4 mt-0.5 flex-shrink-0 text-green-600 dark:text-green-400"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      <span>
                        Add ₹
                        {Math.max(
                          0,
                          Number(checkoutRule.min_order) - subtotal
                        ).toLocaleString("en-IN")}{" "}
                        more to unlock {checkoutOfferLabel}
                        {bestDiscountType === 'product' && productSavings > 0 && (
                          <span className="block mt-1 text-xs">
                            Note: Product discounts of ₹{productSavings.toLocaleString("en-IN")} are already applied
                          </span>
                        )}
                      </span>
                    </div>
                  </div>
                )}

              {/* Sticky CTA card */}
              <section className="bg-white dark:bg-dark2 rounded-2xl shadow-lg p-4 sm:p-6 sticky top-4 space-y-4 transition-colors duration-200">
                <div className="flex flex-col items-center text-center space-y-4">
                  <div className="flex items-center justify-center gap-2">
                    <div className="p-1.5 rounded-full bg-green-100 dark:bg-green-900/30">
                      <Shield className="w-5 h-5 sm:w-6 sm:h-6 text-green-600 dark:text-green-400" />
                    </div>
                    <h3 className="font-semibold text-sm sm:text-base text-gray-900 dark:text-gray-100">
                      Secure Checkout
                    </h3>
                  </div>
                  <div className="w-full max-w-xs mx-auto">
                    <img
                      src={razorpayPayments}
                      alt="Payment methods: Cards, UPI and Razorpay"
                      className="h-10 sm:h-12 md:h-14 lg:h-16 w-full object-contain dark:invert dark:brightness-90 dark:contrast-125"
                      loading="lazy"
                    />
                  </div>
                  <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 px-2">
                    Your payment information is encrypted and securely processed.
                  </p>
                </div>

                <button
                  onClick={handlePlaceOrder}
                  disabled={
                    isProcessing ||
                    (selectedPayment === "cod" && !otpVerified)
                  }
                  className={`w-full py-3 sm:py-4 rounded-xl font-bold text-base sm:text-lg shadow-lg transition-all duration-200 transform hover:scale-105 disabled:opacity-60 disabled:cursor-not-allowed ${
                    selectedPayment === "cod" && !otpVerified
                      ? "bg-gray-300 text-gray-700 dark:bg-gray-700 dark:text-gray-300 cursor-not-allowed hover:scale-100"
                      : "bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700"
                  }`}
                >
                  {isProcessing ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Processing...
                    </span>
                  ) : selectedPayment === "cod" && !otpVerified ? (
                    "Complete OTP Verification to Place Order"
                  ) : (
                    `Place Order  ₹${totalAmount.toLocaleString("en-IN")}`
                  )}
                </button>
              </section>
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
          prepaidDiscount={bestDiscountType === 'checkout' ? checkoutDiscount : 0}
          onClose={() => {
            setShowPaymentStatus(false);
            setPaymentStatus(null);
            clearCart();
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
          (bestDiscountType === 'checkout' && checkoutDiscount > 0)
            ? `You can save an extra ₹${checkoutDiscount.toLocaleString(
                "en-IN"
              )} by paying online. Cash on Delivery does not include this checkout discount.`
            : (bestDiscountType === 'product' && productSavings > 0)
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
    </>
  );
};

export default CheckoutPage;
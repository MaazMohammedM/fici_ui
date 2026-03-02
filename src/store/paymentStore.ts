// src/store/paymentStore.ts
import { create } from 'zustand';
import { db, collection, addDoc, getDocs, query, where, doc, getDoc, updateDoc, serverTimestamp, limit } from '@lib/firebase';
import { httpsCallable, functions } from '@lib/firebase';

/** ─────────────────────────────────────────────────────────────────────────────
 * Types
 * DB stores rupees (numeric). Razorpay needs paise when hitting their API.
 * ──────────────────────────────────────────────────────────────────────────── */
export type PaymentStatusDB = 'pending' | 'paid' | 'failed' | 'refunded'|'completed';
export type OrderStatusDB = 'pending' | 'paid' | 'shipped' | 'delivered' | 'cancelled'|'confirmed';

export interface CartItemForOrder {
  product_id: string;
  size?: string | null;
  quantity: number;
  price: number;         // per unit price (rupees) captured at checkout time
thumbnail_url : string;
}

export interface OrderCreateInput {
  user_id?: string;
  guest_session_id?: string;
  guest_contact_info?: any;
  items: CartItemForOrder[];
  subtotal: number;
  discount: number;
  delivery_charge: number;
  total_amount: number;      // rupees (what customer sees)
  status: OrderStatusDB;     // usually 'pending'
  payment_status: PaymentStatusDB; // usually 'pending'
  payment_method: string;    // 'razorpay'
  shipping_address: any;     // JSONB
}

export interface PaymentDetails {
  order_id: string;
  user_id?: string | null;
  guest_session_id?: string | null;
  provider: string;                 // 'razorpay'
  payment_status: PaymentStatusDB;  // 'paid' | 'failed' | 'pending'
  payment_method: string;           // 'razorpay'
  amount: number;                   // rupees (same as order total)
  currency: string;                 // 'INR'
  payment_reference?: string | null; // e.g. razorpay_payment_id
  paid_at?: string | null;
  updated_at?: string | null;
}

export interface PaymentResponse {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}
interface PaymentState {
  loading: boolean;
  error: string | null;
  currentPayment: PaymentDetails | null;

  /** Creates order in Razorpay and returns razorpay_order_id */
  createRazorpayOrder: (amount: number, currency: string) => Promise<any>;

  /** Creates internal order and links it to Razorpay order */
  createOrderWithRazorpay: (orderData: OrderCreateInput, razorpayOrderId: string) => Promise<string | null>;

  /** Insert payment row and update orders.{status,payment_status} */
  savePaymentDetails: (paymentData: Omit<PaymentDetails, 'paid_at' | 'updated_at'>) => Promise<void>;

  clearError: () => void;
}

export const usePaymentStore = create<PaymentState>((set) => ({
  loading: false,
  error: null,
  currentPayment: null,

  /** Creates order in Razorpay and returns razorpay_order_id */
  createRazorpayOrder: async (amount: number, currency: string = 'INR') => {
    try {
      const createRazorpayOrderFunction = httpsCallable(functions, 'create-razorpay-order');
      const { data } = await createRazorpayOrderFunction({ amount, currency });

      return data;
    } catch (error) {
      console.error('Failed to create Razorpay order:', error);
      throw error;
    }
  },

  /** Creates internal order and links it to Razorpay order */
  createOrderWithRazorpay: async (orderData: OrderCreateInput, razorpayOrderId: string) => {
    set({ loading: true, error: null });
    try {
      // 1) Insert into orders with razorpay_order_id
      const orderInsertData: any = {
        ...orderData,
        razorpay_order_id: razorpayOrderId, // Link to Razorpay order
        created_at: serverTimestamp(),
        updated_at: serverTimestamp()
      };

      // Add user_id or guest session data based on order type
      if (orderData.user_id) {
        orderInsertData.user_id = orderData.user_id;
        orderInsertData.order_type = 'registered';
      } else if (orderData.guest_session_id) {
        orderInsertData.guest_session_id = orderData.guest_session_id;
        orderInsertData.order_type = 'guest';
        if (orderData.guest_contact_info) {
          orderInsertData.guest_email = orderData.guest_contact_info.email;
          orderInsertData.guest_phone = orderData.guest_contact_info.phone;
        }
      }

      const orderRef = await addDoc(collection(db, 'orders'), orderInsertData);
      const orderId = orderRef.id;

      // 2) Insert order_items
      if (orderData.items?.length) {
        const itemsToInsert = orderData.items.map((i: CartItemForOrder) => ({
          order_id: orderId,
          product_id: i.product_id,
          size: i.size ?? null,
          quantity: i.quantity,
          price_at_purchase: i.price,
          thumbnail_url: i.thumbnail_url,
          created_at: serverTimestamp()
        }));

        for (const item of itemsToInsert) {
          await addDoc(collection(db, 'order_items'), item);
        }
      }

      set({ loading: false });
      return orderId;
    } catch (e: any) {
      console.error("createOrderWithRazorpay error:", e);
      set({ error: e?.message ?? "Failed to create order", loading: false });
      return null;
    }
  },

  savePaymentDetails: async (paymentData) => {
    set({ loading: true, error: null });
    try {
      const now = serverTimestamp();
      const isPaid = paymentData.payment_status === "completed";

      // If order_id is not provided, try to find it from existing payment record
      let orderId = paymentData.order_id;
      if (!orderId && paymentData.payment_reference) {
        // Look up the order_id from the payments table using payment_reference
        const paymentsQuery = query(
          collection(db, 'payments'),
          where('payment_reference', '==', paymentData.payment_reference),
          limit(1)
        );
        const paymentSnapshot = await getDocs(paymentsQuery);

        if (!paymentSnapshot.empty) {
          orderId = paymentSnapshot.docs[0].data().order_id;
        }
      }

      if (!orderId) {
        throw new Error("Could not determine order_id for payment");
      }

      // Check if payment record already exists
      const existingPaymentQuery = query(
        collection(db, 'payments'),
        where('payment_reference', '==', paymentData.payment_reference),
        limit(1)
      );
      const existingPaymentSnapshot = await getDocs(existingPaymentQuery);

      if (!existingPaymentSnapshot.empty) {
        // Update existing payment record
        const paymentDoc = existingPaymentSnapshot.docs[0];
        await updateDoc(paymentDoc.ref, {
          payment_status: paymentData.payment_status,
          payment_method: paymentData.payment_method,
          amount: paymentData.amount,
          currency: paymentData.currency,
          paid_at: isPaid ? now : null,
          updated_at: now,
        });
      } else {
        // Insert new payment record
        const paymentInsert: any = {
          order_id: orderId,
          provider: paymentData.provider,
          payment_status: paymentData.payment_status,
          payment_method: paymentData.payment_method,
          amount: paymentData.amount, // ✅ RUPEES
          currency: paymentData.currency,
          payment_reference: paymentData.payment_reference ?? null,
          paid_at: isPaid ? now : null,
          updated_at: now,
          created_at: now,
        };

        // Add user_id or guest_session_id based on payment type
        if (paymentData.user_id) {
          paymentInsert.user_id = paymentData.user_id;
          paymentInsert.payment_type = 'registered';
        } else if (paymentData.guest_session_id) {
          paymentInsert.guest_session_id = paymentData.guest_session_id;
          paymentInsert.payment_type = 'guest';
        }

        await addDoc(collection(db, 'payments'), paymentInsert);
      }

      // 2) Update orders.{status,payment_status}
      const nextOrderStatus: OrderStatusDB = isPaid
        ? "confirmed"
        : paymentData.payment_status === "failed"
        ? "cancelled"
        : "pending";

      const orderQuery = query(
        collection(db, 'orders'),
        where('order_id', '==', orderId),
        limit(1)
      );
      const orderSnapshot = await getDocs(orderQuery);

      if (!orderSnapshot.empty) {
        await updateDoc(orderSnapshot.docs[0].ref, {
          status: nextOrderStatus,
          payment_status: paymentData.payment_status,
          updated_at: now,
        });
      }

      set({
        currentPayment: {
          ...paymentData,
          order_id: orderId,
          paid_at: isPaid ? new Date().toISOString() : null,
          updated_at: new Date().toISOString(),
        },
        loading: false,
      });
    } catch (e: any) {
      console.error("savePaymentDetails error:", e);
      set({
        error: e?.message ?? "Failed to save payment details",
        loading: false,
      });
    }
  },

  // Optional. Implement a dedicated edge function (e.g. 'verify-payment') to HMAC check signature server-side.
  verifyPayment: async () => {
    // Not used in this flow; keep for future.
    return true;
  },

  clearError: () => set({ error: null })
}));

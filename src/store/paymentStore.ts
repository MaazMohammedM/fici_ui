// src/store/paymentStore.ts
import { create } from 'zustand';
import { supabase } from '@lib/supabase';

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

  /** Inserts row in orders and its order_items; returns order_id on success */
  createOrder: (orderData: OrderCreateInput) => Promise<string | null>;

  /** Insert payment row and update orders.{status,payment_status} */
  savePaymentDetails: (paymentData: Omit<PaymentDetails, 'paid_at' | 'updated_at'>) => Promise<void>;

  /** Optional: if you add a server verifier later */
  verifyPayment: (response: PaymentResponse, orderId: string) => Promise<boolean>;

  clearError: () => void;
}

export const usePaymentStore = create<PaymentState>((set) => ({
  loading: false,
  error: null,
  currentPayment: null,

  createOrder: async (orderData) => {
    set({ loading: true, error: null });
    try {
      // 1) Insert into orders
      const orderInsertData: any = {
        subtotal: orderData.subtotal,
        discount: orderData.discount,
        delivery_charge: orderData.delivery_charge,
        total_amount: orderData.total_amount, // ✅ RUPEES in DB
        status: orderData.status,
        payment_status: orderData.payment_status,
        payment_method: orderData.payment_method,
        shipping_address: orderData.shipping_address,
      };

      // Add user_id or guest session data based on order type
      if (orderData.user_id) {
        orderInsertData.user_id = orderData.user_id;
        orderInsertData.order_type = 'registered';
      } else if (orderData.guest_session_id) {
        orderInsertData.guest_session_id = orderData.guest_session_id;
        orderInsertData.order_type = 'guest';
        // Extract guest email and phone from guest_contact_info
        if (orderData.guest_contact_info) {
          orderInsertData.guest_email = orderData.guest_contact_info.email;
          orderInsertData.guest_phone = orderData.guest_contact_info.phone;
        }
      }

      const { data: orderRow, error: orderErr } = await supabase
        .from("orders")
        .insert([orderInsertData])
        .select("order_id")
        .single();

      if (orderErr) throw orderErr;
      const orderId: string = orderRow.order_id;

      // 2) Insert order_items
      if (orderData.items?.length) {
        const itemsToInsert = orderData.items.map((i) => ({
          order_id: orderId,
          product_id: i.product_id,
          size: i.size ?? null,
          quantity: i.quantity,
          price_at_purchase: i.price,
          thumbnail_url: i.thumbnail_url, // ✅ RUPEES
        }));

        const { error: itemsErr } = await supabase
          .from("order_items")
          .insert(itemsToInsert);

        if (itemsErr) throw itemsErr;
      }

      set({ loading: false });
      return orderId;
    } catch (e: any) {
      console.error("createOrder error:", e);
      set({ error: e?.message ?? "Failed to create order", loading: false });
      return null;
    }
  },

  savePaymentDetails: async (paymentData) => {
    set({ loading: true, error: null });
    try {
      const now = new Date().toISOString();
      const isPaid = paymentData.payment_status === "completed";

      // 1) Insert payments
      const paymentInsert: any = {
        order_id: paymentData.order_id,
        provider: paymentData.provider,
        payment_status: paymentData.payment_status,
        payment_method: paymentData.payment_method,
        amount: paymentData.amount, // ✅ RUPEES
        currency: paymentData.currency,
        payment_reference: paymentData.payment_reference ?? null,
        paid_at: isPaid ? now : null,
        updated_at: now,
      };

      // Add user_id or guest_session_id based on payment type
      if (paymentData.user_id) {
        paymentInsert.user_id = paymentData.user_id;
        paymentInsert.payment_type = 'registered';
      } else if (paymentData.guest_session_id) {
        paymentInsert.guest_session_id = paymentData.guest_session_id;
        paymentInsert.payment_type = 'guest';
      }

      const { error: payErr } = await supabase.from("payments").insert([paymentInsert]);
      if (payErr) throw payErr;

      // 2) Update orders.{status,payment_status}
      const nextOrderStatus: OrderStatusDB = isPaid
        ? "confirmed"
        : paymentData.payment_status === "failed"
        ? "cancelled"
        : "pending";

      const { error: updErr } = await supabase
        .from("orders")
        .update({
          status: nextOrderStatus,
          payment_status: paymentData.payment_status,
        })
        .eq("order_id", paymentData.order_id);

      if (updErr) throw updErr;

      set({
        currentPayment: {
          ...paymentData,
          paid_at: isPaid ? now : null,
          updated_at: now,
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

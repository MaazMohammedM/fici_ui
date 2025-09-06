import { supabase } from '@lib/supabase';
export interface OrderCreateRequest {
  user_id?: string;
  guest_session_id?: string;
  guest_contact_info?: {
    email: string;
    phone: string;
    name: string;
  };
  order_id: string;
  payment_method: string;
  items: any[];
  subtotal: number;
  discount: number;
  delivery_charge: number;
  shipping_address: any;
  amount: number;
}

export class OrderService {
  static async createOrder(orderData: OrderCreateRequest) {
    try {
      const { data, error } = await supabase.functions.invoke('create-order', {
        body: orderData
      });

      if (error) {
        console.error('Order creation error:', error);
        throw new Error(error.message || 'Failed to create order');
      }

      return data;
    } catch (error) {
      console.error('Order service error:', error);
      throw error;
    }
  }

  static generateOrderId(): string {
    return crypto.randomUUID();
  }

  static validateOrderData(data: any): boolean {
    return !!(
      data.items?.length > 0 &&
      data.shipping_address &&
      data.payment_method &&
      data.subtotal >= 0
    );
  }
}

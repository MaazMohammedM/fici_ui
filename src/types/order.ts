export interface OrderItem {
  product_id: string;
  article_id: string;
  name: string;
  color: string;
  size: string;
  image: string;
  quantity: number;
  price: number;
  mrp: number;
  discount_percentage: number;
}

export interface Order {
  id: string;
  user_id: string;
  items: OrderItem[];
  subtotal: number;
  discount: number;
  delivery_charge: number;
  total_amount: number;
  status: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';
  payment_status: 'pending' | 'completed' | 'failed';
  payment_method: string;
  razorpay_order_id?: string;
  razorpay_payment_id?: string;
  shipping_address: {
    name: string;
    phone: string;
    email: string;
    address: string;
    city: string;
    state: string;
    pincode: string;
    landmark?: string;
  };
  created_at: string;
  estimated_delivery?: string;
  tracking_number?: string;
  reviews_submitted: string[];
}

export interface OrderFilters {
  status: string;
  search: string;
}

export interface Review {
  review_id: string;
  order_id: string;
  product_id: string;
  user_id: string;
  rating: number;
  title: string;
  images: string[];
  comment: string;
  created_at: string;
  is_verified_purchase: boolean;
}

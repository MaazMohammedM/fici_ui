export interface OrderItem {
  product_id: string;
  article_id: string;
  name: string;
  color: string;
  size: string;
  image: string;
  price: number;
  mrp: number;
  quantity: number;
  discount_percentage: number;
}

export interface Order {
  order_id: string;
  user_id: string;
  status: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';
  items: OrderItem[];
  total_amount: number;
  discount_amount: number;
  tax_amount: number;
  shipping_amount: number;
  payment_method: string;
  payment_status: 'pending' | 'completed' | 'failed' | 'refunded';
  shipping_address: {
    name: string;
    phone: string;
    address: string;
    city: string;
    state: string;
    pincode: string;
  };
  order_date: string;
  estimated_delivery: string;
  tracking_number?: string;
  reviews_submitted: string[]; // Array of product_ids that have been reviewed
}

export interface Review {
  review_id: string;
  order_id: string;
  product_id: string;
  user_id: string;
  rating: number;
  title: string;
  comment: string;
  images?: string[];
  created_at: string;
  is_verified_purchase: boolean;
}

export interface OrderFilters {
  status?: string;
  date_range?: {
    start: string;
    end: string;
  };
  search?: string;
}

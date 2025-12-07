export interface Product {
  product_id: string;
  article_id: string;
  name: string;
  description?: string;
  sub_category?: string;
  mrp_price: string;
  mrp: number;
  discount_price: string | number;
  gender: 'men' | 'women' | 'unisex';
  category: 'Footwear' | 'Bags and Accessories';
  sizes: Record<string, number>;
  images: string[];
  thumbnail_url?: string;
  color: string | number;
  discount_percentage: number;
  created_at: string;
  rating?: Rating;
  tags?: string[];
}

export interface Rating {
  average: number;
  count: number;
  distribution?: {
    1: number;
    2: number;
    3: number;
    4: number;
    5: number;
  };
}

export interface ProductDetail {
  article_id: string;
  name: string;
  description?: string;
  sub_category?: string;
  variants: Product[];
  category: string;
  gender: string;
  rating?: Rating;
  total_reviews?: number;
}

export interface Category {
  id: string;
  name: string;
  image: string;
  count: number;
}

export interface HeroSlide {
  id: string;
  title: string;
  subtitle: string;
  image: string;
  ctaText: string;
  ctaLink: string;
  gender?: 'men' | 'women';
} 
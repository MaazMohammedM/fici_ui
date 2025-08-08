export interface Product {
  product_id: string;
  article_id: string;
  name: string;
  description?: string;
  brand?: string;
  mrp_price: string;
  discount_price: string;
  gender: 'men' | 'women' | 'unisex';
  category: 'shoes' | 'sandals' | 'chappals';
  sizes: Record<string, number>;
  images: string[];
  thumbnail_url?: string;
  color: string;
  discount_percentage: number;
  created_at: string;
}

export interface ProductDetail {
  article_id: string;
  name: string;
  description?: string;
  brand?: string;
  variants: Product[];
  category: string;
  gender: string;
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
// src/features/cart/data/cartItems.ts

import loafersImage from "../assets/loafers.png";
import sneakersImage from "../assets/sneakers.png";

export interface CartItem {
  id: number;
  name: string;
  image: string;
  price: number;
  quantity: number;
  color: string;
  mrp?: number;
}

export const cartItems: CartItem[] = [
  {
    id: 1,
    name: "Classic Loafers",
    image: loafersImage,
    price: 49.99,
    quantity: 1,
    color: "Black",
    mrp: 80
  },
  {
    id: 2,
    name: "Sneakers Max",
    image: sneakersImage,
    price: 59.99,
    quantity: 2,
    color: "White",
    mrp: 90
  },
  // Add more items and imports as needed
];

import React from "react";
import { ShoppingCart, Zap } from "lucide-react";

interface Props {
  onAddToCart: () => void;
  onBuyNow: () => void;
}

const ProductActionsButton: React.FC<Props> = ({ onAddToCart, onBuyNow }) => (
  <div className="flex flex-col sm:flex-row gap-3 mt-4">
    <button
      onClick={onAddToCart}
      className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl border-2 border-accent text-accent font-semibold hover:bg-accent hover:text-white transition-all"
    >
      <ShoppingCart className="w-5 h-5" />
      Add to Cart
    </button>

    <button
      onClick={onBuyNow}
      className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-accent to-accent/80 text-white font-semibold shadow-md hover:scale-105 transition-transform"
    >
      <Zap className="w-5 h-5" />
      Buy Now
    </button>
  </div>
);

export default ProductActionsButton;

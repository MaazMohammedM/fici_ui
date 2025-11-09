import React from "react";
import { Share2, Heart } from "lucide-react";

interface Props {
  onShare: () => void;
}

const ProductExtras: React.FC<Props> = ({ onShare }) => (
  <div className="flex gap-4 mt-6">
    <button
      onClick={onShare}
      className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition"
    >
      <Share2 className="w-4 h-4" />
      Share
    </button>
    <button
      className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition"
    >
      <Heart className="w-4 h-4" />
      Wishlist
    </button>
  </div>
);

export default ProductExtras;
import { useState } from "react";

export default function NetworkIssueBanner() {
  const [visible, setVisible] = useState(true);

  if (!visible) return null;

  const handleClose = () => {
    setVisible(false);
  };

  const message = "🔥 Enjoy a Flat 10% Discount. Limited-Time Offer - Shop Now Before It Ends.";

  return (
    <div className="w-full bg-gradient-to-r from-red-600 via-orange-500 to-red-600 text-white text-center py-2 px-4 text-xs sm:text-sm font-medium shadow-sm relative overflow-hidden">
      {/* Animated background effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-pulse"></div>
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-yellow-400/20 to-transparent animate-pulse" style={{ animationDelay: '1s' }}></div>
      
      <span className="block truncate relative z-10">{message}</span>
      {/* <button
        onClick={handleClose}
        className="absolute top-1/2 right-4 transform -translate-y-1/2 font-bold text-white hover:text-yellow-300 bg-red-700 rounded-full w-5 h-5 flex items-center justify-center text-xs transition-colors"
        aria-label="Close banner"
      >
        ✕
      </button> */}
    </div>
  );
}

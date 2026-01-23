import React from "react";
import desktopImg from "../../assets/shoecare_desktop.png";
import mobileImg from "../../assets/shoe_care_mobile_screen.png";

const ShoeCarePage: React.FC = () => {
  return (
    <main className="min-h-dvh flex flex-col bg-gradient-to-b from-[#f6efe5] to-[#f1e5d4] dark:from-slate-900 dark:to-slate-950">
      {/* Header area (if any) - will be flex-none */}
      <div className="flex-none">{/* Header content would go here */}</div>

      {/* Main content area - flex-1 makes it take remaining space */}
      <div className="flex-1 flex flex-col">
        <div className="w-full max-w-[1800px] mx-auto flex-1 flex flex-col">
          <div className="relative w-full flex-1 flex items-center justify-center overflow-hidden sm:rounded-xl sm:shadow-xl sm:ring-1 sm:ring-slate-200/60 sm:dark:ring-slate-700/80 sm:bg-slate-900/5 sm:dark:bg-slate-900 sm:mx-4 sm:my-4 sm:aspect-[16/9] lg:aspect-[21/9] sm:flex-none">
            <picture className="w-full h-full flex items-center justify-center">
              <source 
                srcSet={mobileImg} 
                media="(max-width: 767px)"
                className="w-full h-full object-contain"
              />
              <img
                src={desktopImg}
                alt="FiCi Shoe Care Guide — Daily care tips, cleaning & conditioning, storage, weather & moisture care, and polishing tips to keep your leather shoes looking great and lasting longer."
                className="w-full h-full object-contain sm:object-cover"
                loading="eager"
                decoding="async"
              />
            </picture>
          </div>
        </div>
      </div>

      {/* Footer area (if any) - will be flex-none */}
      <div className="flex-none">{/* Footer content would go here */}</div>
    </main>
  );
};

export default ShoeCarePage;
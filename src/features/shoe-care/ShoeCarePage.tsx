import React from "react";
import desktopImg from "../../assets/shoe_care_desktop.png";
import mobileImg from "../../assets/shoe_care_mobile.png";

const ShoeCarePage: React.FC = () => {
  return (
    <main className="min-h-screen bg-gradient-to-b from-[#f6efe5] to-[#f1e5d4] dark:from-slate-900 dark:to-slate-950 flex items-center">
      <section className="w-full max-w-5xl mx-auto px-4 py-10 sm:py-12 lg:py-16">

        {/* Responsive infographic image */}
        <div className="rounded-2xl overflow-hidden shadow-xl ring-1 ring-slate-200/60 dark:ring-slate-700/80 bg-slate-900/5 dark:bg-slate-900">
          <picture>
            {/* Mobile first: show tall/portrait version on small screens */}
            <source
              srcSet={mobileImg}
              media="(max-width: 768px)"
            />
            {/* Default / desktop: landscape version */}
            <img
              src={desktopImg}
              alt="FiCi Shoe Care Guide — Daily care tips, cleaning & conditioning, storage, weather & moisture care, and polishing tips to keep your leather shoes looking great and lasting longer."
              className="w-full h-auto block"
              loading="lazy"
            />
          </picture>
        </div>
      </section>
    </main>
  );
};

export default ShoeCarePage;
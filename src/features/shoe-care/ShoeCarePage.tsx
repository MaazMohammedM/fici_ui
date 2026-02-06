import React from "react";
import ficiLight from '../../assets/fici_logo_light.png';

const ShoeCarePage: React.FC = () => {
  return (
    <main className="min-h-screen relative overflow-hidden bg-[#0a0a0a]">
      {/* Animated background with noise texture */}
      <div className="fixed inset-0 opacity-30">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-amber-900/20 via-transparent to-transparent"></div>
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_var(--tw-gradient-stops))] from-yellow-900/10 via-transparent to-transparent"></div>
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' /%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.05'/%3E%3C/svg%3E")`,
          backgroundSize: '200px 200px'
        }}></div>
      </div>

      {/* Geometric accent patterns */}
      <div className="fixed top-0 left-0 w-96 h-96 opacity-10">
        <div className="absolute top-20 left-20 w-64 h-64 border-2 border-amber-500/30 rotate-45 animate-[spin_60s_linear_infinite]"></div>
        <div className="absolute top-32 left-32 w-40 h-40 border border-yellow-400/20 rotate-12"></div>
      </div>
      <div className="fixed bottom-0 right-0 w-96 h-96 opacity-10">
        <div className="absolute bottom-20 right-20 w-72 h-72 border-2 border-amber-500/30 -rotate-12 animate-[spin_80s_linear_infinite_reverse]"></div>
      </div>

      <div className="relative z-10 py-8 px-4 sm:py-12 md:py-16 lg:py-20">
        <div className="max-w-[1400px] mx-auto">
          {/* Main card with art deco styling */}
          <article className="relative bg-gradient-to-br from-neutral-900/95 via-black/98 to-neutral-950/95 backdrop-blur-sm rounded-none sm:rounded-2xl overflow-hidden shadow-[0_0_100px_rgba(251,191,36,0.15)]">
            
            {/* Triple ornate border */}
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute inset-0 border-[6px] border-double border-amber-600/70 hidden sm:block"></div>
              <div className="absolute inset-3 border-[3px] border-amber-500/50 hidden sm:block"></div>
              <div className="absolute inset-5 border border-amber-400/30 hidden sm:block"></div>
            </div>

            {/* Corner decorations */}
            <div className="absolute top-0 left-0 w-32 h-32 opacity-20 pointer-events-none hidden lg:block">
              <div className="absolute top-6 left-6 w-20 h-20">
                <div className="absolute inset-0 border-t-4 border-l-4 border-amber-500"></div>
                <div className="absolute top-2 left-2 w-4 h-4 bg-amber-400"></div>
              </div>
            </div>
            <div className="absolute top-0 right-0 w-32 h-32 opacity-20 pointer-events-none hidden lg:block">
              <div className="absolute top-6 right-6 w-20 h-20">
                <div className="absolute inset-0 border-t-4 border-r-4 border-amber-500"></div>
                <div className="absolute top-2 right-2 w-4 h-4 bg-amber-400"></div>
              </div>
            </div>
            <div className="absolute bottom-0 left-0 w-32 h-32 opacity-20 pointer-events-none hidden lg:block">
              <div className="absolute bottom-6 left-6 w-20 h-20">
                <div className="absolute inset-0 border-b-4 border-l-4 border-amber-500"></div>
                <div className="absolute bottom-2 left-2 w-4 h-4 bg-amber-400"></div>
              </div>
            </div>
            <div className="absolute bottom-0 right-0 w-32 h-32 opacity-20 pointer-events-none hidden lg:block">
              <div className="absolute bottom-6 right-6 w-20 h-20">
                <div className="absolute inset-0 border-b-4 border-r-4 border-amber-500"></div>
                <div className="absolute bottom-2 right-2 w-4 h-4 bg-amber-400"></div>
              </div>
            </div>

            {/* Content */}
            <div className="relative px-6 sm:px-10 md:px-16 lg:px-24 py-10 sm:py-14 md:py-20">
              
              {/* Logo with animation */}
              <div className="text-center mb-10 sm:mb-14 animate-[fadeIn_1s_ease-out]">
                <img 
                  src={ficiLight} 
                  alt="FiCi - A Mark of Trust & Quality" 
                  className="h-16 sm:h-20 md:h-24 mx-auto drop-shadow-[0_0_20px_rgba(251,191,36,0.3)] hover:drop-shadow-[0_0_30px_rgba(251,191,36,0.5)] transition-all duration-500"
                />
              </div>

              {/* Main title with staggered animation */}
              <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold text-center mb-8 sm:mb-10 md:mb-12 animate-[fadeInUp_0.8s_ease-out_0.2s_both]"
                  style={{ 
                    fontFamily: "'Cormorant Garamond', 'Playfair Display', serif",
                    background: 'linear-gradient(to bottom, #fbbf24 0%, #f59e0b 50%, #d97706 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                    letterSpacing: '0.03em',
                    textShadow: '0 0 40px rgba(251,191,36,0.3)'
                  }}>
                Shoe Care Guide
              </h1>

              {/* Decorative divider */}
              <div className="flex items-center justify-center gap-4 mb-10 sm:mb-12 animate-[fadeIn_1s_ease-out_0.4s_both]">
                <div className="h-px w-16 sm:w-24 bg-gradient-to-r from-transparent to-amber-500/50"></div>
                <div className="w-2 h-2 rotate-45 bg-amber-500"></div>
                <div className="h-px w-16 sm:w-24 bg-gradient-to-l from-transparent to-amber-500/50"></div>
              </div>

              {/* Introduction */}
              <p className="text-center text-amber-100/90 text-lg sm:text-xl md:text-2xl mb-12 sm:mb-16 md:mb-20 max-w-4xl mx-auto leading-relaxed animate-[fadeInUp_0.8s_ease-out_0.6s_both]"
                 style={{ fontFamily: "'Crimson Text', Georgia, serif" }}>
                At FiCi, we use only good quality leathers. With the right care, your shoes will not only look great but also last longer.
              </p>

              {/* Why section - full width */}
              <section className="mb-16 sm:mb-20 md:mb-24 max-w-5xl mx-auto animate-[fadeInUp_0.8s_ease-out_0.8s_both]">
                <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-6 sm:mb-8"
                    style={{ 
                      fontFamily: "'Cormorant Garamond', serif",
                      background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      backgroundClip: 'text'
                    }}>
                  Why Shoe Care Matters?
                </h2>
                <p className="text-amber-100/80 text-lg sm:text-xl leading-relaxed" style={{ fontFamily: "'Crimson Text', Georgia, serif" }}>
                  Leather is a natural material that reacts to environmental conditions. Regular maintenance helps preserve the finish, fit, and feel of your shoes over time.
                </p>
              </section>

              {/* Main content grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 md:gap-16 lg:gap-20 max-w-6xl mx-auto">
                
                {/* Section 1 */}
                <section className="group animate-[fadeInUp_0.8s_ease-out_1s_both]">
                  <div className="relative mb-6">
                    <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold transition-all duration-300 group-hover:translate-x-2 flex items-center gap-3"
                        style={{ 
                          fontFamily: "'Cormorant Garamond', serif",
                          background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)',
                          WebkitBackgroundClip: 'text',
                          WebkitTextFillColor: 'transparent',
                          backgroundClip: 'text'
                        }}>
                      <span className="font-mono font-bold text-3xl sm:text-4xl md:text-5xl" 
                            style={{ 
                              background: 'linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%)',
                              WebkitBackgroundClip: 'text',
                              WebkitTextFillColor: 'transparent',
                              backgroundClip: 'text'
                            }}>
                        1.
                      </span>
                      Daily Care Tips
                    </h2>
                    <div className="absolute -left-4 top-0 bottom-0 w-1 bg-gradient-to-b from-amber-500 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  </div>
                  <div className="space-y-6 pl-2">
                    <div className="border-l-2 border-amber-600/30 pl-6 py-2 hover:border-amber-500/60 transition-colors duration-300">
                      <h3 className="text-xl sm:text-2xl font-semibold text-amber-400 mb-2" style={{ fontFamily: "'Crimson Text', serif" }}>
                        • Use a Shoe Horn
                      </h3>
                      <p className="text-amber-100/70 text-base sm:text-lg leading-relaxed" style={{ fontFamily: "'Crimson Text', serif" }}>
                        Helps retain the heel structure of the shoe. Prevents the back from bending or collapsing while putting them on.
                      </p>
                    </div>
                    <div className="border-l-2 border-amber-600/30 pl-6 py-2 hover:border-amber-500/60 transition-colors duration-300">
                      <h3 className="text-xl sm:text-2xl font-semibold text-amber-400 mb-2" style={{ fontFamily: "'Crimson Text', serif" }}>
                        • Use a Shoe Tree
                      </h3>
                      <p className="text-amber-100/70 text-base sm:text-lg leading-relaxed" style={{ fontFamily: "'Crimson Text', serif" }}>
                        Helps absorb moisture and odor after wear. Reduces creasing and helps retain shape. Wooden shoe trees, especially cedarwood, are highly recommended.
                      </p>
                    </div>
                  </div>
                </section>

                {/* Section 2 */}
                <section className="group animate-[fadeInUp_0.8s_ease-out_1.1s_both]">
                  <div className="relative mb-6">
                    <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold transition-all duration-300 group-hover:translate-x-2 flex items-center gap-3"
                        style={{ 
                          fontFamily: "'Cormorant Garamond', serif",
                          background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)',
                          WebkitBackgroundClip: 'text',
                          WebkitTextFillColor: 'transparent',
                          backgroundClip: 'text'
                        }}>
                      <span className="font-mono font-bold text-3xl sm:text-4xl md:text-5xl" 
                            style={{ 
                              background: 'linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%)',
                              WebkitBackgroundClip: 'text',
                              WebkitTextFillColor: 'transparent',
                              backgroundClip: 'text'
                            }}>
                        2.
                      </span>
                      Cleaning & Conditioning
                    </h2>
                    <div className="absolute -left-4 top-0 bottom-0 w-1 bg-gradient-to-b from-amber-500 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  </div>
                  <div className="space-y-6 pl-2">
                    <div className="border-l-2 border-amber-600/30 pl-6 py-2 hover:border-amber-500/60 transition-colors duration-300">
                      <h3 className="text-xl sm:text-2xl font-semibold text-amber-400 mb-2" style={{ fontFamily: "'Crimson Text', serif" }}>
                        • For Smooth Leather:
                      </h3>
                      <p className="text-amber-100/70 text-base sm:text-lg leading-relaxed" style={{ fontFamily: "'Crimson Text', serif" }}>
                        Remove surface dirt using a soft brush or cloth. Apply a matching or neutral shoe cream using a cloth. Let it rest and then buff with a horsehair brush or soft cloth for shine.
                      </p>
                    </div>
                    <div className="border-l-2 border-amber-600/30 pl-6 py-2 hover:border-amber-500/60 transition-colors duration-300">
                      <h3 className="text-xl sm:text-2xl font-semibold text-amber-400 mb-2" style={{ fontFamily: "'Crimson Text', serif" }}>
                        • For Suede/Nubuck:
                      </h3>
                      <p className="text-amber-100/70 text-base sm:text-lg leading-relaxed" style={{ fontFamily: "'Crimson Text', serif" }}>
                        Use a suede brush to lift the nap and remove dirt. Avoid water; use a suede protector spray to guard against stains. For minor marks, a suede eraser works well.
                      </p>
                    </div>
                  </div>
                </section>

                {/* Section 3 */}
                <section className="group animate-[fadeInUp_0.8s_ease-out_1.2s_both]">
                  <div className="relative mb-6">
                    <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold transition-all duration-300 group-hover:translate-x-2 flex items-center gap-3"
                        style={{ 
                          fontFamily: "'Cormorant Garamond', serif",
                          background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)',
                          WebkitBackgroundClip: 'text',
                          WebkitTextFillColor: 'transparent',
                          backgroundClip: 'text'
                        }}>
                      <span className="font-mono font-bold text-3xl sm:text-4xl md:text-5xl" 
                            style={{ 
                              background: 'linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%)',
                              WebkitBackgroundClip: 'text',
                              WebkitTextFillColor: 'transparent',
                              backgroundClip: 'text'
                            }}>
                        3.
                      </span>
                      Storing Shoes
                    </h2>
                    <div className="absolute -left-4 top-0 bottom-0 w-1 bg-gradient-to-b from-amber-500 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  </div>
                  <ul className="space-y-4 pl-2">
                    <li className="flex items-start gap-4 border-l-2 border-amber-600/30 pl-6 py-2 hover:border-amber-500/60 transition-colors duration-300">
                      <span className="text-amber-400 text-xl mt-1">•</span>
                      <span className="text-amber-100/70 text-base sm:text-lg leading-relaxed" style={{ fontFamily: "'Crimson Text', serif" }}>
                        Store shoes in a dry, well-ventilated space.
                      </span>
                    </li>
                    <li className="flex items-start gap-4 border-l-2 border-amber-600/30 pl-6 py-2 hover:border-amber-500/60 transition-colors duration-300">
                      <span className="text-amber-400 text-xl mt-1">•</span>
                      <span className="text-amber-100/70 text-base sm:text-lg leading-relaxed" style={{ fontFamily: "'Crimson Text', serif" }}>
                        Use dust bags or boxes to protect from dust.
                      </span>
                    </li>
                    <li className="flex items-start gap-4 border-l-2 border-amber-600/30 pl-6 py-2 hover:border-amber-500/60 transition-colors duration-300">
                      <span className="text-amber-400 text-xl mt-1">•</span>
                      <span className="text-amber-100/70 text-base sm:text-lg leading-relaxed" style={{ fontFamily: "'Crimson Text', serif" }}>
                        Avoid plastic, which traps moisture and may damage leather.
                      </span>
                    </li>
                  </ul>
                </section>

                {/* Section 4 */}
                <section className="group animate-[fadeInUp_0.8s_ease-out_1.3s_both]">
                  <div className="relative mb-6">
                    <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold transition-all duration-300 group-hover:translate-x-2 flex items-center gap-3"
                        style={{ 
                          fontFamily: "'Cormorant Garamond', serif",
                          background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)',
                          WebkitBackgroundClip: 'text',
                          WebkitTextFillColor: 'transparent',
                          backgroundClip: 'text'
                        }}>
                      <span className="font-mono font-bold text-3xl sm:text-4xl md:text-5xl" 
                            style={{ 
                              background: 'linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%)',
                              WebkitBackgroundClip: 'text',
                              WebkitTextFillColor: 'transparent',
                              backgroundClip: 'text'
                            }}>
                        4.
                      </span>
                      Weather & Moisture Care
                    </h2>
                    <div className="absolute -left-4 top-0 bottom-0 w-1 bg-gradient-to-b from-amber-500 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  </div>
                  <div className="space-y-6 pl-2">
                    <div className="border-l-2 border-amber-600/30 pl-6 py-2 hover:border-amber-500/60 transition-colors duration-300">
                      <h3 className="text-xl sm:text-2xl font-semibold text-amber-400 mb-2" style={{ fontFamily: "'Crimson Text', serif" }}>
                        • If Shoes Get Wet:
                      </h3>
                      <p className="text-amber-100/70 text-base sm:text-lg leading-relaxed" style={{ fontFamily: "'Crimson Text', serif" }}>
                        Gently pat dry with a cloth, do not rub. Insert a shoe tree and stuff with newspaper to absorb moisture. Let air-dry naturally. Do not expose to direct heat (like heaters or blow dryers).
                      </p>
                    </div>
                    <div className="border-l-2 border-amber-600/30 pl-6 py-2 hover:border-amber-500/60 transition-colors duration-300">
                      <h3 className="text-xl sm:text-2xl font-semibold text-amber-400 mb-2" style={{ fontFamily: "'Crimson Text', serif" }}>
                        • Avoid:
                      </h3>
                      <p className="text-amber-100/70 text-base sm:text-lg leading-relaxed" style={{ fontFamily: "'Crimson Text', serif" }}>
                        Wearing the same pair every day—alternate between pairs to allow time for airing out. Leather soles in rainy or wet conditions.
                      </p>
                    </div>
                  </div>
                </section>

                {/* Section 5 */}
                <section className="group animate-[fadeInUp_0.8s_ease-out_1.4s_both] lg:col-span-2">
                  <div className="relative mb-6 max-w-3xl mx-auto">
                    <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold transition-all duration-300 group-hover:translate-x-2 flex items-center gap-3"
                        style={{ 
                          fontFamily: "'Cormorant Garamond', serif",
                          background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)',
                          WebkitBackgroundClip: 'text',
                          WebkitTextFillColor: 'transparent',
                          backgroundClip: 'text'
                        }}>
                      <span className="font-mono font-bold text-3xl sm:text-4xl md:text-5xl" 
                            style={{ 
                              background: 'linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%)',
                              WebkitBackgroundClip: 'text',
                              WebkitTextFillColor: 'transparent',
                              backgroundClip: 'text'
                            }}>
                        5.
                      </span>
                      Polishing Tips
                    </h2>
                    <div className="absolute -left-4 top-0 bottom-0 w-1 bg-gradient-to-b from-amber-500 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  </div>
                  <ul className="space-y-4 pl-2 max-w-3xl mx-auto">
                    <li className="flex items-start gap-4 border-l-2 border-amber-600/30 pl-6 py-2 hover:border-amber-500/60 transition-colors duration-300">
                      <span className="text-amber-400 text-xl mt-1">•</span>
                      <span className="text-amber-100/70 text-base sm:text-lg leading-relaxed" style={{ fontFamily: "'Crimson Text', serif" }}>
                        Use a cream-based polish to nourish the leather and retain its natural look.
                      </span>
                    </li>
                    <li className="flex items-start gap-4 border-l-2 border-amber-600/30 pl-6 py-2 hover:border-amber-500/60 transition-colors duration-300">
                      <span className="text-amber-400 text-xl mt-1">•</span>
                      <span className="text-amber-100/70 text-base sm:text-lg leading-relaxed" style={{ fontFamily: "'Crimson Text', serif" }}>
                        For deeper shine, apply a wax-based polish sparingly.
                      </span>
                    </li>
                    <li className="flex items-start gap-4 border-l-2 border-amber-600/30 pl-6 py-2 hover:border-amber-500/60 transition-colors duration-300">
                      <span className="text-amber-400 text-xl mt-1">•</span>
                      <span className="text-amber-100/70 text-base sm:text-lg leading-relaxed" style={{ fontFamily: "'Crimson Text', serif" }}>
                        Always test new products on a small area before full application.
                      </span>
                    </li>
                  </ul>
                </section>
              </div>

              {/* Decorative divider */}
              <div className="flex items-center justify-center gap-4 my-16 sm:my-20 md:my-24 animate-[fadeIn_1s_ease-out_1.6s_both]">
                <div className="h-px w-24 sm:w-32 bg-gradient-to-r from-transparent via-amber-500/50 to-transparent"></div>
                <div className="flex gap-2">
                  <div className="w-1.5 h-1.5 rotate-45 bg-amber-500"></div>
                  <div className="w-2 h-2 rotate-45 bg-amber-400"></div>
                  <div className="w-1.5 h-1.5 rotate-45 bg-amber-500"></div>
                </div>
                <div className="h-px w-24 sm:w-32 bg-gradient-to-l from-transparent via-amber-500/50 to-transparent"></div>
              </div>

              {/* Final Word */}
              <section className="text-center max-w-4xl mx-auto animate-[fadeInUp_0.8s_ease-out_1.8s_both]">
                <h2 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-6 sm:mb-8"
                    style={{ 
                      fontFamily: "'Cormorant Garamond', serif",
                      background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      backgroundClip: 'text'
                    }}>
                  Final Word
                </h2>
                <p className="text-amber-100/80 text-lg sm:text-xl md:text-2xl leading-relaxed" style={{ fontFamily: "'Crimson Text', Georgia, serif" }}>
                  A little care goes a long way in extending the life and appearance of your shoes. Regular cleaning, protection, and proper storage are the best ways to ensure your shoes remain stylish and durable over time.
                </p>
              </section>

              {/* Decorative star */}
              <div className="absolute bottom-8 right-8 opacity-20 hidden lg:block pointer-events-none">
                <svg width="80" height="80" viewBox="0 0 80 80" fill="none" className="animate-[spin_20s_linear_infinite]">
                  <path d="M40 0L42.944 37.056L80 40L42.944 42.944L40 80L37.056 42.944L0 40L37.056 37.056L40 0Z" fill="url(#star-gradient)"/>
                  <defs>
                    <linearGradient id="star-gradient" x1="0" y1="0" x2="80" y2="80">
                      <stop offset="0%" stopColor="#fbbf24"/>
                      <stop offset="100%" stopColor="#f59e0b"/>
                    </linearGradient>
                  </defs>
                </svg>
              </div>
            </div>
          </article>
        </div>
      </div>

      {/* Custom styles and fonts */}
      <style dangerouslySetInnerHTML={{
        __html: `
          @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;600;700&family=Crimson+Text:ital,wght@0,400;0,600;1,400&display=swap');
          
          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }
          
          @keyframes fadeInUp {
            from {
              opacity: 0;
              transform: translateY(30px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
          
          * {
            -webkit-font-smoothing: antialiased;
            -moz-osx-font-smoothing: grayscale;
          }
          
          html {
            scroll-behavior: smooth;
          }
        `
      }} />
    </main>
  );
};

export default ShoeCarePage;
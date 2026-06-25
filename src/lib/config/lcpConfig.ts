// LCP Optimization Configuration

export const LCP_CONFIG = {
  // Critical resources to preload for different page types
  pageConfigs: {
    products: {
      preloadImages: true,
      preloadFonts: true,
      dnsPrefetch: [
        '//fonts.googleapis.com',
        '//ficishoes.com',
        '//api.ficishoes.com'
      ],
      criticalCSS: `
        /* Critical CSS for products page */
        .min-h-screen{min-height:100vh}
        .bg-gray-50{background-color:#f9fafb}
        .dark\\:bg-gray-900:root.dark &{background-color:#111827}
        .max-w-7xl{max-width:80rem}
        .mx-auto{margin-left:auto;margin-right:auto}
        .px-4{padding-left:1rem;padding-right:1rem}
        .sm\\:px-6{padding-left:1.5rem;padding-right:1.5rem}
        .lg\\:px-8{padding-left:2rem;padding-right:2rem}
        .py-6{padding-top:1.5rem;padding-bottom:1.5rem}
        .sm\\:py-8{padding-top:2rem;padding-bottom:2rem}
        .text-2xl{font-size:1.5rem;line-height:2rem}
        .sm\\:text-3xl{font-size:1.875rem;line-height:2.25rem}
        .font-bold{font-weight:700}
        .text-gray-900{color:#111827}
        .dark\\:text-white:root.dark &{color:#ffffff}
        .text-gray-600{color:#4b5563}
        .dark\\:text-gray-400:root.dark &{color:#9ca3af}
        .grid{display:grid}
        .grid-cols-2{grid-template-columns:repeat(2,minmax(0,1fr))}
        .sm\\:grid-cols-2{grid-template-columns:repeat(2,minmax(0,1fr))}
        .md\\:grid-cols-3{grid-template-columns:repeat(3,minmax(0,1fr))}
        .lg\\:grid-cols-4{grid-template-columns:repeat(4,minmax(0,1fr))}
        .gap-3{gap:0.75rem}
        .sm\\:gap-4{gap:1rem}
        .md\\:gap-6{gap:1.5rem}
      `,
      imageOptimization: {
        priorityImages: 4, // Number of images to preload with high priority
        lazyLoadThreshold: 2, // Start lazy loading after this many images
        fetchPriority: 'high'
      }
    },
    terms: {
      preloadImages: false,
      preloadFonts: true,
      dnsPrefetch: [
        '//fonts.googleapis.com',
        '//ficishoes.com'
      ],
      criticalCSS: `
        /* Critical CSS for terms page */
        .bg-white{background-color:#ffffff}
        .dark\\:bg-neutral-900:root.dark &{background-color:#1a1a1a}
        .max-w-5xl{max-width:64rem}
        .mx-auto{margin-left:auto;margin-right:auto}
        .px-4{padding-left:1rem;padding-right:1rem}
        .sm\\:px-6{padding-left:1.5rem;padding-right:1.5rem}
        .py-8{padding-top:2rem;padding-bottom:2rem}
        .sm\\:py-10{padding-top:2.5rem;padding-bottom:2.5rem}
        .border-b{border-bottom-width:1px}
        .bg-neutral-50{background-color:#fafafa}
        .dark\\:bg-neutral-800:root.dark &{background-color:#262626}
        .text-2xl{font-size:1.5rem;line-height:2rem}
        .sm\\:text-3xl{font-size:1.875rem;line-height:2.25rem}
        .font-bold{font-weight:700}
        .text-gray-900{color:#111827}
        .dark\\:text-white:root.dark &{color:#ffffff}
        .text-gray-600{color:#4b5563}
        .dark\\:text-gray-400:root.dark &{color:#9ca3af}
        .space-y-6 > :not([hidden]) ~ :not([hidden]){margin-top:1.5rem}
        .text-xl{font-size:1.25rem;line-height:1.75rem}
        .font-semibold{font-weight:600}
        .leading-relaxed{line-height:1.625}
        .text-gray-700{color:#374151}
        .dark\\:text-gray-300:root.dark &{color:#d1d5db}
      `,
      imageOptimization: {
        priorityImages: 0,
        lazyLoadThreshold: 0,
        fetchPriority: 'auto'
      }
    }
  },

  // Global LCP settings
  global: {
    // Font loading strategy
    fonts: {
      preload: [
        'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap'
      ],
      display: 'swap',
      timeout: 3000 // Font loading timeout in ms
    },

    // Image optimization
    images: {
      formats: ['webp', 'avif', 'jpg'], // Preferred formats in order
      quality: 80,
      placeholder: 'blur', // or 'empty'
      sizes: {
        thumbnail: { width: 150, height: 150 },
        card: { width: 300, height: 300 },
        hero: { width: 1200, height: 600 }
      }
    },

    // Network optimization
    network: {
      preconnect: [
        'https://fonts.googleapis.com',
        'https://fonts.gstatic.com',
        'https://www.ficishoes.com'
      ],
      dnsPrefetch: [
        '//fonts.googleapis.com',
        '//ficishoes.com',
        '//api.ficishoes.com',
        '//www.google-analytics.com'
      ]
    },

    // Performance thresholds
    thresholds: {
      lcp: {
        good: 2500,      // 2.5s
        needsImprovement: 4000, // 4s
        poor: 4000       // > 4s
      },
      fid: {
        good: 100,       // 100ms
        needsImprovement: 300,  // 300ms
        poor: 300        // > 300ms
      },
      cls: {
        good: 0.1,
        needsImprovement: 0.25,
        poor: 0.25
      }
    }
  }
};

// Helper function to get page-specific config
export const getLCPConfig = (pageType: keyof typeof LCP_CONFIG.pageConfigs) => {
  return LCP_CONFIG.pageConfigs[pageType] || LCP_CONFIG.pageConfigs.terms;
};

// Helper function to get global config
export const getGlobalLCPConfig = () => LCP_CONFIG.global;

export default LCP_CONFIG;

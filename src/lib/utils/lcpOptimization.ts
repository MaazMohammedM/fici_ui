// LCP (Largest Contentful Paint) optimization utilities
import React, { useEffect } from 'react';

export interface LCPOptions {
  preloadImages?: boolean;
  preloadFonts?: boolean;
  dnsPrefetch?: string[];
  criticalCSS?: string;
}

export class LCPOptimizer {
  private static instance: LCPOptimizer;
  private preloadedImages = new Set<string>();
  private preloadedFonts = new Set<string>();

  static getInstance(): LCPOptimizer {
    if (!LCPOptimizer.instance) {
      LCPOptimizer.instance = new LCPOptimizer();
    }
    return LCPOptimizer.instance;
  }

  // Preload critical images for LCP
  async preloadCriticalImages(imageUrls: string[]): Promise<void> {
    const uniqueUrls = imageUrls.filter(url => !this.preloadedImages.has(url));
    
    if (uniqueUrls.length === 0) return;

    const preloadPromises = uniqueUrls.map(url => {
      return new Promise<void>((resolve, reject) => {
        const link = document.createElement('link');
        link.rel = 'preload';
        link.as = 'image';
        link.href = url;
        
        link.onload = () => {
          this.preloadedImages.add(url);
          resolve();
        };
        
        link.onerror = () => {
          console.warn(`Failed to preload image: ${url}`);
          resolve(); // Don't reject, continue with other images
        };
        
        document.head.appendChild(link);
      });
    });

    try {
      await Promise.all(preloadPromises);
    } catch (error) {
      console.warn('Some images failed to preload:', error);
    }
  }

  // Preload critical fonts with font-display: swap
  preloadCriticalFonts(fontUrls: string[]): void {
    fontUrls.forEach(url => {
      if (this.preloadedFonts.has(url)) return;

      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'style';
      link.href = url;
      link.crossOrigin = 'anonymous';
      
      link.onload = () => {
        this.preloadedFonts.add(url);
        // Convert preload to stylesheet
        const stylesheet = document.createElement('link');
        stylesheet.rel = 'stylesheet';
        stylesheet.href = url;
        stylesheet.crossOrigin = 'anonymous';
        document.head.appendChild(stylesheet);
      };
      
      document.head.appendChild(link);
    });
  }

  // Add DNS prefetch hints for external domains
  addDNSPrefetch(domains: string[]): void {
    domains.forEach(domain => {
      const link = document.createElement('link');
      link.rel = 'dns-prefetch';
      link.href = domain;
      document.head.appendChild(link);
    });
  }

  // Add preconnect hints for critical external domains
  addPreconnect(domains: string[]): void {
    domains.forEach(domain => {
      const link = document.createElement('link');
      link.rel = 'preconnect';
      link.href = domain;
      if (domain.includes('fonts.gstatic.com')) {
        link.crossOrigin = 'anonymous';
      }
      document.head.appendChild(link);
    });
  }

  // Optimize images with fetchpriority for LCP
  optimizeImageLoading(imgElement: HTMLImageElement, isCritical = false): void {
    if (isCritical) {
      imgElement.fetchPriority = 'high';
      imgElement.loading = 'eager';
    } else {
      imgElement.fetchPriority = 'low';
      imgElement.loading = 'lazy';
    }

    // Add decoding attribute for better performance
    imgElement.decoding = 'async';
  }

  // Apply critical CSS inline
  applyCriticalCSS(css: string): void {
    const style = document.createElement('style');
    style.textContent = css;
    style.setAttribute('data-critical', 'true');
    document.head.appendChild(style);
  }

  // Initialize LCP optimizations
  initialize(options: LCPOptions = {}): void {
    const {
      preloadImages = true,
      preloadFonts = true,
      dnsPrefetch = ['//fonts.googleapis.com', '//ficishoes.com'],
      criticalCSS
    } = options;

    // Add DNS prefetch hints
    this.addDNSPrefetch(dnsPrefetch);

    // Add preconnect hints
    this.addPreconnect([
      'https://fonts.googleapis.com',
      'https://fonts.gstatic.com',
      'https://ficishoes.com'
    ]);

    // Apply critical CSS if provided
    if (criticalCSS) {
      this.applyCriticalCSS(criticalCSS);
    }

    // Preload fonts
    if (preloadFonts) {
      this.preloadCriticalFonts([
        'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap'
      ]);
    }
  }

  // Measure and report LCP
  measureLCP(): Promise<number> {
    return new Promise((resolve) => {
      if (!('PerformanceObserver' in window)) {
        resolve(0);
        return;
      }

      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        resolve(lastEntry.startTime);
      });

      observer.observe({ entryTypes: ['largest-contentful-paint'] });
      
      // Fallback timeout
      setTimeout(() => resolve(0), 10000);
    });
  }
}

// Hook for React components
export const useLCPOptimization = (options: LCPOptions = {}) => {
  const optimizer = LCPOptimizer.getInstance();

  useEffect(() => {
    optimizer.initialize(options);
  }, [options]);

  return {
    preloadImages: optimizer.preloadCriticalImages.bind(optimizer),
    preloadFonts: optimizer.preloadCriticalFonts.bind(optimizer),
    optimizeImage: optimizer.optimizeImageLoading.bind(optimizer),
    measureLCP: optimizer.measureLCP.bind(optimizer)
  };
};

export default LCPOptimizer;

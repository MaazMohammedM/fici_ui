import { useEffect, useCallback } from 'react';

interface PerformanceMetrics {
  pageLoadTime: number;
  firstContentfulPaint: number;
  largestContentfulPaint: number;
  cumulativeLayoutShift: number;
  firstInputDelay: number;
}

interface UsePerformanceMonitoringOptions {
  enableLogging?: boolean;
  reportToAnalytics?: boolean;
  thresholds?: {
    pageLoadTime?: number;
    firstContentfulPaint?: number;
    largestContentfulPaint?: number;
    cumulativeLayoutShift?: number;
    firstInputDelay?: number;
  };
}

export const usePerformanceMonitoring = (options: UsePerformanceMonitoringOptions = {}) => {
  const {
    enableLogging = process.env.NODE_ENV === 'development',
    reportToAnalytics = process.env.NODE_ENV === 'production',
    thresholds = {
      pageLoadTime: 3000,
      firstContentfulPaint: 1800,
      largestContentfulPaint: 2500,
      cumulativeLayoutShift: 0.1,
      firstInputDelay: 100
    }
  } = options;

  const logMetric = useCallback((name: string, value: number, threshold?: number) => {
    if (enableLogging) {
      const status = threshold && value > threshold ? '⚠️ SLOW' : '✅ GOOD';
      console.log(`[Performance] ${name}: ${value.toFixed(2)}ms ${status}`);
    }
  }, [enableLogging]);

  const reportMetric = useCallback((_name: string, _value: number) => {
    if (reportToAnalytics) {
        console.log(`[Performance] ${_name}: ${_value.toFixed(2)}ms`);
      // In production, integrate with analytics services like Google Analytics 4
      // gtag('event', 'page_timing', {
      //   name: name,
      //   value: Math.round(value)
      // });
      
      // Or send to custom analytics endpoint
      // fetch('/api/analytics/performance', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ metric: name, value, timestamp: Date.now() })
      // });
    }
  }, [reportToAnalytics]);

  const measureWebVitals = useCallback(() => {
    // Measure Core Web Vitals
    if ('performance' in window && 'PerformanceObserver' in window) {
      // Largest Contentful Paint (LCP)
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1] as any;
        const lcp = lastEntry.startTime;
        
        logMetric('Largest Contentful Paint', lcp, thresholds.largestContentfulPaint);
        reportMetric('lcp', lcp);
      });
      
      try {
        lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
      } catch (e) {
        // LCP not supported
      }

      // First Input Delay (FID)
      const fidObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry: any) => {
          const fid = entry.processingStart - entry.startTime;
          logMetric('First Input Delay', fid, thresholds.firstInputDelay);
          reportMetric('fid', fid);
        });
      });
      
      try {
        fidObserver.observe({ entryTypes: ['first-input'] });
      } catch (e) {
        // FID not supported
      }

      // Cumulative Layout Shift (CLS)
      let clsValue = 0;
      const clsObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry: any) => {
          if (!entry.hadRecentInput) {
            clsValue += entry.value;
          }
        });
        
        logMetric('Cumulative Layout Shift', clsValue, thresholds.cumulativeLayoutShift);
        reportMetric('cls', clsValue);
      });
      
      try {
        clsObserver.observe({ entryTypes: ['layout-shift'] });
      } catch (e) {
        // CLS not supported
      }
    }
  }, [logMetric, reportMetric, thresholds]);

  const measurePageLoad = useCallback(() => {
    if ('performance' in window) {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      
      if (navigation) {
        const pageLoadTime = navigation.loadEventEnd - navigation.fetchStart;
        logMetric('Page Load Time', pageLoadTime, thresholds.pageLoadTime);
        reportMetric('page_load_time', pageLoadTime);
      }

      // First Contentful Paint
      const paintEntries = performance.getEntriesByType('paint');
      const fcpEntry = paintEntries.find(entry => entry.name === 'first-contentful-paint');
      
      if (fcpEntry) {
        logMetric('First Contentful Paint', fcpEntry.startTime, thresholds.firstContentfulPaint);
        reportMetric('fcp', fcpEntry.startTime);
      }
    }
  }, [logMetric, reportMetric, thresholds]);

  const measureResourceTiming = useCallback(() => {
    if ('performance' in window) {
      const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
      
      // Group resources by type
      const resourcesByType = resources.reduce((acc, resource) => {
        const type = resource.initiatorType || 'other';
        if (!acc[type]) acc[type] = [];
        acc[type].push(resource);
        return acc;
      }, {} as Record<string, PerformanceResourceTiming[]>);

      // Log slow resources
      Object.entries(resourcesByType).forEach(([type, typeResources]) => {
        const slowResources = typeResources.filter(resource => 
          resource.duration > (type === 'img' ? 1000 : 500)
        );
        
        if (slowResources.length > 0 && enableLogging) {
          console.log(`[Performance] Slow ${type} resources:`, slowResources.map(r => ({
            name: r.name,
            duration: Math.round(r.duration)
          })));
        }
      });
    }
  }, [enableLogging]);

  const getPerformanceMetrics = useCallback((): Partial<PerformanceMetrics> => {
    if (!('performance' in window)) return {};

    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    const paintEntries = performance.getEntriesByType('paint');
    
    const metrics: Partial<PerformanceMetrics> = {};
    
    if (navigation) {
      metrics.pageLoadTime = navigation.loadEventEnd - navigation.fetchStart;
    }
    
    const fcpEntry = paintEntries.find(entry => entry.name === 'first-contentful-paint');
    if (fcpEntry) {
      metrics.firstContentfulPaint = fcpEntry.startTime;
    }
    
    return metrics;
  }, []);

  useEffect(() => {
    // Wait for page to load before measuring
    if (document.readyState === 'complete') {
      measurePageLoad();
      measureWebVitals();
      measureResourceTiming();
    } else {
      window.addEventListener('load', () => {
        setTimeout(() => {
          measurePageLoad();
          measureWebVitals();
          measureResourceTiming();
        }, 0);
      });
    }
  }, [measurePageLoad, measureWebVitals, measureResourceTiming]);

  return {
    getPerformanceMetrics,
    measurePageLoad,
    measureWebVitals,
    measureResourceTiming
  };
};

// Hook for measuring component render performance
export const useComponentPerformance = (componentName: string) => {
  useEffect(() => {
    const startTime = performance.now();
    
    return () => {
      const endTime = performance.now();
      const renderTime = endTime - startTime;
      
      if (process.env.NODE_ENV === 'development' && renderTime > 16) {
        console.warn(`[Performance] ${componentName} render took ${renderTime.toFixed(2)}ms (>16ms)`);
      }
    };
  });
};

// Hook for measuring API call performance
export const useApiPerformance = () => {
  const measureApiCall = useCallback(async <T>(
    apiCall: () => Promise<T>,
    endpoint: string
  ): Promise<T> => {
    const startTime = performance.now();
    
    try {
      const result = await apiCall();
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      if (process.env.NODE_ENV === 'development') {
        console.log(`[API Performance] ${endpoint}: ${duration.toFixed(2)}ms`);
      }
      
      // Report to analytics in production
      if (process.env.NODE_ENV === 'production') {
        // gtag('event', 'api_timing', {
        //   endpoint: endpoint,
        //   value: Math.round(duration)
        // });
      }
      
      return result;
    } catch (error) {
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      console.error(`[API Performance] ${endpoint} failed after ${duration.toFixed(2)}ms:`, error);
      throw error;
    }
  }, []);

  return { measureApiCall };
};

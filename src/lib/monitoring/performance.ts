// Performance monitoring utilities for production

export interface PerformanceMetrics {
  name: string;
  duration: number;
  timestamp: number;
  type: 'navigation' | 'resource' | 'measure' | 'custom';
}

class PerformanceMonitor {
  private metrics: PerformanceMetrics[] = [];
  private observers: PerformanceObserver[] = [];

  constructor() {
    this.initializeObservers();
  }

  private initializeObservers() {
    // Navigation timing
    if ('PerformanceObserver' in window) {
      const navObserver = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry) => {
          this.recordMetric({
            name: entry.name,
            duration: entry.duration,
            timestamp: entry.startTime,
            type: 'navigation'
          });
        });
      });
      navObserver.observe({ entryTypes: ['navigation'] });
      this.observers.push(navObserver);

      // Resource timing
      const resourceObserver = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry) => {
          this.recordMetric({
            name: entry.name,
            duration: entry.duration,
            timestamp: entry.startTime,
            type: 'resource'
          });
        });
      });
      resourceObserver.observe({ entryTypes: ['resource'] });
      this.observers.push(resourceObserver);

      // Measure timing
      const measureObserver = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry) => {
          this.recordMetric({
            name: entry.name,
            duration: entry.duration,
            timestamp: entry.startTime,
            type: 'measure'
          });
        });
      });
      measureObserver.observe({ entryTypes: ['measure'] });
      this.observers.push(measureObserver);
    }
  }

  recordMetric(metric: PerformanceMetrics) {
    this.metrics.push(metric);
    
    // Send to analytics service in production
    if (process.env.NODE_ENV === 'production') {
      this.sendToAnalytics(metric);
    }
  }

  private sendToAnalytics(metric: PerformanceMetrics) {
    // Example: Send to Google Analytics, Mixpanel, or custom analytics
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'performance_metric', {
        metric_name: metric.name,
        metric_duration: metric.duration,
        metric_type: metric.type
      });
    }
  }

  measureFunction<T>(name: string, fn: () => T): T {
    const start = performance.now();
    const result = fn();
    const end = performance.now();
    
    this.recordMetric({
      name,
      duration: end - start,
      timestamp: start,
      type: 'custom'
    });
    
    return result;
  }

  async measureAsyncFunction<T>(name: string, fn: () => Promise<T>): Promise<T> {
    const start = performance.now();
    const result = await fn();
    const end = performance.now();
    
    this.recordMetric({
      name,
      duration: end - start,
      timestamp: start,
      type: 'custom'
    });
    
    return result;
  }

  getMetrics(): PerformanceMetrics[] {
    return [...this.metrics];
  }

  getMetricsByType(type: PerformanceMetrics['type']): PerformanceMetrics[] {
    return this.metrics.filter(m => m.type === type);
  }

  clearMetrics() {
    this.metrics = [];
  }

  disconnect() {
    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];
  }

  // Core Web Vitals
  getCoreWebVitals() {
    return {
      LCP: this.getLargestContentfulPaint(),
      FID: this.getFirstInputDelay(),
      CLS: this.getCumulativeLayoutShift()
    };
  }

  private getLargestContentfulPaint(): number | null {
    const lcpEntries = performance.getEntriesByType('largest-contentful-paint');
    return lcpEntries.length > 0 ? lcpEntries[lcpEntries.length - 1].startTime : null;
  }

  private getFirstInputDelay(): number | null {
    const fidEntries = performance.getEntriesByType('first-input') as PerformanceEntry[];
    if (fidEntries.length === 0) return null;
    
    const entry = fidEntries[0];
    const timingEntry = entry as PerformanceEventTiming;
    
    // Use processingStart if available, otherwise fall back to startTime
    const processingStart = 'processingStart' in timingEntry 
      ? (timingEntry as any).processingStart 
      : entry.startTime;
      
    return processingStart - entry.startTime;
  }

  private getCumulativeLayoutShift(): number | null {
    const clsEntries = performance.getEntriesByType('layout-shift');
    return clsEntries.reduce((sum, entry) => sum + (entry as any).value, 0);
  }
}

export const performanceMonitor = new PerformanceMonitor();

// React hook for performance monitoring
export const usePerformanceMonitor = () => {
  const measureRender = (componentName: string, fn: () => void) => {
    performanceMonitor.measureFunction(`${componentName}_render`, fn);
  };

  const measureAsyncOperation = async <T>(operationName: string, fn: () => Promise<T>): Promise<T> => {
    return performanceMonitor.measureAsyncFunction(operationName, fn);
  };

  return {
    measureRender,
    measureAsyncOperation,
    getMetrics: performanceMonitor.getMetrics.bind(performanceMonitor),
    getCoreWebVitals: performanceMonitor.getCoreWebVitals.bind(performanceMonitor)
  };
};

// Error tracking and monitoring for production

export interface ErrorReport {
  message: string;
  stack?: string;
  url: string;
  lineNumber?: number;
  columnNumber?: number;
  timestamp: number;
  userAgent: string;
  userId?: string;
  sessionId: string;
  additionalData?: Record<string, any>;
}

class ErrorTracker {
  private sessionId: string;
  private userId?: string;
  private errorQueue: ErrorReport[] = [];
  private isOnline = navigator.onLine;

  constructor() {
    this.sessionId = this.generateSessionId();
    this.initializeErrorHandlers();
    this.initializeNetworkHandlers();
  }

  private generateSessionId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private initializeErrorHandlers() {
    // Global error handler
    window.addEventListener('error', (event) => {
      this.captureError({
        message: event.message,
        stack: event.error?.stack,
        url: event.filename || window.location.href,
        lineNumber: event.lineno,
        columnNumber: event.colno,
        timestamp: Date.now(),
        userAgent: navigator.userAgent,
        userId: this.userId,
        sessionId: this.sessionId
      });
    });

    // Unhandled promise rejection handler
    window.addEventListener('unhandledrejection', (event) => {
      this.captureError({
        message: `Unhandled Promise Rejection: ${event.reason}`,
        stack: event.reason?.stack,
        url: window.location.href,
        timestamp: Date.now(),
        userAgent: navigator.userAgent,
        userId: this.userId,
        sessionId: this.sessionId,
        additionalData: { type: 'unhandledrejection' }
      });
    });
  }

  private initializeNetworkHandlers() {
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.flushErrorQueue();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
    });
  }

  setUserId(userId: string) {
    this.userId = userId;
  }

  captureError(error: ErrorReport) {
    console.error('Error captured:', error);

    if (this.isOnline) {
      this.sendError(error);
    } else {
      this.errorQueue.push(error);
    }
  }

  captureException(error: Error, additionalData?: Record<string, any>) {
    this.captureError({
      message: error.message,
      stack: error.stack,
      url: window.location.href,
      timestamp: Date.now(),
      userAgent: navigator.userAgent,
      userId: this.userId,
      sessionId: this.sessionId,
      additionalData
    });
  }

  captureMessage(message: string, level: 'info' | 'warning' | 'error' = 'info', additionalData?: Record<string, any>) {
    this.captureError({
      message,
      url: window.location.href,
      timestamp: Date.now(),
      userAgent: navigator.userAgent,
      userId: this.userId,
      sessionId: this.sessionId,
      additionalData: { level, ...additionalData }
    });
  }

  private async sendError(error: ErrorReport) {
    try {
      // In production, send to your error tracking service
      if (process.env.NODE_ENV === 'production') {
        await fetch('/api/errors', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(error)
        });
      }
    } catch (sendError) {
      console.error('Failed to send error report:', sendError);
      this.errorQueue.push(error);
    }
  }

  private async flushErrorQueue() {
    while (this.errorQueue.length > 0 && this.isOnline) {
      const error = this.errorQueue.shift();
      if (error) {
        await this.sendError(error);
      }
    }
  }

  // React Error Boundary integration
  captureReactError(error: Error, errorInfo: { componentStack: string }) {
    this.captureError({
      message: error.message,
      stack: error.stack,
      url: window.location.href,
      timestamp: Date.now(),
      userAgent: navigator.userAgent,
      userId: this.userId,
      sessionId: this.sessionId,
      additionalData: {
        type: 'react_error',
        componentStack: errorInfo.componentStack
      }
    });
  }
}

export const errorTracker = new ErrorTracker();

// React hook for error tracking
export const useErrorTracking = () => {
  const captureError = (error: Error, additionalData?: Record<string, any>) => {
    errorTracker.captureException(error, additionalData);
  };

  const captureMessage = (message: string, level: 'info' | 'warning' | 'error' = 'info', additionalData?: Record<string, any>) => {
    errorTracker.captureMessage(message, level, additionalData);
  };

  return {
    captureError,
    captureMessage,
    setUserId: errorTracker.setUserId.bind(errorTracker)
  };
};

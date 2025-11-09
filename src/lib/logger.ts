// Simple logger utility with different log levels
type LogLevel = 'error' | 'warn' | 'info' | 'debug';

const LOG_LEVELS: Record<LogLevel, number> = {
  error: 0,
  warn: 1,
  info: 2,
  debug: 3,
};

const currentLogLevel: LogLevel = process.env.NODE_ENV === 'production' ? 'warn' : 'debug';

const logger = {
  error: (message: string, ...args: any[]) => {
    if (LOG_LEVELS[currentLogLevel] >= LOG_LEVELS.error) {
      console.error(`[ERROR] ${message}`, ...args);
    }
  },
  warn: (message: string, ...args: any[]) => {
    if (LOG_LEVELS[currentLogLevel] >= LOG_LEVELS.warn) {
      console.warn(`[WARN] ${message}`, ...args);
    }
  },
  info: (message: string, ...args: any[]) => {
    if (LOG_LEVELS[currentLogLevel] >= LOG_LEVELS.info) {
      console.log(`[INFO] ${message}`, ...args);
    }
  },
  debug: (message: string, ...args: any[]) => {
    if (LOG_LEVELS[currentLogLevel] >= LOG_LEVELS.debug) {
      console.log(`[DEBUG] ${message}`, ...args);
    }
  },
};

export { logger };

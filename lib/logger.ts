// Production logging utility
// Respects LOG_LEVEL environment variable for production optimization
import { config } from './config';

const LOG_LEVELS = {
  error: 0,
  warn: 1,
  info: 2,
  debug: 3,
} as const;

function getLogLevel(): number {
  const cfg = config();
  return LOG_LEVELS[cfg.LOG_LEVEL as keyof typeof LOG_LEVELS] || LOG_LEVELS.info;
}

export const logger = {
  log: (...args: any[]) => {
    if (getLogLevel() >= LOG_LEVELS.info) {
      console.log(...args);
    }
  },
  error: (...args: any[]) => {
    // Always log errors
    console.error(...args);
  },
  warn: (...args: any[]) => {
    if (getLogLevel() >= LOG_LEVELS.warn) {
      console.warn(...args);
    }
  },
  info: (...args: any[]) => {
    if (getLogLevel() >= LOG_LEVELS.info) {
      console.info(...args);
    }
  },
  debug: (...args: any[]) => {
    if (getLogLevel() >= LOG_LEVELS.debug) {
      console.debug(...args);
    }
  }
};

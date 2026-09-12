import type { Logger, LoggerOptions } from "pino";
import pino from "pino";

// Log levels: trace, debug, info, warn, error, fatal
const logLevel = (process.env.LOG_LEVEL || "info") as pino.LevelWithSilent;
const isDevelopment = process.env.NODE_ENV !== "production";

// Create logger options
const loggerOptions: LoggerOptions = {
  level: logLevel,
  timestamp: pino.stdTimeFunctions.isoTime,
  base: {
    env: process.env.NODE_ENV || "development",
  },
};

// Use pino-pretty in development for readable logs
// In production, use raw JSON for better performance and log aggregation
let logger: Logger;

if (isDevelopment && process.env.PINO_PRETTY !== "false") {
  logger = pino({
    ...loggerOptions,
    transport: {
      target: "pino-pretty",
      options: {
        colorize: true,
        translateTime: "SYS:standard",
        ignore: "pid,hostname",
        singleLine: false,
      },
    },
  });
} else {
  logger = pino(loggerOptions);
}

/**
 * Create a child logger with additional context
 */
export function createChildLogger(bindings: Record<string, unknown>): Logger {
  return logger.child(bindings);
}

export { logger };
export default logger;

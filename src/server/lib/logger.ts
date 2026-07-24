export interface Logger {
  info(message: string, context?: Record<string, unknown>): void;
  warn(message: string, context?: Record<string, unknown>): void;
  error(message: string, context?: Record<string, unknown>): void;
  debug(message: string, context?: Record<string, unknown>): void;
}

function formatLog(
  level: string,
  message: string,
  context?: Record<string, unknown>
): string {
  const timestamp = new Date().toISOString();
  const contextStr = context ? ` ${JSON.stringify(context)}` : "";
  return `[${timestamp}] ${level.toUpperCase()}: ${message}${contextStr}`;
}

function createLogger(context?: string): Logger {
  const prefix = context ? `[${context}] ` : "";

  return {
    info: (message: string, ctx?: Record<string, unknown>) => {
      console.log(formatLog("info", `${prefix}${message}`, ctx));
    },
    warn: (message: string, ctx?: Record<string, unknown>) => {
      console.warn(formatLog("warn", `${prefix}${message}`, ctx));
    },
    error: (message: string, ctx?: Record<string, unknown>) => {
      console.error(formatLog("error", `${prefix}${message}`, ctx));
    },
    debug: (message: string, ctx?: Record<string, unknown>) => {
      if (process.env.NODE_ENV === "development") {
        console.debug(formatLog("debug", `${prefix}${message}`, ctx));
      }
    },
  };
}

export const logger = createLogger();

export default createLogger;

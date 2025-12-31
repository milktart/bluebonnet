/**
 * Logger Type Declarations
 * Winston logger utility
 */

export interface LogContext {
  [key: string]: any;
}

declare const logger: {
  error(message: string | LogContext, context?: LogContext): void;
  warn(message: string | LogContext, context?: LogContext): void;
  info(message: string | LogContext, context?: LogContext): void;
  debug(message: string | LogContext, context?: LogContext): void;
};

export default logger;

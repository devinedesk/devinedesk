import pino from 'pino';
import * as Sentry from '@sentry/nextjs';

const isDev = process.env.NODE_ENV !== 'production';

// Pino configuration
const pinoLogger = pino({
  level: process.env.LOG_LEVEL || (isDev ? 'debug' : 'info'),
  ...(isDev && {
    transport: {
      target: 'pino-pretty',
      options: {
        colorize: true,
      },
    },
  }),
});

export const logger = {
  info: (message, meta = {}) => {
    pinoLogger.info(meta, message);
  },

  warn: (message, meta = {}) => {
    pinoLogger.warn(meta, message);
  },

  error: (message, error = null, meta = {}) => {
    const errorDetails =
      error instanceof Error
        ? {
            name: error.name,
            message: error.message,
            stack: error.stack,
          }
        : error;

    // Log to standard output via pino
    pinoLogger.error({ ...meta, err: errorDetails }, message);

    // Send exception to Sentry
    if (error instanceof Error) {
      Sentry.captureException(error, {
        extra: meta,
      });
    } else if (error) {
      Sentry.captureMessage(`${message}: ${JSON.stringify(error)}`, {
        level: 'error',
        extra: meta,
      });
    }
  },

  debug: (message, meta = {}) => {
    pinoLogger.debug(meta, message);
  },
};

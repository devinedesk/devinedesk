import pino from 'pino';

const isDev = process.env.NODE_ENV !== 'production';

export const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport: isDev
    ? {
        target: 'pino-pretty',
        options: {
          colorize: true,
          ignore: 'pid,hostname',
          translateTime: 'SYS:standard',
        },
      }
    : undefined,
});

export const logInfo = (msg, obj) => {
  logger.info(obj || {}, msg);
};

export const logError = (msg, err) => {
  logger.error(err || {}, msg);
};

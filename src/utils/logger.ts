import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';

interface LogMetadata {
  [key: string]:
    | string
    | number
    | boolean
    | Date
    | object
    | undefined
    | unknown;
}

const logsDirectory = './logs';

const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.printf(info => {
    const { timestamp, level, message, service, ...meta } = info;
    const additionalInfo = Object.keys(meta).length
      ? JSON.stringify(meta, null, 4)
      : '';
    return `${timestamp} [${level}] [${service}]: ${message} ${additionalInfo}`;
  }),
  winston.format.colorize({ all: true })
);

const dailyRotateFileTransport = new DailyRotateFile({
  filename: `${logsDirectory}/application-%DATE%.log`,
  datePattern: 'YYYY-MM-DD',
  zippedArchive: true,
  maxSize: '20m',
  maxFiles: '14d',
});

const logger = winston.createLogger({
  level: 'info',
  format: logFormat,
  transports: [
    new winston.transports.Console({
      level: 'debug',
      format: winston.format.combine(winston.format.colorize(), logFormat),
    }),
    dailyRotateFileTransport,
  ],
});

const buildLogger = (service: string) => {
  return {
    info: (message: string, obj: LogMetadata = {}) =>
      logger.info({ message, ...obj, service }),
    error: (message: string, obj: LogMetadata = {}) =>
      logger.error({ message, ...obj, service }),
    debug: (message: string, obj: LogMetadata = {}) =>
      logger.debug({ message, ...obj, service }),
    warn: (message: string, obj: LogMetadata = {}) =>
      logger.warn({ message, ...obj, service }),
  };
};

export { buildLogger };

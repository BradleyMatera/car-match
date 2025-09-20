const fs = require('fs');
const path = require('path');
const os = require('os');
const winston = require('winston');
const { createLogger, format, transports } = winston;
const DailyRotateFile = require('winston-daily-rotate-file');

const customLevels = {
  fatal: 0,
  error: 1,
  warn: 2,
  security: 3,
  info: 4,
  http: 5,
  debug: 6,
};

const defaultLogDir = path.join(__dirname, 'logs');
const logDir = process.env.LOG_DIR ? path.resolve(process.cwd(), process.env.LOG_DIR) : defaultLogDir;

fs.mkdirSync(logDir, { recursive: true });

winston.addColors({
  fatal: 'bold red',
  error: 'red',
  warn: 'yellow',
  security: 'magenta',
  info: 'green',
  http: 'blue',
  debug: 'grey',
});

const retentionDays = parseInt(process.env.LOG_RETENTION_DAYS, 10);
const maxFiles = Number.isFinite(retentionDays) && retentionDays > 0 ? `${retentionDays}d` : '14d';

const baseFormat = format.combine(
  format.timestamp({ format: 'YYYY-MM-DDTHH:mm:ss.SSSZ' }),
  format.errors({ stack: true }),
  format.splat()
);

const jsonFormat = format.combine(baseFormat, format.json());

const consoleFormat = format.combine(
  format.colorize({ all: true }),
  format.padLevels(),
  format.timestamp({ format: 'HH:mm:ss' }),
  format.printf(({ timestamp, level, message, ...meta }) => {
    const metaEntries = Object.entries(meta).filter(([key]) => typeof key !== 'symbol');
    const metaString = metaEntries.length ? ` ${JSON.stringify(Object.fromEntries(metaEntries))}` : '';
    return `${timestamp} [${level}] ${message}${metaString}`;
  })
);

const levelFromEnv = process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'info' : 'debug');

const logger = createLogger({
  level: levelFromEnv,
  levels: customLevels,
  format: jsonFormat,
  transports: [
    new DailyRotateFile({
      dirname: logDir,
      filename: 'app-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      zippedArchive: true,
      maxFiles,
    }),
    new DailyRotateFile({
      dirname: logDir,
      filename: 'security-%DATE%.log',
      level: 'security',
      datePattern: 'YYYY-MM-DD',
      zippedArchive: true,
      maxFiles,
    }),
  ],
  exitOnError: false,
});

if (process.env.NODE_ENV !== 'production' || process.env.LOG_TO_CONSOLE === 'true') {
  logger.add(
    new transports.Console({
      level: levelFromEnv,
      format: consoleFormat,
    })
  );
}

/**
 * Emit a structured security event to the dedicated transport.
 * @param {string} message
 * @param {Record<string, any>} meta
 */
function securityEvent(message, meta = {}) {
  logger.log('security', message, {
    hostname: os.hostname(),
    category: 'security',
    ...meta,
  });
}

module.exports = {
  logger,
  securityEvent,
};

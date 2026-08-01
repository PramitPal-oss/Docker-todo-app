import winston from 'winston';
import path from 'path';
import pool from './db';

/**
 * Custom Winston transport that writes log entries into the
 * `error_logs` table in PostgreSQL. Only log levels of "warn"
 * and above are persisted to the DB by default (see logger below),
 * to avoid flooding the table with debug/info noise.
 */
const Transport = require('winston-transport');

class PostgresErrorLogTransport extends Transport {
  constructor(opts?: any) {
    super(opts);
  }

  log(info: any, callback: () => void) {
    setImmediate(() => {
      this.emit('logged', info);
    });

    const { level, message, stack, ...rest } = info;

    // Fire-and-forget insert; failures here are logged to console
    // only (never re-thrown) to avoid crashing the app or causing
    // infinite logging loops.
    pool
      .query(
        `INSERT INTO error_logs (level, message, meta, stack) VALUES ($1, $2, $3, $4)`,
        [level, message, Object.keys(rest).length ? JSON.stringify(rest) : null, stack || null]
      )
      .catch((err) => {
        console.error('Failed to write log to PostgreSQL:', err.message);
      });

    callback();
  }
}

const logFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json()
);

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: logFormat,
  defaultMeta: { service: 'todo-backend' },
  transports: [
    // Console output (human-readable, colorized)
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.printf(({ timestamp, level, message, stack }) => {
          return `${timestamp} [${level}]: ${stack || message}`;
        })
      ),
    }),
    // Rotating-ish file transport for all logs
    new winston.transports.File({
      filename: path.join(__dirname, '../../logs/combined.log'),
    }),
    // Separate file for errors only
    new winston.transports.File({
      filename: path.join(__dirname, '../../logs/error.log'),
      level: 'error',
    }),
    // PostgreSQL transport - only warn/error persisted to DB
    new PostgresErrorLogTransport({ level: 'warn' }) as unknown as winston.transport,
  ],
  exceptionHandlers: [
    new winston.transports.File({ filename: path.join(__dirname, '../../logs/exceptions.log') }),
  ],
  rejectionHandlers: [
    new winston.transports.File({ filename: path.join(__dirname, '../../logs/rejections.log') }),
  ],
});

export default logger;

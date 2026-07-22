import winston from 'winston';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const logDir = path.join(__dirname, '../../logs');

// Ensure log directory exists
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

const customFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    const metaString = Object.keys(meta).length ? JSON.stringify(meta) : '';
    return `[${timestamp}] [${level.toUpperCase()}]: ${message} ${metaString}`;
  })
);

// Helper to create category-specific logger
const createCategoryLogger = (filename) => {
  return winston.createLogger({
    level: 'info',
    format: customFormat,
    transports: [
      new winston.transports.File({
        filename: path.join(logDir, filename),
        maxsize: 5242880, // 5MB
        maxFiles: 5,
      }),
      new winston.transports.Console({
        format: winston.format.combine(
          winston.format.colorize(),
          winston.format.simple()
        ),
      }),
    ],
  });
};

export const serverLogger = createCategoryLogger('server.log');
export const errorLogger = createCategoryLogger('error.log');
export const authLogger = createCategoryLogger('auth.log');
export const recordingLogger = createCategoryLogger('recording.log');
export const driveLogger = createCategoryLogger('google-drive.log');

export default {
  server: serverLogger,
  error: errorLogger,
  auth: authLogger,
  recording: recordingLogger,
  drive: driveLogger,
};

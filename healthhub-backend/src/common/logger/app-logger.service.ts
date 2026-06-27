import { Injectable, LoggerService, Scope } from '@nestjs/common';
import * as winston from 'winston';
import 'winston-daily-rotate-file';

const { combine, timestamp, printf, colorize, errors, json } = winston.format;

const prettyFormat = printf(({ level, message, timestamp, context, trace, ...meta }) => {
  let base = `${timestamp} [${level}]${context ? ` [${context}]` : ''} ${message}`;
  if (trace) base += `\n${trace}`;
  const extra = Object.keys(meta).length ? `\n${JSON.stringify(meta, null, 2)}` : '';
  return base + extra;
});

function buildWinstonLogger() {
  const isDev = process.env.NODE_ENV !== 'production';

  const transports: winston.transport[] = [
    // Console: format đẹp màu ở dev, JSON ở prod
    new winston.transports.Console({
      format: isDev
        ? combine(colorize({ all: true }), timestamp({ format: 'HH:mm:ss' }), errors({ stack: true }), prettyFormat)
        : combine(timestamp(), errors({ stack: true }), json()),
    }),

    // File: chỉ ERROR — giữ tối đa 30 ngày, mỗi file tối đa 20MB
    new (winston.transports as any).DailyRotateFile({
      filename: 'logs/error-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      level: 'error',
      maxFiles: '30d',
      maxSize: '20m',
      zippedArchive: true,
      format: combine(timestamp(), errors({ stack: true }), json()),
    }),

    // File: tất cả log (warn + log + error) — giữ 14 ngày
    new (winston.transports as any).DailyRotateFile({
      filename: 'logs/combined-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      maxFiles: '14d',
      maxSize: '50m',
      zippedArchive: true,
      format: combine(timestamp(), errors({ stack: true }), json()),
    }),
  ];

  return winston.createLogger({
    level: process.env.LOG_LEVEL ?? (isDev ? 'debug' : 'warn'),
    transports,
    exitOnError: false,
  });
}

const winstonLogger = buildWinstonLogger();

@Injectable({ scope: Scope.DEFAULT })
export class AppLogger implements LoggerService {
  private context?: string;

  setContext(context: string) {
    this.context = context;
    return this;
  }

  log(message: any, context?: string) {
    winstonLogger.info(this.format(message), { context: context ?? this.context });
  }

  error(message: any, trace?: string, context?: string) {
    winstonLogger.error(this.format(message), {
      context: context ?? this.context,
      trace,
    });
  }

  warn(message: any, context?: string) {
    winstonLogger.warn(this.format(message), { context: context ?? this.context });
  }

  debug(message: any, context?: string) {
    winstonLogger.debug(this.format(message), { context: context ?? this.context });
  }

  verbose(message: any, context?: string) {
    winstonLogger.verbose(this.format(message), { context: context ?? this.context });
  }

  private format(message: any): string {
    if (typeof message === 'string') return message;
    if (message instanceof Error) return message.message;
    return JSON.stringify(message);
  }
}

export { winstonLogger };

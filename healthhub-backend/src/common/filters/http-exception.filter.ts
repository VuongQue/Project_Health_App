import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { winstonLogger } from '../logger/app-logger.service';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse<Response>();
    const req = ctx.getRequest<Request>();

    const isHttp = exception instanceof HttpException;
    const status = isHttp ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;

    const responseBody = isHttp
      ? (exception.getResponse() as any)
      : { message: 'Internal server error' };

    const userId = (req as any).user?.userId ?? (req as any).user?.id ?? null;
    const requestId = req.headers['x-request-id'] ?? null;
    const userAgent = req.headers['user-agent'] ?? null;
    const ip = req.ip ?? req.socket?.remoteAddress ?? null;

    const safeBody = sanitizeBody(req.body);

    const logPayload: Record<string, any> = {
      requestId,
      method: req.method,
      url: req.url,
      statusCode: status,
      userId,
      ip,
      userAgent,
      body: safeBody,
      query: req.query,
    };

    if (exception instanceof Error) {
      logPayload.errorName = exception.constructor.name;
      logPayload.errorMessage = exception.message;
      logPayload.stack = exception.stack;
    } else {
      logPayload.errorRaw = JSON.stringify(exception);
    }

    // 5xx → error, 4xx (trừ 401/403 thường gặp) → warn, 401/403 → debug
    if (status >= 500) {
      winstonLogger.error(`[HTTP ${status}] ${req.method} ${req.url}`, logPayload);
    } else if (status === 401 || status === 403) {
      winstonLogger.debug(`[HTTP ${status}] ${req.method} ${req.url}`, logPayload);
    } else {
      winstonLogger.warn(`[HTTP ${status}] ${req.method} ${req.url}`, logPayload);
    }

    const message =
      typeof responseBody === 'object' && responseBody !== null
        ? responseBody
        : { message: responseBody };

    res.status(status).json({
      statusCode: status,
      ...(typeof message === 'object' ? message : { message }),
      path: req.url,
      timestamp: new Date().toISOString(),
      ...(requestId ? { requestId } : {}),
    });
  }
}

function sanitizeBody(body: Record<string, any>): Record<string, any> {
  if (!body || typeof body !== 'object') return {};
  const SENSITIVE = new Set(['password', 'confirmPassword', 'token', 'refreshToken', 'secret', 'accessToken', 'otp']);
  const result: Record<string, any> = {};
  for (const [k, v] of Object.entries(body)) {
    result[k] = SENSITIVE.has(k) ? '[REDACTED]' : v;
  }
  return result;
}

import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, tap, catchError, throwError } from 'rxjs';
import { Request, Response } from 'express';
import { winstonLogger } from '../logger/app-logger.service';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const req = context.switchToHttp().getRequest<Request>();
    const res = context.switchToHttp().getResponse<Response>();

    // Bỏ qua health check để tránh spam log
    if (req.url === '/health' || req.url.startsWith('/health/')) {
      return next.handle();
    }

    const start = Date.now();
    const userId = (req as any).user?.userId ?? (req as any).user?.id ?? null;
    const requestId = req.headers['x-request-id'] ?? null;

    winstonLogger.debug(`→ ${req.method} ${req.url}`, {
      context: 'HTTP',
      userId,
      requestId,
      ip: req.ip,
    });

    return next.handle().pipe(
      tap(() => {
        const ms = Date.now() - start;
        const status = res.statusCode;
        const level = ms > 3000 ? 'warn' : 'debug';

        winstonLogger[level](`← ${req.method} ${req.url} ${status} +${ms}ms`, {
          context: 'HTTP',
          userId,
          requestId,
          statusCode: status,
          durationMs: ms,
          ...(ms > 3000 ? { slowRequest: true } : {}),
        });
      }),
      catchError((err) => {
        const ms = Date.now() - start;
        winstonLogger.error(`← ${req.method} ${req.url} ERR +${ms}ms`, {
          context: 'HTTP',
          userId,
          requestId,
          durationMs: ms,
          errorMessage: err?.message,
        });
        return throwError(() => err);
      }),
    );
  }
}

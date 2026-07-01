import { NestFactory, Reflector } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AllExceptionsFilter } from './common/filters/http-exception.filter';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { AppLogger, winstonLogger } from './common/logger/app-logger.service';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { ThrottlerGuard } from '@nestjs/throttler';
import { randomUUID } from 'crypto';

const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS ?? 'http://localhost:3000,http://localhost:5173,http://localhost:8081')
  .split(',')
  .map((o) => o.trim());

async function bootstrap() {
  const appLogger = new AppLogger();

  const app = await NestFactory.create(AppModule, {
    logger: appLogger,
    bufferLogs: true,
    bodyParser: true,
  });

  app.use(require('express').json({ limit: '10mb' }));
  app.use(require('express').urlencoded({ limit: '10mb', extended: true }));

  // Gắn x-request-id vào mỗi request để trace log theo request
  app.use((req: any, _res: any, next: () => void) => {
    req.headers['x-request-id'] ??= randomUUID();
    next();
  });

  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.useGlobalFilters(new AllExceptionsFilter());
  app.useGlobalInterceptors(new LoggingInterceptor());

  app.enableCors({
    origin: (origin, callback) => {
      if (!origin || ALLOWED_ORIGINS.includes(origin)) {
        callback(null, true);
      } else {
        winstonLogger.warn(`CORS blocked: ${origin}`, { context: 'CORS' });
        callback(new Error(`CORS: origin ${origin} not allowed`));
      }
    },
    credentials: true,
  });

  // Swagger
  const swaggerConfig = new DocumentBuilder()
    .setTitle('HealthHub API')
    .setDescription('Backend API for Health & Wellness App')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  SwaggerModule.setup('api/docs', app, SwaggerModule.createDocument(app, swaggerConfig));

  // Kafka microservice
  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.KAFKA,
    options: {
      client: {
        clientId: 'healthhub-notification',
        brokers: (process.env.KAFKA_BROKERS ?? 'localhost:9094').split(','),
      },
      consumer: { groupId: 'notification-service-group' },
    },
  });

  await app.startAllMicroservices();

  const port = process.env.PORT || 4000;
  await app.listen(port);

  winstonLogger.info(`Application running on http://localhost:${port}`, { context: 'Bootstrap' });
  winstonLogger.info(`Swagger docs: http://localhost:${port}/api/docs`, { context: 'Bootstrap' });
  winstonLogger.info(`Environment: ${process.env.NODE_ENV ?? 'development'}`, { context: 'Bootstrap' });
  winstonLogger.info(`Log level: ${process.env.LOG_LEVEL ?? 'auto'}`, { context: 'Bootstrap' });
}

bootstrap().catch((err) => {
  winstonLogger.error('Fatal error during bootstrap', { error: err?.message, stack: err?.stack });
  process.exit(1);
});

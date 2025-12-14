import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger, ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AllExceptionsFilter } from './common/filters/http-exception.filter';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
  app.useGlobalFilters(new AllExceptionsFilter());
  app.enableCors();

  // --- Swagger Setup ---
  const config = new DocumentBuilder()
    .setTitle('HealthHub API')
    .setDescription('Backend API for Health & Wellness App')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);
  // -----------------------

  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.KAFKA,
    options: {
      client: {
        clientId: 'healthhub-notification',
        brokers: (process.env.KAFKA_BROKERS ?? 'localhost:9094').split(','),
      },
      consumer: {
        groupId: 'notification-service-group',
      },
    },
  });


  await app.startAllMicroservices();

  app.useLogger(['error', 'warn', 'log']);
  const port = process.env.PORT || 4000;
  await app.listen(port);

  const logger = new Logger('Bootstrap');
  logger.log(`🚀 Application is running on: http://localhost:${port}`);
  logger.log(`📘 Swagger Docs at http://localhost:${port}/api/docs`);
  logger.log(`🟠 Kafka consumer connected`);
}
bootstrap();

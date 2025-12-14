import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Notification } from './entities/notification.entity';
import { NotificationService } from './notification.service';
import { NotificationGateway } from './notification.gateway';
import { NotificationController } from './notification.controller';
import { NotificationConsumer } from './notification.consumer';

@Module({
  imports: [TypeOrmModule.forFeature([Notification])],
  providers: [
    NotificationService,
    NotificationGateway,
    NotificationConsumer, 
  ],
  controllers: [
    NotificationController,
    NotificationConsumer, 
  ],
  exports: [NotificationService],
})
export class NotificationModule {}

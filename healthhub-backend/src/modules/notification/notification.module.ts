import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Notification } from './entities/notification.entity';
import { NotificationService } from './notification.service';
import { NotificationGateway } from './notification.gateway';
import { NotificationController } from './notification.controller';
import { NotificationConsumer } from './notification.consumer';
import { SmartReminderService } from './smart-reminder.service';
import { User } from '../users/entities/user.entity';
import { DailySteps } from '../steps/entities/daily-steps.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Notification, User, DailySteps])],
  providers: [
    NotificationService,
    NotificationGateway,
    NotificationConsumer,
    SmartReminderService,
  ],
  controllers: [
    NotificationController,
    NotificationConsumer,
  ],
  exports: [NotificationService],
})
export class NotificationModule {}

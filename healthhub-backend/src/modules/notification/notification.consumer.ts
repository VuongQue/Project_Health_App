import { Controller, Logger } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotificationService } from './notification.service';
import { TOPIC_NOTIFICATION_EVENTS } from '../../config/kafka.config';
import { NotificationEventDto } from './dto/notification-event.dto';
import { NotificationType } from './entities/notification.entity';
import { User } from '../users/entities/user.entity';

@Controller()
export class NotificationConsumer {
  private readonly logger = new Logger(NotificationConsumer.name);

  constructor(
    private readonly notiService: NotificationService,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  @MessagePattern(TOPIC_NOTIFICATION_EVENTS)
  async handleNotificationEvent(@Payload() event: NotificationEventDto) {
    if (!event) {
      this.logger.warn('⚠️ Kafka payload is empty');
      return;
    }

    this.logger.log(
      `📨 Kafka event userId=${event.userId} type=${event.type}`,
    );

    if (!event.userId || !event.type || !event.message) {
      this.logger.error('❌ Invalid notification payload', event);
      return;
    }

    if (!Object.values(NotificationType).includes(event.type)) {
      this.logger.error(`❌ Invalid notification type: ${event.type}`);
      return;
    }

    // Fetch Expo push token for this user
    const user = await this.userRepo.findOne({
      where: { id: Number(event.userId) },
      select: { expoPushToken: true },
    });

    await this.notiService.createForUserId(
      Number(event.userId),
      event.type,
      event.message,
      {
        icon: event.icon,
        link: event.link,
        metadata: event.metadata,
        priority: event.priority,
        expoPushToken: user?.expoPushToken ?? undefined,
      },
    );

    this.logger.log(`✅ Notification processed for userId=${event.userId}`);
  }
}

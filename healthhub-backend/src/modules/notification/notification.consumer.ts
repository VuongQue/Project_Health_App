import { Controller, Logger } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { NotificationService } from './notification.service';
import { TOPIC_NOTIFICATION_EVENTS } from '../../config/kafka.config';
import { NotificationEventDto } from './dto/notification-event.dto';
import { NotificationType } from './entities/notification.entity';

@Controller()
export class NotificationConsumer {
  private readonly logger = new Logger(NotificationConsumer.name);

  constructor(private readonly notiService: NotificationService) {}

  @MessagePattern(TOPIC_NOTIFICATION_EVENTS)
  async handleNotificationEvent(@Payload() event: NotificationEventDto) {
    // 🔥 event ĐÃ LÀ OBJECT (Nest auto parse)
    if (!event) {
      this.logger.warn('⚠️ Kafka payload is empty');
      return;
    }

    this.logger.log(
      `📨 Kafka event userId=${event.userId} type=${event.type}`,
    );

    // Validate
    if (!event.userId || !event.type || !event.message) {
      this.logger.error('❌ Invalid notification payload', event);
      return;
    }

    if (!Object.values(NotificationType).includes(event.type)) {
      this.logger.error(`❌ Invalid notification type: ${event.type}`);
      return;
    }

    // ✅ Save DB + push WS
    await this.notiService.createForUserId(
      Number(event.userId),
      event.type,
      event.message,
      {
        icon: event.icon,
        link: event.link,
        metadata: event.metadata,
        priority: event.priority,
      },
    );

    this.logger.log(`✅ Notification processed for userId=${event.userId}`);
  }
}

import { NotificationType } from '../entities/notification.entity';

export class NotificationEventDto {
  userId: number;
  type: NotificationType;
  message: string;
  icon?: string;
  link?: string;
  metadata?: any;
  priority?: number;
}

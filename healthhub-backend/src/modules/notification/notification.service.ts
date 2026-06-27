import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification, NotificationType } from './entities/notification.entity';
import { NotificationGateway } from './notification.gateway';
import Expo from 'expo-server-sdk';

const expo = new Expo();

@Injectable()
export class NotificationService {
  constructor(
    @InjectRepository(Notification)
    private readonly notiRepo: Repository<Notification>,
    private readonly gateway: NotificationGateway,
  ) {}

  // =====================================================
  // CREATE (Kafka / Internal)
  // =====================================================
  async createForUserId(
    userId: number,
    type: NotificationType,
    message: string,
    options?: {
      icon?: string;
      link?: string;
      metadata?: any;
      priority?: number;
      expoPushToken?: string;
    },
  ) {
    if (!userId) {
      throw new Error('Invalid userId when creating notification');
    }

    const noti = this.notiRepo.create({
      userId,
      type,
      message,
      icon: options?.icon,
      link: options?.link,
      metadata: options?.metadata,
      priority: options?.priority ?? 1,
      isRead: false,
    });

    const saved = await this.notiRepo.save(noti);

    // 🔔 realtime push via WebSocket (if user online) — fire-and-forget, never crash the caller
    try {
      this.gateway.sendNotificationToUser(userId, saved);
    } catch {
      // user offline or socket not ready — notification is already persisted in DB
    }

    // 📲 Expo push notification (if token provided)
    if (options?.expoPushToken && Expo.isExpoPushToken(options.expoPushToken)) {
      this.sendExpoPush(options.expoPushToken, message, options?.metadata).catch(() => {});
    }

    return saved;
  }

  private async sendExpoPush(token: string, body: string, data?: any) {
    try {
      await expo.sendPushNotificationsAsync([
        {
          to: token,
          sound: 'default',
          body,
          data: data ?? {},
        },
      ]);
    } catch {
      // ignore push failures — don't break the main flow
    }
  }

  // =====================================================
  // READ
  // =====================================================
  async getMyNotifications(userId: number, page = 1, limit = 20) {
    if (!userId) return { total: 0, page, limit, items: [] };

    const skip = (page - 1) * limit;
    const [items, total] = await this.notiRepo.findAndCount({
      where: { userId },
      order: { priority: 'DESC', createdAt: 'DESC' },
      skip,
      take: limit,
    });

    return { total, page, limit, items };
  }

  async getUnreadCount(userId: number) {
    if (!userId) return 0;

    return this.notiRepo.count({
      where: {
        userId,
        isRead: false,
      },
    });
  }

  // =====================================================
  // UPDATE
  // =====================================================
  async markAsRead(notificationId: number, userId: number) {
    const noti = await this.notiRepo.findOne({
      where: { id: notificationId },
    });

    if (!noti) {
      throw new NotFoundException('Notification not found');
    }

    if (noti.userId !== userId) {
      throw new ForbiddenException('You cannot access this notification');
    }

    if (!noti.isRead) {
      noti.isRead = true;
      await this.notiRepo.save(noti);
    }

    return noti;
  }

  async markAllAsRead(userId: number) {
    if (!userId) return { success: true };

    await this.notiRepo.update(
      { userId },
      { isRead: true },
    );

    return { success: true };
  }

  // =====================================================
  // DELETE
  // =====================================================
  async clearAll(userId: number) {
    if (!userId) return { success: true };

    await this.notiRepo.delete({ userId });

    return { success: true };
  }
}

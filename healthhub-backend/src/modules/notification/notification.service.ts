// notification.service.ts
import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification, NotificationType } from './entities/notification.entity';
import { NotificationGateway } from './notification.gateway';

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
    },
  ) {
    if (!userId) {
      throw new Error('Invalid userId when creating notification');
    }

    const noti = this.notiRepo.create({
      userId,                     // 🔥 QUAN TRỌNG NHẤT
      type,
      message,
      icon: options?.icon,
      link: options?.link,
      metadata: options?.metadata,
      priority: options?.priority ?? 1,
      isRead: false,
    });

    const saved = await this.notiRepo.save(noti);

    // 🔔 realtime push (nếu user đang online)
    this.gateway.sendNotificationToUser(userId, saved);

    return saved;
  }

  // =====================================================
  // READ
  // =====================================================
  async getMyNotifications(userId: number) {
    if (!userId) return [];

    return this.notiRepo.find({
      where: { userId },
      order: {
        priority: 'DESC',
        createdAt: 'DESC',
      },
    });
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

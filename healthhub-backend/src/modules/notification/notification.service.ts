import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification, NotificationType } from './entities/notification.entity';
import { User } from '../users/entities/user.entity';
import { NotificationGateway } from './notification.gateway';

@Injectable()
export class NotificationService {
  constructor(
    @InjectRepository(Notification)
    private notiRepo: Repository<Notification>,
    private gateway: NotificationGateway,
  ) {}

  async create(
    user: User,
    type: NotificationType,
    message: string,
    options?: {
      icon?: string;
      link?: string;
      metadata?: any;
      priority?: number;
    },
  ) {
    const noti = this.notiRepo.create({
      user,
      type,
      message,
      icon: options?.icon,
      link: options?.link,
      metadata: options?.metadata,
      priority: options?.priority ?? 1,
    });

    const saved = await this.notiRepo.save(noti);

    // Realtime push
    this.gateway.sendNotificationToUser(user.id, saved);

    return saved;
  }

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
    const user = { id: userId } as User; // lightweight ref
    return this.create(user, type, message, options);
  }

  async getMyNotifications(user: User) {
    return this.notiRepo.find({
      where: { user: { id: user.id } },
      order: { createdAt: 'DESC', priority: 'DESC' },
    });
  }

  async markAsRead(id: number, user: User) {
    const noti = await this.notiRepo.findOne({
      where: { id },
      relations: ['user'],
    });
    if (!noti) throw new NotFoundException('Notification not found');
    if (noti.user.id !== user.id) {
      throw new ForbiddenException();
    }

    if (!noti.isRead) {
      noti.isRead = true;
      await this.notiRepo.save(noti);
    }
    return noti;
  }

  async markAllAsRead(user: User) {
    await this.notiRepo.update(
      { user: { id: user.id }, isRead: false },
      { isRead: true },
    );
    return { success: true };
  }

  async getUnreadCount(user: User) {
    const count = await this.notiRepo.count({
      where: { user: { id: user.id }, isRead: false },
    });
    return count ?? 0;
  }
}

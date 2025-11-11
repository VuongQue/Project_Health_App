import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification } from './entities/notification.entity';
import { User } from '../users/entities/user.entity';

@Injectable()
export class NotificationService {
  constructor(
    @InjectRepository(Notification)
    private notiRepo: Repository<Notification>,
  ) {}

  async create(user: User, type: string, message: string) {
    const noti = this.notiRepo.create({ user, type, message });
    return this.notiRepo.save(noti);
  }

  async getMyNotifications(user: User) {
    return this.notiRepo.find({
      where: { user },
      order: { createdAt: 'DESC' },
    });
  }

  async markAsRead(id: number) {
    const noti = await this.notiRepo.findOne({ where: { id } });
    if (!noti) return null;
    noti.isRead = true;
    return this.notiRepo.save(noti);
  }
}

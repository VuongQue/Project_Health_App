import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotificationService } from './notification.service';
import { NotificationType } from './entities/notification.entity';
import { User, UserStatus } from '../users/entities/user.entity';
import { DailySteps } from '../steps/entities/daily-steps.entity';

@Injectable()
export class SmartReminderService {
  private readonly logger = new Logger(SmartReminderService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(DailySteps)
    private readonly stepsRepo: Repository<DailySteps>,
    private readonly notificationService: NotificationService,
  ) {}

  private today() {
    return new Date().toISOString().slice(0, 10);
  }

  // Nhắc uống nước — mỗi 2 giờ từ 8h–20h
  @Cron('0 8,10,12,14,16,18,20 * * *')
  async remindWater() {
    const users = await this.userRepo.find({
      where: { status: UserStatus.ACTIVE },
      select: ['id', 'expoPushToken'],
    });

    for (const user of users) {
      try {
        await this.notificationService.createForUserId(
          user.id,
          NotificationType.SYSTEM,
          'Đã đến giờ uống nước! Hãy uống một ly nước ngay bây giờ.',
          {
            icon: '💧',
            link: '/water-intake',
            priority: 1,
            expoPushToken: user.expoPushToken ?? undefined,
          },
        );
      } catch {
        // skip individual failures
      }
    }
    this.logger.log(`[SmartReminder] Water reminder sent to ${users.length} users`);
  }

  // Nhắc tập luyện — 7h sáng mỗi ngày
  @Cron('0 7 * * *')
  async remindWorkout() {
    const users = await this.userRepo.find({
      where: { status: UserStatus.ACTIVE },
      select: ['id', 'fullName', 'expoPushToken'],
    });

    for (const user of users) {
      try {
        await this.notificationService.createForUserId(
          user.id,
          NotificationType.WORKOUT,
          `Chào buổi sáng! Hôm nay bạn có muốn hoàn thành bài tập không? 💪`,
          {
            icon: '🏋️',
            link: '/(tabs)/(personal)/fitness',
            priority: 2,
            expoPushToken: user.expoPushToken ?? undefined,
          },
        );
      } catch {
        // skip
      }
    }
    this.logger.log(`[SmartReminder] Workout reminder sent to ${users.length} users`);
  }

  // Nhắc ghi mood — 21h mỗi tối, nếu chưa ghi mood hôm nay
  @Cron('0 21 * * *')
  async remindMood() {
    const users = await this.userRepo.find({
      where: { status: UserStatus.ACTIVE },
      select: ['id', 'expoPushToken'],
    });

    for (const user of users) {
      try {
        await this.notificationService.createForUserId(
          user.id,
          NotificationType.MOOD,
          'Bạn cảm thấy thế nào hôm nay? Hãy ghi lại tâm trạng để theo dõi sức khoẻ tinh thần.',
          {
            icon: '😊',
            link: '/(tabs)/(personal)/mood',
            priority: 1,
            expoPushToken: user.expoPushToken ?? undefined,
          },
        );
      } catch {
        // skip
      }
    }
    this.logger.log(`[SmartReminder] Mood reminder sent to ${users.length} users`);
  }

  // Nhắc bước chân — 18h, nếu chưa đạt 5000 bước
  @Cron('0 18 * * *')
  async remindSteps() {
    const today = this.today();
    const users = await this.userRepo.find({
      where: { status: UserStatus.ACTIVE },
      select: ['id', 'expoPushToken'],
    });

    for (const user of users) {
      try {
        const stepsRecord = await this.stepsRepo.findOne({
          where: { userId: user.id, date: today },
        });
        const steps = stepsRecord?.steps ?? 0;
        const goal = stepsRecord?.goalSteps ?? 10000;

        if (steps < goal * 0.5) {
          await this.notificationService.createForUserId(
            user.id,
            NotificationType.SYSTEM,
            `Bạn mới đi được ${steps.toLocaleString()} bước. Còn ${(goal - steps).toLocaleString()} bước nữa để hoàn thành mục tiêu hôm nay!`,
            {
              icon: '👟',
              link: '/(tabs)/(personal)',
              priority: 2,
              expoPushToken: user.expoPushToken ?? undefined,
            },
          );
        }
      } catch {
        // skip
      }
    }
    this.logger.log('[SmartReminder] Steps reminder processed');
  }

  // Nhắc check-in hành trình — 20h
  @Cron('0 20 * * *')
  async remindJourneyCheckin() {
    const users = await this.userRepo.find({
      where: { status: UserStatus.ACTIVE },
      select: ['id', 'expoPushToken'],
    });

    for (const user of users) {
      try {
        await this.notificationService.createForUserId(
          user.id,
          NotificationType.SYSTEM,
          'Đừng quên check-in lộ trình sức khoẻ hôm nay! Mỗi ngày một bước nhỏ đều có ý nghĩa.',
          {
            icon: '🗓️',
            link: '/health-journey',
            priority: 1,
            expoPushToken: user.expoPushToken ?? undefined,
          },
        );
      } catch {
        // skip
      }
    }
    this.logger.log('[SmartReminder] Journey check-in reminder sent');
  }
}

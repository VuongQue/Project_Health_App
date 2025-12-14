// src/modules/achievement/achievement.listener.ts
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Achievement } from './entities/achievement.entity';
import { UserAchievement } from './entities/user-achievement.entity';
import { User } from '../users/entities/user.entity';
import { NotificationService } from '../notification/notification.service';
import { NotificationType } from '../notification/entities/notification.entity';

@Injectable()
export class AchievementListener {
  private readonly logger = new Logger(AchievementListener.name);

  constructor(
    @InjectRepository(Achievement)
    private readonly achRepo: Repository<Achievement>,

    @InjectRepository(UserAchievement)
    private readonly userAchRepo: Repository<UserAchievement>,

    private readonly notiService: NotificationService,
  ) {}

  async unlockAchievement(user: User, code: string) {
    // 1️⃣ Tìm achievement theo code
    const achievement = await this.achRepo.findOne({
      where: { code },
    });

    if (!achievement) {
      this.logger.warn(`Achievement code not found: ${code}`);
      return null;
    }

    // 2️⃣ Check user đã có achievement chưa
    const already = await this.userAchRepo.findOne({
      where: {
        user: { id: user.id },
        achievement: { id: achievement.id },
      },
    });

    if (already) return null;

    // 3️⃣ Lưu user-achievement
    const record = this.userAchRepo.create({
      user,
      achievement,
    });
    await this.userAchRepo.save(record);

    // 4️⃣ Tạo notification
    const msg = `Chúc mừng bạn đã đạt được huy hiệu "${achievement.name}" 🏅`;

    await this.notiService.createForUserId(
      user.id,                         // 🔥 CHỈ TRUYỀN userId
      NotificationType.ACHIEVEMENT,
      msg,
      {
        metadata: {
          achievementCode: achievement.code,
          achievementId: achievement.id,
        },
        priority: 2,
      },
    );

    this.logger.log(
      `🏅 User ${user.email} earned achievement: ${achievement.name}`,
    );

    return record;
  }
}

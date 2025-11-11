import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Achievement } from './entities/achievement.entity';
import { UserAchievement } from './entities/user-achievement.entity';
import { User } from '../users/entities/user.entity';
import { NotificationService } from '../notification/notification.service';
import { NotificationGateway } from '../notification/notification.gateway';

@Injectable()
export class AchievementListener {
  private readonly logger = new Logger(AchievementListener.name);

  constructor(
    @InjectRepository(Achievement)
    private achRepo: Repository<Achievement>,
    @InjectRepository(UserAchievement)
    private userAchRepo: Repository<UserAchievement>,
    private notiService: NotificationService,
    private notiGateway: NotificationGateway,
  ) {}

  async unlockAchievement(user: User, code: string) {
    const achievement = await this.achRepo.findOne({ where: { code } });
    if (!achievement) {
      this.logger.warn(`Achievement code not found: ${code}`);
      return null;
    }

    const already = await this.userAchRepo.findOne({
      where: { user: { id: user.id }, achievement: { id: achievement.id } },
      relations: ['user', 'achievement'],
    });

    if (already) return null; // đã có rồi

    const record = this.userAchRepo.create({ user, achievement });
    await this.userAchRepo.save(record);
    const msg = `Chúc mừng bạn đã đạt được huy hiệu "${achievement.name}" 🏅`;
    await this.notiService.create(user, 'ACHIEVEMENT', msg);
    this.notiGateway.sendNotificationToUser(user.id, { type: 'ACHIEVEMENT', message: msg });
    this.logger.log(`🏅 User ${user.email} earned achievement: ${achievement.name}`);
    return record;
  }
}

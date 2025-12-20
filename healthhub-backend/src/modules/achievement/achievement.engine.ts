import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Achievement } from './entities/achievement.entity';
import { UserAchievement } from './entities/user-achievement.entity';
import { NotificationService } from '../notification/notification.service';
import { NotificationType } from '../notification/entities/notification.entity';

@Injectable()
export class AchievementEngine {
  constructor(
    @InjectRepository(Achievement)
    private readonly achRepo: Repository<Achievement>,

    @InjectRepository(UserAchievement)
    private readonly userAchRepo: Repository<UserAchievement>,

    private readonly notiService: NotificationService,
  ) {}

  async evaluate(
    userId: number,
    trigger: string,
    context: Record<string, number>,
  ) {
    console.log(
      `[ACH_ENGINE] evaluate trigger=${trigger}, userId=${userId}, context=${JSON.stringify(context)}`
    );

    const achievements = await this.achRepo.find({ where: { trigger } });

    for (const ach of achievements) {
      const existed = await this.userAchRepo.findOne({
        where: {
          user: { id: userId },
          achievement: { id: ach.id },
        },
      });

      if (existed) continue;

      if (this.matchRule(ach.condition, context)) {
        await this.unlock(userId, ach);
      }
    }
  }

  private matchRule(
    condition: Achievement['condition'],
    context: Record<string, number>,
  ) {
    const actual = context[condition.field];
    if (actual === undefined) return false;

    switch (condition.operator) {
      case '==':
        return actual === condition.value;
      case '>=':
        return actual >= condition.value;
      case '<=':
        return actual <= condition.value;
      case '>':
        return actual > condition.value;
      default:
        return false;
    }
  }

  private async unlock(userId: number, achievement: Achievement) {
    const record = this.userAchRepo.create({
      user: { id: userId } as any,
      achievement,
    });

    await this.userAchRepo.save(record);

    await this.notiService.createForUserId(
      userId,
      NotificationType.ACHIEVEMENT,
      `🎉 Bạn đã đạt được thành tựu "${achievement.name}"`,
      {
        icon: 'award',
        link: '/achievements',
        metadata: {
          event: 'ACHIEVEMENT_UNLOCKED',
          achievementCode: achievement.code,
          achievementId: achievement.id,
          name: achievement.name,
          points: achievement.points,
        },
        priority: 2,
      },
    );
  }
}

import { forwardRef, Inject, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Achievement } from './entities/achievement.entity';
import { UserAchievement } from './entities/user-achievement.entity';
import { NotificationService } from '../notification/notification.service';
import { NotificationType } from '../notification/entities/notification.entity';
import { UsersService } from '../users/users.service';

@Injectable()
export class AchievementEngine {
  private readonly logger = new Logger(AchievementEngine.name);
  constructor(
    @InjectRepository(Achievement)
    private readonly achRepo: Repository<Achievement>,

    @InjectRepository(UserAchievement)
    private readonly userAchRepo: Repository<UserAchievement>,

    private readonly notiService: NotificationService,

    @Inject(forwardRef(() => UsersService))
    private readonly usersService: UsersService,
  ) {}

  async evaluate(
    userId: number,
    trigger: string,
    context: Record<string, number>,
  ) {
    const achievements = await this.achRepo.find({ where: { trigger } });
    this.logger.log(`[evaluate] userId=${userId} trigger=${trigger} found=${achievements.length} context=${JSON.stringify(context)}`);

    for (const ach of achievements) {
      const existed = await this.userAchRepo.findOne({
        where: {
          user: { id: userId },
          achievement: { id: ach.id },
        },
      });

      if (existed) { this.logger.log(`[evaluate] skip ${ach.code} — already unlocked`); continue; }

      const matched = this.matchRule(ach.condition, context);
      this.logger.log(`[evaluate] ${ach.code} matched=${matched}`);
      if (matched) {
        await this.unlock(userId, ach);
      }
    }
  }

  private matchRule(
    condition: Achievement['condition'],
    context: Record<string, number>,
  ) {
    if (!condition?.field || !condition?.operator) return false;

    const actual = context[condition.field];
    if (actual === undefined) return false;

    switch (condition.operator) {
      case '==':  return actual === condition.value;
      case '!=':  return actual !== condition.value;
      case '>=':  return actual >= condition.value;
      case '<=':  return actual <= condition.value;
      case '>':   return actual >  condition.value;
      case '<':   return actual <  condition.value;
      default:    return false;
    }
  }

  private async unlock(userId: number, achievement: Achievement) {
    this.logger.log(`[unlock] userId=${userId} achievement=${achievement.code}`);
    const record = this.userAchRepo.create({
      user: { id: userId } as any,
      achievement,
    });

    await this.userAchRepo.save(record);

    // Award points and recalculate level
    const pts = achievement.points ?? 10;
    await this.usersService.addPoints(userId, pts);

    await this.notiService.createForUserId(
      userId,
      NotificationType.ACHIEVEMENT,
      `🎉 Bạn đã đạt được thành tựu "${achievement.name}" (+${pts} điểm)`,
      {
        icon: 'award',
        link: '/achievements',
        metadata: {
          event: 'ACHIEVEMENT_UNLOCKED',
          achievementCode: achievement.code,
          achievementId: achievement.id,
          name: achievement.name,
          points: pts,
        },
        priority: 2,
      },
    );
  }
}

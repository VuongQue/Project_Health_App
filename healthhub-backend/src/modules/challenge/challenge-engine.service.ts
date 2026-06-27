import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserChallenge } from './entities/user-challenge.entity';
import { ChallengeSource } from './challenge.types';
import { NotificationService } from '../notification/notification.service';
import { NotificationType } from '../notification/entities/notification.entity';
import { AchievementEngine } from '../achievement/achievement.engine';
import { UsersService } from '../users/users.service';

function toDateKey(d = new Date()) {
  return d.toISOString().slice(0, 10); // YYYY-MM-DD
}
function yesterdayKey(d = new Date()) {
  const y = new Date(d.getTime() - 86400000);
  return toDateKey(y);
}

@Injectable()
export class ChallengeEngineService {
  constructor(
    @InjectRepository(UserChallenge)
    private ucRepo: Repository<UserChallenge>,
    private notiService: NotificationService,
    private achEngine: AchievementEngine,
    private usersService: UsersService,
  ) {}

  /**
   * Gọi hàm này khi user tạo mood / complete workout...
   */
  async handleUserAction(params: {
    userId: number;
    source: ChallengeSource;
    payload?: any; // ví dụ { score: 4 }
  }) {
    const { userId, source, payload } = params;
    const today = toDateKey();

    const list = await this.ucRepo.find({
      where: {
        user: { id: userId },
        status: 'ongoing',
      },
      relations: ['challenge'],
    });

    const candidates = list.filter((uc) => uc.challenge?.rule?.source === source);
    if (candidates.length === 0) return;

    for (const uc of candidates) {
      const rule = uc.challenge.rule;
      const maxPerDay = rule.maxPerDay ?? 1;

      // reset todayCount theo ngày
      if (uc.todayKey !== today) {
        uc.todayKey = today;
        uc.todayCount = 0;
      }

      // giới hạn số lần tính trong 1 ngày (thường = 1)
      if (uc.todayCount >= maxPerDay) continue;

      // điều kiện theo source
      if (source === 'MOOD' && rule.minValue != null) {
        const score = payload?.score;
        if (typeof score !== 'number' || score < rule.minValue) continue;
      }

      // tránh double-count kiểu “đánh dấu rồi” khi maxPerDay = 1
      if (maxPerDay === 1 && uc.lastCompletedDate === today) continue;

      // lưu oldLast trước khi ghi today để tính streak chính xác
      const prevLast = uc.lastCompletedDate;

      uc.completedCount += 1;
      uc.todayCount += 1;
      uc.lastCompletedDate = today;

      // streak nếu requireConsecutive
      if (rule.requireConsecutive) {
        const yKey = yesterdayKey();
        // nếu ngày trước đó là yesterday => streak++
        uc.currentStreak = prevLast === yKey ? uc.currentStreak + 1 : 1;
        uc.maxStreak = Math.max(uc.maxStreak, uc.currentStreak);
      }

      // complete
      if (uc.completedCount >= uc.challenge.targetCount && uc.status !== 'completed') {
        uc.status = 'completed';

        await this.notiService.createForUserId(
          userId,
          NotificationType.CHALLENGE,
          `🏆 Bạn đã hoàn thành thử thách "${uc.challenge.name}"!`,
        );

        // Evaluate EVERY time a challenge is completed (not just first)
        const completedCount = await this.ucRepo.count({
          where: { user: { id: userId }, status: 'completed' },
        });
        await this.achEngine.evaluate(userId, 'CHALLENGE_COMPLETED', {
          challengeCompletedCount: completedCount,
        });
      }

      await this.ucRepo.save(uc);
    }
  }
}

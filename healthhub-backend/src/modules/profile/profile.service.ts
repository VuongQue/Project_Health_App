import { Injectable, Logger } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { FitnessService } from '../fitness/fitness.service';
import { AchievementService } from '../achievement/achievement.service';
import { ChallengeService } from '../challenge/challenge.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { RedisService } from '../redis/redis.service';

const PROFILE_CACHE_TTL = 60; // 60 giây

@Injectable()
export class ProfileService {
  private readonly logger = new Logger(ProfileService.name);

  constructor(
    private readonly usersService: UsersService,
    private readonly fitnessService: FitnessService,
    private readonly achievementService: AchievementService,
    private readonly challengeService: ChallengeService,
    private readonly redisService: RedisService,
  ) {}

  async getMyProfile(userId: number) {
    const cacheKey = `profile:${userId}`;

    const cached = await this.redisService.get(cacheKey);
    if (cached) {
      this.logger.log(`[CACHE HIT] profile:${userId}`);
      return JSON.parse(cached);
    }

    const user = await this.usersService.getProfile(userId);

    const [totalWorkouts, currentStreak, badgesEarned] = await Promise.all([
      this.fitnessService.getTotalWorkouts(userId),
      this.fitnessService.getWorkoutStreak(userId),
      this.achievementService.countUserBadges(userId),
    ]);

    const badges = await this.achievementService.getUnlockedBadgesForProfile(userId, 6);
    const challenges = await this.challengeService.getUserActiveChallenges(userId);

    const result = {
      user,
      stats: { totalWorkouts, currentStreak, badgesEarned },
      badges,
      challenges,
    };

    await this.redisService.set(cacheKey, JSON.stringify(result), PROFILE_CACHE_TTL);
    this.logger.log(`[CACHE SET] profile:${userId} (TTL ${PROFILE_CACHE_TTL}s)`);

    return result;
  }

  async updateMyProfile(userId: number, dto: UpdateProfileDto) {
    await this.usersService.updateProfile(userId, dto);
    // Xoá cache để lần sau trả dữ liệu mới
    await this.redisService.del(`profile:${userId}`);
    return this.getMyProfile(userId);
  }
}

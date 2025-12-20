import { Injectable } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { FitnessService } from '../fitness/fitness.service';
import { AchievementService } from '../achievement/achievement.service';
import { ChallengeService } from '../challenge/challenge.service';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Injectable()
export class ProfileService {
  constructor(
    private readonly usersService: UsersService,
    private readonly fitnessService: FitnessService,
    private readonly achievementService: AchievementService,
    private readonly challengeService: ChallengeService,
  ) {}

  async getMyProfile(userId: number) {
    console.log('🔍 getMyProfile userId =', userId);

    // ===== USER =====
    const user = await this.usersService.getProfile(userId);

    // ===== STATS =====
    const [totalWorkouts, currentStreak, badgesEarned] =
      await Promise.all([
        this.fitnessService.getTotalWorkouts(userId),
        this.fitnessService.getWorkoutStreak(userId),
        this.achievementService.countUserBadges(userId),
      ]);

    // ===== BADGES (UNLOCKED ONLY) =====
    const badges =
      await this.achievementService.getUnlockedBadgesForProfile(userId, 6);

    // ===== CHALLENGES =====
    const challenges =
      await this.challengeService.getUserActiveChallenges(userId);

    return {
      user,
      stats: {
        totalWorkouts,
        currentStreak,
        badgesEarned,
      },
      badges,       // ✅ chỉ badge đã unlock
      challenges,
    };
  }

  async updateMyProfile(userId: number, dto: UpdateProfileDto) {
    await this.usersService.updateProfile(userId, dto);
    return this.getMyProfile(userId);
  }
}

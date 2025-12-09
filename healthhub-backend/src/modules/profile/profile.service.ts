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

    const user = await this.usersService.getProfile(userId);
    console.log('✔ user loaded =', user);

    const totalWorkouts = await this.fitnessService.getTotalWorkouts(userId);
    const currentStreak = await this.fitnessService.getWorkoutStreak(userId);
    const badges = await this.achievementService.getRecentAchievements(userId, 6);
    const badgesEarned = await this.achievementService.countUserBadges(userId);
    const challenges = await this.challengeService.getUserActiveChallenges(userId);

    return {
      user,
      stats: {
        totalWorkouts,
        currentStreak,
        badgesEarned,
      },
      badges,
      challenges,
    };
  }

  async updateMyProfile(userId: number, dto: UpdateProfileDto) {
    await this.usersService.updateProfile(userId, dto);
    return this.getMyProfile(userId);
  }
}

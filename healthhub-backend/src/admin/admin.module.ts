import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { UsersModule } from 'src/modules/users/users.module';
import { FitnessModule } from 'src/modules/fitness/fitness.module';
import { CommunityModule } from 'src/modules/community/community.module';
import { AchievementModule } from 'src/modules/achievement/achievement.module';
import { ChallengeModule } from 'src/modules/challenge/challenge.module';
import { SeedModule } from 'src/database/seed.module';

import { User } from 'src/modules/users/entities/user.entity';
import { Workout } from 'src/modules/fitness/entities/workout.entity';
import { WorkoutExercise } from 'src/modules/fitness/entities/workout-exercise.entity';
import { UserAchievement } from 'src/modules/achievement/entities/user-achievement.entity';
import { UserChallenge } from 'src/modules/challenge/entities/user-challenge.entity';

import { AdminUsersController } from './admin-users.controller';
import { AdminFitnessController } from './admin-fitness.controller';
import { AdminCommunityController, AdminReportController } from './admin-community.controller';
import { AdminAchievementController } from './admin-achievement.controller';
import { AdminChallengeController } from './admin-challenge.controller';
import { AdminStatsController } from './admin-stats.controller';

import { AdminService } from './admin.service';

@Module({
  imports: [
    UsersModule,
    FitnessModule,
    CommunityModule,
    AchievementModule,
    ChallengeModule,
    SeedModule,

    // Stats cần đếm bảng => inject repo
    TypeOrmModule.forFeature([User, Workout, WorkoutExercise, UserAchievement, UserChallenge]),
  ],
  controllers: [
    AdminUsersController,
    AdminFitnessController,
    AdminCommunityController,
    AdminReportController,
    AdminAchievementController,
    AdminChallengeController,
    AdminStatsController,
  ],
  providers: [AdminService],
})
export class AdminModule {}

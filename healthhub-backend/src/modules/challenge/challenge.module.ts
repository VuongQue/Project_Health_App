import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Challenge } from './entities/challenge.entity';
import { UserChallenge } from './entities/user-challenge.entity';
import { ChallengeService } from './challenge.service';
import { ChallengeController } from './challenge.controller';
import { ChallengeEngineService } from './challenge-engine.service';
import { NotificationModule } from '../notification/notification.module';
import { AchievementModule } from '../achievement/achievement.module';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Challenge, UserChallenge]),
    NotificationModule,
    AchievementModule,
    UsersModule,
  ],
  controllers: [ChallengeController],
  providers: [ChallengeService, ChallengeEngineService],
  exports: [ChallengeEngineService, ChallengeService],
})
export class ChallengeModule {}

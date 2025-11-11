import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChallengeService } from './challenge.service';
import { ChallengeController } from './challenge.controller';
import { Challenge } from './entities/challenge.entity';
import { UserChallenge } from './entities/user-challenge.entity';
import { UsersModule } from '../users/users.module';
import { AchievementModule } from '../achievement/achievement.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Challenge, UserChallenge]),
    UsersModule,
    AchievementModule,
  ],
  controllers: [ChallengeController],
  providers: [ChallengeService],
})
export class ChallengeModule {}

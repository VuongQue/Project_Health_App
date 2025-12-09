import { Module } from '@nestjs/common';
import { ProfileController } from './profile.controller';
import { ProfileService } from './profile.service';

import { UsersModule } from '../users/users.module';
import { FitnessModule } from '../fitness/fitness.module';
import { AchievementModule } from '../achievement/achievement.module';
import { ChallengeModule } from '../challenge/challenge.module';

@Module({
  imports: [
    UsersModule,
    FitnessModule,       
    AchievementModule,
    ChallengeModule,
  ],
  controllers: [ProfileController],
  providers: [ProfileService],
})
export class ProfileModule {}

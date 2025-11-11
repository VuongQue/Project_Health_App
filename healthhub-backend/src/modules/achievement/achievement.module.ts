import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AchievementService } from './achievement.service';
import { AchievementController } from './achievement.controller';
import { Achievement } from './entities/achievement.entity';
import { UserAchievement } from './entities/user-achievement.entity';
import { UsersModule } from '../users/users.module';
import { AchievementListener } from './achievement.listener';

@Module({
  imports: [
    TypeOrmModule.forFeature([Achievement, UserAchievement]),
    UsersModule,
  ],
  controllers: [AchievementController],
  providers: [AchievementService, AchievementListener],
  exports: [AchievementListener],
})
export class AchievementModule {}

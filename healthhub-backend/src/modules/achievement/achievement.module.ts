import { forwardRef, Module, OnModuleInit } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AchievementService } from './achievement.service';
import { AchievementController } from './achievement.controller';
import { Achievement } from './entities/achievement.entity';
import { UserAchievement } from './entities/user-achievement.entity';
import { UsersModule } from '../users/users.module';
import { NotificationModule } from '../notification/notification.module';
import { AchievementEngine } from './achievement.engine';
import { AchievementListener } from './achievement.listener';
import { AchievementSeedService } from './achievement.seed';

@Module({
  imports: [
    TypeOrmModule.forFeature([Achievement, UserAchievement]),
    forwardRef(() => UsersModule),
    NotificationModule,
  ],
  controllers: [AchievementController],
  providers: [AchievementService, AchievementEngine, AchievementListener, AchievementSeedService],
  exports: [AchievementEngine, AchievementService, AchievementListener],
})
export class AchievementModule implements OnModuleInit {
  constructor(private readonly achievementSeed: AchievementSeedService) {}

  async onModuleInit() {
    await this.achievementSeed.seed();
  }
}

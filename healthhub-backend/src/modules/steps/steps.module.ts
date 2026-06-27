import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DailySteps } from './entities/daily-steps.entity';
import { StepsService } from './steps.service';
import { StepsController } from './steps.controller';
import { AchievementModule } from '../achievement/achievement.module';

@Module({
  imports: [TypeOrmModule.forFeature([DailySteps]), AchievementModule],
  providers: [StepsService],
  controllers: [StepsController],
  exports: [StepsService],
})
export class StepsModule {}

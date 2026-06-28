import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AiService } from './ai.service';
import { AiChatService } from './ai-chat.service';
import { AiController } from './ai.controller';
import { AiChatSession, AiChatSessionSchema } from './schemas/ai-chat-session.schema';
import { MoodModule } from '../mood/mood.module';
import { StepsModule } from '../steps/steps.module';
import { WaterIntakeModule } from '../water-intake/water-intake.module';
import { FoodDiaryModule } from '../food-diary/food-diary.module';
import { BodyMetricsModule } from '../body-metrics/body-metrics.module';
import { GoalsModule } from '../goals/goals.module';
import { FitnessModule } from '../fitness/fitness.module';
import { UsersModule } from '../users/users.module';
import { WearableHealthModule } from '../wearable-health/wearable-health.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: AiChatSession.name, schema: AiChatSessionSchema },
    ]),
    MoodModule,
    StepsModule,
    WaterIntakeModule,
    FoodDiaryModule,
    BodyMetricsModule,
    GoalsModule,
    FitnessModule,
    UsersModule,
    WearableHealthModule,
  ],
  controllers: [AiController],
  providers: [AiService, AiChatService],
  exports: [AiService],
})
export class AiModule {}

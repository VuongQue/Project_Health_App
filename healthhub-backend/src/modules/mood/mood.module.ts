import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MoodService } from './mood.service';
import { MoodController } from './mood.controller';
import { MoodEntry, MoodEntrySchema } from './schemas/mood-entry.schema';
import { KafkaModule } from '../kafka/kafka.module';
import { ChallengeModule } from '../challenge/challenge.module';
import { AchievementModule } from '../achievement/achievement.module';
import { FitnessModule } from '../fitness/fitness.module';

@Module({
  imports: [MongooseModule.forFeature([{ name: MoodEntry.name, schema: MoodEntrySchema }]), 
  KafkaModule, 
  ChallengeModule, 
  AchievementModule,
  FitnessModule,

],
  controllers: [MoodController],
  providers: [MoodService],
  exports: [MoodService],
})
export class MoodModule {}

import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MoodService } from './mood.service';
import { MoodController } from './mood.controller';
import { MoodEntry, MoodEntrySchema } from './schemas/mood-entry.schema';
import { KafkaModule } from '../kafka/kafka.module';

@Module({
  imports: [MongooseModule.forFeature([{ name: MoodEntry.name, schema: MoodEntrySchema }]), KafkaModule],
  controllers: [MoodController],
  providers: [MoodService],
})
export class MoodModule {}

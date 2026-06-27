import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MongooseModule } from '@nestjs/mongoose';
import { EventController } from './event.controller';
import { EventService } from './event.service';
import { Event } from './entities/event.entity';
import { EventRegistration } from './entities/event-registration.entity';
import { EventSubmission } from './entities/event-submission.entity';
import { Group, GroupSchema } from '../community/schemas/group.schema';
import { UsersModule } from '../users/users.module';
import { AchievementModule } from '../achievement/achievement.module';
import { NotificationModule } from '../notification/notification.module';
import { ChatModule } from '../chat/chat.module';
import { WorkoutLog } from '../fitness/entities/workout-log.entity';
import { DailySteps } from '../steps/entities/daily-steps.entity';
import { WaterLog } from '../water-intake/entities/water-log.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Event, EventRegistration, EventSubmission, WorkoutLog, DailySteps, WaterLog]),
    MongooseModule.forFeature([{ name: Group.name, schema: GroupSchema }]),
    UsersModule,
    AchievementModule,
    NotificationModule,
    ChatModule,
  ],
  controllers: [EventController],
  providers: [EventService],
  exports: [EventService],
})
export class EventModule {}

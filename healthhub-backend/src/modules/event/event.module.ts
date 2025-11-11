import { Module } from '@nestjs/common';
import { EventController } from './event.controller';
import { EventService } from './event.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Event } from './entities/event.entity';
import { EventRegistration } from './entities/event-registration.entity';
import { UsersModule } from '../users/users.module';
import { AchievementModule } from '../achievement/achievement.module';

@Module({
  imports: [TypeOrmModule.forFeature([Event, EventRegistration]),
      UsersModule,
      AchievementModule,
    ],

  controllers: [EventController],
  providers: [EventService]
})
export class EventModule {}

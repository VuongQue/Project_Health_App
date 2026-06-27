import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MongooseModule } from '@nestjs/mongoose';
import { SeedService } from './seed.service';

// MySQL / TypeORM entities
import { User } from '../modules/users/entities/user.entity';
import { Workout } from '../modules/fitness/entities/workout.entity';
import { WorkoutExercise } from '../modules/fitness/entities/workout-exercise.entity';
import { WorkoutLog } from '../modules/fitness/entities/workout-log.entity';
import { Challenge } from '../modules/challenge/entities/challenge.entity';
import { UserChallenge } from '../modules/challenge/entities/user-challenge.entity';
import { Achievement } from '../modules/achievement/entities/achievement.entity';
import { UserAchievement } from '../modules/achievement/entities/user-achievement.entity';
import { Event } from '../modules/event/entities/event.entity';
import { EventRegistration } from '../modules/event/entities/event-registration.entity';
import { BodyMetric } from '../modules/body-metrics/entities/body-metric.entity';
import { DailySteps } from '../modules/steps/entities/daily-steps.entity';
import { WaterLog } from '../modules/water-intake/entities/water-log.entity';
import { Friend } from '../modules/friend/entities/friend.entity';
import { FriendRequest } from '../modules/friend/entities/friend-request.entity';

// MongoDB / Mongoose schemas
import { Group, GroupSchema } from '../modules/community/schemas/group.schema';
import { Post, PostSchema } from '../modules/community/schemas/post.schema';
import { MoodEntry, MoodEntrySchema } from '../modules/mood/schemas/mood-entry.schema';
import { ChatRoom, ChatRoomSchema } from '../modules/chat/schemas/chat-room.schema';
import { ChatMessage, ChatMessageSchema } from '../modules/chat/schemas/chat-message.schema';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User, Workout, WorkoutExercise, WorkoutLog,
      Challenge, UserChallenge,
      Achievement, UserAchievement,
      Event, EventRegistration,
      BodyMetric, DailySteps, WaterLog,
      Friend, FriendRequest,
    ]),
    MongooseModule.forFeature([
      { name: Group.name,       schema: GroupSchema },
      { name: Post.name,        schema: PostSchema },
      { name: MoodEntry.name,   schema: MoodEntrySchema },
      { name: ChatRoom.name,    schema: ChatRoomSchema },
      { name: ChatMessage.name, schema: ChatMessageSchema },
    ]),
  ],
  providers: [SeedService],
  exports: [SeedService],
})
export class SeedModule {}

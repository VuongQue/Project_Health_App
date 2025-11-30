import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MongooseModule } from '@nestjs/mongoose';
import { mysqlConfig } from './config/mysql.config';
import { mongoConfig } from './config/mongo.config';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { MoodModule } from './modules/mood/mood.module';
import { FitnessModule } from './modules/fitness/fitness.module';
import { CommunityModule } from './modules/community/community.module';
import { EventModule } from './modules/event/event.module';
import { ChallengeModule } from './modules/challenge/challenge.module';
import { AchievementModule } from './modules/achievement/achievement.module';
import { NotificationModule } from './modules/notification/notification.module';
import { CloudinaryModule } from './modules/cloudinary/cloudinary.module';
import { FriendModule } from './modules/friend/friend.module';
import { ChatModule } from './modules/chat/chat.module';

@Module({
  imports: [
    // Load biến môi trường
    ConfigModule.forRoot({
      isGlobal: true, // để module khác có thể truy cập process.env
      envFilePath: '.env',
    }),

    // MySQL
    TypeOrmModule.forRoot(mysqlConfig),

    // MongoDB
    MongooseModule.forRoot(mongoConfig.uri as string),

    AuthModule,

    UsersModule,

    MoodModule,

    FitnessModule,

    CommunityModule,

    EventModule,

    ChallengeModule,

    AchievementModule,

    NotificationModule,
    CloudinaryModule,
    FriendModule,
    ChatModule,
  ],
})
export class AppModule {}

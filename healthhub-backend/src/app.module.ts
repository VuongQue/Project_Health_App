import { Module, OnModuleInit } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { ScheduleModule } from '@nestjs/schedule';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MongooseModule } from '@nestjs/mongoose';
import { mysqlConfig } from './config/mysql.config';
import { mongoConfig } from './config/mongo.config';
import { envValidationSchema } from './config/env.validation';
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
import { ProfileModule } from './modules/profile/profile.module';
import { ElasticsearchModule } from './modules/elasticsearch/elasticsearch.module';
import { AdminModule } from './admin/admin.module';
import { AdminSeedService } from './admin/admin.seed';
import { SeedModule } from './database/seed.module';
import { SeedService } from './database/seed.service';
import { RedisModule } from './modules/redis/redis.module';
import { HealthModule } from './health/health.module';
import { BodyMetricsModule } from './modules/body-metrics/body-metrics.module';
import { FoodDiaryModule } from './modules/food-diary/food-diary.module';
import { WaterIntakeModule } from './modules/water-intake/water-intake.module';
import { GoalsModule } from './modules/goals/goals.module';
import { StepsModule } from './modules/steps/steps.module';
import { AiModule } from './modules/ai/ai.module';
import { HealthJourneyModule } from './modules/health-journey/health-journey.module';
import { WearableHealthModule } from './modules/wearable-health/wearable-health.module';
import { AdvertisementModule } from './modules/advertisement/advertisement.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      validationSchema: envValidationSchema,
      validationOptions: { abortEarly: false },
    }),

    // Rate limiting toàn cục: 100 req/phút mỗi IP
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 100 }]),

    // Cron jobs (dùng cho các task định kỳ)
    ScheduleModule.forRoot(),

    TypeOrmModule.forRoot(mysqlConfig),
    MongooseModule.forRoot(mongoConfig.uri as string),

    // Redis global (inject RedisService vào bất kỳ module nào)
    RedisModule,

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
    ProfileModule,
    ElasticsearchModule,
    AdminModule,
    SeedModule,
    HealthModule,
    BodyMetricsModule,
    FoodDiaryModule,
    WaterIntakeModule,
    GoalsModule,
    StepsModule,
    AiModule,
    HealthJourneyModule,
    WearableHealthModule,
    AdvertisementModule,
  ],
  providers: [AdminSeedService],
})
export class AppModule implements OnModuleInit {
  constructor(
    private readonly adminSeed: AdminSeedService,
    private readonly seed: SeedService,
  ) {}

  async onModuleInit() {
    await this.adminSeed.seedAdmin(); // backward-compat: đảm bảo admin tồn tại trước
    await this.seed.run();            // seed toàn bộ mock data
  }
}
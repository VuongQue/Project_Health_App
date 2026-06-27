import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ThrottlerModule } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UsersModule } from '../users/users.module';
import { JwtStrategy } from './strategies/jwt.strategy';
import { GoogleStrategy } from './strategies/google.strategy';
import { GoogleWebStrategy } from './strategies/google-web.strategy';
import { EmailModule } from '../email/email.module';
import { KafkaModule } from '../kafka/kafka.module';
import { AchievementModule } from '../achievement/achievement.module';

@Module({
  imports: [
    UsersModule,
    PassportModule,
    EmailModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: process.env.JWT_EXPIRATION || ('1d' as any) },
    }),
    KafkaModule,
    AchievementModule,
    // Rate limiting: 20 req/phút mặc định cho toàn module auth
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 20 }]),
  ],
  providers: [AuthService, JwtStrategy, GoogleStrategy, GoogleWebStrategy],
  controllers: [AuthController],
})
export class AuthModule {}

import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  Inject,
} from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { AuthProvider } from '../users/entities/user.entity';
import { EmailService } from '../email/email.service';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { ClientKafka } from '@nestjs/microservices';
import { TOPIC_NOTIFICATION_EVENTS } from '../../config/kafka.config';

import { NotificationType } from '../notification/entities/notification.entity';
import { AchievementEngine } from '../achievement/achievement.engine';


@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly emailService: EmailService,
    private readonly achievementEngine: AchievementEngine, 

    // 🔥 Kafka producer
    @Inject('KAFKA_CLIENT')
    private readonly kafka: ClientKafka,
  ) {}

  // =========================
  // UTILS
  // =========================
  private generateOtp() {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  // =========================
  // REGISTER
  // =========================
  async register(dto: RegisterDto) {
    const existing = await this.usersService.findByEmail(dto.email);
    if (existing) {
      throw new BadRequestException('Email already registered');
    }

    const hash = await bcrypt.hash(dto.password, 10);
    const otp = this.generateOtp();

    await this.usersService.create({
      fullName: dto.fullName,
      email: dto.email,
      password: hash,
      provider: AuthProvider.LOCAL,
      isVerified: false,
      otpCode: otp,
      otpExpiresAt: new Date(Date.now() + 5 * 60 * 1000), // 5 phút
    });

    await this.emailService.sendOtp(dto.email, otp);

    return {
      message: 'OTP sent to your email. Please verify.',
      email: dto.email,
    };
  }

  // =========================
  // VERIFY OTP
  // =========================
  async verifyOtp(dto: VerifyOtpDto) {
    const user = await this.usersService.findByEmail(dto.email);
    if (!user) {
      throw new BadRequestException('User not found');
    }

    if (user.isVerified) {
      return { message: 'Account is already verified.' };
    }

    if (user.otpCode !== dto.otp) {
      throw new BadRequestException('Invalid OTP');
    }

    if (!user.otpExpiresAt || user.otpExpiresAt < new Date()) {
      throw new BadRequestException('OTP expired');
    }

    user.isVerified = true;
    user.otpCode = null;
    user.otpExpiresAt = null;

    await this.usersService.save(user);
    await this.achievementEngine.evaluate(user.id, 'USER_REGISTER', {
      register: 1,
    });

    await this.achievementEngine.evaluate(user.id, 'USER_LOGIN', {
      loginCount: 1,
    });



    // 🔥🔥🔥 EMIT WELCOME NOTIFICATION (KAFKA EVENT)
    // ❗ không await → auth không bị block nếu Kafka lỗi
    this.kafka.emit(
      TOPIC_NOTIFICATION_EVENTS,
      {
        userId: user.id,
        type: NotificationType.SYSTEM,
        message:
          '🎉 Chào mừng bạn đến với HealthHub! Hãy bắt đầu hành trình chăm sóc sức khỏe ngay hôm nay 💪',
        priority: 1,
      },
    );



    // Trả token đăng nhập
    return this.generateTokens(user.id, user.email);
  }

  // =========================
  // LOGIN
  // =========================
  async login(dto: LoginDto) {
    const user = await this.usersService.findByEmail(dto.email);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.isVerified) {
      throw new UnauthorizedException('Email not verified');
    }

    const match = await bcrypt.compare(dto.password, user.password);
    if (!match) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return this.generateTokens(user.id, user.email);
  }

  // =========================
  // TOKEN
  // =========================
  private generateTokens(userId: number, email: string) {
    const payload = { sub: userId, email };

    const accessToken = this.jwtService.sign(payload, {
      secret: process.env.JWT_SECRET ?? 'default_secret',
      expiresIn: '1d',
    });

    const refreshToken = this.jwtService.sign(payload, {
      secret: process.env.JWT_REFRESH_SECRET ?? 'refresh_secret',
      expiresIn: '7d',
    });

    return { accessToken, refreshToken };
  }
}

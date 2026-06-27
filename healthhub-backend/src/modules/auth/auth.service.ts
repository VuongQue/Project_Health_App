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
import { RedisService } from '../redis/redis.service';

const REFRESH_TOKEN_TTL = 7 * 24 * 60 * 60; // 7 ngày tính bằng giây

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly emailService: EmailService,
    private readonly achievementEngine: AchievementEngine,
    private readonly redisService: RedisService,

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
      throw new BadRequestException('Email đã được đăng ký');
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
      message: 'OTP đã được gửi đến email của bạn. Vui lòng xác minh.',
      email: dto.email,
    };
  }

  // =========================
  // VERIFY OTP
  // =========================
  async verifyOtp(dto: VerifyOtpDto) {
    const user = await this.usersService.findByEmail(dto.email);
    if (!user) {
      throw new BadRequestException('Không tìm thấy người dùng');
    }

    if (user.isVerified) {
      return { message: 'Tài khoản đã được xác minh.' };
    }

    if (user.otpCode !== dto.otp) {
      throw new BadRequestException('OTP không hợp lệ');
    }

    if (!user.otpExpiresAt || user.otpExpiresAt < new Date()) {
      throw new BadRequestException('OTP đã hết hạn');
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
  // RESEND OTP
  // =========================
  async resendOtp(email: string) {
    const user = await this.usersService.findByEmail(email);
    if (!user) throw new BadRequestException('Email không tồn tại');
    if (user.isVerified) throw new BadRequestException('Tài khoản đã được xác minh');

    // Rate-limit: block resend if existing OTP still has >2 min remaining
    if (user.otpExpiresAt && user.otpExpiresAt.getTime() - Date.now() > 2 * 60 * 1000) {
      throw new BadRequestException('Vui lòng chờ trước khi yêu cầu OTP mới');
    }

    const otp = this.generateOtp();
    user.otpCode = otp;
    user.otpExpiresAt = new Date(Date.now() + 5 * 60 * 1000);
    await this.usersService.save(user);
    await this.emailService.sendOtp(email, otp);

    return { message: 'OTP mới đã được gửi đến email của bạn.' };
  }

  // =========================
  // LOGIN
  // =========================
  async login(dto: LoginDto) {
    const user = await this.usersService.findByEmail(dto.email);

    if (!user) {
      throw new UnauthorizedException('Email hoặc mật khẩu không đúng');
    }

    if (user.status === 'LOCKED') {
      throw new UnauthorizedException('Tài khoản đã bị khoá');
    }

    if (!user.isVerified) {
      throw new UnauthorizedException('Email chưa được xác minh');
    }

    const match = await bcrypt.compare(dto.password, user.password);
    if (!match) {
      throw new UnauthorizedException('Email hoặc mật khẩu không đúng');
    }

    return this.generateTokens(user.id, user.email);
  }



  // =========================
  // TOKEN
  // =========================
  private async generateTokens(userId: number, email: string) {
    const user = await this.usersService.findByEmail(email);

    if (!user) {
      throw new UnauthorizedException('Không tìm thấy người dùng');
    }

    const payload = { sub: userId, email: user.email, role: user.role };

    const accessToken = this.jwtService.sign(payload, {
      secret: process.env.JWT_SECRET ?? 'default_secret',
      expiresIn: '1d',
    });

    const refreshToken = this.jwtService.sign(payload, {
      secret: process.env.JWT_REFRESH_SECRET ?? 'refresh_secret',
      expiresIn: '7d',
    });

    // Lưu refresh token vào Redis với TTL 7 ngày
    await this.redisService.set(
      `refresh_token:${userId}`,
      refreshToken,
      REFRESH_TOKEN_TTL,
    );

    return {
      accessToken,
      refreshToken,
      user: { id: user.id, email: user.email, role: user.role },
    };
  }

  // =========================
  // REFRESH TOKEN
  // =========================
  async refreshToken(token: string) {
    let payload: any;
    try {
      payload = this.jwtService.verify(token, {
        secret: process.env.JWT_REFRESH_SECRET ?? 'refresh_secret',
      });
    } catch {
      throw new UnauthorizedException('Refresh token không hợp lệ hoặc đã hết hạn');
    }

    const stored = await this.redisService.get(`refresh_token:${payload.sub}`);
    if (stored !== token) {
      throw new UnauthorizedException('Refresh token đã bị thu hồi');
    }

    const user = await this.usersService.findByEmail(payload.email);
    if (!user) throw new UnauthorizedException('Người dùng không tồn tại');

    const newPayload = { sub: user.id, email: user.email, role: user.role };
    const accessToken = this.jwtService.sign(newPayload, {
      secret: process.env.JWT_SECRET ?? 'default_secret',
      expiresIn: '1d',
    });

    return { accessToken };
  }

  // =========================
  // GOOGLE OAUTH
  // =========================
  async googleLogin(googleUser: {
    googleId: string;
    email: string;
    fullName: string;
    avatarUrl?: string;
  }) {
    let user = await this.usersService.findByEmail(googleUser.email);

    if (!user) {
      user = await this.usersService.create({
        email: googleUser.email,
        fullName: googleUser.fullName,
        avatarUrl: googleUser.avatarUrl,
        googleId: googleUser.googleId,
        provider: AuthProvider.GOOGLE,
        isVerified: true,
        password: undefined,
      });

      await this.achievementEngine.evaluate(user.id, 'USER_REGISTER', { register: 1 });

      this.kafka.emit(TOPIC_NOTIFICATION_EVENTS, {
        userId: user.id,
        type: NotificationType.SYSTEM,
        message: '🎉 Chào mừng bạn đến với HealthHub! Hãy bắt đầu hành trình sức khoẻ ngay hôm nay 💪',
        priority: 1,
      });
    } else if (!user.googleId) {
      user.googleId = googleUser.googleId;
      user.provider = AuthProvider.GOOGLE;
      if (!user.avatarUrl && googleUser.avatarUrl) user.avatarUrl = googleUser.avatarUrl;
      await this.usersService.save(user);
    }

    return this.generateTokens(user.id, user.email);
  }

  // =========================
  // FORGOT PASSWORD
  // =========================
  async forgotPassword(email: string) {
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      // Trả về success để tránh user enumeration attack
      return { message: 'Nếu email tồn tại, OTP đã được gửi.' };
    }

    const otp = this.generateOtp();
    user.otpCode = otp;
    user.otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 phút
    await this.usersService.save(user);

    await this.emailService.sendOtp(email, otp);
    return { message: 'Nếu email tồn tại, OTP đã được gửi.' };
  }

  // =========================
  // RESET PASSWORD
  // =========================
  async resetPassword(email: string, otp: string, newPassword: string) {
    const user = await this.usersService.findByEmail(email);
    if (!user) throw new BadRequestException('Email không tồn tại');

    if (user.otpCode !== otp) throw new BadRequestException('OTP không hợp lệ');
    if (!user.otpExpiresAt || user.otpExpiresAt < new Date()) {
      throw new BadRequestException('OTP đã hết hạn');
    }

    user.password = await bcrypt.hash(newPassword, 10);
    user.otpCode = null;
    user.otpExpiresAt = null;
    await this.usersService.save(user);

    // Vô hiệu refresh token cũ
    await this.redisService.del(`refresh_token:${user.id}`);

    return { message: 'Đặt lại mật khẩu thành công. Vui lòng đăng nhập lại.' };
  }

  // =========================
  // LOGOUT
  // =========================
  async logout(userId: number) {
    await this.redisService.del(`refresh_token:${userId}`);
    return { success: true };
  }
}


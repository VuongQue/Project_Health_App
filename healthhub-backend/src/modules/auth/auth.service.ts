import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { AuthProvider } from '../users/entities/user.entity';
import { EmailService } from '../email/email.service';
import { VerifyOtpDto } from './dto/verify-otp.dto';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private emailService: EmailService,
  ) {}

  private generateOtp() {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  async register(dto: RegisterDto) {
    const existing = await this.usersService.findByEmail(dto.email);
    if (existing) throw new BadRequestException('Email already registered');

    const hash = await bcrypt.hash(dto.password, 10);

    // Generate OTP
    const otp = this.generateOtp();

    const user = await this.usersService.create({
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

  async verifyOtp(dto: VerifyOtpDto) {
    const user = await this.usersService.findByEmail(dto.email);
    if (!user) throw new BadRequestException('User not found');

    // 🔥 LOG CHI TIẾT
  console.log("======================================");
  console.log("🔐 VERIFY OTP DEBUG LOG");
  console.log("Email:", dto.email);
  console.log("OTP client gửi:", dto.otp);
  console.log("OTP trong DB:", user.otpCode);
  console.log("OTP typeof:", typeof user.otpCode);
  console.log("OTP Expire At:", user.otpExpiresAt);
  console.log("Now:", new Date());
  console.log("======================================");

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

    // After verification → login token
    return this.generateTokens(user.id, user.email);
  }

  async login(dto: LoginDto) {
    const user = await this.usersService.findByEmail(dto.email);
    if (!user) throw new UnauthorizedException('Invalid credentials');

    if (!user.isVerified)
      throw new UnauthorizedException('Email not verified');

    const match = await bcrypt.compare(dto.password, user.password);
    if (!match) throw new UnauthorizedException('Invalid credentials');

    return this.generateTokens(user.id, user.email);
  }

  generateTokens(userId: number, email: string) {
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

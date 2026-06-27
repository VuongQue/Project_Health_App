import { Body, Controller, Get, Post, Req, Res, UseGuards } from '@nestjs/common';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@Controller('auth')
@UseGuards(ThrottlerGuard)
export class AuthController {
  constructor(private authService: AuthService) {}

  // 5 lần đăng ký / phút mỗi IP
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('register')
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post('verify-otp')
  verifyOtp(@Body() dto: VerifyOtpDto) {
    return this.authService.verifyOtp(dto);
  }

  @Throttle({ default: { limit: 3, ttl: 60000 } })
  @Post('resend-otp')
  resendOtp(@Body() body: { email: string }) {
    return this.authService.resendOtp(body.email);
  }

  // 10 lần đăng nhập / phút mỗi IP
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Post('refresh')
  refresh(@Body() dto: RefreshTokenDto) {
    return this.authService.refreshToken(dto.refreshToken);
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  logout(@Req() req) {
    const userId = Number(req.user?.userId);
    return this.authService.logout(userId);
  }

  // =========================
  // GOOGLE OAUTH — Mobile (deep link)
  // =========================
  @Get('google')
  @UseGuards(AuthGuard('google'))
  googleAuth() {}

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  async googleCallback(@Req() req, @Res() res) {
    const tokens = await this.authService.googleLogin(req.user);
    const params = `accessToken=${tokens.accessToken}&refreshToken=${tokens.refreshToken}&userId=${tokens.user.id}`;
    return res.redirect(`healthhub://auth/google/callback?${params}`);
  }

  // =========================
  // GOOGLE OAUTH — Web browser
  // =========================
  @Get('google/web')
  @UseGuards(AuthGuard('google-web'))
  googleAuthWeb() {}

  @Get('google/web/callback')
  @UseGuards(AuthGuard('google-web'))
  async googleWebCallback(@Req() req, @Res() res) {
    const tokens = await this.authService.googleLogin(req.user);
    const params = `accessToken=${tokens.accessToken}&refreshToken=${tokens.refreshToken}&userId=${tokens.user.id}`;
    const webUrl = process.env.WEB_CALLBACK_URL ?? 'http://localhost:8081';
    return res.redirect(`${webUrl}/auth/google/callback?${params}`);
  }

  // =========================
  // FORGOT / RESET PASSWORD
  // =========================
  @Throttle({ default: { limit: 3, ttl: 60000 } })
  @Post('forgot-password')
  forgotPassword(@Body() body: { email: string }) {
    return this.authService.forgotPassword(body.email);
  }

  @Post('reset-password')
  resetPassword(@Body() body: { email: string; otp: string; newPassword: string }) {
    return this.authService.resetPassword(body.email, body.otp, body.newPassword);
  }
}

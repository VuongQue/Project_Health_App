import { Controller, Get, Put, Body, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { ProfileService } from './profile.service';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Controller('profile')
@UseGuards(JwtAuthGuard)
export class ProfileController {
  constructor(private readonly profileService: ProfileService) {
    console.log('🔥 ProfileController LOADED');
  }

  @Get('me')
  async getMe(@Req() req) {
    console.log('👉 GET /profile/me called, req.user =', req.user);
    return this.profileService.getMyProfile(req.user.userId);
  }

  @Put('me')
  async updateMe(@Req() req, @Body() dto: UpdateProfileDto) {
    console.log('👉 PUT /profile/me called, dto =', dto, 'user =', req.user);
    return this.profileService.updateMyProfile(req.user.userId, dto);
  }
}

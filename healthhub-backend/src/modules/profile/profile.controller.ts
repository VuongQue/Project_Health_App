import { Controller, Get, Put, Body, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { ProfileService } from './profile.service';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Controller('profile')
@UseGuards(JwtAuthGuard)
export class ProfileController {
  constructor(private readonly profileService: ProfileService) {}

  @Get('me')
  getMe(@Req() req) {
    return this.profileService.getMyProfile(req.user.userId);
  }

  @Put('me')
  updateMe(@Req() req, @Body() dto: UpdateProfileDto) {
    return this.profileService.updateMyProfile(req.user.userId, dto);
  }
}

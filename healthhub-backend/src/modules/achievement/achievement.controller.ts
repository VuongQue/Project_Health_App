import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { AchievementService } from './achievement.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@Controller('achievements')
export class AchievementController {
  constructor(private achievementService: AchievementService) {}

  @Get()
  getAll() {
    return this.achievementService.getAll();
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  getMine(@Req() req) {
    return this.achievementService.myAchievements(req.user.email);
  }
}

import { Controller, Get, Post, Body, Param, Req, UseGuards } from '@nestjs/common';
import { ChallengeService } from './challenge.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CreateChallengeDto } from './dto/create-challenge.dto';

@Controller('challenges')
export class ChallengeController {
  constructor(private challengeService: ChallengeService) {}

  // Admin tạo challenge
  @UseGuards(JwtAuthGuard)
  @Post()
  create(@Body() dto: CreateChallengeDto) {
    return this.challengeService.create(dto);
  }

  // Lấy tất cả challenge
  @Get()
  getAll() {
    return this.challengeService.getAll();
  }

  // User tham gia challenge
  @UseGuards(JwtAuthGuard)
  @Post(':id/join')
  join(@Req() req, @Param('id') id: number) {
    return this.challengeService.join(req.user.email, id);
  }

  // Challenge của user (hiển thị trên Dashboard)
  @UseGuards(JwtAuthGuard)
  @Get('me')
  myChallenges(@Req() req) {
    return this.challengeService.myChallenges(req.user.email);
  }

  // User đánh dấu hoàn thành 1 ngày Progress
  @UseGuards(JwtAuthGuard)
  @Post(':id/progress')
  addProgress(@Req() req, @Param('id') id: number) {
    return this.challengeService.addProgress(req.user.email, id);
  }
}

import { Controller, Get, Post, Body, UseGuards, Req } from '@nestjs/common';
import { MoodService } from './mood.service';
import { CreateMoodDto } from './dto/create-mood.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@Controller('moods')
@UseGuards(JwtAuthGuard)
export class MoodController {
  constructor(private moodService: MoodService) {}

  @Post()
  create(@Req() req, @Body() dto: CreateMoodDto) {
    return this.moodService.create(req.user.userId, dto);
  }

  @Get('today')
  getToday(@Req() req) {
    return this.moodService.getToday(req.user.userId);
  }

  @Get('week-trend')
  getWeekTrend(@Req() req) {
    return this.moodService.getWeekTrend(req.user.userId);
  }

  @Get('summary')
  getSummary(@Req() req) {
    return this.moodService.getSummary(req.user.userId);
  }

  @Get('latest')
  getLatest(@Req() req) {
    return this.moodService.getLatest(req.user.userId);
  }

  @Get('streak')
  getStreak(@Req() req) {
    return this.moodService.getStreak(req.user.userId);
  }

  @Get('recent')
  getRecent(@Req() req) {
    return this.moodService.getRecent(req.user.userId);
  }

  // API phục vụ mobile: lấy hết 1 lần
  @Get('dashboard')
  getDashboard(@Req() req) {
    return this.moodService.getDashboard(req.user.userId);
  }
}

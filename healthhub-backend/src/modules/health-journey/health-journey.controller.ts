import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { HealthJourneyService } from './health-journey.service';
import { CreateJourneyDto } from './dto/create-journey.dto';
import { DailyCheckinDto } from './dto/daily-checkin.dto';

@Controller('health-journey')
@UseGuards(JwtAuthGuard)
export class HealthJourneyController {
  constructor(private readonly service: HealthJourneyService) {}

  @Post()
  create(@Request() req, @Body() dto: CreateJourneyDto) {
    return this.service.createJourney(req.user.userId, dto);
  }

  @Get('active')
  getActive(@Request() req) {
    return this.service.getActiveJourney(req.user.userId);
  }

  @Get('history')
  getHistory(@Request() req) {
    return this.service.getJourneyHistory(req.user.userId);
  }

  @Get('weekly-progress')
  getWeeklyProgress(@Request() req) {
    return this.service.getWeeklyProgress(req.user.userId);
  }

  @Post('checkin')
  checkin(@Request() req, @Body() dto: DailyCheckinDto) {
    return this.service.dailyCheckin(req.user.userId, dto);
  }

  @Delete('active')
  abandon(@Request() req) {
    return this.service.abandonJourney(req.user.userId);
  }
}

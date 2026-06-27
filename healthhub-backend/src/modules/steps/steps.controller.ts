import { Body, Controller, Get, Post, Query, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { StepsService } from './steps.service';

@Controller('steps')
@UseGuards(JwtAuthGuard)
export class StepsController {
  constructor(private readonly stepsService: StepsService) {}

  @Post()
  upsert(@Req() req, @Body() body: { steps: number; goalSteps?: number }) {
    return this.stepsService.upsert(req.user.userId, body.steps, body.goalSteps);
  }

  @Get('today')
  getToday(@Req() req) {
    return this.stepsService.getToday(req.user.userId);
  }

  @Get('history')
  getHistory(@Req() req, @Query('days') days: string) {
    return this.stepsService.getHistory(req.user.userId, Number(days) || 7);
  }

  @Get('streak')
  getStreak(@Req() req) {
    return this.stepsService.getStreak(req.user.userId);
  }
}

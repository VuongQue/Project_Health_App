import { Controller, Get, Post, Body, Query, UseGuards, Req } from '@nestjs/common';
import { MoodService } from './mood.service';
import { CreateMoodDto } from './dto/create-mood.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@Controller('moods')
export class MoodController {
  constructor(private moodService: MoodService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  create(@Req() req, @Body() dto: CreateMoodDto) {
    return this.moodService.create(req.user.userId, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  findAll(@Req() req, @Query('from') from?: string, @Query('to') to?: string) {
    const fromDate = from ? new Date(from) : undefined;
    const toDate = to ? new Date(to) : undefined;
    return this.moodService.findAllByUser(req.user.userId, fromDate, toDate);
  }
}

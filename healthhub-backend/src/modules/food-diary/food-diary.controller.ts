import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
  ParseIntPipe,
} from '@nestjs/common';
import { FoodDiaryService } from './food-diary.service';
import { CreateFoodLogDto } from './dto/create-food-log.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@Controller('food-diary')
@UseGuards(JwtAuthGuard)
export class FoodDiaryController {
  constructor(private readonly service: FoodDiaryService) {}

  @Post()
  create(@Req() req, @Body() dto: CreateFoodLogDto) {
    return this.service.create(req.user.userId, dto);
  }

  @Get('today')
  getToday(@Req() req) {
    return this.service.getToday(req.user.userId);
  }

  @Get('date')
  getByDate(@Req() req, @Query('date') date: string) {
    return this.service.getByDate(req.user.userId, date);
  }

  @Get('week')
  getWeekSummary(@Req() req) {
    return this.service.getWeekSummary(req.user.userId);
  }

  @Get('suggestions')
  getSuggestions(@Req() req, @Query('goal') goal: string) {
    return this.service.getSuggestions(req.user.userId, Number(goal) || 2000);
  }

  @Delete(':id')
  delete(@Req() req, @Param('id', ParseIntPipe) id: number) {
    return this.service.delete(req.user.userId, id);
  }
}

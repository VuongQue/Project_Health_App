import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
  Req,
  ParseIntPipe,
} from '@nestjs/common';
import { WaterIntakeService } from './water-intake.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { IsNumber, Min, Max } from 'class-validator';

class LogWaterDto {
  @IsNumber()
  @Min(50)
  @Max(2000)
  amount: number;
}

@Controller('water-intake')
@UseGuards(JwtAuthGuard)
export class WaterIntakeController {
  constructor(private readonly service: WaterIntakeService) {}

  @Post()
  log(@Req() req, @Body() dto: LogWaterDto) {
    return this.service.log(req.user.userId, dto.amount);
  }

  @Get('today')
  getToday(@Req() req) {
    return this.service.getToday(req.user.userId);
  }

  @Get('week')
  getWeekSummary(@Req() req) {
    return this.service.getWeekSummary(req.user.userId);
  }

  @Delete(':id')
  delete(@Req() req, @Param('id', ParseIntPipe) id: number) {
    return this.service.delete(req.user.userId, id);
  }
}

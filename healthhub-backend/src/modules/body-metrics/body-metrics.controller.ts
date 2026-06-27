import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
  Req,
  Query,
  ParseIntPipe,
} from '@nestjs/common';
import { BodyMetricsService } from './body-metrics.service';
import { CreateBodyMetricDto } from './dto/create-body-metric.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@Controller('body-metrics')
@UseGuards(JwtAuthGuard)
export class BodyMetricsController {
  constructor(private readonly service: BodyMetricsService) {}

  @Post()
  create(@Req() req, @Body() dto: CreateBodyMetricDto) {
    return this.service.create(req.user.userId, dto);
  }

  @Get()
  getHistory(@Req() req, @Query('limit') limit?: string) {
    return this.service.getHistory(req.user.userId, limit ? +limit : 30);
  }

  @Get('latest')
  getLatest(@Req() req) {
    return this.service.getLatest(req.user.userId);
  }

  @Get('stats')
  getStats(@Req() req) {
    return this.service.getStats(req.user.userId);
  }

  @Delete(':id')
  delete(@Req() req, @Param('id', ParseIntPipe) id: number) {
    return this.service.delete(req.user.userId, id);
  }
}

import { Body, Controller, Get, Post, Query, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { WearableHealthService } from './wearable-health.service';
import { BulkSyncDto, UpsertWearableRecordDto } from './dto/wearable-health.dto';

@Controller('wearable-health')
@UseGuards(JwtAuthGuard)
export class WearableHealthController {
  constructor(private readonly service: WearableHealthService) {}

  // POST /wearable-health/sync — đồng bộ nhiều bản ghi 1 lần (từ Health Connect)
  @Post('sync')
  bulkSync(@Req() req: any, @Body() dto: BulkSyncDto) {
    return this.service.bulkSync(req.user.userId, dto.records);
  }

  // POST /wearable-health — upsert 1 bản ghi
  @Post()
  upsert(@Req() req: any, @Body() dto: UpsertWearableRecordDto) {
    return this.service.upsert(req.user.userId, dto);
  }

  // GET /wearable-health/today — lấy tất cả data hôm nay
  @Get('today')
  getToday(@Req() req: any) {
    return this.service.getToday(req.user.userId);
  }

  // GET /wearable-health/history?dataType=heart_rate&days=7
  @Get('history')
  getHistory(
    @Req() req: any,
    @Query('dataType') dataType: string,
    @Query('days') days: string,
  ) {
    return this.service.getHistory(req.user.userId, dataType, Number(days) || 7);
  }

  // GET /wearable-health/summary?days=7
  @Get('summary')
  getSummary(@Req() req: any, @Query('days') days: string) {
    return this.service.getSummary(req.user.userId, Number(days) || 7);
  }
}

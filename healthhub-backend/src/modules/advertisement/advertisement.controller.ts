import {
  Controller, Get, Post, Put, Delete, Patch,
  Body, Param, Query, ParseIntPipe, UseGuards, Req,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/role/roles.guard';
import { Roles } from '../auth/role/roles.decorator';
import { AdvertisementService } from './advertisement.service';
import { CreateAdvertisementDto } from './dto/create-advertisement.dto';
import { UpdateAdvertisementDto } from './dto/update-advertisement.dto';
import type { AdCategory, AdPlacement } from './entities/advertisement.entity';

// ─── Admin routes (/admin/ads) ────────────────────────────────
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
@Controller('admin/ads')
export class AdminAdvertisementController {
  constructor(private readonly adService: AdvertisementService) {}

  @Post()
  create(@Body() dto: CreateAdvertisementDto) {
    return this.adService.create(dto);
  }

  @Get()
  findAll() {
    return this.adService.findAll();
  }

  @Get('stats')
  getStats() {
    return this.adService.getStats();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.adService.findOne(id);
  }

  @Put(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateAdvertisementDto) {
    return this.adService.update(id, dto);
  }

  @Patch(':id/toggle')
  toggle(@Param('id', ParseIntPipe) id: number) {
    return this.adService.toggleActive(id);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.adService.remove(id);
  }
}

// ─── Mobile routes (/ads) ─────────────────────────────────────
@UseGuards(JwtAuthGuard)
@Controller('ads')
export class AdvertisementController {
  constructor(private readonly adService: AdvertisementService) {}

  /**
   * GET /ads/active?placement=feed&categories=fitness,nutrition
   * Mobile gọi để lấy ads hiển thị theo vị trí + category context
   */
  @Get('active')
  getActive(
    @Query('placement') placement: AdPlacement = 'feed',
    @Query('categories') categoriesStr?: string,
  ) {
    const categories = categoriesStr
      ? (categoriesStr.split(',') as AdCategory[])
      : undefined;
    return this.adService.getActiveAds(placement, categories);
  }

  /**
   * POST /ads/:id/impression — tracking lượt hiển thị
   */
  @Post(':id/impression')
  trackImpression(@Param('id', ParseIntPipe) id: number) {
    return this.adService.trackImpression(id);
  }

  /**
   * POST /ads/:id/click — tracking lượt click
   */
  @Post(':id/click')
  trackClick(@Param('id', ParseIntPipe) id: number) {
    return this.adService.trackClick(id);
  }
}

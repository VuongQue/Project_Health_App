import { Controller, Get, Patch, Delete, Post, Param, Query, Body } from '@nestjs/common';
import { AdminOnly } from './admin-only.decorator';
import { AdminService } from './admin.service';
import { SeedService } from '../database/seed.service';

@Controller('admin/posts')
export class AdminCommunityController {
  constructor(
    private readonly adminService: AdminService,
    private readonly seedService: SeedService,
  ) {}

  @AdminOnly()
  @Get()
  list(@Query('keyword') keyword = '', @Query('page') page = '1', @Query('limit') limit = '10') {
    return this.adminService.listPosts(keyword, Number(page), Number(limit));
  }

  @AdminOnly()
  @Patch(':id/hide')
  hide(@Param('id') id: string) {
    return this.adminService.hidePost(id);
  }

  @AdminOnly()
  @Patch(':id/unhide')
  unhide(@Param('id') id: string) {
    return this.adminService.unhidePost(id);
  }

  @AdminOnly()
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.adminService.deletePost(id);
  }

  @AdminOnly()
  @Post('reseed')
  async reseed() {
    await this.seedService.reseedPosts();
    return { message: 'Posts reseeded successfully' };
  }
}

@Controller('admin/reports')
export class AdminReportController {
  constructor(private readonly adminService: AdminService) {}

  @AdminOnly()
  @Get()
  list(
    @Query('page') page = '1',
    @Query('limit') limit = '20',
    @Query('status') status?: string,
  ) {
    return this.adminService.listReports(Number(page), Number(limit), status);
  }

  @AdminOnly()
  @Patch(':id/resolve')
  resolve(
    @Param('id') id: string,
    @Body('action') action: 'warn' | 'hide' | 'dismiss',
    @Body('adminNote') adminNote?: string,
  ) {
    return this.adminService.resolveReport(id, action, adminNote);
  }
}

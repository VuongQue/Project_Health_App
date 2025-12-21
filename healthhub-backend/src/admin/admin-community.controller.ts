import { Controller, Get, Patch, Delete, Param, Query } from '@nestjs/common';
import { AdminOnly } from './admin-only.decorator';
import { AdminService } from './admin.service';

@Controller('admin/posts')
export class AdminCommunityController {
  constructor(private readonly adminService: AdminService) {}

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
}

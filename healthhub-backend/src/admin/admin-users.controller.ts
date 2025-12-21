import { Controller, Get, Patch, Param, Query, Body } from '@nestjs/common';
import { AdminOnly } from './admin-only.decorator';
import { AdminService } from './admin.service';

@Controller('admin/users')
export class AdminUsersController {
  constructor(private readonly adminService: AdminService) {}

  @AdminOnly()
  @Get()
  list(
    @Query('keyword') keyword = '',
    @Query('page') page = '1',
    @Query('limit') limit = '10',
  ) {
    return this.adminService.listUsers({
      keyword,
      page: Number(page),
      limit: Number(limit),
    });
  }

  @AdminOnly()
  @Get(':id')
  detail(@Param('id') id: string) {
    return this.adminService.getUserDetail(Number(id));
  }

  @AdminOnly()
  @Patch(':id/lock')
  lock(@Param('id') id: string) {
    return this.adminService.lockUser(Number(id));
  }

  @AdminOnly()
  @Patch(':id/unlock')
  unlock(@Param('id') id: string) {
    return this.adminService.unlockUser(Number(id));
  }

  @AdminOnly()
  @Patch(':id/role')
  setRole(@Param('id') id: string, @Body() body: { role: string }) {
    return this.adminService.setUserRole(Number(id), body.role);
  }
}

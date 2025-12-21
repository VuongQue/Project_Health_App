import { Controller, Get } from '@nestjs/common';
import { AdminOnly } from './admin-only.decorator';
import { AdminService } from './admin.service';

@Controller('admin/stats')
export class AdminStatsController {
  constructor(private readonly adminService: AdminService) {}

  @AdminOnly()
  @Get()
  stats() {
    return this.adminService.getDashboardStats();
  }
}

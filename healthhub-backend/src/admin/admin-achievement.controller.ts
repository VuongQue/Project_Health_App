import { Controller, Get, Post, Put, Delete, Param, Body } from '@nestjs/common';
import { AdminOnly } from './admin-only.decorator';
import { AdminService } from './admin.service';

@Controller('admin/achievements')
export class AdminAchievementController {
  constructor(private readonly adminService: AdminService) {}

  @AdminOnly()
  @Get()
  list() {
    return this.adminService.listAchievements();
  }

  @AdminOnly()
  @Post()
  create(@Body() dto: any) {
    return this.adminService.createAchievement(dto);
  }

  @AdminOnly()
  @Put(':id')
  update(@Param('id') id: string, @Body() dto: any) {
    return this.adminService.updateAchievement(Number(id), dto);
  }

  @AdminOnly()
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.adminService.deleteAchievement(Number(id));
  }
}

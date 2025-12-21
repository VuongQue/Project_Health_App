import { Controller, Get, Post, Put, Delete, Param, Body, Query } from '@nestjs/common';
import { AdminOnly } from './admin-only.decorator';
import { AdminService } from './admin.service';

@Controller('admin/workouts')
export class AdminFitnessController {
  constructor(private readonly adminService: AdminService) {}

  @AdminOnly()
  @Get()
  list(@Query('keyword') keyword = '') {
    return this.adminService.listWorkouts(keyword);
  }

  @AdminOnly()
  @Post()
  create(@Body() dto: any) {
    return this.adminService.createWorkout(dto);
  }

  @AdminOnly()
  @Put(':id')
  update(@Param('id') id: string, @Body() dto: any) {
    return this.adminService.updateWorkout(Number(id), dto);
  }

  @AdminOnly()
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.adminService.deleteWorkout(Number(id));
  }
}

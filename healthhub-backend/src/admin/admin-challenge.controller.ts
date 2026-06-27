import { Controller, Get, Post, Put, Delete, Param, Body } from '@nestjs/common';
import { AdminOnly } from './admin-only.decorator';
import { AdminService } from './admin.service';

@Controller('admin/challenges')
export class AdminChallengeController {
  constructor(private readonly adminService: AdminService) {}

  @AdminOnly()
  @Get()
  list() {
    return this.adminService.listChallenges();
  }

  @AdminOnly()
  @Post()
  create(@Body() dto: any) {
    return this.adminService.createChallenge(dto);
  }

  @AdminOnly()
  @Put(':id')
  update(@Param('id') id: string, @Body() dto: any) {
    return this.adminService.updateChallenge(Number(id), dto);
  }

  @AdminOnly()
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.adminService.deleteChallenge(Number(id));
  }
}

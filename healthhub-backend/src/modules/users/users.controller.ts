import { Body, Controller, Get, Post, Req, UseGuards, Query, Param, ParseIntPipe } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get('me')
  getMe(@Req() req) {
    return this.usersService.getMe(req.user.email);
  }

  @Post('push-token')
  registerPushToken(@Req() req, @Body() body: { token: string }) {
    return this.usersService.savePushToken(req.user.userId, body.token);
  }

  @Get('search')
  search(@Query('q') q: string) {
    return this.usersService.searchUsers(q ?? '');
  }

  @Get(':id')
  getById(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.getUserById(id);
  }
}

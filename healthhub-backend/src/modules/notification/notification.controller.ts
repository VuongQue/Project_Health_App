import { Controller, Get, Patch, Param, UseGuards, Req } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationController {
  constructor(private notiService: NotificationService) {}

  @Get()
  getMyNotifications(@Req() req) {
    return this.notiService.getMyNotifications(req.user);
  }

  @Patch(':id/read')
  markRead(@Param('id') id: number) {
    return this.notiService.markAsRead(id);
  }
  @Get('unread-count')
  async getUnread(@Req() req) {
  const count = await this.notiService.getUnreadCount(req.user);
  return { count: count ?? 0 };
}
}

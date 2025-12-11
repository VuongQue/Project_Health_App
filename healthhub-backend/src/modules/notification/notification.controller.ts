// src/notifications/notification.controller.ts
import {
  Controller,
  Get,
  Patch,
  Param,
  UseGuards,
  Req,
} from '@nestjs/common';
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

  @Get('unread-count')
  async getUnread(@Req() req) {
    const count = await this.notiService.getUnreadCount(req.user);
    return { count };
  }

  @Patch(':id/read')
  markRead(@Param('id') id: string, @Req() req) {
    return this.notiService.markAsRead(Number(id), req.user);
  }

  @Patch('read-all')
  markAllRead(@Req() req) {
    return this.notiService.markAllAsRead(req.user);
  }
}

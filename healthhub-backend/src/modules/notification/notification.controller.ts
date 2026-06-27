import {
  Controller,
  Get,
  Patch,
  Delete,
  Param,
  Query,
  UseGuards,
  Req,
  Logger,
} from '@nestjs/common';

import { NotificationService } from './notification.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationController {
  private readonly logger = new Logger(NotificationController.name);

  constructor(private readonly notiService: NotificationService) {}

  // =====================================================
  // 🔔 GET MY NOTIFICATIONS
  // =====================================================
  @Get()
  async getMyNotifications(
    @Req() req,
    @Query('page') page = '1',
    @Query('limit') limit = '20',
  ) {
    const userId = Number(req.user?.userId);
    const result = await this.notiService.getMyNotifications(
      userId,
      Number(page),
      Number(limit),
    );
    this.logger.log(`[GET] /notifications → userId=${userId}, total=${result.total}`);
    return result;
  }

  // =====================================================
  // 🔢 GET UNREAD COUNT
  // =====================================================
  @Get('unread-count')
  async unreadCount(@Req() req) {
    const userId = Number(req.user?.userId);

    this.logger.log(
      `[GET] /notifications/unread-count → userId=${userId}`,
    );

    const count = await this.notiService.getUnreadCount(userId);

    this.logger.log(
      `[GET] /notifications/unread-count → count=${count}`,
    );

    return count; // FE đọc number trực tiếp
  }

  // =====================================================
  // 👁️ MARK ONE AS READ
  // =====================================================
  @Patch(':id/read')
  async markRead(@Param('id') id: string, @Req() req) {
    const userId = Number(req.user?.userId);

    this.logger.log(
      `[PATCH] /notifications/${id}/read → userId=${userId}`,
    );

    const updated = await this.notiService.markAsRead(
      Number(id),
      userId,
    );

    this.logger.debug(
      `Marked as read: ${JSON.stringify(updated)}`,
    );

    return updated;
  }

  // =====================================================
  // 👁️👁️ MARK ALL AS READ
  // =====================================================
  @Patch('read-all')
  async markAll(@Req() req) {
    const userId = Number(req.user?.userId);

    this.logger.log(
      `[PATCH] /notifications/read-all → userId=${userId}`,
    );

    const result = await this.notiService.markAllAsRead(userId);

    this.logger.log(
      `[PATCH] /notifications/read-all → done`,
    );

    return result;
  }

  // =====================================================
  // 🧹 CLEAR ALL
  // =====================================================
  @Delete('clear')
  async clearAll(@Req() req) {
    const userId = Number(req.user?.userId);

    this.logger.log(
      `[DELETE] /notifications/clear → userId=${userId}`,
    );

    const result = await this.notiService.clearAll(userId);

    this.logger.log(
      `[DELETE] /notifications/clear → done`,
    );

    return result;
  }
}

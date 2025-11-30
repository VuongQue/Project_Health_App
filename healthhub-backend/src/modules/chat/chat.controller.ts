import { Controller, Get, Param, Query, Post, Body, UseGuards, Req } from '@nestjs/common';
import { ChatService } from './chat.service';
import { SendMessageDto } from './dto/send-message.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@Controller('chat')
@UseGuards(JwtAuthGuard)
export class ChatController {
  constructor(private chatService: ChatService) {}

  /** GET ROOMS */
  @Get('rooms')
  async getRooms(@Req() req) {
    const userId = String(req.user.userId);
    return this.chatService.getUserRooms(userId);
  }

  /** OPEN CHAT (no message creation) */
  @Post('open')
  async openChat(@Req() req, @Body() dto: { receiverId: string }) {
    const userId = String(req.user.userId);
    const room = await this.chatService.findOrCreateRoom(userId, dto.receiverId);
    return { roomId: room.id };
  }

  /** GET MESSAGES */
  @Get('messages/:roomId')
  async getMessages(
    @Param('roomId') roomId: string,
    @Query('limit') limit = '50',
  ) {
    return this.chatService.getMessages(roomId, Number(limit));
  }

  /** SEND MESSAGE (REST) */
  @Post('message')
  async sendMessage(@Req() req, @Body() dto: SendMessageDto) {
    const userId = String(req.user.userId);
    return this.chatService.sendMessage(userId, dto);
  }
}

import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger, UseGuards } from '@nestjs/common';
import { ChatService } from './chat.service';
import { WsJwtGuard } from '../../common/guards/ws-jwt.guard';
import { SendMessageDto } from './dto/send-message.dto';

@WebSocketGateway({ cors: { origin: '*' } })
@UseGuards(WsJwtGuard)
export class ChatGateway {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(ChatGateway.name);

  constructor(private chatService: ChatService) {}

  handleConnection(client: Socket) {
    const user: any = (client as any).user;
    this.logger.debug(`Client connected: ${client.id} | userId=${user?.userId ?? 'unknown'}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.debug(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('joinRoom')
  async handleJoinRoom(
    @MessageBody() data: { roomId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const roomId = String(data.roomId);
    client.join(roomId);
    this.logger.debug(`Client ${client.id} joined room ${roomId}`);
  }

  @SubscribeMessage('typing')
  handleTyping(
    @MessageBody() data: { roomId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const user: any = (client as any).user;
    const userId = String(user?.userId ?? user?.id ?? user?.sub ?? '');
    const roomId = String(data.roomId);
    client.to(roomId).emit('typing', { userId, roomId });
  }

  @SubscribeMessage('sendMessage')
  async handleSendMessage(
    @MessageBody() dto: SendMessageDto,
    @ConnectedSocket() client: Socket,
  ) {
    const user: any = (client as any).user;
    const senderId = String(user?.userId ?? user?.id ?? user?.sub ?? '');

    if (!senderId) {
      this.logger.warn(`sendMessage aborted: no senderId (client ${client.id})`);
      return;
    }

    try {
      const msg = await this.chatService.sendMessage(senderId, dto);
      const safeMsg = {
        ...msg,
        senderId: String(msg.senderId),
        roomId: String(msg.roomId),
      };
      this.server.to(safeMsg.roomId).emit('message', safeMsg);
      this.logger.debug(`Message sent to room ${safeMsg.roomId} by user ${senderId}`);
    } catch (err: any) {
      this.logger.error(`sendMessage error: ${err?.message}`, err?.stack);
    }
  }
}

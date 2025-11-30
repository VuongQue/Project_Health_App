import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { UseGuards } from '@nestjs/common';
import { ChatService } from './chat.service';
import { WsJwtGuard } from '../../common/guards/ws-jwt.guard';
import { SendMessageDto } from './dto/send-message.dto';

@WebSocketGateway({
  cors: { origin: '*' },
})
@UseGuards(WsJwtGuard)
export class ChatGateway {
  @WebSocketServer()
  server: Server;

  constructor(private chatService: ChatService) {}

  handleConnection(client: Socket) {
    const user: any = (client as any).user;
    console.log('===========================');
    console.log('[WS][handleConnection] client.id =', client.id);
    console.log('[WS][handleConnection] user payload =', user);
    console.log('===========================');
  }

  handleDisconnect(client: Socket) {
    console.log('[WS][handleDisconnect] client.id =', client.id);
  }

  /** JOIN ROOM */
  @SubscribeMessage('joinRoom')
  async handleJoinRoom(
    @MessageBody() data: { roomId: string },
    @ConnectedSocket() client: Socket,
  ) {
    console.log('---------------------------');
    console.log('[WS][joinRoom] raw payload =', data);
    const roomId = String(data.roomId);
    console.log('[WS][joinRoom] client.id =', client.id);
    console.log('[WS][joinRoom] roomId =', roomId);

    client.join(roomId);

    // log danh sách room của client sau khi join
    console.log('[WS][joinRoom] client.rooms =', Array.from(client.rooms));
    console.log('---------------------------');
  }

  /** SEND MESSAGE (REALTIME) */
  @SubscribeMessage('sendMessage')
  async handleSendMessage(
    @MessageBody() dto: SendMessageDto,
    @ConnectedSocket() client: Socket,
  ) {
    console.log('***************************');
    console.log('[WS][sendMessage] dto =', dto);

    const user: any = (client as any).user;
    console.log('[WS][sendMessage] socket user payload =', user);

    const senderId = String(user?.userId ?? user?.id ?? user?.sub ?? '');
    console.log('[WS][sendMessage] resolved senderId =', senderId);

    if (!senderId) {
      console.error('[WS][sendMessage] ❌ MISSING senderId -> abort emit');
      console.log('***************************');
      return;
    }

    try {
      const msg = await this.chatService.sendMessage(senderId, dto);
      console.log('[WS][sendMessage] message from service =', msg);

      const safeMsg = {
        ...msg,
        senderId: String(msg.senderId),
        roomId: String(msg.roomId),
      };

      console.log(
        '[WS][sendMessage] broadcasting to room =',
        safeMsg.roomId,
        ' | sender =',
        safeMsg.senderId,
      );

      this.server.to(safeMsg.roomId).emit('message', safeMsg);
    } catch (err) {
      console.error('[WS][sendMessage] ❌ Error =', err);
    }

    console.log('***************************');
  }
}

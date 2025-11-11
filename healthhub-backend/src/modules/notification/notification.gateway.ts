import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';

@WebSocketGateway({
  cors: { origin: '*' }, // cho phép kết nối từ frontend
})
export class NotificationGateway {
  @WebSocketServer()
  server: Server;

  private logger = new Logger(NotificationGateway.name);

  handleConnection(client: Socket) {
    this.logger.log(`✅ Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`❌ Client disconnected: ${client.id}`);
  }

  // Emit từ backend khi có thông báo mới
  sendNotificationToUser(userId: number, payload: any) {
    this.server.to(`user_${userId}`).emit('notification', payload);
  }

  // Frontend sẽ emit “registerUser” để join vào room riêng
  @SubscribeMessage('registerUser')
  handleRegister(@MessageBody() userId: number, @ConnectedSocket() client: Socket) {
    client.join(`user_${userId}`);
    this.logger.log(`👤 User ${userId} joined room user_${userId}`);
  }
}

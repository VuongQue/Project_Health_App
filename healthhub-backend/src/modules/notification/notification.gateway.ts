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
  cors: { origin: '*' },
  namespace: '/notifications', // FE sẽ connect vào /notifications
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

  // backend dùng chỗ này để gửi noti xuống 1 user
  sendNotificationToUser(userId: number, payload: any) {
    this.server.to(`user_${userId}`).emit('notification', payload);
  }

  // FE gọi registerUser để join room riêng
  @SubscribeMessage('registerUser')
  handleRegister(
    @MessageBody() userId: number,
    @ConnectedSocket() client: Socket,
  ) {
    client.join(`user_${userId}`);
    this.logger.log(`👤 User ${userId} joined room user_${userId}`);
  }
}

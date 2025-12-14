import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  ConnectedSocket,
} from "@nestjs/websockets";

import { Server, Socket } from "socket.io";
import * as jwt from "jsonwebtoken";
import { Logger } from "@nestjs/common";

@WebSocketGateway({
  cors: { origin: "*" },
  namespace: "/notifications",
})
export class NotificationGateway {
  @WebSocketServer() server: Server;

  private logger = new Logger(NotificationGateway.name);

  handleConnection(client: Socket) {
    const token = client.handshake.auth?.token;
    if (!token) {
      this.logger.error("❌ Missing token");
      return client.disconnect();
    }

    try {
      const payload: any = jwt.verify(token, process.env.JWT_SECRET!);

      client.data.user = {
        id: payload.sub,
        email: payload.email,
      };

      this.logger.log(
        `🔌 Connected: ${client.id}, userId = ${client.data.user.id}`,
      );
    } catch (err) {
      this.logger.error("❌ Invalid WS token", err);
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`❌ Disconnected: ${client.id}`);
  }

  @SubscribeMessage("registerUser")
  handleRegister(@ConnectedSocket() client: Socket) {
    const user = client.data.user;
    const room = `user_${user.id}`;

    client.join(room);
    this.logger.log(`👤 User ${user.id} joined room ${room}`);
  }

  sendNotificationToUser(userId: number, payload: any) {
    this.server.to(`user_${userId}`).emit("notification", payload);
    this.logger.log(`📨 Push → user_${userId}`, payload);
  }
}

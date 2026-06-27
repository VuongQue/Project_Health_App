import { CanActivate, ExecutionContext, Injectable, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class WsJwtGuard implements CanActivate {
  private readonly logger = new Logger(WsJwtGuard.name);

  constructor(private jwtService: JwtService) {}

  canActivate(context: ExecutionContext): boolean {
    const client = context.switchToWs().getClient();
    const token =
      client.handshake.auth?.token ||
      client.handshake.headers['authorization']?.toString().replace('Bearer ', '');

    if (!token) {
      this.logger.warn(`WS auth failed: no token (client ${client.id})`);
      return false;
    }

    try {
      const payload = this.jwtService.verify(token);
      (client as any).user = { userId: payload.sub, email: payload.email };
      return true;
    } catch (err: any) {
      this.logger.warn(`WS auth failed: ${err?.message} (client ${client.id})`);
      return false;
    }
  }
}

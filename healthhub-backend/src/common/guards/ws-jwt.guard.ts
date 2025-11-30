import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class WsJwtGuard implements CanActivate {
  constructor(private jwtService: JwtService) {}

  canActivate(context: ExecutionContext): boolean {
    const client = context.switchToWs().getClient();
    const token =
      client.handshake.auth?.token ||
      client.handshake.headers['authorization']?.toString().replace('Bearer ', '');
    console.log("[WsJwtGuard] token received =", token);
    if (!token) {
      console.log('[WsJwtGuard] ❌ No token in handshake');
      return false;
    }

    try {
      const payload = this.jwtService.verify(token);
      console.log('[WsJwtGuard] ✅ payload =', payload);

      (client as any).user = {
        userId: payload.sub,
        email: payload.email,
      };

      console.log('[WsJwtGuard] ✅ attached user =', (client as any).user);

      return true;
    } catch (err) {
      console.log('[WsJwtGuard] ❌ verify error:', err);
      return false;
    }
  }
}

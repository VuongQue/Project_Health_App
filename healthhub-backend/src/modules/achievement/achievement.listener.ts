import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class AchievementListener {
  private readonly logger = new Logger(AchievementListener.name);

  // ❌ KHÔNG unlock ở đây nữa
  // Chỉ giữ nếu sau này cần analytics / audit
}

import { Injectable, Logger } from '@nestjs/common';
import { UsersService } from '../modules/users/users.service';
import { UserRole, UserStatus } from '../modules/users/entities/user.entity';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AdminSeedService {
  private readonly logger = new Logger(AdminSeedService.name);

  constructor(private readonly usersService: UsersService) {}

  async seedAdmin() {
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@healthhub.com';
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';

    const existing = await this.usersService.findByEmail(adminEmail);
    if (existing) {
      this.logger.log('Admin account already exists');
      return;
    }

    const hashed = await bcrypt.hash(adminPassword, 10);

    await this.usersService.create({
      email: adminEmail,
      password: hashed,
      fullName: 'HealthHub Admin',
      username: 'admin',
      role: UserRole.ADMIN,
      status: UserStatus.ACTIVE,
      isVerified : true,
    });

    this.logger.log(`Admin account created: ${adminEmail}`);
  }
}

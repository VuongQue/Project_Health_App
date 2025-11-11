import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Achievement } from './entities/achievement.entity';
import { UserAchievement } from './entities/user-achievement.entity';
import { UsersService } from '../users/users.service';

@Injectable()
export class AchievementService {
  constructor(
    @InjectRepository(Achievement) private achRepo: Repository<Achievement>,
    @InjectRepository(UserAchievement) private userAchRepo: Repository<UserAchievement>,
    private usersService: UsersService,
  ) {}

  getAll() {
    return this.achRepo.find();
  }

  async myAchievements(userEmail: string) {
    const user = await this.usersService.findByEmail(userEmail);
    if (!user) {
    throw new NotFoundException(`User with email ${userEmail} not found`);
  }
    return this.userAchRepo.find({ where: { user }, relations: ['achievement'] });
  }
}

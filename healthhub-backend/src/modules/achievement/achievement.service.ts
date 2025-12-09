import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Achievement } from './entities/achievement.entity';
import { UserAchievement } from './entities/user-achievement.entity';
import { UsersService } from '../users/users.service';
import { User } from '../users/entities/user.entity';

@Injectable()
export class AchievementService {
  constructor(
    @InjectRepository(Achievement)
    private achRepo: Repository<Achievement>,

    @InjectRepository(UserAchievement)
    private userAchRepo: Repository<UserAchievement>,

    private usersService: UsersService,
  ) {}

  getAll() {
    return this.achRepo.find();
  }

  async myAchievements(userEmail: string) {
    const user = await this.usersService.findByEmail(userEmail);
    if (!user) throw new NotFoundException('User not found');

    const list = await this.userAchRepo.find({
      where: { user: { id: user.id } },
      relations: ['achievement'],
      order: { earnedAt: 'DESC' },
    });

    return list.map((ua) => ({
      id: ua.id,
      code: ua.achievement.code,
      name: ua.achievement.name,
      description: ua.achievement.description,
      points: ua.achievement.points,
      earnedAt: ua.earnedAt,
    }));
  }

  async unlockAchievement(user: User, code: string) {
    const ach = await this.achRepo.findOne({ where: { code } });
    if (!ach) throw new NotFoundException(`Achievement ${code} not found`);

    const existed = await this.userAchRepo.findOne({
      where: { user: { id: user.id }, achievement: { id: ach.id } },
    });

    if (existed) return existed;

    const record = this.userAchRepo.create({
      user,
      achievement: ach,
    });

    return this.userAchRepo.save(record);
  }

  async getRecentAchievements(userId: number, limit = 6) {
    return this.userAchRepo.find({
      where: { user: { id: userId } },
      relations: ['achievement'],
      order: { earnedAt: 'DESC' },
      take: limit,
    });
  }


  async countUserBadges(userId: number) {
    return this.userAchRepo.count({
      where: { user: { id: userId } },
    });
  }

}

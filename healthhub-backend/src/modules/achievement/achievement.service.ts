import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Achievement } from './entities/achievement.entity';
import { UserAchievement } from './entities/user-achievement.entity';
import { UsersService } from '../users/users.service';

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

    const unlocked = await this.userAchRepo.find({
      where: { user: { id: user.id } },
      relations: ["achievement"], 
    });


    const all = await this.achRepo.find();

    return all
      // ❌ Ẩn hoàn toàn secret chưa unlock
      .filter(
        (a) =>
          !(
            a.hiddenLevel === 3 &&
            !unlocked.some((u) => u.achievement.id === a.id)
          ),
      )
      .map((a) => {
        const ua = unlocked.find((u) => u.achievement.id === a.id);

        if (!ua) {
          return {
            code: a.code,
            locked: true,
            displayName: a.hiddenLevel > 0 ? '???' : a.name,
            hint: a.hiddenLevel >= 1 ? a.hint : null,
            points: a.points,
          };
        }

        return {
          code: a.code,
          unlocked: true,
          name: a.name,
          description: a.description,
          points: a.points,
          earnedAt: ua.earnedAt,
        };
      });
  }

  async getRecentAchievements(userId: number, limit = 6) {
    return this.userAchRepo.find({
      where: { user: { id: userId } },
      order: { earnedAt: 'DESC' },
      take: limit,
    });
  }

  async countUserBadges(userId: number) {
    return this.userAchRepo.count({
      where: { user: { id: userId } },
    });
  }

  async getUnlockedBadgesForProfile(userId: number, limit = 6) {
    const rows = await this.userAchRepo.find({
      where: { user: { id: userId } },
      relations: ["achievement"],
      order: { earnedAt: "DESC" },
      take: limit,
    });

    return rows.map((ua) => ({
      code: ua.achievement.code,
      name: ua.achievement.name,
      description: ua.achievement.description,
      points: ua.achievement.points,
      earnedAt: ua.earnedAt,
    }));
  }


  // ===== ADMIN CRUD =====
  async create(dto: Partial<Achievement>) {
    const ach = this.achRepo.create(dto);
    return this.achRepo.save(ach);
  }

  async update(id: number, dto: Partial<Achievement>) {
    const ach = await this.achRepo.findOne({ where: { id } });
    if (!ach) throw new NotFoundException('Achievement not found');
    Object.assign(ach, dto);
    return this.achRepo.save(ach);
  }

  async remove(id: number) {
    const ach = await this.achRepo.findOne({ where: { id } });
    if (!ach) throw new NotFoundException('Achievement not found');
    await this.achRepo.delete(id);
    return { ok: true };
  }

}

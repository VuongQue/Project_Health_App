import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, Not, ILike } from 'typeorm';
import { User } from './entities/user.entity';
import { AchievementEngine } from '../achievement/achievement.engine';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    @InjectRepository(User)
    private usersRepo: Repository<User>,
    private readonly achievementEngine: AchievementEngine,
  ) {}

  async save(user: User) {
    return this.usersRepo.save(user);
  }

  findByEmail(email: string) {
    return this.usersRepo.findOne({ where: { email } });
  }

  create(data: Partial<User>) {
    const user = this.usersRepo.create(data);
    return this.usersRepo.save(user);
  }

  async getMe(email: string) {
    const user = await this.usersRepo.findOne({ where: { email } });

    if (!user) throw new Error('User not found');

    return {
      id: user.id,
      fullName: user.fullName,
      username: user.username,
      avatarUrl: user.avatarUrl,
      level: user.level,
      points: user.points,
      email: user.email,
    };
  }

  async getUserById(id: string | number) {
    const user = await this.usersRepo.findOne({
      where: { id: Number(id) },
    });

    if (!user) throw new NotFoundException('User not found');

    return {
      id: user.id,
      fullName: user.fullName,
      username: user.username,
      avatarUrl: user.avatarUrl,
      level: user.level,
      points: user.points,
      email: user.email,
    };
  }

  async getUserFullById(id: string | number): Promise<User> {
    const user = await this.usersRepo.findOne({ where: { id: Number(id) } });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async getUsersExclude(
    ids: number[],
    opts?: { excludeRoles?: string[] },
  ) {
    const qb = this.usersRepo.createQueryBuilder("u")
      .where("u.id NOT IN (:...ids)", { ids });

    if (opts?.excludeRoles?.length) {
      qb.andWhere("u.role NOT IN (:...roles)", { roles: opts.excludeRoles });
    }

    return qb.getMany();
  }

  async searchUsers(keyword: string) {
    return this.usersRepo.find({
      where: [
        { fullName: ILike(`%${keyword}%`) },
        { email: ILike(`%${keyword}%`) },
      ],
    });
  }

  async getProfile(userId: number) {
    return this.usersRepo.findOne({
      where: { id: userId },
      select: {
        id: true,
        fullName: true,
        username: true,
        avatarUrl: true,
        dailyGoal: true,
        level: true,
        points: true,
        email: true,
        createdAt: true,
      },
    });
  }

  async savePushToken(userId: number, token: string) {
    await this.usersRepo.update(userId, { expoPushToken: token });
    return { success: true };
  }

  async getPushToken(userId: number): Promise<string | null> {
    const user = await this.usersRepo.findOne({ where: { id: userId }, select: { expoPushToken: true } });
    return user?.expoPushToken ?? null;
  }

  async addPoints(userId: number, pts: number) {
    const user = await this.usersRepo.findOne({ where: { id: userId } });
    if (!user) return;
    user.points = (user.points ?? 0) + pts;
    // Level thresholds: 1→100, 2→250, 3→500, 4→1000, 5→2000 …
    const thresholds = [0, 100, 250, 500, 1000, 2000, 4000, 7000, 11000, 16000];
    let newLevel = 1;
    for (let i = thresholds.length - 1; i >= 0; i--) {
      if (user.points >= thresholds[i]) { newLevel = i + 1; break; }
    }
    user.level = newLevel;
    await this.usersRepo.save(user);
  }

  async updateProfile(userId: number, dto: any) {
  // Whitelist fields that users are allowed to update themselves
  const { fullName, username, avatarUrl, dailyGoal } = dto;
  const safeDto: Partial<User> = {};
  if (fullName   !== undefined) safeDto.fullName   = fullName;
  if (username   !== undefined) safeDto.username   = username;
  if (avatarUrl  !== undefined) safeDto.avatarUrl  = avatarUrl;
  if (dailyGoal  !== undefined) safeDto.dailyGoal  = dailyGoal;

  await this.usersRepo.update(userId, safeDto);

  const user = await this.usersRepo.findOne({
    where: { id: userId },
  });

  if (!user) throw new NotFoundException("User not found");

  // ✅ CHECK PROFILE COMPLETE
  const isProfileComplete =
    !!user.fullName &&
    !!user.username &&
    !!user.avatarUrl;

  // 🔥 GỌI ACHIEVEMENT ENGINE
  await this.achievementEngine.evaluate(
    user.id,
    "PROFILE_UPDATED",
    {
      profileComplete: isProfileComplete ? 1 : 0,
    }
  );


  return this.getProfile(userId);
}


}

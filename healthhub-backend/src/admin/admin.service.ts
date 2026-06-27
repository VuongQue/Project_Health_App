import { BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Like, Repository } from 'typeorm';

import { User } from 'src/modules/users/entities/user.entity';
import { Workout } from 'src/modules/fitness/entities/workout.entity';
import { WorkoutExercise } from 'src/modules/fitness/entities/workout-exercise.entity';
import { UserAchievement } from 'src/modules/achievement/entities/user-achievement.entity';
import { UserChallenge } from 'src/modules/challenge/entities/user-challenge.entity';

import { UsersService } from 'src/modules/users/users.service';
import { FitnessService } from 'src/modules/fitness/fitness.service';
import { CommunityService } from 'src/modules/community/community.service';
import { AchievementService } from 'src/modules/achievement/achievement.service';
import { ChallengeService } from 'src/modules/challenge/challenge.service';

export class AdminService {
  constructor(
    private readonly usersService: UsersService,
    private readonly fitnessService: FitnessService,
    private readonly communityService: CommunityService,
    private readonly achievementService: AchievementService,
    private readonly challengeService: ChallengeService,

    @InjectRepository(User) private readonly userRepo: Repository<User>,
    @InjectRepository(Workout) private readonly workoutRepo: Repository<Workout>,
    @InjectRepository(WorkoutExercise) private readonly workoutExRepo: Repository<WorkoutExercise>,
    @InjectRepository(UserAchievement) private readonly uaRepo: Repository<UserAchievement>,
    @InjectRepository(UserChallenge) private readonly ucRepo: Repository<UserChallenge>,
  ) {}

  // -----------------------
  // USERS
  // -----------------------
  async listUsers(opts: { keyword: string; page: number; limit: number }) {
    const { keyword, page, limit } = opts;
    const skip = (page - 1) * limit;

    const where = keyword
      ? [
          { email: Like(`%${keyword}%`) } as any,
          { fullName: Like(`%${keyword}%`) } as any,
          { username: Like(`%${keyword}%`) } as any,
        ]
      : {};

    const [items, total] = await this.userRepo.findAndCount({
      where: where as any,
      order: { createdAt: 'DESC' as any },
      take: limit,
      skip,
      select: ['id', 'email', 'fullName', 'username', 'role', 'status', 'createdAt', 'updatedAt'] as any,
    });

    return { items, total, page, limit };
  }

  async getUserDetail(id: number) {
    const user = await this.userRepo.findOne({ where: { id } as any });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async lockUser(id: number) {
    const user = await this.userRepo.findOne({ where: { id } as any });
    if (!user) throw new NotFoundException('User not found');

    (user as any).status = 'LOCKED';
    await this.userRepo.save(user);
    return { ok: true };
  }

  async unlockUser(id: number) {
    const user = await this.userRepo.findOne({ where: { id } as any });
    if (!user) throw new NotFoundException('User not found');

    (user as any).status = 'ACTIVE';
    (user as any).bannedUntil = null;
    await this.userRepo.save(user);
    return { ok: true };
  }

  async setUserRole(id: number, role: string) {
    const allow = ['USER', 'ADMIN', 'TRAINER', 'MODERATOR'];
    if (!allow.includes(role)) throw new BadRequestException('Invalid role');

    const user = await this.userRepo.findOne({ where: { id } as any });
    if (!user) throw new NotFoundException('User not found');

    (user as any).role = role;
    await this.userRepo.save(user);
    return { ok: true };
  }

  // -----------------------
  // WORKOUTS
  // -----------------------
  async listWorkouts(keyword = '') {
    // nếu FitnessService của bạn có method list -> gọi ở đây, nếu không dùng repo trực tiếp:
    if (!keyword) return this.workoutRepo.find({ order: { createdAt: 'DESC' as any } });

    return this.workoutRepo.find({
      where: [{ title: Like(`%${keyword}%`) } as any, { level: Like(`%${keyword}%`) } as any],
      order: { createdAt: 'DESC' as any },
    });
  }

  async createWorkout(dto: any) {
    // tuỳ entity workout của bạn, map field phù hợp
    const w = this.workoutRepo.create(dto);
    return this.workoutRepo.save(w);
  }

  async updateWorkout(id: number, dto: any) {
    const w = await this.workoutRepo.findOne({ where: { id } as any });
    if (!w) throw new NotFoundException('Workout not found');
    Object.assign(w, dto);
    return this.workoutRepo.save(w);
  }

  async deleteWorkout(id: number) {
    const w = await this.workoutRepo.findOne({ where: { id } as any });
    if (!w) throw new NotFoundException('Workout not found');
    await this.workoutRepo.delete({ id } as any);
    return { ok: true };
  }

  // -----------------------
  // COMMUNITY POSTS (Mongo)
  // -----------------------
  async listPosts(keyword: string, page: number, limit: number) {
    // CommunityService bạn đã có: mình gọi wrapper, nếu chưa có method thì bạn thêm theo mẫu bên dưới
    return this.communityService.adminListPosts(keyword, page, limit);
  }

  async hidePost(id: string) {
    return this.communityService.adminHidePost(id);
  }

  async unhidePost(id: string) {
    return this.communityService.adminUnhidePost(id);
  }

  async deletePost(id: string) {
    return this.communityService.adminDeletePost(id);
  }

  async listReports(page: number, limit: number, status?: string) {
    return this.communityService.getAdminReports(page, limit, status);
  }

  async resolveReport(reportId: string, action: 'warn' | 'hide' | 'dismiss', adminNote?: string) {
    return this.communityService.resolveReport(reportId, action, adminNote);
  }

  // -----------------------
  // ACHIEVEMENTS / CHALLENGES
  // -----------------------
  // Achievements
    async listAchievements() { return this.achievementService.getAll(); }
    async createAchievement(dto:any){ return this.achievementService.create(dto); }
    async updateAchievement(id:number,dto:any){ return this.achievementService.update(id,dto); }
    async deleteAchievement(id:number){ return this.achievementService.remove(id); }

    // Challenges
    async listChallenges(){ return this.challengeService.findAll(); }
    async createChallenge(dto:any){ return this.challengeService.create(dto); }
    async updateChallenge(id:number,dto:any){ return this.challengeService.update(id,dto); }
    async deleteChallenge(id:number){ return this.challengeService.remove(id); }

  // -----------------------
  // DASHBOARD STATS
  // -----------------------
  async getDashboardStats() {
    const [totalUsers, totalWorkouts, totalWorkoutExercises, totalUserAchievements, totalUserChallenges] =
      await Promise.all([
        this.userRepo.count(),
        this.workoutRepo.count(),
        this.workoutExRepo.count(),
        this.uaRepo.count(),
        this.ucRepo.count(),
      ]);

    const totalPosts = await this.communityService.adminCountPosts();

    return {
      totalUsers,
      totalWorkouts,
      totalWorkoutExercises,
      totalPosts,
      totalUserAchievements,
      totalUserChallenges,
    };
  }
}

import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Challenge } from './entities/challenge.entity';
import { UserChallenge } from './entities/user-challenge.entity';
import { UsersService } from '../users/users.service';
import { AchievementListener } from '../achievement/achievement.listener';
import { NotificationService } from '../notification/notification.service';
import { NotificationGateway } from '../notification/notification.gateway';

@Injectable()
export class ChallengeService {
  constructor(
    @InjectRepository(Challenge)
    private challengeRepo: Repository<Challenge>,

    @InjectRepository(UserChallenge)
    private userChallengeRepo: Repository<UserChallenge>,

    private usersService: UsersService,
    private achListener: AchievementListener,
    private notiService: NotificationService,
    private notiGateway: NotificationGateway,
  ) {}

  // ================= CREATE CHALLENGE =================
  async create(dto: any) {
    const challenge = this.challengeRepo.create(dto);
    return this.challengeRepo.save(challenge);
  }

  getAll() {
    return this.challengeRepo.find();
  }

  // ================= JOIN CHALLENGE ===================
  async join(userEmail: string, challengeId: number) {
    const user = await this.usersService.findByEmail(userEmail);
    if (!user) throw new NotFoundException(`User with email ${userEmail} not found`);

    const challenge = await this.challengeRepo.findOne({ where: { id: challengeId } });
    if (!challenge) throw new NotFoundException(`Challenge ${challengeId} not found`);

    // Check duplicate join
    const existed = await this.userChallengeRepo.findOne({
      where: { user: { id: user.id }, challenge: { id: challengeId } },
    });
    if (existed) throw new BadRequestException('Bạn đã tham gia thử thách này rồi');

    const record = this.userChallengeRepo.create({
      user,
      challenge,
      status: 'ongoing',
      completedDays: 0,
      lastCompletedDate: null,
    });

    return this.userChallengeRepo.save(record);
  }

  // ================= USER CHALLENGES ===================
  async myChallenges(userEmail: string) {
    const user = await this.usersService.findByEmail(userEmail);
    if (!user) throw new NotFoundException(`User with email ${userEmail} not found`);

    const list = await this.userChallengeRepo.find({
      where: { user: { id: user.id } },
      relations: ['challenge'],
    });

    
    return list.map((uc) => {
      const total = uc.challenge.durationDays;
      const completed = uc.completedDays;
      const progress = completed / total;
      const remaining = total - completed;

      return {
        id: uc.id,
        challengeId: uc.challenge.id,
        name: uc.challenge.name,
        description: uc.challenge.description,
        durationDays: total,
        completedDays: completed,
        daysRemaining: remaining,
        progress,
        status: uc.status,
        joinedAt: uc.joinedAt,
      };
    });
  }

  // ================= COMPLETE ONE DAY ==================
  async addProgress(userEmail: string, challengeUserId: number) {
    const user = await this.usersService.findByEmail(userEmail);
    if (!user) throw new NotFoundException(`User with email ${userEmail} not found`);

    const uc = await this.userChallengeRepo.findOne({
      where: { id: challengeUserId, user: { id: user.id } },
      relations: ['challenge'],
    });
    if (!uc) throw new NotFoundException('Bạn chưa tham gia thử thách này');

    if (uc.status === 'completed') {
      throw new BadRequestException('Bạn đã hoàn thành thử thách này rồi');
    }

    const today = new Date().toISOString().slice(0, 10);

    // Không cho complete 2 lần trong 1 ngày
    if (uc.lastCompletedDate === today) {
      throw new BadRequestException('Hôm nay bạn đã đánh dấu rồi');
    }

    uc.completedDays += 1;
    uc.lastCompletedDate = today;

    // Nếu hoàn tất thử thách
    if (uc.completedDays >= uc.challenge.durationDays) {
      uc.status = 'completed';

      // Gửi notification hoàn thành challenge
      await this.notiService.create(
        user,
        'CHALLENGE',
        `Bạn đã hoàn thành thử thách "${uc.challenge.name}"!`,
      );

      this.notiGateway.sendNotificationToUser(user.id, {
        type: 'CHALLENGE',
        message: `Bạn đã hoàn thành thử thách "${uc.challenge.name}"!`,
      });

      // Achievement: First Challenge Completed
      const completedCount = await this.userChallengeRepo.count({
        where: { user: { id: user.id }, status: 'completed' },
      });

      if (completedCount === 1) {
        await this.achListener.unlockAchievement(user, 'FIRST_CHALLENGE');
      }
    }

    await this.userChallengeRepo.save(uc);

    return {
      message: 'Progress updated',
      completedDays: uc.completedDays,
      totalDays: uc.challenge.durationDays,
      progress: uc.completedDays / uc.challenge.durationDays,
      status: uc.status,
    };
  }

  async getUserActiveChallenges(userId: number) {
    const list = await this.userChallengeRepo.find({
      where: {
        user: { id: userId },
        status: 'ongoing',
      },
      relations: ['challenge'],
    });

    return list.map((uc) => {
      const total = uc.challenge.durationDays;
      const completed = uc.completedDays;
      const progress = completed / total;

      return {
        id: uc.id,
        challengeId: uc.challenge.id,
        name: uc.challenge.name,
        description: uc.challenge.description,
        durationDays: total,
        completedDays: completed,
        progress,
        status: uc.status,
      };
    });
  }

}

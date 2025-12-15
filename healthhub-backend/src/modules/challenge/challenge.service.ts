import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Challenge } from './entities/challenge.entity';
import { UserChallenge } from './entities/user-challenge.entity';
import { CreateChallengeDto } from './dto/create-challenge.dto';
import { UpdateChallengeDto } from './dto/update-challenge.dto';

@Injectable()
export class ChallengeService {
  constructor(
    @InjectRepository(Challenge) private challengeRepo: Repository<Challenge>,
    @InjectRepository(UserChallenge) private userChallengeRepo: Repository<UserChallenge>,
  ) {}

  // Admin create
  async create(dto: CreateChallengeDto) {
    const c = this.challengeRepo.create({
      ...dto,
      isActive: dto.isActive ?? true,
      isPublic: dto.isPublic ?? true,
    });
    return this.challengeRepo.save(c);
  }

  async update(id: number, dto: UpdateChallengeDto) {
    const c = await this.challengeRepo.findOne({ where: { id } });
    if (!c) throw new NotFoundException('Challenge not found');
    Object.assign(c, dto);
    return this.challengeRepo.save(c);
  }

  async deactivate(id: number) {
    const c = await this.challengeRepo.findOne({ where: { id } });
    if (!c) throw new NotFoundException('Challenge not found');
    c.isActive = false;
    return this.challengeRepo.save(c);
  }

  /**
   * List challenge public + kèm trạng thái user đã join hay chưa
   */
  async listForUser(userId?: number) {
    const challenges = await this.challengeRepo.find({
      where: { isActive: true, isPublic: true },
      order: { createdAt: 'DESC' },
    });

    // chưa login → chỉ xem public
    if (!userId) {
      return challenges.map((c) => ({
        id: c.id,
        name: c.name,
        description: c.description,
        type: c.type,
        targetCount: c.targetCount,
        durationDays: c.durationDays ?? null,
        joined: false,
      }));
    }

    const userChallenges = await this.userChallengeRepo.find({
      where: {
        user: { id: userId },
        challenge: { id: In(challenges.map((c) => c.id)) },
      },
      relations: ['challenge'],
    });

    const map = new Map<number, UserChallenge>();
    userChallenges.forEach((uc) => map.set(uc.challenge.id, uc));

    return challenges.map((c) => {
      const uc = map.get(c.id);

      return {
        id: c.id,
        name: c.name,
        description: c.description,
        type: c.type,
        targetCount: c.targetCount,
        durationDays: c.durationDays ?? null,

        joined: !!uc,

        userChallenge: uc
          ? {
              id: uc.id,
              completedCount: uc.completedCount,
              progress:
                c.targetCount > 0
                  ? uc.completedCount / c.targetCount
                  : 0,
              status: uc.status,
              currentStreak: uc.currentStreak,
              maxStreak: uc.maxStreak,
            }
          : null,
      };
    });
    }


  async join(userId: number, challengeId: number) {
    const challenge = await this.challengeRepo.findOne({
      where: { id: challengeId, isActive: true },
    });
    if (!challenge) throw new NotFoundException('Challenge not found');

    const existed = await this.userChallengeRepo.findOne({
      where: { user: { id: userId }, challenge: { id: challengeId } },
    });
    if (existed) {
      throw new BadRequestException('Bạn đã tham gia thử thách này rồi');
    }

    const record = this.userChallengeRepo.create({
      user: { id: userId } as any,
      challenge,
      status: 'ongoing',
      completedCount: 0,
      currentStreak: 0,
      maxStreak: 0,
      lastCompletedDate: null,
      todayCount: 0,
      todayKey: null,
    });

    return this.userChallengeRepo.save(record);
  }


  async leave(userId: number, userChallengeId: number) {
    const uc = await this.userChallengeRepo.findOne({
      where: { id: userChallengeId, user: { id: userId } },
    });
    if (!uc) throw new NotFoundException('UserChallenge not found');
    await this.userChallengeRepo.delete(uc.id);
    return { message: 'Left challenge' };
  }

  async myChallenges(userId: number) {
    const list = await this.userChallengeRepo.find({
      where: { user: { id: userId } },
      relations: ['challenge'],
      order: { joinedAt: 'DESC' },
    });

    return list.map((uc) => ({
      id: uc.id,
      challengeId: uc.challenge.id,
      name: uc.challenge.name,
      description: uc.challenge.description,
      type: uc.challenge.type,
      targetCount: uc.challenge.targetCount,
      completedCount: uc.completedCount,
      progress: uc.challenge.targetCount ? uc.completedCount / uc.challenge.targetCount : 0,
      status: uc.status,
      currentStreak: uc.currentStreak,
      maxStreak: uc.maxStreak,
      lastCompletedDate: uc.lastCompletedDate,
      joinedAt: uc.joinedAt,
    }));
  }

  async getOneUserChallenge(userId: number, userChallengeId: number) {
    const uc = await this.userChallengeRepo.findOne({
      where: { id: userChallengeId, user: { id: userId } },
      relations: ['challenge'],
    });
    if (!uc) throw new NotFoundException('UserChallenge not found');
    return uc;
  }

  async getUserActiveChallenges(userId: number) {
    const list = await this.userChallengeRepo.find({
      where: {
        user: { id: userId },
        status: 'ongoing',
      },
      relations: ['challenge'],
      order: { joinedAt: 'DESC' },
    });

    return list.map((uc) => ({
      id: uc.id,
      challengeId: uc.challenge.id,
      name: uc.challenge.name,
      description: uc.challenge.description,
      type: uc.challenge.type,
      targetCount: uc.challenge.targetCount,
      completedCount: uc.completedCount,
      progress:
        uc.challenge.targetCount > 0
          ? uc.completedCount / uc.challenge.targetCount
          : 0,
      currentStreak: uc.currentStreak,
      maxStreak: uc.maxStreak,
      lastCompletedDate: uc.lastCompletedDate,
      joinedAt: uc.joinedAt,
    }));
  }

}

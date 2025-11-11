import { Injectable, NotFoundException } from '@nestjs/common';
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
    @InjectRepository(Challenge) private challengeRepo: Repository<Challenge>,
    @InjectRepository(UserChallenge) private userChallengeRepo: Repository<UserChallenge>,
    private usersService: UsersService,
    private achListener: AchievementListener,
    private notiService: NotificationService,
    private notiGateway: NotificationGateway,
  ) {}

  async create(dto: any) {
    const challenge = this.challengeRepo.create(dto);
    return this.challengeRepo.save(challenge);
  }

  getAll() {
    return this.challengeRepo.find();
  }

  async join(userEmail: string, challengeId: number) {
    const user = await this.usersService.findByEmail(userEmail);
    if (!user) {
    throw new NotFoundException(`User with email ${userEmail} not found`);
  }
    const challenge = await this.challengeRepo.findOne({ where: { id: challengeId } });
    if (!challenge) {
    throw new NotFoundException(`Challenge ${challengeId} not found`);
  }
    const record = this.userChallengeRepo.create({ user, challenge });
    return this.userChallengeRepo.save(record);
  }

  async myChallenges(userEmail: string) {
    const user = await this.usersService.findByEmail(userEmail);
    if (!user) {
    throw new NotFoundException(`User with email ${userEmail} not found`);
  }
    console.log('🔍 JWT email:', userEmail);
    console.log('🔍 DB user id:', user?.id);

    return this.userChallengeRepo.find({
    where: { user: { id: user.id } },
    relations: ['challenge'],
    });
  }

  async completeChallenge(userEmail: string, challengeId: number) {
    const user = await this.usersService.findByEmail(userEmail);
    if (!user) {
    throw new NotFoundException(`User with email ${userEmail} not found`);
  }
    console.log('🔍 JWT email:', userEmail);
    console.log('🔍 DB user id:', user?.id);
    const record = await this.userChallengeRepo.findOne({
    where: {
        user: { id: user.id },
        challenge: { id: challengeId },
    },
    relations: ['challenge'],
    });
    if (!record) throw new NotFoundException('Bạn chưa tham gia thử thách này');
    record.status = 'completed';
    await this.userChallengeRepo.save(record);

    await this.notiService.create(user, 'CHALLENGE', `Bạn đã hoàn thành thử thách "${record.challenge.name}"!`);
    this.notiGateway.sendNotificationToUser(user.id, {
    type: 'CHALLENGE',
    message: `Bạn đã hoàn thành thử thách "${record.challenge.name}"!`,
    });


    // 🏅 Trao huy hiệu đầu tiên
    const count = await this.userChallengeRepo.count({
      where: { 
        user: { id: user.id },
        status: 'completed' },
    });
    if (count === 1) {
      await this.achListener.unlockAchievement(user, 'FIRST_CHALLENGE');
    }
    return record;
  }
}

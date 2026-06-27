import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserGoal, GoalStatus } from './entities/user-goal.entity';
import { CreateGoalDto } from './dto/create-goal.dto';

@Injectable()
export class GoalsService {
  constructor(
    @InjectRepository(UserGoal)
    private readonly repo: Repository<UserGoal>,
  ) {}

  async create(userId: number, dto: CreateGoalDto) {
    const goal = this.repo.create({
      userId,
      ...dto,
      deadline: dto.deadline ? new Date(dto.deadline) : undefined,
    });
    return this.repo.save(goal);
  }

  async getAll(userId: number) {
    return this.repo.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }

  async getActive(userId: number) {
    return this.repo.find({
      where: { userId, status: GoalStatus.ACTIVE },
      order: { createdAt: 'DESC' },
    });
  }

  async updateProgress(userId: number, id: number, currentValue: number) {
    const goal = await this.repo.findOne({ where: { id, userId } });
    if (!goal) throw new NotFoundException('Goal not found');

    goal.currentValue = currentValue;

    if (goal.targetValue && currentValue >= goal.targetValue) {
      goal.status = GoalStatus.COMPLETED;
    }

    return this.repo.save(goal);
  }

  async updateStatus(userId: number, id: number, status: GoalStatus) {
    const goal = await this.repo.findOne({ where: { id, userId } });
    if (!goal) throw new NotFoundException('Goal not found');
    goal.status = status;
    return this.repo.save(goal);
  }

  async delete(userId: number, id: number) {
    const goal = await this.repo.findOne({ where: { id, userId } });
    if (!goal) return { success: false };
    await this.repo.remove(goal);
    return { success: true };
  }
}

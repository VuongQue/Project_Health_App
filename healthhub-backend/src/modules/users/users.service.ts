import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, Not, ILike } from 'typeorm';
import { User } from './entities/user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepo: Repository<User>,
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

  async getUsersExclude(ids: number[]) {
    console.log("[UsersService][getUsersExclude] exclude ids =", ids);
    const users = await this.usersRepo.find({
      where: { id: Not(In(ids)) },
    });
    console.log("[UsersService][getUsersExclude] result count =", users.length);
    return users;
  }

  async searchUsers(keyword: string) {
    console.log("[UsersService][searchUsers] keyword =", keyword);
    const users = await this.usersRepo.find({
      where: [
        { fullName: ILike(`%${keyword}%`) },
        { email: ILike(`%${keyword}%`) },
      ],
    });
    console.log("[UsersService][searchUsers] result count =", users.length);
    return users;
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

  async updateProfile(userId: number, dto: any) {
    await this.usersRepo.update(userId, dto);
    return this.getProfile(userId);
  }


}

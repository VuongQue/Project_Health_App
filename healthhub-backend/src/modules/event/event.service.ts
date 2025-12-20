import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Event } from './entities/event.entity';
import { EventRegistration } from './entities/event-registration.entity';
import { CreateEventDto } from './dto/create-event.dto';
import { UsersService } from '../users/users.service';
import { AchievementEngine } from '../achievement/achievement.engine';

@Injectable()
export class EventService {
  constructor(
    @InjectRepository(Event) private eventRepo: Repository<Event>,
    @InjectRepository(EventRegistration) private regRepo: Repository<EventRegistration>,
    private usersService: UsersService,
    private achEngine: AchievementEngine,
  ) {}

  async createEvent(userEmail: string, dto: CreateEventDto) {
    const user = await this.usersService.findByEmail(userEmail);
    if (!user) {
    throw new NotFoundException(`User with email ${userEmail} not found`);
  }
    const event = this.eventRepo.create({ ...dto, createdBy: user });
    return this.eventRepo.save(event);
  }

  async getAll() {
    return this.eventRepo.find({ relations: ['createdBy'] });
  }

  async register(userEmail: string, eventId: number) {
    const user = await this.usersService.findByEmail(userEmail);
    if (!user) {
    throw new NotFoundException(`User with email ${userEmail} not found`);
  }
    const event = await this.eventRepo.findOne({ where: { id: eventId } });
    if (!event) throw new NotFoundException('Event not found');
    const reg = this.regRepo.create({ event, user });
    await this.regRepo.save(reg);
    //  Trao huy hiệu cho lần tham gia đầu tiên
    const count = await this.regRepo.count({ where: { user } });
    if (count === 1) {
        await this.achEngine.evaluate(user.id, 'EVENT_JOIN', {
        eventJoinCount: count,
      });

    } else if (count >= 3) {
        await this.achEngine.evaluate(user.id, 'EVENT_FAN', {
        eventJoinCount: count,
      });

    }

    return reg;
  }

  async getRegistrations(userEmail: string) {
    const user = await this.usersService.findByEmail(userEmail);
    if (!user) {
    throw new NotFoundException(`User with email ${userEmail} not found`);
  }
    return this.regRepo.find({ where: {user: { id: user.id }}, relations: ['event'] });
  }
}

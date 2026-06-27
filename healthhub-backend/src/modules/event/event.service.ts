import {
  Injectable, NotFoundException, ForbiddenException, BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, Repository } from 'typeorm';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Event, EventScope, EventConditionType } from './entities/event.entity';
import { EventRegistration, RegistrationStatus } from './entities/event-registration.entity';
import { EventSubmission, SubmissionStatus } from './entities/event-submission.entity';
import { CreateEventDto } from './dto/create-event.dto';
import { UsersService } from '../users/users.service';
import { AchievementEngine } from '../achievement/achievement.engine';
import { UserRole } from '../users/entities/user.entity';
import { Group, GroupDocument } from '../community/schemas/group.schema';
import { WorkoutLog } from '../fitness/entities/workout-log.entity';
import { DailySteps } from '../steps/entities/daily-steps.entity';
import { WaterLog } from '../water-intake/entities/water-log.entity';
import { NotificationService } from '../notification/notification.service';
import { NotificationType } from '../notification/entities/notification.entity';
import { ChatService } from '../chat/chat.service';

@Injectable()
export class EventService {
  // Admin system userId — dùng để gửi tin nhắn hệ thống
  private readonly ADMIN_SYSTEM_ID = 1;

  constructor(
    @InjectRepository(Event) private eventRepo: Repository<Event>,
    @InjectRepository(EventRegistration) private regRepo: Repository<EventRegistration>,
    @InjectRepository(EventSubmission) private subRepo: Repository<EventSubmission>,
    @InjectRepository(WorkoutLog) private workoutLogRepo: Repository<WorkoutLog>,
    @InjectRepository(DailySteps) private stepsRepo: Repository<DailySteps>,
    @InjectRepository(WaterLog) private waterLogRepo: Repository<WaterLog>,
    private usersService: UsersService,
    private achEngine: AchievementEngine,
    private notifService: NotificationService,
    private chatService: ChatService,
    @InjectModel(Group.name) private groupModel: Model<GroupDocument>,
  ) {}

  // ─── CREATE ─────────────────────────────────────────────────────────────────

  async createEvent(userId: number, dto: CreateEventDto) {
    const user = await this.usersService.getUserFullById(userId);
    if (!user) throw new NotFoundException('User not found');

    if (dto.scope === EventScope.PUBLIC && user.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Chỉ admin mới có thể tạo sự kiện công khai');
    }

    if (dto.scope === EventScope.GROUP) {
      if (!dto.groupId) throw new BadRequestException('groupId là bắt buộc cho group event');
      const group = await this.groupModel.findById(dto.groupId);
      if (!group) throw new NotFoundException('Group không tồn tại');
      if (!group.members.includes(String(userId))) {
        throw new ForbiddenException('Bạn chưa tham gia group này');
      }
    }

    const event = this.eventRepo.create({ ...dto, createdBy: user });
    return this.eventRepo.save(event);
  }

  // ─── LIST ────────────────────────────────────────────────────────────────────

  /** Lấy tất cả PUBLIC events */
  async getPublicEvents() {
    return this.eventRepo.find({
      where: { scope: EventScope.PUBLIC },
      relations: ['createdBy'],
      order: { startTime: 'ASC' },
    });
  }

  /** Lấy events của một group (chỉ member mới gọi được — guard ở controller) */
  async getGroupEvents(groupId: string, userId: number) {
    const group = await this.groupModel.findById(groupId);
    if (!group) throw new NotFoundException('Group không tồn tại');
    if (!group.members.includes(String(userId))) {
      throw new ForbiddenException('Bạn chưa tham gia group này');
    }
    return this.eventRepo.find({
      where: { scope: EventScope.GROUP, groupId },
      relations: ['createdBy'],
      order: { startTime: 'ASC' },
    });
  }

  /** @deprecated dùng cho backward-compat mobile cũ */
  async getAll() {
    return this.eventRepo.find({
      where: { scope: EventScope.PUBLIC },
      relations: ['createdBy'],
      order: { startTime: 'ASC' },
    });
  }

  // ─── REGISTER ────────────────────────────────────────────────────────────────

  async register(userId: number, eventId: number) {
    const user = await this.usersService.getUserFullById(userId);
    if (!user) throw new NotFoundException('User not found');

    const event = await this.eventRepo.findOne({ where: { id: eventId } });
    if (!event) throw new NotFoundException('Sự kiện không tồn tại');

    // Nếu là group event, phải là member
    if (event.scope === EventScope.GROUP && event.groupId) {
      const group = await this.groupModel.findById(event.groupId);
      if (!group || !group.members.includes(String(userId))) {
        throw new ForbiddenException('Bạn chưa tham gia group này');
      }
    }

    const existing = await this.regRepo.findOne({
      where: { event: { id: eventId }, user: { id: userId } },
    });
    if (existing) throw new BadRequestException('Bạn đã đăng ký sự kiện này rồi');

    // Check maxParticipants
    if (event.maxParticipants) {
      const count = await this.regRepo.count({ where: { event: { id: eventId } } });
      if (count >= event.maxParticipants) {
        throw new BadRequestException('Sự kiện đã đầy chỗ');
      }
    }

    const reg = this.regRepo.create({ event, user });
    await this.regRepo.save(reg);

    const totalJoined = await this.regRepo.count({ where: { user: { id: userId } } });
    await this.achEngine.evaluate(userId, 'EVENT_JOIN', { eventJoinCount: totalJoined });

    return reg;
  }

  async unregister(userId: number, eventId: number) {
    const reg = await this.regRepo.findOne({
      where: { event: { id: eventId }, user: { id: userId } },
    });
    if (!reg) throw new NotFoundException('Bạn chưa đăng ký sự kiện này');
    if (reg.status === RegistrationStatus.COMPLETED) {
      throw new BadRequestException('Không thể huỷ đăng ký sự kiện đã hoàn thành');
    }
    reg.status = RegistrationStatus.CANCELLED;
    return this.regRepo.save(reg);
  }

  // ─── CHECK-IN ────────────────────────────────────────────────────────────────

  async checkIn(userId: number, eventId: number) {
    const reg = await this.regRepo.findOne({
      where: { event: { id: eventId }, user: { id: userId } },
      relations: ['event'],
    });
    if (!reg) throw new NotFoundException('Bạn chưa đăng ký sự kiện này');
    if (reg.status === RegistrationStatus.CANCELLED) {
      throw new BadRequestException('Bạn đã huỷ đăng ký sự kiện này');
    }

    const now = new Date();
    const today = now.toISOString().slice(0, 10); // YYYY-MM-DD
    const lastDate = reg.lastCheckInDate
      ? new Date(reg.lastCheckInDate).toISOString().slice(0, 10)
      : null;

    if (lastDate === today) throw new BadRequestException('Bạn đã checkin hôm nay rồi');

    const event = reg.event;
    const start = new Date(event.startTime);
    const end   = new Date(event.endTime);

    if (now < start) throw new BadRequestException('Sự kiện chưa bắt đầu');
    if (now > end)   throw new BadRequestException('Sự kiện đã kết thúc');

    reg.checkInCount += 1;
    reg.lastCheckInDate = now;
    reg.status = RegistrationStatus.CHECKED_IN;

    // Tính tiến độ dựa trên tổng số ngày của event
    const totalDays = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / 86400_000));
    reg.progress = Math.min(100, Math.round((reg.checkInCount / totalDays) * 100));

    // Hoàn thành khi checkin đủ ngày hoặc progress = 100
    if (reg.progress >= 100) {
      reg.status = RegistrationStatus.COMPLETED;
      reg.completedAt = now;
      await this.achEngine.evaluate(userId, 'EVENT_COMPLETE', { eventCompleteCount: 1 });
    }

    return this.regRepo.save(reg);
  }

  // ─── MY REGISTRATIONS ────────────────────────────────────────────────────────

  async getRegistrations(userId: number) {
    return this.regRepo.find({
      where: { user: { id: userId } },
      relations: ['event', 'event.createdBy'],
      order: { registeredAt: 'DESC' },
    });
  }

  /** Registrations với events đang diễn ra / sắp diễn ra — dùng cho personal dashboard */
  async getActiveRegistrations(userId: number) {
    const regs = await this.regRepo.find({
      where: { user: { id: userId } },
      relations: ['event', 'event.createdBy'],
      order: { registeredAt: 'DESC' },
    });

    const now = new Date();
    return regs.filter((r) => {
      const end = new Date(r.event.endTime);
      return end >= now || r.status === RegistrationStatus.COMPLETED;
    });
  }

  // ─── ADMIN / OWNER ───────────────────────────────────────────────────────────

  async deleteEvent(userId: number, eventId: number) {
    const user = await this.usersService.getUserFullById(userId);
    const event = await this.eventRepo.findOne({ where: { id: eventId }, relations: ['createdBy'] });
    if (!event) throw new NotFoundException('Sự kiện không tồn tại');

    const isOwner = event.createdBy?.id === userId;
    const isAdmin = user?.role === UserRole.ADMIN;
    if (!isOwner && !isAdmin) throw new ForbiddenException('Không có quyền xoá sự kiện này');

    await this.regRepo.delete({ event: { id: eventId } });
    await this.eventRepo.delete(eventId);
    return { ok: true };
  }

  // ─── VERIFY PROGRESS (tự động từ dữ liệu thực) ──────────────────────────────

  async verifyProgress(userId: number, eventId: number) {
    const reg = await this.regRepo.findOne({
      where: { event: { id: eventId }, user: { id: userId } },
      relations: ['event'],
    });
    if (!reg) throw new NotFoundException('Bạn chưa đăng ký sự kiện này');
    if (reg.status === RegistrationStatus.CANCELLED)
      throw new BadRequestException('Bạn đã huỷ đăng ký sự kiện này');
    if (reg.status === RegistrationStatus.COMPLETED)
      throw new BadRequestException('Bạn đã hoàn thành sự kiện này rồi');

    const now = new Date();
    const today = now.toISOString().slice(0, 10);
    const lastDate = reg.lastCheckInDate
      ? new Date(reg.lastCheckInDate).toISOString().slice(0, 10)
      : null;

    if (lastDate === today)
      throw new BadRequestException('Bạn đã xác nhận tiến độ hôm nay rồi');

    const event = reg.event;
    if (now < new Date(event.startTime)) throw new BadRequestException('Sự kiện chưa bắt đầu');
    if (now > new Date(event.endTime))   throw new BadRequestException('Sự kiện đã kết thúc');

    const conditionType  = event.conditionType  ?? EventConditionType.MANUAL;
    const conditionValue = event.conditionValue ?? 1;

    // ── Kiểm tra điều kiện theo loại ──────────────────────────────────────────
    if (conditionType !== EventConditionType.MANUAL) {
      const dayStart = new Date(`${today}T00:00:00.000Z`);
      const dayEnd   = new Date(`${today}T23:59:59.999Z`);

      let met = false;

      if (conditionType === EventConditionType.WORKOUT) {
        // Số buổi tập hoàn thành trong ngày
        const count = await this.workoutLogRepo.count({
          where: {
            user: { id: userId },
            startedAt: Between(dayStart, dayEnd),
          },
        });
        met = count >= conditionValue;
        if (!met)
          throw new BadRequestException(
            `Cần hoàn thành ít nhất ${conditionValue} buổi tập hôm nay (hiện tại: ${count})`,
          );
      }

      if (conditionType === EventConditionType.STEPS) {
        // Tổng bước chân trong ngày
        const stepRecord = await this.stepsRepo.findOne({
          where: { userId, date: today },
        });
        const steps = stepRecord?.steps ?? 0;
        met = steps >= conditionValue;
        if (!met)
          throw new BadRequestException(
            `Cần đạt ít nhất ${conditionValue.toLocaleString()} bước chân hôm nay (hiện tại: ${steps.toLocaleString()})`,
          );
      }

      if (conditionType === EventConditionType.WATER) {
        // Tổng lượng nước uống trong ngày (ml)
        const logs = await this.waterLogRepo.find({
          where: {
            userId,
            loggedAt: Between(dayStart, dayEnd),
          },
        });
        const totalMl = logs.reduce((s, l) => s + l.amount, 0);
        met = totalMl >= conditionValue;
        if (!met)
          throw new BadRequestException(
            `Cần uống ít nhất ${conditionValue}ml nước hôm nay (hiện tại: ${totalMl}ml)`,
          );
      }
    }

    // ── Tất cả điều kiện đã đạt — cập nhật tiến độ ────────────────────────────
    const end      = new Date(event.endTime);
    const start    = new Date(event.startTime);
    const totalDays = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / 86400_000));

    reg.checkInCount    += 1;
    reg.lastCheckInDate  = now;
    reg.status           = RegistrationStatus.CHECKED_IN;
    reg.progress         = Math.min(100, Math.round((reg.checkInCount / totalDays) * 100));

    if (reg.progress >= 100) {
      reg.status      = RegistrationStatus.COMPLETED;
      reg.completedAt = now;
      await this.achEngine.evaluate(userId, 'EVENT_COMPLETE', { eventCompleteCount: 1 });
    }

    const saved = await this.regRepo.save(reg);

    // Trả về thêm thông tin để client hiển thị
    return {
      ...saved,
      conditionType,
      conditionValue,
      totalDays,
      message: reg.status === RegistrationStatus.COMPLETED
        ? '🏆 Chúc mừng! Bạn đã hoàn thành sự kiện!'
        : `✅ Xác nhận thành công! Tiến độ: ${saved.progress}%`,
    };
  }

  async getParticipants(eventId: number) {
    return this.regRepo.find({
      where: { event: { id: eventId } },
      relations: ['user'],
      order: { registeredAt: 'ASC' },
    });
  }

  // ─── DETAIL (kèm registration của user hiện tại) ─────────────────────────────

  async getById(eventId: number, userId: number) {
    const event = await this.eventRepo.findOne({
      where: { id: eventId },
      relations: ['createdBy'],
    });
    if (!event) throw new NotFoundException('Sự kiện không tồn tại');

    const registration = await this.regRepo.findOne({
      where: { event: { id: eventId }, user: { id: userId } },
    });

    const totalRegistered = await this.regRepo.count({
      where: { event: { id: eventId } },
    });

    return { ...event, registration: registration ?? null, totalRegistered };
  }

  // ─── MEDIA SUBMISSION (Upload bằng chứng) ────────────────────────────────────

  async submitMedia(userId: number, eventId: number, dto: { mediaUrl: string; mediaType: 'video' | 'image'; userNote?: string }) {
    const reg = await this.regRepo.findOne({
      where: { event: { id: eventId }, user: { id: userId } },
      relations: ['event'],
    });
    if (!reg) throw new NotFoundException('Bạn chưa đăng ký sự kiện này');
    if (reg.status === RegistrationStatus.CANCELLED)
      throw new BadRequestException('Bạn đã huỷ đăng ký sự kiện này');

    const now = new Date();
    const today = now.toISOString().slice(0, 10);
    const event = reg.event;

    if (now < new Date(event.startTime)) throw new BadRequestException('Sự kiện chưa bắt đầu');
    if (now > new Date(event.endTime))   throw new BadRequestException('Sự kiện đã kết thúc');

    // Kiểm tra đã nộp pending hôm nay chưa (chặn spam)
    const existingToday = await this.subRepo.findOne({
      where: {
        event: { id: eventId },
        user: { id: userId },
        checkInDate: today,
        status: SubmissionStatus.PENDING,
      },
    });
    if (existingToday) throw new BadRequestException('Bạn đã nộp minh chứng hôm nay, vui lòng chờ admin duyệt');

    const user = await this.usersService.getUserFullById(userId);
    const sub = this.subRepo.create({
      event: { id: eventId } as Event,
      user: { id: userId } as any,
      registration: reg,
      mediaUrl: dto.mediaUrl,
      mediaType: dto.mediaType,
      userNote: dto.userNote,
      checkInDate: today,
      status: SubmissionStatus.PENDING,
    });

    return this.subRepo.save(sub);
  }

  async getMySubmissions(userId: number, eventId: number) {
    return this.subRepo.find({
      where: { event: { id: eventId }, user: { id: userId } },
      order: { submittedAt: 'DESC' },
    });
  }

  // ─── ADMIN: lấy submissions của event ────────────────────────────────────────

  async getSubmissionsForAdmin(eventId: number, status?: SubmissionStatus) {
    const where: any = { event: { id: eventId } };
    if (status) where.status = status;
    return this.subRepo.find({
      where,
      relations: ['user', 'reviewedBy'],
      order: { submittedAt: 'ASC' },
    });
  }

  // ─── ADMIN: duyệt submission ──────────────────────────────────────────────────

  async approveSubmission(adminId: number, submissionId: number) {
    const sub = await this.subRepo.findOne({
      where: { id: submissionId },
      relations: ['event', 'user', 'registration'],
    });
    if (!sub) throw new NotFoundException('Submission không tồn tại');
    if (sub.status !== SubmissionStatus.PENDING && sub.status !== SubmissionStatus.APPEALING)
      throw new BadRequestException('Submission không ở trạng thái chờ duyệt');

    const userId = sub.user.id;
    const eventId = sub.event.id;
    const reg = sub.registration;

    // Cập nhật submission
    sub.status = SubmissionStatus.APPROVED;
    sub.reviewedBy = { id: adminId } as any;
    sub.reviewedAt = new Date();
    await this.subRepo.save(sub);

    // Tính tiến độ
    const event = sub.event;
    const end   = new Date(event.endTime);
    const start = new Date(event.startTime);
    const totalDays = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / 86400_000));

    reg.checkInCount    += 1;
    reg.lastCheckInDate  = new Date(sub.checkInDate);
    reg.status           = RegistrationStatus.CHECKED_IN;
    reg.progress         = Math.min(100, Math.round((reg.checkInCount / totalDays) * 100));

    if (reg.progress >= 100) {
      reg.status      = RegistrationStatus.COMPLETED;
      reg.completedAt = new Date();

      // Phần thưởng hoàn thành: XP + Badge
      await this.achEngine.evaluate(userId, 'EVENT_COMPLETE', { eventCompleteCount: 1 });

      // Leaderboard reward: top 3
      await this._grantLeaderboardRewards(eventId);
    }
    await this.regRepo.save(reg);

    // Gửi thông báo + tin nhắn cho user
    const eventTitle = event.title;
    await this.notifService.createForUserId(userId, NotificationType.EVENT,
      `✅ Minh chứng ngày ${sub.checkInDate} của bạn trong "${eventTitle}" đã được duyệt! Tiến độ: ${reg.progress}%`,
      { icon: '✅', metadata: { eventId, submissionId } },
    );
    await this.chatService.sendMessage(String(this.ADMIN_SYSTEM_ID), {
      receiverId: String(userId),
      text: `✅ *[${eventTitle}]* Minh chứng ngày ${sub.checkInDate} của bạn đã được admin duyệt! Tiến độ hiện tại: **${reg.progress}%**. Hãy tiếp tục cố gắng! 💪`,
    });

    return { ok: true, progress: reg.progress };
  }

  // ─── ADMIN: từ chối nhẹ (WARN) — cho upload lại ──────────────────────────────

  async warnSubmission(adminId: number, submissionId: number, reason: string) {
    const sub = await this.subRepo.findOne({
      where: { id: submissionId },
      relations: ['event', 'user'],
    });
    if (!sub) throw new NotFoundException('Submission không tồn tại');
    if (sub.status !== SubmissionStatus.PENDING)
      throw new BadRequestException('Submission không ở trạng thái chờ duyệt');

    sub.status      = SubmissionStatus.WARNED;
    sub.adminReason = reason;
    sub.reviewedBy  = { id: adminId } as any;
    sub.reviewedAt  = new Date();
    await this.subRepo.save(sub);

    const userId     = sub.user.id;
    const eventTitle = sub.event.title;
    const eventId    = sub.event.id;

    await this.notifService.createForUserId(userId, NotificationType.WARNING,
      `⚠️ Minh chứng ngày ${sub.checkInDate} trong "${eventTitle}" chưa đạt yêu cầu. Bạn có thể upload lại.`,
      { icon: '⚠️', metadata: { eventId, submissionId } },
    );
    await this.chatService.sendMessage(String(this.ADMIN_SYSTEM_ID), {
      receiverId: String(userId),
      text: `⚠️ *[${eventTitle}]* Minh chứng ngày ${sub.checkInDate} của bạn chưa đạt yêu cầu.\n\n📋 **Lý do:** ${reason}\n\nBạn có thể upload lại minh chứng mới cho ngày hôm đó.`,
    });

    return { ok: true };
  }

  // ─── ADMIN: báo cáo gian lận (FRAUD) — ban + reset progress ──────────────────

  async fraudSubmission(adminId: number, submissionId: number, reason: string) {
    const sub = await this.subRepo.findOne({
      where: { id: submissionId },
      relations: ['event', 'user', 'registration'],
    });
    if (!sub) throw new NotFoundException('Submission không tồn tại');

    sub.status      = SubmissionStatus.FRAUD;
    sub.adminReason = reason;
    sub.reviewedBy  = { id: adminId } as any;
    sub.reviewedAt  = new Date();
    await this.subRepo.save(sub);

    const reg = sub.registration;
    // Reset toàn bộ tiến độ
    reg.checkInCount = 0;
    reg.progress     = 0;
    reg.status       = RegistrationStatus.CANCELLED;
    await this.regRepo.save(reg);

    const userId     = sub.user.id;
    const eventTitle = sub.event.title;
    const eventId    = sub.event.id;

    await this.notifService.createForUserId(userId, NotificationType.WARNING,
      `🚫 Tài khoản của bạn bị báo cáo gian lận trong "${eventTitle}". Tiến độ đã bị xoá.`,
      { icon: '🚫', priority: 2, metadata: { eventId, submissionId } },
    );
    await this.chatService.sendMessage(String(this.ADMIN_SYSTEM_ID), {
      receiverId: String(userId),
      text: `🚫 *[${eventTitle}]* Minh chứng của bạn đã bị đánh dấu **gian lận** và bạn đã bị loại khỏi sự kiện này.\n\n📋 **Lý do:** ${reason}\n\nNếu bạn cho rằng đây là sai sót, hãy nhấn **"Khiếu nại"** trong màn hình sự kiện để giải thích và upload lại bằng chứng. Admin sẽ xem xét lại.`,
    });

    return { ok: true };
  }

  // ─── USER: khiếu nại sau khi bị FRAUD ───────────────────────────────────────

  async appealSubmission(userId: number, submissionId: number, dto: { appealNote: string; appealMediaUrl?: string }) {
    const sub = await this.subRepo.findOne({
      where: { id: submissionId, user: { id: userId } },
      relations: ['event'],
    });
    if (!sub) throw new NotFoundException('Submission không tồn tại');
    if (sub.status !== SubmissionStatus.FRAUD)
      throw new BadRequestException('Chỉ có thể khiếu nại submission bị đánh dấu gian lận');

    sub.status         = SubmissionStatus.APPEALING;
    sub.appealNote     = dto.appealNote;
    sub.appealMediaUrl = dto.appealMediaUrl;
    sub.appealedAt     = new Date();
    await this.subRepo.save(sub);

    const eventTitle = sub.event.title;
    const eventId    = sub.event.id;

    // Thông báo cho admin (user 1) về khiếu nại mới
    await this.notifService.createForUserId(this.ADMIN_SYSTEM_ID, NotificationType.EVENT,
      `📨 User ${userId} đã gửi khiếu nại về submission #${submissionId} trong "${eventTitle}"`,
      { icon: '📨', priority: 2, metadata: { eventId, submissionId, userId } },
    );

    return { ok: true };
  }

  // ─── ADMIN: quyết định cuối sau appeal ───────────────────────────────────────

  async resolveAppeal(adminId: number, submissionId: number, decision: 'restore' | 'keep_ban', adminNote?: string) {
    const sub = await this.subRepo.findOne({
      where: { id: submissionId },
      relations: ['event', 'user', 'registration'],
    });
    if (!sub) throw new NotFoundException('Submission không tồn tại');
    if (sub.status !== SubmissionStatus.APPEALING)
      throw new BadRequestException('Submission không ở trạng thái khiếu nại');

    const userId     = sub.user.id;
    const eventTitle = sub.event.title;
    const eventId    = sub.event.id;

    if (decision === 'restore') {
      // Phục hồi → duyệt submission và tính lại tiến độ
      await this.approveSubmission(adminId, submissionId);
      // approveSubmission đã set status APPROVED và gửi noti

      // Phục hồi registration
      const reg = sub.registration;
      reg.status = RegistrationStatus.CHECKED_IN;
      await this.regRepo.save(reg);

      await this.chatService.sendMessage(String(this.ADMIN_SYSTEM_ID), {
        receiverId: String(userId),
        text: `✅ *[${eventTitle}]* Sau khi xem xét lại, admin đã **phục hồi** tiến độ của bạn. Xin lỗi vì sự bất tiện!${adminNote ? `\n\n📝 Ghi chú: ${adminNote}` : ''}`,
      });
    } else {
      // Giữ nguyên ban — cập nhật status về FRAUD lại
      sub.status     = SubmissionStatus.FRAUD;
      sub.reviewedBy = { id: adminId } as any;
      sub.reviewedAt = new Date();
      if (adminNote) sub.adminReason = adminNote;
      await this.subRepo.save(sub);

      await this.chatService.sendMessage(String(this.ADMIN_SYSTEM_ID), {
        receiverId: String(userId),
        text: `🚫 *[${eventTitle}]* Sau khi xem xét khiếu nại, admin đã đưa ra **quyết định cuối cùng**: Xác nhận gian lận. Bạn đã bị loại vĩnh viễn khỏi sự kiện này.${adminNote ? `\n\n📝 Lý do: ${adminNote}` : ''}`,
      });
    }

    return { ok: true, decision };
  }

  // ─── Helper: phần thưởng leaderboard top 3 ───────────────────────────────────

  private async _grantLeaderboardRewards(eventId: number) {
    const top3 = await this.regRepo.find({
      where: { event: { id: eventId }, status: RegistrationStatus.COMPLETED },
      relations: ['user'],
      order: { checkInCount: 'DESC', completedAt: 'ASC' },
      take: 3,
    });

    const badges = ['🥇 Vô địch sự kiện', '🥈 Á quân sự kiện', '🥉 Hạng ba sự kiện'];
    for (let i = 0; i < top3.length; i++) {
      const reg = top3[i];
      await this.notifService.createForUserId(reg.user.id, NotificationType.EVENT,
        `${badges[i]}: Bạn xếp hạng ${i + 1} trong sự kiện! 🎉`,
        { icon: badges[i].split(' ')[0], priority: 2, metadata: { eventId, rank: i + 1 } },
      );
      await this.achEngine.evaluate(reg.user.id, 'EVENT_TOP3', { eventRank: i + 1 });
    }
  }

  // ─── LEADERBOARD ────────────────────────────────────────────────────────────

  async getLeaderboard(eventId: number) {
    const regs = await this.regRepo.find({
      where: { event: { id: eventId } },
      relations: ['user'],
      order: { checkInCount: 'DESC', registeredAt: 'ASC' },
    });

    return regs
      .filter((r) => r.status !== 'cancelled')
      .map((r, i) => ({
        rank: i + 1,
        userId: r.user.id,
        fullName: r.user.fullName,
        avatarUrl: r.user.avatarUrl ?? null,
        level: r.user.level ?? 1,
        checkInCount: r.checkInCount,
        progress: r.progress,
        status: r.status,
        completedAt: r.completedAt ?? null,
      }));
  }
}

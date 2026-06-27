import {
  Injectable,
  BadRequestException,
  NotFoundException,
  Inject,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { FriendRequest } from "./entities/friend-request.entity";
import { Friend } from "./entities/friend.entity";
import { DailySteps } from "../steps/entities/daily-steps.entity";
import { UsersService } from "../users/users.service";

// 🔥 Kafka
import { ClientKafka } from "@nestjs/microservices";
import { TOPIC_NOTIFICATION_EVENTS } from "../../config/kafka.config";
import { NotificationType } from "../notification/entities/notification.entity";

@Injectable()
export class FriendService {
  constructor(
    @InjectRepository(FriendRequest)
    private readonly friendRequestRepo: Repository<FriendRequest>,

    @InjectRepository(Friend)
    private readonly friendRepo: Repository<Friend>,

    @InjectRepository(DailySteps)
    private readonly stepsRepo: Repository<DailySteps>,

    private readonly usersService: UsersService,

    // 🔥 Kafka producer (GIỐNG AuthService)
    @Inject("KAFKA_CLIENT")
    private readonly kafka: ClientKafka,
  ) {}

  // ============================
  // SEND FRIEND REQUEST
  // ============================
  async sendRequest(currentUserId: number, toUserId: number) {
    if (currentUserId === toUserId) {
      throw new BadRequestException("Cannot add yourself");
    }

    const fromUser = await this.usersService.getUserById(currentUserId);
    const toUser = await this.usersService.getUserById(toUserId);

    if (!fromUser || !toUser) {
      throw new NotFoundException("User not found");
    }

    const alreadyFriends = await this.friendRepo.findOne({
      where: { userId: currentUserId, friendId: toUserId },
    });

    if (alreadyFriends) {
      throw new BadRequestException("Already friends");
    }

    const existing = await this.friendRequestRepo.findOne({
      where: {
        fromUserId: currentUserId,
        toUserId,
        status: "pending",
      },
    });

    if (existing) {
      throw new BadRequestException("Request already sent");
    }

    const req = this.friendRequestRepo.create({
      fromUserId: currentUserId,
      toUserId,
      fromUser,
      toUser,
      status: "pending",
    });

    const saved = await this.friendRequestRepo.save(req);

    // 🔥🔥🔥 EMIT FRIEND REQUEST NOTIFICATION (KAFKA)
    // ❗ KHÔNG await (giống AuthService)
    this.kafka.emit(TOPIC_NOTIFICATION_EVENTS, {
      userId: toUserId,
      type: NotificationType.FRIEND_REQUEST,
      message: `👤 ${fromUser.fullName} sent you a friend request`,
      metadata: {
        requestId: saved.id,
        fromUserId: currentUserId,
        fromUserName: fromUser.fullName,
      },
      priority: 2,
    });

    return saved;
  }

  // ============================
  // RESPOND REQUEST
  // ============================
  async respondRequest(
    userId: number,
    requestId: string,
    accept: boolean,
  ) {
    const req = await this.friendRequestRepo.findOne({
      where: { id: requestId },
      relations: ["fromUser", "toUser"],
    });

    if (!req) {
      throw new NotFoundException("Request not found");
    }

    if (req.toUserId !== userId) {
      throw new BadRequestException("Not allowed");
    }

    if (req.status !== "pending") {
      throw new BadRequestException("Already handled");
    }

    if (accept) {
      req.status = "accepted";
      await this.friendRequestRepo.save(req);

      await this.friendRepo.save([
        this.friendRepo.create({
          userId: req.fromUserId,
          friendId: req.toUserId,
          user: req.fromUser,
          friend: req.toUser,
        }),
        this.friendRepo.create({
          userId: req.toUserId,
          friendId: req.fromUserId,
          user: req.toUser,
          friend: req.fromUser,
        }),
      ]);

      return { message: "Friend added" };
    }

    req.status = "rejected";
    await this.friendRequestRepo.save(req);

    return { message: "Rejected" };
  }

  // ============================
  // FRIEND LIST
  // ============================
  async getFriends(userId: number) {
    const list = await this.friendRepo.find({
      where: { userId },
      relations: ["friend"],
    });

    return list.map((f) => f.friend);
  }

  // ============================
  // REQUESTS I RECEIVED
  // ============================
  async getReceivedRequests(userId: number) {
    return this.friendRequestRepo.find({
      where: { toUserId: userId, status: "pending" },
      relations: ["fromUser"],
    });
  }

  // ============================
  // REQUESTS I SENT
  // ============================
  async getSentRequests(userId: number) {
    return this.friendRequestRepo.find({
      where: { fromUserId: userId, status: "pending" },
      relations: ["toUser"],
    });
  }

  // ============================
  // SUGGEST FRIENDS
  // ============================
  async suggestFriends(userId: number) {
  const friends = await this.friendRepo.find({ where: { userId } });

  const friendIds = friends.map((f) => f.friendId);
  const excludeIds = [userId, ...friendIds];

  return this.usersService.getUsersExclude(excludeIds, {
    excludeRoles: ["ADMIN"],
  });
}


  // ============================
  // LEADERBOARD (friends ranked by points)
  // ============================
  async getLeaderboard(userId: number) {
    const friends = await this.friendRepo.find({
      where: { userId },
      relations: ['friend'],
    });

    const me = await this.usersService.getUserById(userId);
    const friendUsers = friends.map((f) => f.friend);
    const all = [{ ...me, isMe: true }, ...friendUsers.map((u) => ({ ...u, isMe: false }))];

    all.sort((a, b) => (b.points ?? 0) - (a.points ?? 0));

    return all.map((u, i) => ({
      rank: i + 1,
      id: u.id,
      fullName: u.fullName,
      avatarUrl: (u as any).avatarUrl,
      level: u.level,
      points: u.points,
      isMe: (u as any).isMe ?? false,
    }));
  }

  // ============================
  // STEPS LEADERBOARD (today)
  // ============================
  async getStepsLeaderboard(userId: number) {
    const friends = await this.friendRepo.find({
      where: { userId },
      relations: ['friend'],
    });

    const me = await this.usersService.getUserById(userId);
    const friendUsers = friends.map((f) => f.friend);
    const allUsers = [{ ...(me as any), isMe: true }, ...friendUsers.map((u) => ({ ...u, isMe: false }))];
    const allIds = allUsers.map((u) => u.id);

    const today = new Date().toISOString().slice(0, 10);
    const stepsRecords = await this.stepsRepo.find({
      where: allIds.map((id) => ({ userId: id, date: today })),
    });
    const stepsMap = new Map(stepsRecords.map((r) => [r.userId, r]));

    const ranked = allUsers.map((u) => {
      const r = stepsMap.get(u.id);
      return {
        id: u.id,
        fullName: u.fullName,
        avatarUrl: u.avatarUrl ?? null,
        level: u.level ?? 1,
        todaySteps: r?.steps ?? 0,
        goalSteps: r?.goalSteps ?? 10000,
        isMe: u.isMe,
      };
    });

    ranked.sort((a, b) => b.todaySteps - a.todaySteps);
    return ranked.map((u, i) => ({ rank: i + 1, ...u }));
  }

  // ============================
  // UNFRIEND
  // ============================
  async unfriend(userId: number, targetId: number) {
    await this.friendRepo.delete({ userId, friendId: targetId });
    await this.friendRepo.delete({
      userId: targetId,
      friendId: userId,
    });

    return { message: "Unfriended" };
  }
}

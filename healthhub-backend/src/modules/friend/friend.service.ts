import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { FriendRequest } from "./entities/friend-request.entity";
import { Friend } from "./entities/friend.entity";
import { UsersService } from "../users/users.service";

@Injectable()
export class FriendService {
  constructor(
    @InjectRepository(FriendRequest)
    private friendRequestRepo: Repository<FriendRequest>,

    @InjectRepository(Friend)
    private friendRepo: Repository<Friend>,

    private usersService: UsersService,
  ) {}

  // SEND FRIEND REQUEST
  async sendRequest(currentUserId: number, toUserId: number) {
    console.log("[FriendService][sendRequest] from =", currentUserId, "to =", toUserId);

    if (currentUserId === toUserId)
      throw new BadRequestException("Cannot add yourself");

    const fromUser = await this.usersService.getUserById(currentUserId);
    const toUser = await this.usersService.getUserById(toUserId);
    if (!fromUser || !toUser) throw new NotFoundException("User not found");

    const alreadyFriends = await this.friendRepo.findOne({
      where: { userId: currentUserId, friendId: toUserId },
    });
    console.log("[FriendService][sendRequest] alreadyFriends =", !!alreadyFriends);
    if (alreadyFriends) throw new BadRequestException("Already friends");

    const existing = await this.friendRequestRepo.findOne({
      where: { fromUserId: currentUserId, toUserId, status: "pending" },
    });
    console.log("[FriendService][sendRequest] existingRequest =", !!existing);
    if (existing)
      throw new BadRequestException("Friend request already sent");

    const req = this.friendRequestRepo.create({
      fromUserId: currentUserId,
      toUserId,
      fromUser,
      toUser,
    });

    return this.friendRequestRepo.save(req);
  }

  // RESPOND REQUEST
  async respondRequest(userId: number, requestId: string, accept: boolean) {
    console.log("[FriendService][respondRequest] userId =", userId, "requestId =", requestId, "accept =", accept);

    const req = await this.friendRequestRepo.findOne({
      where: { id: requestId },
      relations: ["fromUser", "toUser"],
    });

    console.log("[FriendService][respondRequest] foundReq =", !!req);

    if (!req) throw new NotFoundException("Request not found");

    if (req.toUserId !== userId)
      throw new BadRequestException("Not allowed to respond");

    if (req.status !== "pending")
      throw new BadRequestException("Request already handled");

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
    return { message: "Friend request rejected" };
  }

  // GET FRIEND LIST
  async getFriends(userId: number) {
    console.log("[FriendService][getFriends] userId =", userId);
    const result = await this.friendRepo.find({
      where: { userId },
      relations: ["friend"],
    });
    console.log("[FriendService][getFriends] count =", result.length);
    return result.map((f) => f.friend);
  }

  // GET PENDING REQUESTS
  async getPendingRequests(userId: number) {
    console.log("[FriendService][getPendingRequests] userId =", userId);
    const list = await this.friendRequestRepo.find({
      where: { toUserId: userId, status: "pending" },
      relations: ["fromUser"],
    });
    console.log("[FriendService][getPendingRequests] count =", list.length);
    return list;
  }

  // SUGGEST FRIENDS
  async suggestFriends(userId: number) {
    console.log("[FriendService][suggestFriends] userId =", userId);

    const friends = await this.friendRepo.find({
      where: { userId },
    });
    console.log("[FriendService][suggestFriends] existing friends =", friends);

    const friendIds = friends.map((f) => f.friendId);
    const excludeIds = [userId, ...friendIds];

    console.log("[FriendService][suggestFriends] excludeIds =", excludeIds);

    const users = await this.usersService.getUsersExclude(excludeIds);
    console.log("[FriendService][suggestFriends] suggested count =", users.length);

    return users;
  }

  // UNFRIEND
  async unfriend(userId: number, targetId: number) {
    console.log("[FriendService][unfriend] userId =", userId, "targetId =", targetId);

    await this.friendRepo.delete({ userId, friendId: targetId });
    await this.friendRepo.delete({ userId: targetId, friendId: userId });

    return { message: "Unfriended successfully" };
  }
}

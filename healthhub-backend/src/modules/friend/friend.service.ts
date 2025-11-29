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
import { SendFriendRequestDto } from "./dto/send-request.dto";
import { RespondFriendRequestDto } from "./dto/respond-request.dto";

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
  async sendRequest(dto: SendFriendRequestDto) {
    const { fromUserId, toUserId } = dto;

    if (fromUserId === toUserId) {
      throw new BadRequestException("Cannot add yourself");
    }

    const fromUser = await this.usersService.getUserById(fromUserId);
    const toUser = await this.usersService.getUserById(toUserId);

    if (!fromUser || !toUser)
      throw new NotFoundException("User not found");

    // Check if already friends
    const alreadyFriends = await this.friendRepo.findOne({
      where: {
        userId: fromUserId,
        friendId: toUserId,
      },
    });

    if (alreadyFriends) {
      throw new BadRequestException("Already friends");
    }

    // Check pending request
    const existing = await this.friendRequestRepo.findOne({
      where: {
        fromUserId,
        toUserId,
        status: "pending",
      },
    });

    if (existing) {
      throw new BadRequestException("Friend request already sent");
    }

    const request = this.friendRequestRepo.create({
      fromUserId,
      toUserId,
      fromUser,
      toUser,
    });

    return this.friendRequestRepo.save(request);
  }

  // ACCEPT / REJECT REQUEST
  async respondRequest(dto: RespondFriendRequestDto) {
    const req = await this.friendRequestRepo.findOne({
      where: { id: dto.requestId },
      relations: ["fromUser", "toUser"],
    });

    if (!req) throw new NotFoundException("Request not found");
    if (req.status !== "pending")
      throw new BadRequestException("Request already handled");

    // ACCEPT
    if (dto.accept) {
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

    // REJECT
    req.status = "rejected";
    await this.friendRequestRepo.save(req);
    return { message: "Friend request rejected" };
  }

  // GET FRIEND LIST
  async getFriends(userId: number) {
    const result = await this.friendRepo.find({
      where: { userId },
      relations: ["friend"],
    });

    return result.map((f) => f.friend);
  }

  // PENDING REQUESTS
  async getPendingRequests(userId: number) {
    return this.friendRequestRepo.find({
      where: {
        toUserId: userId,
        status: "pending",
      },
      relations: ["fromUser"],
    });
  }

  // // SEARCH
  // async search(keyword: string) {
  //   return this.usersService.searchUsers(keyword);
  // }

  // // SUGGEST FRIENDS
  // async suggestFriends(userId: number) {
  //   return this.usersService.getUsersNotFriends(userId);
  // }

  // UNFRIEND
  async unfriend(userId: number, targetId: number) {
    await this.friendRepo.delete({ userId, friendId: targetId });
    await this.friendRepo.delete({ userId: targetId, friendId: userId });

    return { message: "Unfriended successfully" };
  }
}

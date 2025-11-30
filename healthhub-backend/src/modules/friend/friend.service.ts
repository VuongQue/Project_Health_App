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

  // ============================
  // SEND FRIEND REQUEST
  // ============================
  async sendRequest(currentUserId: number, toUserId: number) {
    console.log("\n================ SEND REQUEST ================");
    console.log("[sendRequest] from =", currentUserId, "to =", toUserId);

    if (currentUserId === toUserId) 
      throw new BadRequestException("Cannot add yourself");

    console.log("[sendRequest] Fetching users...");
    const fromUser = await this.usersService.getUserById(currentUserId);
    const toUser = await this.usersService.getUserById(toUserId);

    console.log("[sendRequest] fromUser =", fromUser?.id, "toUser =", toUser?.id);

    if (!fromUser || !toUser) throw new NotFoundException("User not found");

    const alreadyFriends = await this.friendRepo.findOne({
      where: { userId: currentUserId, friendId: toUserId },
    });
    console.log("[sendRequest] alreadyFriends =", alreadyFriends);

    if (alreadyFriends) throw new BadRequestException("Already friends");

    const existing = await this.friendRequestRepo.findOne({
      where: { fromUserId: currentUserId, toUserId, status: "pending" },
    });
    console.log("[sendRequest] existing pending request =", existing);

    if (existing) throw new BadRequestException("Request already sent");

    console.log("[sendRequest] Creating request...");
    const req = this.friendRequestRepo.create({
      fromUserId: currentUserId,
      toUserId,
      fromUser,
      toUser,
    });

    const saved = await this.friendRequestRepo.save(req);
    console.log("[sendRequest] Saved =", saved);

    return saved;
  }

  // ============================
  // RESPOND TO REQUEST
  // ============================
  async respondRequest(userId: number, requestId: string, accept: boolean) {
    console.log("\n================ RESPOND REQUEST ================");
    console.log("[respondRequest] userId =", userId, "requestId =", requestId, "accept =", accept);

    const req = await this.friendRequestRepo.findOne({
      where: { id: requestId },
      relations: ["fromUser", "toUser"],
    });

    console.log("[respondRequest] fetched request =", req);

    if (!req) throw new NotFoundException("Request not found");

    if (req.toUserId !== userId) {
      console.log("[respondRequest] MISMATCH req.toUserId =", req.toUserId);
      throw new BadRequestException("Not allowed");
    }

    if (req.status !== "pending") {
      console.log("[respondRequest] Already handled");
      throw new BadRequestException("Already handled");
    }

    if (accept) {
      console.log("[respondRequest] Accepting...");

      req.status = "accepted";
      await this.friendRequestRepo.save(req);

      console.log("[respondRequest] Creating 2 Friend records...");

      const newFriends = await this.friendRepo.save([
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

      console.log("[respondRequest] Saved friends:", newFriends);
      return { message: "Friend added" };
    }

    console.log("[respondRequest] Rejecting request...");
    req.status = "rejected";
    await this.friendRequestRepo.save(req);

    return { message: "Rejected" };
  }

  // ============================
  // GET FRIEND LIST
  // ============================
  async getFriends(userId: number) {
    console.log("\n================ GET FRIEND LIST ================");
    console.log("[getFriends] userId =", userId);

    const list = await this.friendRepo.find({
      where: { userId },
      relations: ["friend"],
    });

    console.log("[getFriends] raw list =", list);

    // DEBUG: print each friend
    list.forEach((item) => {
      console.log("[getFriends] friend =", {
        friendId: item.friendId,
        friend: item.friend,
      });
    });

    return list.map((f) => f.friend);
  }

  // ============================
  // GET PENDING REQUESTS
  // ============================
  async getPendingRequests(userId: number) {
    console.log("\n================ GET PENDING REQUESTS ================");
    console.log("[pending] userId =", userId);

    const list = await this.friendRequestRepo.find({
      where: { toUserId: userId, status: "pending" },
      relations: ["fromUser"],
    });

    console.log("[pending] list =", list);

    return list;
  }

  // ============================
  // SUGGEST FRIENDS
  // ============================
  async suggestFriends(userId: number) {
    console.log("\n================ SUGGEST FRIENDS ================");
    console.log("[suggest] userId =", userId);

    const friends = await this.friendRepo.find({
      where: { userId },
      relations: ["friend"],
    });

    console.log("[suggest] existing friend records =", friends);

    // debug each relation
    friends.forEach((f) => {
      console.log("[suggest] friend record =", {
        id: f.id,
        friendId: f.friendId,
        friendObj: f.friend,
      });
    });

    const friendIds = friends.map((f) => f.friendId);
    const excludeIds = [userId, ...friendIds];

    console.log("[suggest] excludeIds =", excludeIds);

    const users = await this.usersService.getUsersExclude(excludeIds);

    console.log("[suggest] suggested users =", users);

    return users;
  }

  // ============================
  // UNFRIEND
  // ============================
  async unfriend(userId: number, targetId: number) {
    console.log("\n================ UNFRIEND ================");
    console.log("[unfriend] userId =", userId, "targetId =", targetId);

    const del1 = await this.friendRepo.delete({ userId, friendId: targetId });
    const del2 = await this.friendRepo.delete({ userId: targetId, friendId: userId });

    console.log("[unfriend] del1 =", del1);
    console.log("[unfriend] del2 =", del2);

    return { message: "Unfriended" };
  }
}

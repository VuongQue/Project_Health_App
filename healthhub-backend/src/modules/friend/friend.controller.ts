import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
} from "@nestjs/common";
import { FriendService } from "./friend.service";
import { AuthGuard } from "@nestjs/passport";

@UseGuards(AuthGuard("jwt"))
@Controller("friends")
export class FriendController {
  constructor(private friendService: FriendService) {}

  // ============================
  // SEND FRIEND REQUEST
  // ============================
  @Post("request")
  sendFriendRequest(
    @Req() req,
    @Body("toUserId") toUserId: number,
  ) {
    return this.friendService.sendRequest(req.user.userId, toUserId);
  }

  // ============================
  // ACCEPT / REJECT REQUEST
  // ============================
  @Post("respond")
  respondRequest(
    @Req() req,
    @Body("requestId") requestId: string,
    @Body("accept") accept: boolean,
  ) {
    return this.friendService.respondRequest(
      req.user.userId,
      requestId,
      accept,
    );
  }

  // ============================
  // FRIEND LIST
  // ============================
  @Get("list")
  getFriends(@Req() req) {
    return this.friendService.getFriends(req.user.userId);
  }

  // ============================
  // REQUESTS I RECEIVED (ACCEPT)
  // ============================
  @Get("requests/received")
  getReceived(@Req() req) {
    return this.friendService.getReceivedRequests(req.user.userId);
  }

  // ============================
  // REQUESTS I SENT (REQUESTED)
  // ============================
  @Get("requests/sent")
  getSent(@Req() req) {
    return this.friendService.getSentRequests(req.user.userId);
  }

  // ============================
  // FRIEND SUGGESTION
  // ============================
  @Get("suggest")
  suggest(@Req() req) {
    return this.friendService.suggestFriends(req.user.userId);
  }

  // ============================
  // LEADERBOARD (points)
  // ============================
  @Get("leaderboard")
  getLeaderboard(@Req() req) {
    return this.friendService.getLeaderboard(req.user.userId);
  }

  // ============================
  // STEPS LEADERBOARD (today)
  // ============================
  @Get("leaderboard/steps")
  getStepsLeaderboard(@Req() req) {
    return this.friendService.getStepsLeaderboard(req.user.userId);
  }

  // ============================
  // UNFRIEND
  // ============================
  @Post("unfriend/:targetId")
  unfriend(
    @Req() req,
    @Param("targetId") targetId: number,
  ) {
    return this.friendService.unfriend(req.user.userId, targetId);
  }
}

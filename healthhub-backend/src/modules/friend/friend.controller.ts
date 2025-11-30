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

  @Post("request")
  sendFriendRequest(@Req() req, @Body("toUserId") toUserId: number) {
    return this.friendService.sendRequest(req.user.userId, toUserId);
  }

  @Post("respond")
  respondRequest(
    @Req() req,
    @Body("requestId") requestId: string,
    @Body("accept") accept: boolean,
  ) {
    return this.friendService.respondRequest(req.user.userId, requestId, accept);
  }

  @Get("list")
  getFriends(@Req() req) {
    return this.friendService.getFriends(req.user.userId);
  }

  @Get("pending")
  getPending(@Req() req) {
    return this.friendService.getPendingRequests(req.user.userId);
  }

  @Get("suggest")
  suggest(@Req() req) {
    return this.friendService.suggestFriends(req.user.userId);
  }

  @Post("unfriend/:targetId")
  unfriend(@Req() req, @Param("targetId") targetId: number) {
    return this.friendService.unfriend(req.user.userId, targetId);
  }
}


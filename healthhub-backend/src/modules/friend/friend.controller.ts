import { Body, Controller, Get, Param, Post, Query } from "@nestjs/common";
import { FriendService } from "./friend.service";
import { SendFriendRequestDto } from "./dto/send-request.dto";
import { RespondFriendRequestDto } from "./dto/respond-request.dto";

@Controller("friends")
export class FriendController {
  constructor(private friendService: FriendService) {}

  @Post("request")
  sendFriendRequest(@Body() dto: SendFriendRequestDto) {
    return this.friendService.sendRequest(dto);
  }

  @Post("respond")
  respondRequest(@Body() dto: RespondFriendRequestDto) {
    return this.friendService.respondRequest(dto);
  }

  @Get("list/:userId")
  getFriends(@Param("userId") userId: number) {
    return this.friendService.getFriends(userId);
  }

  @Get("pending/:userId")
  pending(@Param("userId") userId: number) {
    return this.friendService.getPendingRequests(userId);
  }

  // @Get("search")
  // search(@Query("q") q: string) {
  //   return this.friendService.search(q);
  // }

  // @Get("suggest/:userId")
  // suggest(@Param("userId") userId: number) {
  //   return this.friendService.suggestFriends(userId);
  // }

  @Post("unfriend/:userId/:targetId")
  unfriend(
    @Param("userId") userId: number,
    @Param("targetId") targetId: number,
  ) {
    return this.friendService.unfriend(userId, targetId);
  }
}

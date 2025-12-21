import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { FriendRequest } from "./entities/friend-request.entity";
import { Friend } from "./entities/friend.entity";
import { FriendService } from "./friend.service";
import { FriendController } from "./friend.controller";
import { UsersModule } from "../users/users.module";
import { KafkaModule } from "../kafka/kafka.module";

@Module({
  imports: [
    UsersModule,
    TypeOrmModule.forFeature([FriendRequest, Friend]),
    KafkaModule,
  ],
  controllers: [FriendController],
  providers: [FriendService],
})
export class FriendModule {}

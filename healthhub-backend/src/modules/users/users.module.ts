import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { User } from './entities/user.entity';
import { Friend } from '../friend/entities/friend.entity';
import { FriendRequest } from '../friend/entities/friend-request.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User, Friend, FriendRequest])],
  providers: [UsersService],
  controllers: [UsersController],
  exports: [UsersService], 
})
export class UsersModule {}

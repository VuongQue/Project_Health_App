import {
  Column,
  Entity,
  ManyToOne,
  JoinColumn,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from "typeorm";
import { User } from "../../users/entities/user.entity";

export type FriendRequestStatus = "pending" | "accepted" | "rejected";

@Entity('friend_request')
export class FriendRequest {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: "from_user_id", type: 'int' })
  fromUserId: number;

  @Column({ name: "to_user_id", type: 'int' })
  toUserId: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: "from_user_id" })
  fromUser: User;

  @ManyToOne(() => User)
  @JoinColumn({ name: "to_user_id" })
  toUser: User;

  @Column({
    type: "enum",
    enum: ["pending", "accepted", "rejected"],
    default: "pending",
  })
  status: FriendRequestStatus;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}


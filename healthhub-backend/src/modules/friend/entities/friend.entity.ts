import {
  Entity,
  ManyToOne,
  JoinColumn,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  Column,
} from "typeorm";
import { User } from "../../users/entities/user.entity";

@Entity("friends")
export class Friend {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ name: "user_id", type: "int" })
  userId: number;

  @Column({ name: "friend_id", type: "int" })
  friendId: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: "user_id" })
  user: User;

  @ManyToOne(() => User)
  @JoinColumn({ name: "friend_id" })
  friend: User;

  @CreateDateColumn()
  createdAt: Date;
}

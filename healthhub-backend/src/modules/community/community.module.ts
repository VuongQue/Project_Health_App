import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CommunityController, GroupController } from './community.controller';
import { CommunityService } from './community.service';
import { Post, PostSchema } from './schemas/post.schema';
import { Comment, CommentSchema } from './schemas/comment.schema';
import { Story, StorySchema } from './schemas/story.schema';
import { Group, GroupSchema } from './schemas/group.schema';
import { Report, ReportSchema } from './schemas/report.schema';
import { UsersModule } from '../users/users.module';
import { NotificationModule } from '../notification/notification.module';
import { AiModule } from '../ai/ai.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Post.name, schema: PostSchema },
      { name: Comment.name, schema: CommentSchema },
      { name: Story.name, schema: StorySchema },
      { name: Group.name, schema: GroupSchema },
      { name: Report.name, schema: ReportSchema },
    ]),
    UsersModule,
    NotificationModule,
    AiModule,
  ],
  controllers: [CommunityController, GroupController],
  providers: [CommunityService],
  exports: [CommunityService],
})
export class CommunityModule {}


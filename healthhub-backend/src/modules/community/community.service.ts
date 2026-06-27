import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Post, PostDocument } from './schemas/post.schema';
import { Comment, CommentDocument } from './schemas/comment.schema';
import { Story, StoryDocument } from './schemas/story.schema';
import { Group, GroupDocument } from './schemas/group.schema';
import { Report, ReportDocument, ReportReason, ReportStatus } from './schemas/report.schema';
import { CreatePostDto } from './dto/create-post.dto';
import { CreateCommentDto } from './dto/create-comment.dto';
import { CreateStoryDto } from './dto/create-story.dto';
import { CreateGroupDto } from './dto/create-group.dto';
import { UsersService } from '../users/users.service';
import { NotificationService } from '../notification/notification.service';
import { NotificationType } from '../notification/entities/notification.entity';
import { AiService } from '../ai/ai.service';

type LeanStory = Omit<Story, '_id'> & { _id: Types.ObjectId };

@Injectable()
export class CommunityService {
  constructor(
    @InjectModel(Post.name) private postModel: Model<PostDocument>,
    @InjectModel(Comment.name) private commentModel: Model<CommentDocument>,
    @InjectModel(Story.name) private storyModel: Model<StoryDocument>,
    @InjectModel(Group.name) private groupModel: Model<GroupDocument>,
    @InjectModel(Report.name) private reportModel: Model<ReportDocument>,
    private readonly usersService: UsersService,
    private readonly notificationService: NotificationService,
    private readonly aiService: AiService,
  ) {}

  // CREATE POST
  async createPost(userId: string, dto: CreatePostDto) {
    // AI toxicity check
    if (dto.content?.trim()) {
      const toxicity = await this.aiService.checkToxicity(dto.content);
      if (toxicity.isToxic && toxicity.score >= 70) {
        throw new BadRequestException(
          `Nội dung vi phạm quy tắc cộng đồng: ${toxicity.reason ?? 'nội dung không phù hợp'}. Vui lòng chỉnh sửa trước khi đăng.`
        );
      }
    }

    const user = await this.usersService.getUserById(userId);

    const post = await this.postModel.create({
      userId,
      user: {
        name: user.fullName,
        avatar: user.avatarUrl,
      },
      content: dto.content,
      media: dto.media || [],
      status: 'approved',
      likes: [],
      likeCount: 0,
      commentCount: 0,
    });

    return this.populatePost(post._id);
  }

  // FEED — chỉ lấy post không thuộc group
  async getPosts(page = 1, limit = 10) {
    const skip = (page - 1) * limit;
    const filter = { status: 'approved', isHidden: { $ne: true }, groupId: null };

    const [posts, total] = await Promise.all([
      this.postModel.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean().exec(),
      this.postModel.countDocuments(filter),
    ]);

    return { total, page, limit, posts };
  }

  // FRIENDS FEED — posts from specific userIds
  async getFriendsFeed(friendUserIds: string[], limit = 10) {
    if (!friendUserIds.length) return [];
    return this.postModel
      .find({
        userId: { $in: friendUserIds },
        status: 'approved',
        isHidden: { $ne: true },
      })
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean()
      .exec();
  }

  // SEARCH POSTS
  async searchPosts(q: string, page = 1, limit = 10) {
    const skip = (page - 1) * limit;
    const filter = {
      $text: { $search: q },
      status: 'approved',
      isHidden: { $ne: true },
      groupId: null,
    };
    const [posts, total] = await Promise.all([
      this.postModel.find(filter, { score: { $meta: 'textScore' } })
        .sort({ score: { $meta: 'textScore' } })
        .skip(skip).limit(limit).lean(),
      this.postModel.countDocuments(filter),
    ]);
    return { total, page, limit, posts };
  }

  // POST DETAIL
  async getPost(id: string) {
    return this.populatePost(id);
  }

  // LIKE
  async toggleLike(userId: string, postId: string) {
    const post = await this.postModel.findById(postId);
    if (!post) throw new NotFoundException('Post not found');

    const already = post.likes.includes(userId);

    if (already) {
      post.likes = post.likes.filter((u) => u !== userId);
    } else {
      post.likes.push(userId);
      // notify post owner if different user
      if (post.userId !== userId) {
        const liker = await this.usersService.getUserById(userId);
        this.notificationService.createForUserId(
          Number(post.userId),
          NotificationType.LIKE,
          `${liker.fullName} đã thích bài viết của bạn`,
          { metadata: { postId } },
        ).catch(() => {});
      }
    }

    post.likeCount = post.likes.length;
    await post.save();

    return this.populatePost(postId);
  }

  // COMMENT
  async commentPost(userId: string, postId: string, dto: CreateCommentDto) {
    // AI toxicity check
    if (dto.text?.trim()) {
      const toxicity = await this.aiService.checkToxicity(dto.text);
      if (toxicity.isToxic && toxicity.score >= 70) {
        throw new BadRequestException(
          `Bình luận vi phạm quy tắc cộng đồng: ${toxicity.reason ?? 'nội dung không phù hợp'}.`
        );
      }
    }

    const post = await this.postModel.findById(postId);
    if (!post) throw new NotFoundException('Post not found');

    const user = await this.usersService.getUserById(userId);

    const comment = await this.commentModel.create({
      postId: new Types.ObjectId(postId),
      userId,
      user: {
        name: user.fullName,
        avatar: user.avatarUrl,
      },
      text: dto.text,
      parentId: dto.parentId || null,
    });

    post.commentCount++;
    await post.save();

    // notify post owner
    if (post.userId !== userId) {
      this.notificationService.createForUserId(
        Number(post.userId),
        NotificationType.COMMENT,
        `${user.fullName} đã bình luận: "${dto.text.slice(0, 50)}${dto.text.length > 50 ? '...' : ''}"`,
        { metadata: { postId } },
      ).catch(() => {});
    }

    return this.populateComment(comment._id);
  }

  // GET COMMENTS
  async getComments(postId: string) {
    const list = await this.commentModel
      .find({ postId: new Types.ObjectId(postId) })
      .sort({ createdAt: 1 })
      .lean();


    return list;
  }


  // STORIES
  async getStories(userId: string) {
    const list = await this.storyModel
      .find()
      .sort({ createdAt: -1 })
      .lean<LeanStory[]>()  
      .exec();
  
    return list.map((s) => ({
      id: s._id.toString(),    
      user: s.user,
      hasStory: true,
      isYourStory: s.userId === userId,
      media: s.media,
      createdAt: s.createdAt,
    }));
  }
  

  // POPULATE POST + 2 COMMENT PREVIEW
  private async populatePost(id: string | Types.ObjectId) {
    const post = await this.postModel.findById(id).lean();

    if (!post) return null;

    const previews = await this.commentModel
      .find({ postId: post._id })
      .sort({ createdAt: -1 })
      .limit(2)
      .lean();

    return {
      ...post,
      likes: post.likes || [],
      commentPreview: previews.map((c) => ({
        id: c._id,
        text: c.text,
        user: c.user,
      })),
    };
  }

  private async populateComment(id: string | Types.ObjectId) {
    return this.commentModel.findById(id).lean();
  }

  // EDIT POST
  async editPost(userId: string, postId: string, content: string) {
    const post = await this.postModel.findOne({ _id: postId, userId });
    if (!post) throw new ForbiddenException('Post not found or no permission');
    post.content = content;
    await post.save();
    return this.populatePost(post._id);
  }

  // DELETE POST
  async deletePost(userId: string, postId: string) {
    const post = await this.postModel.findOne({ _id: postId, userId });
    if (!post) throw new NotFoundException('Post not found or no permission');
    await this.commentModel.deleteMany({ postId: post._id });
    await post.deleteOne();
    return { success: true };
  }

  // DELETE COMMENT
  async deleteComment(userId: string, commentId: string) {
    const comment = await this.commentModel.findOne({
      _id: commentId,
      userId,
    });

    if (!comment) {
      throw new NotFoundException('Comment not found or no permission');
    }

    if (comment.postId) {
      await this.postModel.updateOne(
        { _id: comment.postId },
        { $inc: { commentCount: -1 } },
      );
    }

    await comment.deleteOne();
    return { success: true };
  }
  async createStory(userId: string, dto: CreateStoryDto) {
    const user = await this.usersService.getUserById(userId);

    const story = await this.storyModel.create({
      userId,
      user: {
        name: user.fullName,
        avatar: user.avatarUrl,
      },
      media: dto.media,
    });

    return {
      id: story._id,
      user: story.user,
      media: story.media,
      createdAt: story.createdAt,
      isYourStory: true,
      hasStory: true,
    };
  }


  // =====================================================================
  // GROUP
  // =====================================================================

  async createGroup(userId: string, dto: CreateGroupDto) {
    const user = await this.usersService.getUserById(userId);
    const group = await this.groupModel.create({
      name: dto.name,
      description: dto.description ?? '',
      avatarUrl: dto.avatarUrl ?? null,
      type: dto.type ?? 'public',
      createdBy: userId,
      creator: { name: user.fullName, avatar: user.avatarUrl },
      members: [userId],
      memberCount: 1,
    });
    return group;
  }

  async getGroups(page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [groups, total] = await Promise.all([
      this.groupModel.find({ type: 'public' }).sort({ memberCount: -1 }).skip(skip).limit(limit).lean(),
      this.groupModel.countDocuments({ type: 'public' }),
    ]);
    return { total, page, limit, groups };
  }

  async getMyGroups(userId: string) {
    return this.groupModel.find({ members: userId }).sort({ createdAt: -1 }).lean();
  }

  async getGroupById(groupId: string) {
    const group = await this.groupModel.findById(groupId).lean();
    if (!group) throw new NotFoundException('Group not found');
    return group;
  }

  async joinGroup(userId: string, groupId: string) {
    const group = await this.groupModel.findById(groupId);
    if (!group) throw new NotFoundException('Group not found');
    if (!group.members.includes(userId)) {
      group.members.push(userId);
      group.memberCount = group.members.length;
      await group.save();
    }
    return { success: true, memberCount: group.memberCount };
  }

  async leaveGroup(userId: string, groupId: string) {
    const group = await this.groupModel.findById(groupId);
    if (!group) throw new NotFoundException('Group not found');
    group.members = group.members.filter((m) => m !== userId);
    group.memberCount = group.members.length;
    await group.save();
    return { success: true };
  }

  async getGroupPosts(groupId: string, page = 1, limit = 10) {
    const skip = (page - 1) * limit;
    const gid = new Types.ObjectId(groupId);
    const filter = { groupId: gid, status: 'approved', isHidden: { $ne: true } };
    const [posts, total] = await Promise.all([
      this.postModel.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      this.postModel.countDocuments(filter),
    ]);
    return { total, page, limit, posts };
  }

  async createGroupPost(userId: string, groupId: string, dto: CreatePostDto) {
    const group = await this.groupModel.findById(groupId);
    if (!group) throw new NotFoundException('Group not found');
    if (!group.members.includes(userId)) throw new ForbiddenException('Not a member of this group');

    const user = await this.usersService.getUserById(userId);
    const post = await this.postModel.create({
      userId,
      user: { name: user.fullName, avatar: user.avatarUrl },
      content: dto.content,
      media: dto.media || [],
      status: 'approved',
      likes: [],
      likeCount: 0,
      commentCount: 0,
      groupId: new Types.ObjectId(groupId),
    });
    return this.populatePost(post._id);
  }

  async adminListPosts(keyword: string, page: number, limit: number) {
    const skip = (page - 1) * limit;
    const filter: any = keyword
      ? { $or: [{ content: new RegExp(keyword, 'i') }, { authorName: new RegExp(keyword, 'i') }] }
      : {};
  
      const items = await this.postModel
      .find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean()
      .exec();
    
    const total = await this.postModel.countDocuments(filter);
    
    return { items, total, page, limit };
    
  }
  
  async adminHidePost(id: string) {
    return this.postModel.findByIdAndUpdate(id, { isHidden: true }, { new: true });
  }
  
  async adminUnhidePost(id: string) {
    return this.postModel.findByIdAndUpdate(id, { isHidden: false }, { new: true });
  }
  
  async adminDeletePost(id: string) {
    await this.postModel.findByIdAndDelete(id);
    return { ok: true };
  }
  
  async adminCountPosts() {
    return this.postModel.countDocuments();
  }

  // =====================================================================
  // REPORT
  // =====================================================================

  async reportPost(
    reporterId: string,
    postId: string,
    reason: ReportReason,
    description: string,
  ) {
    const post = await this.postModel.findById(postId);
    if (!post) throw new NotFoundException('Post not found');

    const reporter = await this.usersService.getUserById(reporterId);
    await this.reportModel.create({
      reporterId,
      reporter: { name: reporter.fullName, avatar: reporter.avatarUrl },
      postId: new Types.ObjectId(postId),
      targetUserId: post.userId,
      reason,
      description,
      status: ReportStatus.PENDING,
    });

    // Auto-hide post if it accumulates 5+ reports
    const reportCount = await this.reportModel.countDocuments({
      postId: new Types.ObjectId(postId),
      status: { $ne: ReportStatus.DISMISSED },
    });
    if (reportCount >= 5) {
      await this.postModel.findByIdAndUpdate(postId, { isHidden: true });
    }

    return { success: true };
  }

  async getAdminReports(page = 1, limit = 20, status?: string) {
    const skip = (page - 1) * limit;
    const filter: any = status ? { status } : {};
    const [items, total] = await Promise.all([
      this.reportModel.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      this.reportModel.countDocuments(filter),
    ]);
    return { items, total, page, limit };
  }

  async resolveReport(
    reportId: string,
    action: 'warn' | 'hide' | 'dismiss',
    adminNote?: string,
  ) {
    const report = await this.reportModel.findById(reportId);
    if (!report) throw new NotFoundException('Report not found');

    report.status = action === 'dismiss' ? ReportStatus.DISMISSED : ReportStatus.RESOLVED;
    report.adminNote = adminNote ?? '';
    await report.save();

    if (action === 'hide' && report.postId) {
      await this.postModel.findByIdAndUpdate(report.postId, { isHidden: true });
    }

    if ((action === 'warn' || action === 'hide') && report.targetUserId) {
      await this.issueWarning(report.targetUserId, report.reason, report.postId?.toString());
    }

    return { success: true };
  }

  async issueWarning(targetUserId: string, reason: string, postId?: string) {
    const user = await this.usersService.getUserFullById(targetUserId);
    user.warningCount = (user.warningCount ?? 0) + 1;

    // Auto-lock after 3 warnings
    if (user.warningCount >= 3) {
      (user as any).status = 'LOCKED';
      const until = new Date();
      until.setDate(until.getDate() + 7);
      user.bannedUntil = until;
    }

    await this.usersService.save(user);

    // Notify the user
    this.notificationService.createForUserId(
      Number(targetUserId),
      NotificationType.WARNING,
      user.warningCount >= 3
        ? 'Tài khoản của bạn đã bị khóa 7 ngày do vi phạm nhiều lần.'
        : `Bạn nhận cảnh báo vi phạm cộng đồng (${user.warningCount}/3): ${reason}. Tích lũy 3 cảnh báo sẽ bị khóa tài khoản.`,
      { metadata: { postId, warningCount: user.warningCount } },
    ).catch(() => {});

    return { warningCount: user.warningCount };
  }

}

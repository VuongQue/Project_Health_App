import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Post, PostDocument } from './schemas/post.schema';
import { Comment, CommentDocument } from './schemas/comment.schema';
import { Story, StoryDocument } from './schemas/story.schema';
import { CreatePostDto } from './dto/create-post.dto';
import { CreateCommentDto } from './dto/create-comment.dto';
import { CreateStoryDto } from './dto/create-story.dto';

import { UsersService } from '../users/users.service';

@Injectable()
export class CommunityService {
  constructor(
    @InjectModel(Post.name) private postModel: Model<PostDocument>,
    @InjectModel(Comment.name) private commentModel: Model<CommentDocument>,
    @InjectModel(Story.name) private storyModel: Model<StoryDocument>,
    private readonly usersService: UsersService, // MySQL user
  ) {}

  // CREATE POST
  async createPost(userId: string, dto: CreatePostDto) {

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

  // FEED
  async getPosts(page = 1, limit = 10) {
    try {
      const skip = (page - 1) * limit;

      const posts = await this.postModel
        .find({ status: 'approved' })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean()
        .exec();

      const total = await this.postModel.countDocuments({
        status: 'approved',
      });

      const populated = await Promise.all(
        posts.map((p) => this.populatePost(p._id)),
      );

      return { total, page, limit, posts: populated };
    } catch (err) {
      console.error('❌ ERROR in getPosts:', err);
      throw err;
    }
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
    }

    post.likeCount = post.likes.length;
    await post.save();

    return this.populatePost(postId);
  }

  // COMMENT
  async commentPost(userId: string, postId: string, dto: CreateCommentDto) {
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

    return this.populateComment(comment._id);
  }

  // GET COMMENTS
  async getComments(postId: string) {
    return this.commentModel
      .find({ postId: new Types.ObjectId(postId) })
      .sort({ createdAt: 1 })
      .lean();
  }

  // STORIES
  async getStories(userId: string) {
    const list = await this.storyModel
      .find()
      .sort({ createdAt: -1 })
      .lean();

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

  // DELETE POST
  async deletePost(userId: string, postId: string) {
    const post = await this.postModel.findOne({
      _id: postId,
      userId,
    });

    if (!post) {
      throw new NotFoundException('Post not found or no permission');
    }

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

}

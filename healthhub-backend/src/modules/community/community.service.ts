import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Post } from './schemas/post.schema';
import { Comment } from './schemas/comment.schema';
import { CreatePostDto } from './dto/create-post.dto';
import { CreateCommentDto } from './dto/create-comment.dto';

@Injectable()
export class CommunityService {
  constructor(
    @InjectModel(Post.name) private postModel: Model<Post>,
    @InjectModel(Comment.name) private commentModel: Model<Comment>,
  ) {}

  async createPost(userId: string, dto: CreatePostDto) {
    const post = new this.postModel({
      userId: new Types.ObjectId(userId),
      content: dto.content,
      media: dto.media || [],
    });
    return post.save();
  }

  async getAllPosts() {
    return this.postModel.find({ status: 'approved' }).sort({ createdAt: -1 });
  }

  async likePost(userId: string, postId: string) {
    const post = await this.postModel.findById(postId);
    if (!post) throw new NotFoundException('Post not found');
    post.likeCount += 1;
    await post.save();
    return post;
  }

  async commentPost(userId: string, postId: string, dto: CreateCommentDto) {
    const post = await this.postModel.findById(postId);
    if (!post) throw new NotFoundException('Post not found');

    const comment = new this.commentModel({
      postId,
      userId,
      text: dto.text,
    });
    await comment.save();
    return comment;
  }

  async getComments(postId: string) {
    return this.commentModel.find({ postId }).sort({ createdAt: -1 });
  }
}

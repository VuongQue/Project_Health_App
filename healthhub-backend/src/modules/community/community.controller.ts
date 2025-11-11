import { Controller, Post, Get, Body, Param, Req, UseGuards } from '@nestjs/common';
import { CommunityService } from './community.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CreatePostDto } from './dto/create-post.dto';
import { CreateCommentDto } from './dto/create-comment.dto';

@Controller('posts')
export class CommunityController {
  constructor(private readonly communityService: CommunityService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  createPost(@Req() req, @Body() dto: CreatePostDto) {
    return this.communityService.createPost(req.user.userId, dto);
  }

  @Get()
  getPosts() {
    return this.communityService.getAllPosts();
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/like')
  like(@Req() req, @Param('id') id: string) {
    return this.communityService.likePost(req.user.userId, id);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/comment')
  comment(@Req() req, @Param('id') id: string, @Body() dto: CreateCommentDto) {
    return this.communityService.commentPost(req.user.userId, id, dto);
  }

  @Get(':id/comments')
  getComments(@Param('id') id: string) {
    return this.communityService.getComments(id);
  }
}

import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Req,
  UseGuards,
  Query,
  Delete,
} from '@nestjs/common';
import { CommunityService } from './community.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CreatePostDto } from './dto/create-post.dto';
import { CreateCommentDto } from './dto/create-comment.dto';
import { CreateStoryDto } from './dto/create-story.dto';

@Controller('posts')
export class CommunityController {
  constructor(private readonly communityService: CommunityService) {}

  // STORIES must be before ":id"
  @UseGuards(JwtAuthGuard)
  @Get('stories/list')
  getStories(@Req() req) {
    return this.communityService.getStories(req.user.userId);
  }
  @UseGuards(JwtAuthGuard)
  @Post('stories')
  async createStory(@Req() req, @Body() dto: CreateStoryDto) {
    return this.communityService.createStory(req.user.userId, dto);
  }


  // FEED
  @Get()
  getPosts(@Query('page') page = 1, @Query('limit') limit = 10) {
    return this.communityService.getPosts(+page, +limit);
  }

  // CREATE POST
  @UseGuards(JwtAuthGuard)
  @Post()
  createPost(@Req() req, @Body() dto: CreatePostDto) {
    return this.communityService.createPost(req.user.userId, dto);
  }

  // POST DETAIL
  @Get(':id')
  getPost(@Param('id') id: string) {
    return this.communityService.getPost(id);
  }

  // LIKE
  @UseGuards(JwtAuthGuard)
  @Post(':id/like')
  toggleLike(@Req() req, @Param('id') id: string) {
    return this.communityService.toggleLike(req.user.userId, id);
  }

  // COMMENT
  @UseGuards(JwtAuthGuard)
  @Post(':id/comment')
  comment(@Req() req, @Param('id') id: string, @Body() dto: CreateCommentDto) {
    return this.communityService.commentPost(req.user.userId, id, dto);
  }

  // GET COMMENTS
  @Get(':id/comments')
  getComments(@Param('id') id: string) {
    return this.communityService.getComments(id);
  }

  // DELETE POST
  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  deletePost(@Req() req, @Param('id') id: string) {
    return this.communityService.deletePost(req.user.userId, id);
  }

  // DELETE COMMENT
  @UseGuards(JwtAuthGuard)
  @Delete(':postId/comments/:commentId')
  deleteComment(@Req() req, @Param('commentId') id: string) {
    return this.communityService.deleteComment(req.user.userId, id);
  }
}

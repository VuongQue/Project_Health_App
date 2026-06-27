import {
  Controller,
  Post,
  Get,
  Patch,
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
import { CreateGroupDto } from './dto/create-group.dto';
import { ReportReason } from './schemas/report.schema';

// ─────────────────────────── POSTS ───────────────────────────
@Controller('posts')
export class CommunityController {
  constructor(private readonly communityService: CommunityService) {}

  // STORIES — must be before :id
  @UseGuards(JwtAuthGuard)
  @Get('stories/list')
  getStories(@Req() req) {
    return this.communityService.getStories(req.user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Post('stories')
  createStory(@Req() req, @Body() dto: CreateStoryDto) {
    return this.communityService.createStory(req.user.userId, dto);
  }

  // FEED
  @Get()
  getPosts(
    @Query('page') page = 1,
    @Query('limit') limit = 10,
    @Query('q') q?: string,
    @Query('userIds') userIds?: string,
  ) {
    if (q?.trim()) return this.communityService.searchPosts(q, +page, +limit);
    if (userIds?.trim()) {
      const ids = userIds.split(',').filter(Boolean);
      return this.communityService.getFriendsFeed(ids, +limit);
    }
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

  // EDIT POST
  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  editPost(@Req() req, @Param('id') id: string, @Body('content') content: string) {
    return this.communityService.editPost(req.user.userId, id, content);
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

  // REPORT POST
  @UseGuards(JwtAuthGuard)
  @Post(':id/report')
  reportPost(
    @Req() req,
    @Param('id') id: string,
    @Body('reason') reason: ReportReason,
    @Body('description') description = '',
  ) {
    return this.communityService.reportPost(req.user.userId, id, reason, description);
  }
}

// ─────────────────────────── GROUPS ───────────────────────────
import { Controller as NestController } from '@nestjs/common';

@NestController('groups')
export class GroupController {
  constructor(private readonly communityService: CommunityService) {}

  @Get()
  getGroups(@Query('page') page = 1, @Query('limit') limit = 20) {
    return this.communityService.getGroups(+page, +limit);
  }

  @UseGuards(JwtAuthGuard)
  @Get('my')
  getMyGroups(@Req() req) {
    return this.communityService.getMyGroups(req.user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Post()
  createGroup(@Req() req, @Body() dto: CreateGroupDto) {
    return this.communityService.createGroup(req.user.userId, dto);
  }

  @Get(':id')
  getGroupById(@Param('id') id: string) {
    return this.communityService.getGroupById(id);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/join')
  joinGroup(@Req() req, @Param('id') id: string) {
    return this.communityService.joinGroup(req.user.userId, id);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/leave')
  leaveGroup(@Req() req, @Param('id') id: string) {
    return this.communityService.leaveGroup(req.user.userId, id);
  }

  @Get(':id/posts')
  getGroupPosts(
    @Param('id') id: string,
    @Query('page') page = 1,
    @Query('limit') limit = 10,
  ) {
    return this.communityService.getGroupPosts(id, +page, +limit);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/posts')
  createGroupPost(@Req() req, @Param('id') id: string, @Body() dto: CreatePostDto) {
    return this.communityService.createGroupPost(req.user.userId, id, dto);
  }
}

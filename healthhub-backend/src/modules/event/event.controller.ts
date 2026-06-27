import {
  Controller, Post, Get, Delete, Patch, Body, Req, Param, UseGuards, Query,
} from '@nestjs/common';
import { SubmissionStatus } from './entities/event-submission.entity';
import { EventService } from './event.service';
import { CreateEventDto } from './dto/create-event.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@Controller('events')
export class EventController {
  constructor(private eventService: EventService) {}

  // ─── PUBLIC EVENTS ──────────────────────────────────────────────────────────

  /** Tất cả sự kiện công khai (không cần đăng nhập) */
  @Get()
  getAll() {
    return this.eventService.getPublicEvents();
  }

  // ─── GROUP EVENTS ───────────────────────────────────────────────────────────

  /** Events của một group cụ thể (yêu cầu đăng nhập + là member) */
  @UseGuards(JwtAuthGuard)
  @Get('group/:groupId')
  getGroupEvents(@Param('groupId') groupId: string, @Req() req) {
    return this.eventService.getGroupEvents(groupId, req.user.userId);
  }

  // ─── CREATE ─────────────────────────────────────────────────────────────────

  @UseGuards(JwtAuthGuard)
  @Post()
  create(@Req() req, @Body() dto: CreateEventDto) {
    return this.eventService.createEvent(req.user.userId, dto);
  }

  // ─── REGISTER / UNREGISTER ──────────────────────────────────────────────────

  @UseGuards(JwtAuthGuard)
  @Post(':id/register')
  register(@Req() req, @Param('id') id: number) {
    return this.eventService.register(req.user.userId, id);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id/register')
  unregister(@Req() req, @Param('id') id: number) {
    return this.eventService.unregister(req.user.userId, id);
  }

  // ─── CHECK-IN ───────────────────────────────────────────────────────────────

  @UseGuards(JwtAuthGuard)
  @Post(':id/checkin')
  checkIn(@Req() req, @Param('id') id: number) {
    return this.eventService.checkIn(req.user.userId, id);
  }

  // ─── MY REGISTRATIONS (PERSONAL DASHBOARD) ──────────────────────────────────

  @UseGuards(JwtAuthGuard)
  @Get('me/registrations')
  myRegistrations(@Req() req) {
    return this.eventService.getRegistrations(req.user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me/active')
  myActiveRegistrations(@Req() req) {
    return this.eventService.getActiveRegistrations(req.user.userId);
  }

  // ─── VERIFY PROGRESS (tự động từ dữ liệu thực) ──────────────────────────────

  @UseGuards(JwtAuthGuard)
  @Post(':id/verify-progress')
  verifyProgress(@Req() req, @Param('id') id: number) {
    return this.eventService.verifyProgress(req.user.userId, id);
  }

  // ─── DETAIL ─────────────────────────────────────────────────────────────────

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  getById(@Param('id') id: number, @Req() req) {
    return this.eventService.getById(id, req.user.userId);
  }

  // ─── LEADERBOARD ────────────────────────────────────────────────────────────

  @UseGuards(JwtAuthGuard)
  @Get(':id/leaderboard')
  getLeaderboard(@Param('id') id: number) {
    return this.eventService.getLeaderboard(id);
  }

  // ─── PARTICIPANTS ───────────────────────────────────────────────────────────

  @UseGuards(JwtAuthGuard)
  @Get(':id/participants')
  getParticipants(@Param('id') id: number) {
    return this.eventService.getParticipants(id);
  }

  // ─── MEDIA SUBMISSIONS ───────────────────────────────────────────────────────

  /** User nộp minh chứng (ảnh/video) */
  @UseGuards(JwtAuthGuard)
  @Post(':id/submissions')
  submitMedia(@Req() req, @Param('id') id: number, @Body() body: { mediaUrl: string; mediaType: 'video' | 'image'; userNote?: string }) {
    return this.eventService.submitMedia(req.user.userId, id, body);
  }

  /** User xem submissions của mình */
  @UseGuards(JwtAuthGuard)
  @Get(':id/submissions/my')
  mySubmissions(@Req() req, @Param('id') id: number) {
    return this.eventService.getMySubmissions(req.user.userId, id);
  }

  /** Admin xem tất cả submissions của event */
  @UseGuards(JwtAuthGuard)
  @Get(':id/submissions')
  adminGetSubmissions(@Param('id') id: number, @Query('status') status?: SubmissionStatus) {
    return this.eventService.getSubmissionsForAdmin(id, status);
  }

  /** Admin duyệt submission */
  @UseGuards(JwtAuthGuard)
  @Patch('submissions/:subId/approve')
  approveSubmission(@Req() req, @Param('subId') subId: number) {
    return this.eventService.approveSubmission(req.user.userId, subId);
  }

  /** Admin từ chối nhẹ (WARN) — cho phép upload lại */
  @UseGuards(JwtAuthGuard)
  @Patch('submissions/:subId/warn')
  warnSubmission(@Req() req, @Param('subId') subId: number, @Body('reason') reason: string) {
    return this.eventService.warnSubmission(req.user.userId, subId, reason);
  }

  /** Admin đánh dấu gian lận (FRAUD) — ban + reset progress */
  @UseGuards(JwtAuthGuard)
  @Patch('submissions/:subId/fraud')
  fraudSubmission(@Req() req, @Param('subId') subId: number, @Body('reason') reason: string) {
    return this.eventService.fraudSubmission(req.user.userId, subId, reason);
  }

  /** User khiếu nại sau khi bị FRAUD */
  @UseGuards(JwtAuthGuard)
  @Post('submissions/:subId/appeal')
  appealSubmission(@Req() req, @Param('subId') subId: number, @Body() body: { appealNote: string; appealMediaUrl?: string }) {
    return this.eventService.appealSubmission(req.user.userId, subId, body);
  }

  /** Admin quyết định cuối sau appeal: restore | keep_ban */
  @UseGuards(JwtAuthGuard)
  @Patch('submissions/:subId/resolve-appeal')
  resolveAppeal(@Req() req, @Param('subId') subId: number, @Body() body: { decision: 'restore' | 'keep_ban'; adminNote?: string }) {
    return this.eventService.resolveAppeal(req.user.userId, subId, body.decision, body.adminNote);
  }

  // ─── DELETE ─────────────────────────────────────────────────────────────────

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  deleteEvent(@Req() req, @Param('id') id: number) {
    return this.eventService.deleteEvent(req.user.userId, id);
  }
}

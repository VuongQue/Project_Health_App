import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  Param,
  Req,
  UseGuards,
} from '@nestjs/common';
import { FitnessService } from './fitness.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

import { CreateWorkoutDto } from './dto/create-workout.dto';
import { CreateWorkoutLogDto } from './dto/create-workout-log.dto';
import { CreateWorkoutPlanDto } from './dto/create-workout-plan.dto';
import { WorkoutFilterDto } from './dto/workout-filter.dto';

@Controller('fitness')
export class FitnessController {
  constructor(private fitnessService: FitnessService) {}

  // WORKOUT LIST
  @Get('workouts')
  getAll(@Query() filter: WorkoutFilterDto) {
    return this.fitnessService.findAllWorkouts(filter);
  }

  // CREATE WORKOUT
  @Post('workouts')
  createWorkout(@Body() dto: CreateWorkoutDto) {
    return this.fitnessService.createWorkout(dto);
  }

  // DETAIL WORKOUT
  @Get('workouts/:id')
  detail(@Param('id') id: number) {
    return this.fitnessService.getWorkoutDetail(id);
  }

  // LOG WORKOUT
  @UseGuards(JwtAuthGuard)
  @Post('logs')
  log(@Req() req, @Body() dto: CreateWorkoutLogDto) {
    return this.fitnessService.logWorkout(req.user, dto);
  }

  // LIST LOGS
  @UseGuards(JwtAuthGuard)
  @Get('logs')
  getLogs(@Req() req) {
    return this.fitnessService.getLogsByUser(req.user);
  }

  // WEEK SUMMARY
  @UseGuards(JwtAuthGuard)
  @Get('logs/week')
  week(@Req() req) {
    return this.fitnessService.getWeeklySummary(req.user);
  }

  // MONTH PROGRESS
  @UseGuards(JwtAuthGuard)
  @Get('progress/month')
  month(@Req() req) {
    return this.fitnessService.getMonthProgress(req.user);
  }

  // UI SUMMARY
  @UseGuards(JwtAuthGuard)
  @Get('summary')
  summary(@Req() req) {
    return this.fitnessService.getSummary(req.user);
  }

  // QUICK START
  @UseGuards(JwtAuthGuard)
  @Post('quick-start')
  quick(@Req() req) {
    return this.fitnessService.quickStart(req.user);
  }

  // WORKOUT PLAN
  @UseGuards(JwtAuthGuard)
  @Post('plans')
  createPlan(@Req() req, @Body() dto: CreateWorkoutPlanDto) {
    return this.fitnessService.createPlan(req.user, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('plans')
  getPlans(@Req() req) {
    return this.fitnessService.getPlansByUser(req.user);
  }
  // ==============================
// SESSION API
// ==============================

  // Lấy session hiện tại (resume workout)
  @UseGuards(JwtAuthGuard)
  @Get('session/:workoutId')
  getActiveSession(@Req() req, @Param('workoutId') workoutId: number) {
    return this.fitnessService.getActiveSession(req.user, workoutId);
  }

  // Bắt đầu hoặc resume session
  @UseGuards(JwtAuthGuard)
  @Post('session/start/:workoutId')
  startSession(@Req() req, @Param('workoutId') workoutId: number) {
    return this.fitnessService.startSession(req.user, workoutId);
  }

  // Update exercise index
  @UseGuards(JwtAuthGuard)
  @Post('session/update/:sessionId')
  updateSession(
    @Req() req,
    @Param('sessionId') sessionId: number,
    @Body() body: { index: number },
  ) {
    return this.fitnessService.updateSession(req.user, sessionId, body.index);
  }

  // Hoàn thành session
  @UseGuards(JwtAuthGuard)
  @Post('session/complete/:sessionId')
  completeSession(@Req() req, @Param('sessionId') sessionId: number, @Body() dto) {
    return this.fitnessService.completeSession(req.user, sessionId, dto);
  }



  // Lấy chi tiết session (workout + exercises)
  @UseGuards(JwtAuthGuard)
  @Get('session/detail/:sessionId')
  getSessionDetail(@Req() req, @Param('sessionId') sessionId: number) {
    return this.fitnessService.getSessionDetail(req.user, sessionId);
  }

  @Get('admin/reindex')
  reindex() {
    return this.fitnessService.reindexAllWorkouts();
  }


}

import { Controller, Get, Post, Body, UseGuards, Req, Query, Param } from '@nestjs/common';
import { FitnessService } from './fitness.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CreateWorkoutDto } from './dto/create-workout.dto';
import { CreateWorkoutLogDto } from './dto/create-workout-log.dto';
import { CreateWorkoutPlanDto } from './dto/create-workout-plan.dto';
import { WorkoutFilterDto } from './dto/workout-filter.dto';

@Controller('fitness')
export class FitnessController {
  constructor(private fitnessService: FitnessService) {}

  // 1. Lấy danh sách bài tập
  @Get('workouts')
  getAllWorkouts(@Query() filter: WorkoutFilterDto) {
    return this.fitnessService.findAllWorkouts(filter);
  }

  // 2. Admin thêm bài tập
  @Post('workouts')
  createWorkout(@Body() dto: CreateWorkoutDto) {
    return this.fitnessService.createWorkout(dto);
  }

  // 3. Người dùng log workout
  @UseGuards(JwtAuthGuard)
  @Post('logs')
  logWorkout(@Req() req, @Body() dto: CreateWorkoutLogDto) {
    return this.fitnessService.logWorkout(req.user, dto);
  }

  // 4. Lấy toàn bộ logs
  @UseGuards(JwtAuthGuard)
  @Get('logs')
  getLogs(@Req() req) {
    return this.fitnessService.getLogsByUser(req.user);
  }

  // 5. Tạo kế hoạch tập luyện
  @UseGuards(JwtAuthGuard)
  @Post('plans')
  createPlan(@Req() req, @Body() dto: CreateWorkoutPlanDto) {
    return this.fitnessService.createPlan(req.user, dto);
  }

  // 6. Lấy kế hoạch
  @UseGuards(JwtAuthGuard)
  @Get('plans')
  getPlans(@Req() req) {
    return this.fitnessService.getPlansByUser(req.user);
  }

  // 7. Weekly summary (cũ)
  @UseGuards(JwtAuthGuard)
  @Get("logs/week")
  getWeeklySummary(@Req() req) {
    return this.fitnessService.getWeeklySummary(req.user);
  }

  // ⭐ NEW: Weekly detail (Mon -> Sun)
  @UseGuards(JwtAuthGuard)
  @Get("logs/week-detail")
  getWeekDetail(@Req() req) {
    return this.fitnessService.getWeeklyDetail(req.user);
  }

  // ⭐ NEW: Monthly progress
  @UseGuards(JwtAuthGuard)
  @Get("progress/month")
  getMonthProgress(@Req() req) {
    return this.fitnessService.getMonthProgress(req.user);
  }

  // ⭐ NEW: Summary tổng quan UI cần
  @UseGuards(JwtAuthGuard)
  @Get("summary")
  getSummary(@Req() req) {
    return this.fitnessService.getSummary(req.user);
  }

  // ⭐ NEW: Quick start workout
  @UseGuards(JwtAuthGuard)
  @Post("quick-start")
  quickStart(@Req() req) {
    return this.fitnessService.quickStart(req.user);
  }
  @Get("workouts/:id")
  getWorkoutDetail(@Param("id") id: number) {
    return this.fitnessService.getWorkoutDetail(id);
  }


}

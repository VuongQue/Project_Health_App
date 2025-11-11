import { Controller, Get, Post, Body, UseGuards, Req } from '@nestjs/common';
import { FitnessService } from './fitness.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CreateWorkoutDto } from './dto/create-workout.dto';
import { CreateWorkoutLogDto } from './dto/create-workout-log.dto';
import { CreateWorkoutPlanDto } from './dto/create-workout-plan.dto';

@Controller('fitness')
export class FitnessController {
  constructor(private fitnessService: FitnessService) {}

  // 1. Lấy danh sách bài tập
  @Get('workouts')
  getAllWorkouts() {
    return this.fitnessService.findAllWorkouts();
  }

  // 2. Admin có thể thêm bài tập
  @Post('workouts')
  createWorkout(@Body() dto: CreateWorkoutDto) {
    return this.fitnessService.createWorkout(dto);
  }

  // 3. Người dùng log buổi tập
  @UseGuards(JwtAuthGuard)
  @Post('logs')
  logWorkout(@Req() req, @Body() dto: CreateWorkoutLogDto) {
    return this.fitnessService.logWorkout(req.user, dto);
  }

  // 4. Xem log tập luyện
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

  // 6. Xem kế hoạch tập luyện
  @UseGuards(JwtAuthGuard)
  @Get('plans')
  getPlans(@Req() req) {
    return this.fitnessService.getPlansByUser(req.user);
  }
}

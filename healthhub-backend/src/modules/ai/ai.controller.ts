import { Body, Controller, Delete, Get, Param, Post, Put, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { AiService, UserHealthContext } from './ai.service';
import { AiChatDto, AnalyzeMealDto, WorkoutPlanDto, CompanionMessageDto } from './dto/ai.dto';
import { AiChatService } from './ai-chat.service';
import { MoodService } from '../mood/mood.service';
import { StepsService } from '../steps/steps.service';
import { WaterIntakeService } from '../water-intake/water-intake.service';
import { FoodDiaryService } from '../food-diary/food-diary.service';
import { BodyMetricsService } from '../body-metrics/body-metrics.service';
import { GoalsService } from '../goals/goals.service';
import { FitnessService } from '../fitness/fitness.service';
import { UsersService } from '../users/users.service';

@UseGuards(JwtAuthGuard)
@Controller('ai')
export class AiController {
  constructor(
    private readonly aiService: AiService,
    private readonly aiChatService: AiChatService,
    private readonly moodService: MoodService,
    private readonly stepsService: StepsService,
    private readonly waterService: WaterIntakeService,
    private readonly foodService: FoodDiaryService,
    private readonly bodyMetricsService: BodyMetricsService,
    private readonly goalsService: GoalsService,
    private readonly fitnessService: FitnessService,
    private readonly usersService: UsersService,
  ) {}

  // ─────────────────────────────────────────────
  // Helper: thu thập context sức khoẻ đầy đủ
  // ─────────────────────────────────────────────
  private async buildContext(userId: number): Promise<UserHealthContext> {
    const [user, todayMood, stepsToday, waterToday, foodToday, bodyMetrics, activeGoals, weekSummary] =
      await Promise.allSettled([
        this.usersService.getUserById(userId),
        this.moodService.getToday(String(userId)),
        this.stepsService.getToday(userId),
        this.waterService.getToday(userId),
        this.foodService.getToday(userId),
        this.bodyMetricsService.getLatest(userId),
        this.goalsService.getActive(userId),
        this.fitnessService.getWeeklySummary({ id: userId } as any),
      ]);

    const u = user.status === 'fulfilled' ? user.value : { fullName: 'Bạn', level: 1 };
    const mood = todayMood.status === 'fulfilled' ? todayMood.value : null;
    const steps = stepsToday.status === 'fulfilled' ? stepsToday.value : null;
    const water = waterToday.status === 'fulfilled' ? waterToday.value : null;
    const food = foodToday.status === 'fulfilled' ? foodToday.value : null;
    const bm = bodyMetrics.status === 'fulfilled' ? bodyMetrics.value : null;
    const goals = activeGoals.status === 'fulfilled' ? (activeGoals.value as any[]) : [];
    const week = weekSummary.status === 'fulfilled' ? weekSummary.value : null;

    const moodLabel: Record<number, string> = { 1: 'Buồn', 2: 'Bình thường', 3: 'Ổn', 4: 'Vui', 5: 'Tuyệt vời' };

    return {
      userId,
      fullName: (u as any).fullName ?? 'Bạn',
      level: (u as any).level ?? 1,
      mood: mood?.hasEntry && mood.mood
        ? { score: mood.mood.score, label: moodLabel[mood.mood.score] ?? 'Bình thường' }
        : null,
      todaySteps: steps?.steps ?? 0,
      goalSteps: steps?.goalSteps ?? 10000,
      todayCalories: (food as any)?.totalCalories ?? 0,
      calorieGoal: 2000,
      todayWater: water?.total ?? 0,
      waterGoal: 2000,
      weekWorkouts: (week as any)?.weekTotal?.workouts ?? 0,
      weekCaloriesBurned: (week as any)?.weekTotal?.calories ?? 0,
      bodyMetrics: bm ? { weight: (bm as any).weight, height: (bm as any).height, bmi: (bm as any).bmi } : null,
      activeGoals: goals.map((g: any) => ({
        title: g.title,
        type: g.type,
        progress: g.currentValue ?? 0,
        target: g.targetValue ?? 0,
      })),
    };
  }

  // ─────────────────────────────────────────────
  // Chat Sessions
  // ─────────────────────────────────────────────

  // GET /ai/sessions
  @Get('sessions')
  getSessions(@Req() req: any) {
    return this.aiChatService.getSessions(req.user.userId);
  }

  // POST /ai/sessions
  @Post('sessions')
  createSession(@Req() req: any, @Body() body: { firstMessage: string }) {
    return this.aiChatService.createSession(req.user.userId, body.firstMessage);
  }

  // PUT /ai/sessions/:id
  @Put('sessions/:id')
  saveMessages(
    @Req() req: any,
    @Param('id') id: string,
    @Body() body: { messages: { role: string; content: string }[] },
  ) {
    return this.aiChatService.saveMessages(id, req.user.userId, body.messages);
  }

  // DELETE /ai/sessions/:id
  @Delete('sessions/:id')
  deleteSession(@Req() req: any, @Param('id') id: string) {
    return this.aiChatService.deleteSession(id, req.user.userId);
  }

  // ─────────────────────────────────────────────
  // AI Features
  // ─────────────────────────────────────────────

  // POST /ai/chat
  @Post('chat')
  async chat(@Req() req: any, @Body() dto: AiChatDto) {
    const context = await this.buildContext(req.user.userId);
    const reply = await this.aiService.chat(context, dto.messages);
    return { reply };
  }

  // GET /ai/daily-insight
  @Get('daily-insight')
  async dailyInsight(@Req() req: any) {
    const context = await this.buildContext(req.user.userId);
    return this.aiService.getDailyInsight(context);
  }

  // POST /ai/analyze-meal
  @Post('analyze-meal')
  async analyzeMeal(@Req() req: any, @Body() dto: AnalyzeMealDto) {
    const userId = req.user.userId;
    const food = await this.foodService.getToday(userId).catch(() => null);
    const totalCalories = (food as any)?.totalCalories ?? 0;
    return this.aiService.analyzeMeal(dto.mealDescription, dto.mealType, totalCalories, 2000);
  }

  // GET /ai/weekly-summary
  @Get('weekly-summary')
  async weeklySummary(@Req() req: any) {
    const userId = req.user.userId;
    const [context, stepsHistory, waterWeek, moodSummary, weekFitness] = await Promise.allSettled([
      this.buildContext(userId),
      this.stepsService.getHistory(userId, 7),
      this.waterService.getWeekSummary(userId),
      this.moodService.getSummary(String(userId)),
      this.fitnessService.getWeeklySummary({ id: userId } as any),
    ]);

    const ctx = context.status === 'fulfilled' ? context.value : { fullName: 'Bạn', level: 1, userId } as any;
    const steps = stepsHistory.status === 'fulfilled' ? (stepsHistory.value as any[]) : [];
    const waterResult = waterWeek.status === 'fulfilled' ? (waterWeek.value as { daily: Record<string, number>; goal: number }) : null;
    const waterEntries = waterResult ? Object.entries(waterResult.daily).map(([date, total]) => ({ date, total })) : [];
    const mood = moodSummary.status === 'fulfilled' ? moodSummary.value : null;
    const fitness = weekFitness.status === 'fulfilled' ? weekFitness.value : null;

    const totalSteps = steps.reduce((sum: number, d: any) => sum + (d.steps ?? 0), 0);
    const daysWithEnoughWater = waterEntries.filter((d) => d.total >= 2000).length;
    const totalWaterMl = waterEntries.reduce((sum: number, d) => sum + d.total, 0);
    const averageMoodScore = (mood as any)?.averageScore ?? null;
    const workoutSessions = (fitness as any)?.weekTotal?.workouts ?? 0;
    const totalCaloriesWeek = (fitness as any)?.weekTotal?.calories ?? 0;
    const averageCalories = Math.round(totalCaloriesWeek / 7);

    const weekData = {
      totalSteps,
      workoutSessions,
      averageMoodScore,
      averageCalories,
      daysWithEnoughWater,
      totalWaterMl,
      streakDays: ctx.streakDays ?? 0,
    };

    const summary = await this.aiService.getWeeklySummary(ctx, weekData);

    return {
      weekData,
      summary,
      stepsHistory: steps,
      waterHistory: waterEntries,
    };
  }

  // GET /ai/health-alerts
  @Get('health-alerts')
  async healthAlerts(@Req() req: any) {
    const context = await this.buildContext(req.user.userId);
    const alerts = this.aiService.getHealthRiskAlerts(context);
    return { alerts };
  }

  // ─────────────────────────────────────────────
  // AI Companion (Hana)
  // ─────────────────────────────────────────────

  // GET /ai/companion/daily — lời chào proactive hàng ngày
  @Get('companion/daily')
  async companionDaily(@Req() req: any) {
    const context = await this.buildContext(req.user.userId);
    return this.aiService.getCompanionDailyPush(context);
  }

  // POST /ai/companion/chat — chat với Hana
  @Post('companion/chat')
  async companionChat(@Req() req: any, @Body() dto: CompanionMessageDto) {
    const context = await this.buildContext(req.user.userId);
    return this.aiService.companionChat(
      context,
      dto.message,
      dto.history ?? [],
      dto.screen,
    );
  }

  // POST /ai/workout-plan
  @Post('workout-plan')
  async workoutPlan(@Req() req: any, @Body() dto: WorkoutPlanDto) {
    const [context, workouts] = await Promise.all([
      this.buildContext(req.user.userId),
      this.fitnessService.findAllWorkouts({ limit: 20 } as any),
    ]);

    const workoutList = (workouts as any[]).slice(0, 15).map((w: any) => ({
      id: w.id,
      title: w.title,
      category: w.category,
      level: w.level,
      kcalPerMin: w.kcalPerMin,
      muscleGroup: w.muscleGroup ?? '',
    }));

    return this.aiService.generateWorkoutPlan(context, workoutList, dto.daysPerWeek, dto.goal);
  }
}

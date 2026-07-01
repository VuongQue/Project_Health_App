import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenerativeAI } from '@google/generative-ai';

export interface UserHealthContext {
  userId: number;
  fullName: string;
  level: number;
  mood?: { score: number; label: string } | null;
  recentMoods?: { date: string; score: number }[];
  todaySteps?: number;
  goalSteps?: number;
  todayCalories?: number;
  calorieGoal?: number;
  todayWater?: number;
  waterGoal?: number;
  weekWorkouts?: number;
  weekCaloriesBurned?: number;
  bodyMetrics?: { weight?: number; height?: number; bmi?: number } | null;
  activeGoals?: { title: string; type: string; progress: number; target: number }[];
  wearable?: {
    avgHeartRate: number | null;
    avgSpo2: number | null;
    avgStress: number | null;
    avgSleepMin: number | null;
  } | null;
}

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private readonly genAI: GoogleGenerativeAI;
  private readonly modelChain: string[] = [
    'gemini-2.0-flash',       // primary — free tier, fast
    'gemini-2.5-flash',       // fallback 1
    'gemini-1.5-flash',       // fallback 2
    'gemini-1.5-flash-8b',    // fallback 3 — lightest
  ];

  constructor(private readonly config: ConfigService) {
    this.genAI = new GoogleGenerativeAI(
      this.config.get<string>('GEMINI_API_KEY') ?? '',
    );
  }

  // Tự động fallback sang model tiếp theo khi gặp 429 quota exceeded
  private async generateWithFallback(
    promptOrParts: string | any[],
    systemInstruction?: string,
  ): Promise<string> {
    let lastError: any;
    for (const model of this.modelChain) {
      try {
        const geminiModel = this.genAI.getGenerativeModel({
          model,
          ...(systemInstruction ? { systemInstruction } : {}),
        });
        const result = await geminiModel.generateContent(promptOrParts as any);
        if (model !== this.modelChain[0]) {
          this.logger.warn(`[AI] Using fallback model: ${model}`);
        }
        return result.response.text();
      } catch (err: any) {
        if (this.isRetryableError(err)) {
          this.logger.warn(`[AI] Model ${model} unavailable (${this.getErrCode(err)}), trying next...`);
          lastError = err;
          continue;
        }
        throw err;
      }
    }
    this.logger.error('[AI] All models exhausted');
    throw lastError;
  }

  private isRetryableError(err: any): boolean {
    const status = err?.status ?? err?.httpStatus;
    if (status === 429 || status === 404 || status === 503) return true;
    const msg: string = err?.message ?? '';
    return (
      msg.includes('429') ||
      msg.includes('404') ||
      msg.includes('quota') ||
      msg.includes('Too Many Requests') ||
      msg.includes('credits are depleted') ||
      msg.includes('is not found') ||
      msg.includes('not supported') ||
      msg.includes('503') ||
      msg.includes('overloaded')
    );
  }

  private getErrCode(err: any): string {
    const status = err?.status ?? err?.httpStatus;
    if (status) return String(status);
    if (err?.message?.includes('404') || err?.message?.includes('is not found')) return '404';
    if (err?.message?.includes('429') || err?.message?.includes('quota')) return '429';
    return 'unknown';
  }

  // Fallback cho chat (streaming / startChat không dùng được generateContent)
  private async chatWithFallback(
    systemInstruction: string,
    history: any[],
    lastMessage: string,
  ): Promise<string> {
    let lastError: any;
    for (const model of this.modelChain) {
      try {
        const geminiModel = this.genAI.getGenerativeModel({ model, systemInstruction });
        if (model !== this.modelChain[0]) {
          this.logger.warn(`[AI] Chat using fallback model: ${model}`);
        }
        const chat = geminiModel.startChat({ history });
        const result = await chat.sendMessage(lastMessage);
        return result.response.text();
      } catch (err: any) {
        if (this.isRetryableError(err)) {
          this.logger.warn(`[AI] Chat model ${model} unavailable (${this.getErrCode(err)}), trying next...`);
          lastError = err;
          continue;
        }
        throw err;
      }
    }
    this.logger.error('[AI] All chat models exhausted');
    throw lastError;
  }

  // ─────────────────────────────────────────────
  // 1. AI Health Coach — chat hỏi đáp
  // ─────────────────────────────────────────────
  async chat(
    context: UserHealthContext,
    messages: { role: 'user' | 'assistant'; content: string }[],
    sponsoredAds?: { title: string; brandName: string; description: string | null; ctaText: string }[],
  ): Promise<string> {
    const systemPrompt = this.buildCoachSystemPrompt(context, sponsoredAds);

    // Gemini dùng 'model' thay vì 'assistant', history phải bắt đầu bằng 'user'
    const allButLast = messages.slice(0, -1).map((m) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }));
    const firstUserIdx = allButLast.findIndex((m) => m.role === 'user');
    const history = firstUserIdx >= 0 ? allButLast.slice(firstUserIdx) : [];

    const lastMessage = messages[messages.length - 1];
    try {
      return await this.chatWithFallback(systemPrompt, history, lastMessage?.content ?? '');
    } catch (err) {
      this.logger.error('[AI] chat error', err);
      throw err;
    }
  }

  // ─────────────────────────────────────────────
  // 2. Daily Insight — phân tích sức khoẻ hôm nay
  // ─────────────────────────────────────────────
  async getDailyInsight(context: UserHealthContext): Promise<{
    summary: string;
    highlights: string[];
    suggestions: string[];
    motivationalMessage: string;
  }> {
    const wearableLine = context.wearable
      ? `- Wearable (7 ngày): Nhịp tim TB ${context.wearable.avgHeartRate ?? '?'} bpm, SpO2 ${context.wearable.avgSpo2 ?? '?'}%, Stress ${context.wearable.avgStress ?? '?'}/100, Giấc ngủ TB ${context.wearable.avgSleepMin != null ? Math.round(context.wearable.avgSleepMin / 60 * 10) / 10 + 'h' : '?'}`
      : '';

    const prompt = `Phân tích dữ liệu sức khoẻ hôm nay của người dùng và trả về JSON.

Dữ liệu:
- Tên: ${context.fullName}, Level ${context.level}
- Mood hôm nay: ${context.mood ? `${context.mood.score}/5 (${context.mood.label})` : 'chưa ghi'}
- Bước chân: ${context.todaySteps ?? 0}/${context.goalSteps ?? 10000}
- Calo tiêu thụ: ${context.todayCalories ?? 0}/${context.calorieGoal ?? 2000} kcal
- Nước uống: ${context.todayWater ?? 0}/2000 ml
- Bài tập tuần này: ${context.weekWorkouts ?? 0} buổi, đốt ${context.weekCaloriesBurned ?? 0} kcal
- Chỉ số cơ thể: ${context.bodyMetrics ? `${context.bodyMetrics.weight}kg, BMI ${context.bodyMetrics.bmi}` : 'chưa cập nhật'}
- Mục tiêu đang theo: ${context.activeGoals?.map(g => g.title).join(', ') || 'không có'}
${wearableLine}

Trả về JSON với format (KHÔNG có markdown/backtick):
{
  "summary": "1 câu tóm tắt tình trạng sức khoẻ hôm nay bằng tiếng Việt",
  "highlights": ["điểm tích cực 1", "điểm tích cực 2"],
  "suggestions": ["gợi ý cải thiện 1", "gợi ý cải thiện 2"],
  "motivationalMessage": "1 câu động viên ngắn gọn bằng tiếng Việt"
}`;

    const text = await this.generateWithFallback(prompt);

    try {
      const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      return JSON.parse(cleaned);
    } catch {
      this.logger.error('[AI] getDailyInsight parse error', text);
      return {
        summary: 'Hôm nay bạn đang duy trì lối sống lành mạnh tốt!',
        highlights: ['Bạn đã đăng nhập và theo dõi sức khoẻ'],
        suggestions: ['Hãy ghi lại mood hôm nay', 'Uống đủ 2L nước'],
        motivationalMessage: 'Mỗi ngày là một cơ hội mới để trở nên khoẻ mạnh hơn!',
      };
    }
  }

  // ─────────────────────────────────────────────
  // 3. Meal Analyzer — phân tích dinh dưỡng
  // ─────────────────────────────────────────────
  async analyzeMeal(
    mealDescription: string,
    mealType: string,
    caloriesConsumedToday: number,
    calorieGoal: number,
  ): Promise<{
    estimatedCalories: number;
    protein: number;
    carbs: number;
    fat: number;
    healthScore: number;
    feedback: string;
    suggestions: string[];
  }> {
    const remaining = calorieGoal - caloriesConsumedToday;

    const prompt = `Phân tích dinh dưỡng món ăn sau và trả về JSON.

Bữa ăn (${mealType}): "${mealDescription}"
Calo còn lại trong ngày: ${remaining} kcal (đã ăn ${caloriesConsumedToday}/${calorieGoal} kcal)

Ước tính dinh dưỡng và đánh giá. Trả về JSON (KHÔNG có markdown):
{
  "estimatedCalories": <số kcal ước tính>,
  "protein": <gram protein>,
  "carbs": <gram carbs>,
  "fat": <gram fat>,
  "healthScore": <1-10, đánh giá độ lành mạnh>,
  "feedback": "<nhận xét ngắn về bữa ăn bằng tiếng Việt>",
  "suggestions": ["<gợi ý 1>", "<gợi ý 2>"]
}`;

    const text = await this.generateWithFallback(prompt);

    try {
      const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      return JSON.parse(cleaned);
    } catch {
      this.logger.error('[AI] analyzeMeal parse error', text);
      return {
        estimatedCalories: 400,
        protein: 20,
        carbs: 50,
        fat: 15,
        healthScore: 6,
        feedback: 'Không thể phân tích chi tiết, vui lòng mô tả kỹ hơn.',
        suggestions: ['Hãy ăn nhiều rau xanh hơn', 'Uống nước sau bữa ăn'],
      };
    }
  }

  // ─────────────────────────────────────────────
  // 4. Workout Planner — lập kế hoạch cá nhân
  // ─────────────────────────────────────────────
  async generateWorkoutPlan(
    context: UserHealthContext,
    availableWorkouts: { id: number; title: string; category: string; level: string; kcalPerMin: number; muscleGroup: string }[],
    daysPerWeek: number,
    goal: string,
  ): Promise<{
    plan: { day: string; workoutTitle: string; workoutId: number; reason: string }[];
    weeklyGoal: string;
    tips: string[];
  }> {
    const moodInfo = context.mood ? `Mood hiện tại: ${context.mood.score}/5` : '';
    const workoutList = availableWorkouts
      .map(w => `[ID:${w.id}] ${w.title} (${w.category}, ${w.level}, ${w.muscleGroup}, ${w.kcalPerMin} kcal/phút)`)
      .join('\n');

    const prompt = `Lập kế hoạch tập luyện cá nhân hoá cho người dùng.

Thông tin người dùng:
- Tên: ${context.fullName}, Level ${context.level}
- ${moodInfo}
- Số buổi/tuần mong muốn: ${daysPerWeek}
- Mục tiêu: ${goal}
- Số bài tập/tuần gần đây: ${context.weekWorkouts ?? 0}

Danh sách bài tập có sẵn:
${workoutList}

Trả về JSON (KHÔNG có markdown):
{
  "plan": [
    { "day": "Thứ Hai", "workoutTitle": "<tên>", "workoutId": <id>, "reason": "<lý do phù hợp ngắn>" }
  ],
  "weeklyGoal": "<mục tiêu tuần này bằng tiếng Việt>",
  "tips": ["<mẹo 1>", "<mẹo 2>", "<mẹo 3>"]
}`;

    const text = await this.generateWithFallback(prompt);

    try {
      const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      return JSON.parse(cleaned);
    } catch {
      this.logger.error('[AI] generateWorkoutPlan parse error', text);
      return {
        plan: [],
        weeklyGoal: `Hoàn thành ${daysPerWeek} buổi tập trong tuần`,
        tips: ['Khởi động kỹ trước khi tập', 'Nghỉ ngơi đủ giữa các buổi', 'Uống nước đầy đủ'],
      };
    }
  }

  // ─────────────────────────────────────────────
  // 5. Weekly Health Summary — tổng kết tuần
  // ─────────────────────────────────────────────
  async getWeeklySummary(
    context: UserHealthContext,
    weekData: {
      totalSteps: number;
      workoutSessions: number;
      averageMoodScore: number | null;
      averageCalories: number;
      daysWithEnoughWater: number;
      totalWaterMl: number;
      streakDays: number;
    },
  ): Promise<{
    headline: string;
    highlights: string[];
    improvements: string[];
    nextWeekFocus: string;
    motivationalMessage: string;
  }> {
    const moodText =
      weekData.averageMoodScore !== null
        ? `${weekData.averageMoodScore}/5`
        : 'chưa ghi';

    const prompt = `Tạo báo cáo sức khoẻ hằng tuần cho người dùng ứng dụng HealthHub.

Dữ liệu tuần này:
- Người dùng: ${context.fullName}, Level ${context.level}
- Tổng bước chân: ${weekData.totalSteps.toLocaleString()} bước
- Số buổi tập: ${weekData.workoutSessions} buổi
- Mood trung bình: ${moodText}
- Calo trung bình/ngày: ${weekData.averageCalories} kcal
- Ngày uống đủ nước (≥2L): ${weekData.daysWithEnoughWater}/7 ngày
- Streak hiện tại: ${weekData.streakDays} ngày

Trả về JSON (KHÔNG có markdown):
{
  "headline": "<1 câu tóm tắt tuần này bằng tiếng Việt, cụ thể và tích cực>",
  "highlights": ["<thành tích nổi bật 1>", "<thành tích nổi bật 2>", "<thành tích nổi bật 3>"],
  "improvements": ["<điểm cần cải thiện 1>", "<điểm cần cải thiện 2>"],
  "nextWeekFocus": "<1 lời khuyên trọng tâm cho tuần tới>",
  "motivationalMessage": "<1 câu động viên ngắn gọn>"
}`;

    const text = await this.generateWithFallback(prompt);

    try {
      const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      return JSON.parse(cleaned);
    } catch {
      this.logger.error('[AI] getWeeklySummary parse error', text);
      return {
        headline: `Tuần này bạn đã đi được ${weekData.totalSteps.toLocaleString()} bước và tập ${weekData.workoutSessions} buổi!`,
        highlights: [
          `Hoàn thành ${weekData.workoutSessions} buổi tập`,
          `Đi bộ tổng cộng ${weekData.totalSteps.toLocaleString()} bước`,
          `Uống đủ nước ${weekData.daysWithEnoughWater}/7 ngày`,
        ],
        improvements: ['Cố gắng ghi mood mỗi ngày', 'Tăng dần số bước chân mỗi tuần'],
        nextWeekFocus: 'Duy trì thói quen vận động và uống đủ nước mỗi ngày',
        motivationalMessage: 'Bạn đang tiến bộ từng ngày — hãy tiếp tục!',
      };
    }
  }

  // ─────────────────────────────────────────────
  // 6. Health Risk Alerts — phát hiện nguy cơ
  // ─────────────────────────────────────────────
  getHealthRiskAlerts(context: UserHealthContext): {
    level: 'low' | 'medium' | 'high';
    title: string;
    description: string;
    action: string;
    link?: string;
  }[] {
    const alerts: { level: 'low' | 'medium' | 'high'; title: string; description: string; action: string; link?: string }[] = [];

    // BMI risk
    if (context.bodyMetrics?.bmi) {
      const bmi = context.bodyMetrics.bmi;
      if (bmi < 18.5) {
        alerts.push({
          level: 'medium',
          title: 'Cân nặng thấp',
          description: `BMI của bạn là ${bmi} (thiếu cân). Cần tăng cường dinh dưỡng.`,
          action: 'Xem nhật ký ăn uống',
          link: '/(tabs)/(personal)/food-diary',
        });
      } else if (bmi >= 25 && bmi < 30) {
        alerts.push({
          level: 'low',
          title: 'Thừa cân nhẹ',
          description: `BMI ${bmi} — bạn đang ở mức thừa cân. Tăng vận động và kiểm soát calo.`,
          action: 'Xem bài tập',
          link: '/(tabs)/(personal)/fitness',
        });
      } else if (bmi >= 30) {
        alerts.push({
          level: 'high',
          title: 'Nguy cơ béo phì',
          description: `BMI ${bmi} — nguy cơ cao. Hãy tham khảo bác sĩ và xây dựng kế hoạch giảm cân.`,
          action: 'Tạo lộ trình giảm cân',
          link: '/health-journey',
        });
      }
    }

    // Low steps
    const steps = context.todaySteps ?? 0;
    const goalSteps = context.goalSteps ?? 10000;
    if (steps < goalSteps * 0.3) {
      alerts.push({
        level: 'low',
        title: 'Vận động ít hôm nay',
        description: `Bạn mới đi ${steps.toLocaleString()} bước — dưới 30% mục tiêu. Hãy vận động thêm!`,
        action: 'Cập nhật bước chân',
        link: '/(tabs)/(personal)',
      });
    }

    // Low water intake
    const water = context.todayWater ?? 0;
    const waterGoal = context.waterGoal ?? 2000;
    if (water < waterGoal * 0.4) {
      alerts.push({
        level: 'medium',
        title: 'Thiếu nước nghiêm trọng',
        description: `Bạn mới uống ${water}ml — dưới 40% mục tiêu. Uống nước ngay!`,
        action: 'Ghi lại lượng nước',
        link: '/(tabs)/(personal)/water-intake',
      });
    }

    // No mood logged (check by mood being null)
    if (!context.mood) {
      alerts.push({
        level: 'low',
        title: 'Chưa ghi tâm trạng hôm nay',
        description: 'Theo dõi tâm trạng giúp phát hiện sớm các vấn đề về sức khoẻ tinh thần.',
        action: 'Ghi tâm trạng',
        link: '/(tabs)/(personal)/mood',
      });
    }

    // Low mood warning
    if (context.mood && context.mood.score <= 2) {
      alerts.push({
        level: 'medium',
        title: 'Tâm trạng không tốt',
        description: 'Tâm trạng của bạn hôm nay thấp. Hãy thư giãn, vận động nhẹ hoặc nói chuyện với bạn bè.',
        action: 'Xem gợi ý',
        link: '/(tabs)/(personal)/mood',
      });
    }

    // Overweight calorie intake (basic check)
    const calories = context.todayCalories ?? 0;
    const calorieGoal = context.calorieGoal ?? 2000;
    if (calories > calorieGoal * 1.3) {
      alerts.push({
        level: 'low',
        title: 'Calo vượt mức',
        description: `Bạn đã nạp ${calories} kcal — vượt mục tiêu ${calorieGoal} kcal. Chú ý bữa ăn tiếp theo.`,
        action: 'Xem nhật ký ăn uống',
        link: '/(tabs)/(personal)/food-diary',
      });
    }

    // Sort by severity
    const order = { high: 0, medium: 1, low: 2 };
    return alerts.sort((a, b) => order[a.level] - order[b.level]);
  }

  // ─────────────────────────────────────────────
  // 7. AI Companion — bạn đồng hành hướng dẫn app
  // ─────────────────────────────────────────────
  async companionChat(
    context: UserHealthContext,
    message: string,
    history: { role: 'user' | 'assistant'; content: string }[],
    screen?: string,
  ): Promise<{ reply: string; suggestions: string[] }> {
    const systemPrompt = this.buildCompanionSystemPrompt(context, screen);

    const geminiHistory = history.map((m) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }));
    const firstUserIdx = geminiHistory.findIndex((m) => m.role === 'user');
    const validHistory = firstUserIdx >= 0 ? geminiHistory.slice(firstUserIdx) : [];

    try {
      const text = await this.chatWithFallback(systemPrompt, validHistory, message);

      // Tách reply và suggestions nếu có format JSON
      try {
        const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        if (cleaned.startsWith('{')) {
          const parsed = JSON.parse(cleaned);
          return {
            reply: parsed.reply ?? text,
            suggestions: parsed.suggestions ?? [],
          };
        }
      } catch {}

      return { reply: text, suggestions: [] };
    } catch (err) {
      this.logger.error('[AI Companion] chat error', err);
      throw err;
    }
  }

  // Gợi ý hoạt động hôm nay cho companion proactive
  async getCompanionDailyPush(context: UserHealthContext): Promise<{
    greeting: string;
    tip: string;
    suggestions: string[];
  }> {
    const hour = new Date().getHours();
    const timeOfDay = hour < 12 ? 'buổi sáng' : hour < 18 ? 'buổi chiều' : 'buổi tối';

    const prompt = `Bạn là Hana — AI bạn đồng hành sức khoẻ thân thiện của HealthHub.

Thông tin người dùng:
- Tên: ${context.fullName}, Level ${context.level}
- Thời điểm: ${timeOfDay}
- Bước chân hôm nay: ${context.todaySteps ?? 0}/${context.goalSteps ?? 10000}
- Nước uống: ${context.todayWater ?? 0}/2000ml
- Mood hôm nay: ${context.mood ? `${context.mood.score}/5 (${context.mood.label})` : 'chưa ghi'}
- Bài tập tuần này: ${context.weekWorkouts ?? 0} buổi

Tạo lời chào proactive ngắn gọn cho ${timeOfDay} và 3 gợi ý hoạt động phù hợp.
Trả về JSON (KHÔNG có markdown):
{
  "greeting": "<lời chào thân thiện ngắn 1-2 câu, gọi tên người dùng>",
  "tip": "<1 mẹo sức khoẻ ngắn phù hợp với ${timeOfDay}>",
  "suggestions": ["<hoạt động gợi ý 1>", "<hoạt động gợi ý 2>", "<hoạt động gợi ý 3>"]
}`;

    const text = await this.generateWithFallback(prompt);

    try {
      const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      return JSON.parse(cleaned);
    } catch {
      return {
        greeting: `Chào ${context.fullName}! Hana đây 👋`,
        tip: 'Hãy uống một ly nước và vươn vai nhé!',
        suggestions: ['Ghi lại mood hôm nay', 'Cập nhật bước chân', 'Xem bài tập phù hợp'],
      };
    }
  }

  // ─────────────────────────────────────────────
  // Helper: build system prompt cho coach
  // ─────────────────────────────────────────────
  private buildCoachSystemPrompt(
    ctx: UserHealthContext,
    sponsoredAds?: { title: string; brandName: string; description: string | null; ctaText: string }[],
  ): string {
    const moodText = ctx.mood ? `${ctx.mood.score}/5 (${ctx.mood.label})` : 'chưa ghi hôm nay';
    const bmiText = ctx.bodyMetrics?.bmi ? `BMI ${ctx.bodyMetrics.bmi}` : '';

    return `Bạn là AI Health Coach của ứng dụng HealthHub — người tư vấn sức khoẻ thân thiện, chuyên nghiệp và am hiểu.

Thông tin người dùng hiện tại:
- Tên: ${ctx.fullName}, Level ${ctx.level}
- Mood hôm nay: ${moodText}
- Bước chân: ${ctx.todaySteps ?? 0}/${ctx.goalSteps ?? 10000}
- Calo hôm nay: ${ctx.todayCalories ?? 0}/${ctx.calorieGoal ?? 2000} kcal
- Nước uống: ${ctx.todayWater ?? 0}/2000 ml
- Bài tập tuần này: ${ctx.weekWorkouts ?? 0} buổi
${bmiText ? `- ${bmiText}` : ''}

Phạm vi hỗ trợ (CHỈ trả lời các chủ đề sau):
- Sức khoẻ, thể dục, tập luyện, vận động
- Dinh dưỡng, chế độ ăn uống, calo, macro
- Tâm lý, giấc ngủ, căng thẳng, thiền định
- Chỉ số cơ thể (cân nặng, BMI, thể trạng)
- Mục tiêu sức khoẻ và lối sống lành mạnh
- Dữ liệu cá nhân của người dùng trong app HealthHub

Nếu người dùng hỏi về các chủ đề NGOÀI phạm vi trên (thời trang, du lịch, tài chính, công nghệ, giải trí, chính trị, v.v.), hãy lịch sự từ chối và nhắc nhở rằng bạn chỉ hỗ trợ về sức khoẻ. Ví dụ: "Mình chỉ có thể tư vấn về sức khoẻ và thể dục thôi nhé! Bạn có muốn hỏi gì về luyện tập hoặc dinh dưỡng không?"

Tuyên bố miễn trách nhiệm (luôn ghi nhớ):
- HealthHub chỉ là công cụ hỗ trợ tham khảo, KHÔNG thay thế bác sĩ hoặc chuyên gia y tế
- Mọi thông tin AI cung cấp chỉ mang tính chất tham khảo và có thể không chính xác
- Khi người dùng đề cập đến triệu chứng bệnh, đau, chấn thương hoặc vấn đề sức khoẻ nghiêm trọng, LUÔN khuyên họ đến gặp bác sĩ
- Không bao giờ đưa ra chẩn đoán, kê đơn thuốc, hoặc thay thế lời khuyên y tế chuyên nghiệp

Nguyên tắc:
1. Trả lời bằng tiếng Việt, ngắn gọn (tối đa 3-4 câu mỗi lần)
2. Cá nhân hoá dựa trên dữ liệu thực của người dùng
3. Không đưa ra chẩn đoán y tế — chỉ tư vấn lối sống lành mạnh
4. Khuyến khích tích cực, không phán xét
5. Khi cần thông tin thêm, hỏi người dùng
6. Cuối mỗi lần tư vấn liên quan đến triệu chứng/bệnh lý, nhắc nhở: "Đây chỉ là thông tin tham khảo, bạn nên gặp bác sĩ để được tư vấn chính xác nhất."${
  sponsoredAds && sponsoredAds.length > 0
    ? `\n\n--- ĐỐI TÁC ---\nCác sản phẩm sau được đối tác của HealthHub giới thiệu. Nếu câu hỏi của người dùng liên quan tự nhiên đến các sản phẩm này, bạn CÓ THỂ đề cập nhẹ nhàng ở cuối câu trả lời với dòng "[Được tài trợ] ..." — nhưng KHÔNG bắt buộc, KHÔNG thần thánh hoá, KHÔNG tạo urgency (không dùng "mua ngay", "giảm giá", "hạn chế"). Chỉ khuyến khích xem thử nếu thực sự phù hợp.\n${sponsoredAds.map((a) => `• ${a.brandName} — ${a.title}${a.description ? `: ${a.description}` : ''} (CTA: "${a.ctaText}")`).join('\n')}`
    : ''
}`;
  }

  private buildCompanionSystemPrompt(ctx: UserHealthContext, screen?: string): string {
    const moodText = ctx.mood ? `${ctx.mood.score}/5 (${ctx.mood.label})` : 'chưa ghi hôm nay';

    const screenGuide: Record<string, string> = {
      home: 'Người dùng đang ở màn hình Trang chủ — tóm tắt tổng quan sức khoẻ hôm nay.',
      fitness: 'Người dùng đang ở màn hình Tập luyện — hỗ trợ chọn bài tập, hướng dẫn tập.',
      mood: 'Người dùng đang ở màn hình Tâm trạng — hỏi thăm cảm xúc, gợi ý cải thiện tâm trạng.',
      water: 'Người dùng đang ở màn hình Nước uống — nhắc nhở uống nước, giải thích lợi ích.',
      steps: 'Người dùng đang ở màn hình Bước chân — cổ vũ vận động, gợi ý tăng bước chân.',
      food: 'Người dùng đang ở màn hình Nhật ký ăn uống — tư vấn dinh dưỡng, cân bằng calo.',
      profile: 'Người dùng đang ở màn hình Hồ sơ — hỗ trợ cập nhật thông tin cá nhân.',
      challenges: 'Người dùng đang ở màn hình Thử thách — giải thích thử thách, khuyến khích tham gia.',
      community: 'Người dùng đang ở màn hình Cộng đồng — hỗ trợ kết nối bạn bè, chia sẻ thành tích.',
    };

    const screenContext = screen ? (screenGuide[screen] ?? '') : '';

    return `Bạn là Hana — AI bạn đồng hành sức khoẻ thân thiện của HealthHub. Bạn như một người bạn gần gũi, luôn quan tâm, vui vẻ và tích cực.

Thông tin người dùng:
- Tên: ${ctx.fullName}, Level ${ctx.level}
- Mood hôm nay: ${moodText}
- Bước chân: ${ctx.todaySteps ?? 0}/${ctx.goalSteps ?? 10000}
- Nước uống: ${ctx.todayWater ?? 0}/2000ml
- Bài tập tuần này: ${ctx.weekWorkouts ?? 0} buổi
${screenContext ? `\nNgữ cảnh hiện tại: ${screenContext}` : ''}

Nhiệm vụ của Hana:
1. Chào hỏi thân thiện, gọi tên người dùng khi phù hợp
2. Hướng dẫn sử dụng các tính năng HealthHub khi được hỏi
3. Gợi ý hoạt động sức khoẻ phù hợp với dữ liệu thực
4. Động viên và tạo thói quen lành mạnh

Hướng dẫn các tính năng HealthHub:
- Trang chủ: xem tổng quan sức khoẻ, gợi ý hôm nay
- Tập luyện: chọn bài tập, bắt đầu buổi tập, xem lịch sử
- Tâm trạng: ghi mood hàng ngày, xem streak
- Nước uống: ghi lượng nước, đặt nhắc nhở
- Bước chân: theo dõi và cập nhật bước chân
- Cộng đồng: kết bạn, chia sẻ bài viết, xem story
- Thử thách: tham gia challenge, nhận phần thưởng
- Thành tích: xem huy hiệu đã mở khoá
- AI Coach: chat chuyên sâu về sức khoẻ

Quy tắc trả lời:
- Trả lời tiếng Việt, ngắn gọn (2-3 câu), thân thiện
- Dùng emoji phù hợp (không quá nhiều)
- Khi có thể, kèm theo 2-3 gợi ý ngắn dưới dạng JSON:
  {"reply": "<câu trả lời>", "suggestions": ["<gợi ý 1>", "<gợi ý 2>"]}
- Nếu câu hỏi đơn giản, chỉ trả lời text thường (không bắt buộc JSON)
- KHÔNG phán xét, KHÔNG so sánh với người khác`;
  }

  // ─────────────────────────────────────────────
  // 8. Voice Meal Transcription — nhận diện giọng nói → mô tả bữa ăn
  // ─────────────────────────────────────────────
  async transcribeMealVoice(audioBase64: string, mimeType: string): Promise<{ transcript: string }> {
    const prompt = `Bạn là trợ lý nhận diện món ăn từ giọng nói.
Người dùng vừa nói về bữa ăn của họ. Hãy chuyển đổi nội dung âm thanh thành danh sách món ăn rõ ràng bằng tiếng Việt.

Yêu cầu:
- Liệt kê các món ăn, đồ uống mà người dùng đề cập
- Kèm theo số lượng/khẩu phần nếu người dùng đề cập (ví dụ: "1 tô", "2 cái", "1 ly lớn")
- Chỉ trả về danh sách món ăn, không thêm giải thích hay lời chào hỏi
- Ví dụ output: "1 tô phở bò, 1 ly nước cam tươi, 1 cái bánh mì que"

Hãy lắng nghe và ghi lại chính xác những gì người dùng nói về bữa ăn của họ.`;

    try {
      const transcript = await this.generateWithFallback([
        { inlineData: { mimeType, data: audioBase64 } },
        { text: prompt },
      ]);
      return { transcript: transcript.trim() };
    } catch (err) {
      this.logger.error('[AI] transcribeMealVoice error', err);
      throw err;
    }
  }

  // ─────────────────────────────────────────────
  // Toxicity check — dùng cho post/comment moderation
  // Returns: { isToxic: boolean; reason?: string; score: number }
  // ─────────────────────────────────────────────
  async checkToxicity(text: string): Promise<{ isToxic: boolean; reason?: string; score: number }> {
    if (!text?.trim()) return { isToxic: false, score: 0 };

    const prompt = `Bạn là hệ thống kiểm duyệt nội dung cộng đồng mạng xã hội sức khoẻ.
Phân tích đoạn văn bản sau và trả lời CHÍNH XÁC theo định dạng JSON:

Văn bản: "${text.replace(/"/g, "'").slice(0, 500)}"

Trả về JSON với format:
{
  "isToxic": boolean,
  "score": number (0-100, 100 là cực kỳ độc hại),
  "reason": string (nếu toxic thì giải thích ngắn gọn bằng tiếng Việt, nếu không thì null)
}

Các trường hợp TOXIC (isToxic=true):
- Chửi bới, xúc phạm, kỳ thị
- Nội dung bạo lực, đe dọa
- Ngôn từ thù địch với cá nhân/nhóm người
- Nội dung sexual rõ ràng
- Spam, quảng cáo lặp đi lặp lại

Các trường hợp KHÔNG TOXIC (isToxic=false):
- Chia sẻ sức khoẻ, tập luyện bình thường
- Góp ý xây dựng (dù có chỉ trích)
- Câu hỏi, trao đổi bình thường
- Biểu đạt cảm xúc thông thường

Chỉ trả về JSON thuần, không thêm markdown.`;

    try {
      const raw = (await this.generateWithFallback(prompt)).trim().replace(/```json\n?/g, '').replace(/```\n?/g, '');
      const parsed = JSON.parse(raw);
      return {
        isToxic: Boolean(parsed.isToxic),
        score: Number(parsed.score ?? 0),
        reason: parsed.reason ?? undefined,
      };
    } catch (err) {
      this.logger.warn('[AI] toxicity check failed, allowing content', err);
      return { isToxic: false, score: 0 };
    }
  }
}

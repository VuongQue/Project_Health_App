import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Achievement } from './entities/achievement.entity';
import { UserAchievement } from './entities/user-achievement.entity';

const SEED_ACHIEVEMENTS: Partial<Achievement>[] = [
  // ─── SYSTEM / REGISTER ───────────────────────────────────────────────────
  {
    code: 'WELCOME',
    name: 'Người mới',
    description: 'Chào mừng bạn đến với HealthHub! Tài khoản đã được xác thực.',
    category: 'SYSTEM',
    trigger: 'USER_REGISTER',
    condition: { field: 'register', operator: '==', value: 1 },
    isHidden: false,
    hiddenLevel: 0,
    points: 20,
  },
  // ─── SYSTEM / FIRST LOGIN ─────────────────────────────────────────────────
  {
    code: 'FIRST_LOGIN',
    name: 'Đăng nhập lần đầu',
    description: 'Bạn đã đăng nhập lần đầu tiên vào HealthHub.',
    category: 'SYSTEM',
    trigger: 'USER_LOGIN',
    condition: { field: 'loginCount', operator: '==', value: 1 },
    isHidden: false,
    hiddenLevel: 0,
    points: 10,
  },
  // ─── WORKOUT ─────────────────────────────────────────────────────────────
  {
    code: 'FIRST_WORKOUT',
    name: 'Bước đầu tiên',
    description: 'Hoàn thành bài tập đầu tiên.',
    category: 'WORKOUT',
    trigger: 'WORKOUT_COMPLETED',
    condition: { field: 'workoutCount', operator: '==', value: 1 },
    isHidden: false,
    hiddenLevel: 0,
    points: 15,
  },
  {
    code: 'WORKOUT_5',
    name: 'Tập luyện đều đặn',
    description: 'Hoàn thành 5 buổi tập.',
    category: 'WORKOUT',
    trigger: 'WORKOUT_COMPLETED',
    condition: { field: 'workoutCount', operator: '>=', value: 5 },
    isHidden: false,
    hiddenLevel: 0,
    points: 20,
  },
  {
    code: 'WORKOUT_10',
    name: 'Người chăm chỉ',
    description: 'Hoàn thành 10 buổi tập.',
    category: 'WORKOUT',
    trigger: 'WORKOUT_COMPLETED',
    condition: { field: 'workoutCount', operator: '>=', value: 10 },
    isHidden: false,
    hiddenLevel: 0,
    points: 30,
  },
  {
    code: 'STREAK_3',
    name: 'Chuỗi 3 ngày',
    description: 'Tập luyện 3 ngày liên tiếp.',
    category: 'WORKOUT',
    trigger: 'WORKOUT_COMPLETED',
    condition: { field: 'streak', operator: '>=', value: 3 },
    isHidden: false,
    hiddenLevel: 0,
    points: 25,
  },
  {
    code: 'STREAK_7',
    name: 'Chuỗi 7 ngày',
    description: 'Tập luyện 7 ngày liên tiếp.',
    category: 'WORKOUT',
    trigger: 'WORKOUT_COMPLETED',
    condition: { field: 'streak', operator: '>=', value: 7 },
    isHidden: false,
    hiddenLevel: 0,
    points: 50,
  },
  {
    code: 'EARLY_BIRD',
    name: 'Chim sớm',
    description: 'Tập luyện trước 6 giờ sáng.',
    category: 'WORKOUT',
    trigger: 'WORKOUT_COMPLETED',
    condition: { field: 'earlyWorkout', operator: '==', value: 1 },
    isHidden: true,
    hiddenLevel: 1,
    hint: 'Thử tập luyện vào buổi sáng sớm...',
    points: 30,
  },
  {
    code: 'COMEBACK',
    name: 'Trở lại mạnh mẽ',
    description: 'Quay lại tập luyện sau 7 ngày nghỉ.',
    category: 'WORKOUT',
    trigger: 'WORKOUT_COMPLETED',
    condition: { field: 'comeback', operator: '==', value: 1 },
    isHidden: true,
    hiddenLevel: 1,
    hint: 'Đừng bỏ cuộc, hãy thử trở lại...',
    points: 20,
  },
  // ─── MOOD ─────────────────────────────────────────────────────────────────
  {
    code: 'FIRST_MOOD',
    name: 'Theo dõi tâm trạng',
    description: 'Ghi lại tâm trạng lần đầu tiên.',
    category: 'MOOD',
    trigger: 'MOOD_CREATED',
    condition: { field: 'moodCount', operator: '==', value: 1 },
    isHidden: false,
    hiddenLevel: 0,
    points: 10,
  },
  {
    code: 'MOOD_7',
    name: 'Nhật ký tâm trạng',
    description: 'Ghi lại tâm trạng 7 lần.',
    category: 'MOOD',
    trigger: 'MOOD_CREATED',
    condition: { field: 'moodCount', operator: '>=', value: 7 },
    isHidden: false,
    hiddenLevel: 0,
    points: 20,
  },
  // ─── STEPS ────────────────────────────────────────────────────────────────
  {
    code: 'STEPS_5000',
    name: 'Đi bộ tích cực',
    description: 'Đạt 5,000 bước trong một ngày.',
    category: 'SYSTEM',
    trigger: 'STEPS_DAILY',
    condition: { field: 'steps', operator: '>=', value: 5000 },
    isHidden: false,
    hiddenLevel: 0,
    points: 15,
  },
  {
    code: 'STEPS_10000',
    name: 'Người đi bộ marathon',
    description: 'Đạt 10,000 bước trong một ngày.',
    category: 'SYSTEM',
    trigger: 'STEPS_DAILY',
    condition: { field: 'steps', operator: '>=', value: 10000 },
    isHidden: false,
    hiddenLevel: 0,
    points: 25,
  },
];

@Injectable()
export class AchievementSeedService {
  private readonly logger = new Logger(AchievementSeedService.name);

  constructor(
    @InjectRepository(Achievement)
    private readonly achRepo: Repository<Achievement>,
    @InjectRepository(UserAchievement)
    private readonly userAchRepo: Repository<UserAchievement>,
  ) {}

  async seed() {
    // Remove legacy achievements that were replaced by newer codes
    const OBSOLETE_CODES = ['NEW_USER', 'COMPLETE_PROFILE', 'WORKOUT_20', 'STREAK_14', 'MOOD_30', 'BIRTHDAY_MOOD', 'ALL_ROUNDER'];
    for (const code of OBSOLETE_CODES) {
      const old = await this.achRepo.findOne({ where: { code } });
      if (old) {
        // Delete user records first to avoid FK constraint
        await this.userAchRepo.delete({ achievement: { id: old.id } });
        await this.achRepo.delete({ code });
        this.logger.log(`Removed obsolete achievement: ${code}`);
      }
    }

    for (const data of SEED_ACHIEVEMENTS) {
      const exists = await this.achRepo.findOne({ where: { code: data.code } });
      if (exists) continue;

      await this.achRepo.save(this.achRepo.create(data));
      this.logger.log(`Seeded achievement: ${data.code}`);
    }
  }
}

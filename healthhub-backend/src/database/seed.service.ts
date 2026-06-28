import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { InjectModel } from '@nestjs/mongoose';
import { Repository } from 'typeorm';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { EXERCISE_GIF_MAP } from './exercise-gif.map';

import { User, UserRole, UserStatus } from '../modules/users/entities/user.entity';
import { Workout } from '../modules/fitness/entities/workout.entity';
import { WorkoutExercise } from '../modules/fitness/entities/workout-exercise.entity';
import { WorkoutLog } from '../modules/fitness/entities/workout-log.entity';
import { Challenge } from '../modules/challenge/entities/challenge.entity';
import { UserChallenge } from '../modules/challenge/entities/user-challenge.entity';
import { Achievement } from '../modules/achievement/entities/achievement.entity';
import { UserAchievement } from '../modules/achievement/entities/user-achievement.entity';
import { Event, EventScope } from '../modules/event/entities/event.entity';
import { EventRegistration } from '../modules/event/entities/event-registration.entity';
import { BodyMetric } from '../modules/body-metrics/entities/body-metric.entity';
import { DailySteps } from '../modules/steps/entities/daily-steps.entity';
import { WaterLog } from '../modules/water-intake/entities/water-log.entity';
import { Group, GroupDocument } from '../modules/community/schemas/group.schema';
import { Post, PostDocument } from '../modules/community/schemas/post.schema';
import { MoodEntry } from '../modules/mood/schemas/mood-entry.schema';
import { Friend } from '../modules/friend/entities/friend.entity';
import { FriendRequest } from '../modules/friend/entities/friend-request.entity';
import { ChatRoom, ChatRoomDocument } from '../modules/chat/schemas/chat-room.schema';
import { ChatMessage, ChatMessageDocument } from '../modules/chat/schemas/chat-message.schema';

// ─── helpers ─────────────────────────────────────────────────────────────────

/** Ngày relative từ hôm nay. offset âm = quá khứ */
function daysAgo(n: number, h = 8, m = 0): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(h, m, 0, 0);
  return d;
}

function daysFromNow(n: number, h = 8, m = 0): Date {
  return daysAgo(-n, h, m);
}

function rand(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

/** Trả về chuỗi date YYYY-MM-DD */
function dateStr(d: Date): string {
  return d.toISOString().slice(0, 10);
}

// ─── Seed Service ─────────────────────────────────────────────────────────────

@Injectable()
export class SeedService {
  private readonly logger = new Logger(SeedService.name);

  constructor(
    @InjectRepository(User)              private userRepo:            Repository<User>,
    @InjectRepository(Workout)           private workoutRepo:         Repository<Workout>,
    @InjectRepository(WorkoutExercise)   private exerciseRepo:        Repository<WorkoutExercise>,
    @InjectRepository(WorkoutLog)        private logRepo:             Repository<WorkoutLog>,
    @InjectRepository(Challenge)         private challengeRepo:       Repository<Challenge>,
    @InjectRepository(UserChallenge)     private uChallengeRepo:      Repository<UserChallenge>,
    @InjectRepository(Achievement)       private achievementRepo:     Repository<Achievement>,
    @InjectRepository(UserAchievement)   private uAchRepo:            Repository<UserAchievement>,
    @InjectRepository(Event)             private eventRepo:           Repository<Event>,
    @InjectRepository(EventRegistration) private regRepo:             Repository<EventRegistration>,
    @InjectRepository(BodyMetric)        private bodyMetricRepo:      Repository<BodyMetric>,
    @InjectRepository(DailySteps)        private stepsRepo:           Repository<DailySteps>,
    @InjectRepository(WaterLog)          private waterRepo:           Repository<WaterLog>,
    @InjectRepository(Friend)            private friendRepo:          Repository<Friend>,
    @InjectRepository(FriendRequest)     private friendRequestRepo:   Repository<FriendRequest>,
    @InjectModel(Group.name)             private groupModel:          Model<GroupDocument>,
    @InjectModel(Post.name)              private postModel:           Model<PostDocument>,
    @InjectModel(MoodEntry.name)         private moodModel:           Model<MoodEntry>,
    @InjectModel(ChatRoom.name)          private chatRoomModel:       Model<ChatRoomDocument>,
    @InjectModel(ChatMessage.name)       private chatMessageModel:    Model<ChatMessageDocument>,
  ) {}

  async run() {
    this.logger.log('=== Seed: starting ===');
    const users        = await this.seedUsers();
    const workouts     = await this.seedWorkouts();
    const challenges   = await this.seedChallenges();
    const achievements = await this.seedAchievements();
    const events       = await this.seedEvents(users);
    const groups       = await this.seedGroups(users);
    await this.seedWorkoutLogs(users, workouts);
    await this.seedMoodEntries(users);
    await this.seedBodyMetrics(users);
    await this.seedDailySteps(users);
    await this.seedWaterLogs(users);
    await this.seedUserChallenges(users, challenges);
    await this.seedUserAchievements(users, achievements);
    await this.seedEventRegistrations(users, events);
    await this.postModel.deleteMany({});
    await this.seedPosts(users, groups);
    await this.seedFriends(users);
    await this.seedFriendRequests(users);
    await this.seedChatRooms(users);
    this.logger.log('=== Seed: done ===');
  }

  // ─── USERS (20 tài khoản demo) ───────────────────────────────────────────────

  private async seedUsers(): Promise<User[]> {
    const existing = await this.userRepo.count({ where: { role: UserRole.USER } });
    if (existing > 0) {
      this.logger.log('Users: already seeded — skip');
      return this.userRepo.find();
    }

    const pw     = await bcrypt.hash('User@123', 10);
    const demoPw = await bcrypt.hash('Demo@123', 10);

    // 5 tài khoản demo dễ nhớ để test mọi chức năng
    const DEMO_PROFILES = [
      { fullName: 'Demo User 1',  username: 'user1', email: 'user1@healthhub.com', level: 10, points: 2500, dailyGoal: 'lose_weight',     password: demoPw },
      { fullName: 'Demo User 2',  username: 'user2', email: 'user2@healthhub.com', level: 8,  points: 1800, dailyGoal: 'muscle_gain',     password: demoPw },
      { fullName: 'Demo User 3',  username: 'user3', email: 'user3@healthhub.com', level: 6,  points: 950,  dailyGoal: 'general_fitness', password: demoPw },
      { fullName: 'Demo User 4',  username: 'user4', email: 'user4@healthhub.com', level: 12, points: 3200, dailyGoal: 'stress_relief',   password: demoPw },
      { fullName: 'Demo User 5',  username: 'user5', email: 'user5@healthhub.com', level: 4,  points: 480,  dailyGoal: 'general_fitness', password: demoPw },
    ];

    const PROFILES = [
      { fullName: 'Nguyễn Văn An',     username: 'nguyenvanan',   email: 'an@healthhub.com',     level: 8,  points: 1850, dailyGoal: 'lose_weight',     password: pw },
      { fullName: 'Trần Thị Bình',     username: 'tranthibinh',   email: 'binh@healthhub.com',   level: 12, points: 3400, dailyGoal: 'muscle_gain',     password: pw },
      { fullName: 'Lê Minh Cường',     username: 'leminhcuong',   email: 'cuong@healthhub.com',  level: 5,  points: 720,  dailyGoal: 'general_fitness', password: pw },
      { fullName: 'Phạm Thị Dung',     username: 'phamthidung',   email: 'dung@healthhub.com',   level: 15, points: 5100, dailyGoal: 'stress_relief',   password: pw },
      { fullName: 'Hoàng Văn Em',      username: 'hoangvanem',    email: 'em@healthhub.com',     level: 3,  points: 280,  dailyGoal: 'general_fitness', password: pw },
      { fullName: 'Vũ Thị Hoa',        username: 'vuthihoa',      email: 'hoa@healthhub.com',    level: 9,  points: 2100, dailyGoal: 'lose_weight',     password: pw },
      { fullName: 'Đặng Minh Khôi',    username: 'dangminhkhoi',  email: 'khoi@healthhub.com',   level: 6,  points: 950,  dailyGoal: 'muscle_gain',     password: pw },
      { fullName: 'Ngô Thị Lan',       username: 'ngothilan',     email: 'lan@healthhub.com',    level: 11, points: 2900, dailyGoal: 'stress_relief',   password: pw },
      { fullName: 'Bùi Quốc Minh',     username: 'buiquocminh',   email: 'minh@healthhub.com',   level: 4,  points: 490,  dailyGoal: 'general_fitness', password: pw },
      { fullName: 'Lý Thị Nga',        username: 'lythinga',      email: 'nga@healthhub.com',    level: 7,  points: 1300, dailyGoal: 'lose_weight',     password: pw },
      { fullName: 'Trịnh Văn Ổn',      username: 'trinhvanon',    email: 'on@healthhub.com',     level: 2,  points: 140,  dailyGoal: 'general_fitness', password: pw },
      { fullName: 'Phan Thị Phương',   username: 'phanthiphuong', email: 'phuong@healthhub.com', level: 10, points: 2650, dailyGoal: 'muscle_gain',     password: pw },
      { fullName: 'Cao Minh Quân',     username: 'caominhquan',   email: 'quan@healthhub.com',   level: 14, points: 4200, dailyGoal: 'general_fitness', password: pw },
      { fullName: 'Đinh Thị Ry',      username: 'dinhthiry',     email: 'ry@healthhub.com',     level: 6,  points: 880,  dailyGoal: 'lose_weight',     password: pw },
      { fullName: 'Hà Văn Sơn',        username: 'havanson',      email: 'son@healthhub.com',    level: 3,  points: 320,  dailyGoal: 'stress_relief',   password: pw },
      { fullName: 'Kiều Thị Tâm',      username: 'kieutam',       email: 'tam@healthhub.com',    level: 8,  points: 1750, dailyGoal: 'general_fitness', password: pw },
      { fullName: 'Lương Quốc Uy',     username: 'luongquocuy',   email: 'uy@healthhub.com',     level: 5,  points: 690,  dailyGoal: 'muscle_gain',     password: pw },
      { fullName: 'Mai Thị Vân',       username: 'maithivan',     email: 'van@healthhub.com',    level: 13, points: 3800, dailyGoal: 'lose_weight',     password: pw },
      { fullName: 'Nguyễn Hữu Xuân',  username: 'nguyenhuxuan',  email: 'xuan@healthhub.com',   level: 7,  points: 1450, dailyGoal: 'general_fitness', password: pw },
      { fullName: 'Ông Thị Yến',       username: 'onthiyen',      email: 'yen@healthhub.com',    level: 4,  points: 580,  dailyGoal: 'stress_relief',   password: pw },
    ];

    const allProfiles = [...DEMO_PROFILES, ...PROFILES];
    const created = await this.userRepo.save(
      allProfiles.map((p) => this.userRepo.create({
        ...p,
        role: UserRole.USER,
        status: UserStatus.ACTIVE,
        isVerified: true,
      }))
    );

    this.logger.log(`Users: seeded ${created.length} accounts (5 demo + 20 regular)`);
    return this.userRepo.find();
  }

  // ─── WORKOUTS (30 bài, đủ thể loại) ──────────────────────────────────────────

  private async seedWorkouts(): Promise<Workout[]> {
    const existing = await this.workoutRepo.count();
    if (existing > 0) {
      this.logger.log('Workouts: already seeded — skip');
      return this.workoutRepo.find();
    }

    type ExDef = { name: string; reps?: number; durationSec?: number; sets?: number; restSec?: number };
    type PlanDef = {
      title: string; level: string; muscleGroup: string; kcalPerMin: number;
      description: string; category: 'FITNESS' | 'MOOD';
      moodTargets?: number[]; focusType?: string;
      exercises: ExDef[];
    };

    const PLANS: PlanDef[] = [
      {
        title: 'Full Body Beginner',
        level: 'beginner', muscleGroup: 'full_body', kcalPerMin: 6,
        category: 'FITNESS',
        description: 'Bài tập toàn thân cho người mới — khởi động cơ thể và xây dựng thói quen',
        exercises: [
          { name: 'Squat',         sets: 3, reps: 15,        restSec: 60 },
          { name: 'Knee Push-up',  sets: 3, reps: 10,        restSec: 60 },
          { name: 'Glute Bridge',  sets: 3, reps: 20,        restSec: 45 },
          { name: 'Plank',         sets: 3, durationSec: 30, restSec: 45 },
          { name: 'Jumping Jacks', sets: 3, durationSec: 45, restSec: 30 },
          { name: 'Lunge',         sets: 2, reps: 12,        restSec: 60 },
          { name: 'Calf Raise',    sets: 3, reps: 20,        restSec: 30 },
          { name: 'Dead Bug',      sets: 3, reps: 10,        restSec: 45 },
        ],
      },
      {
        title: 'Upper Body Strength',
        level: 'intermediate', muscleGroup: 'upper_body', kcalPerMin: 8,
        category: 'FITNESS',
        description: 'Tăng cường sức mạnh phần thân trên — ngực, vai, tay',
        exercises: [
          { name: 'Pull-up',          sets: 4, reps: 8,  restSec: 90 },
          { name: 'Push-up',          sets: 3, reps: 15, restSec: 60 },
          { name: 'Dips',             sets: 3, reps: 12, restSec: 60 },
          { name: 'Diamond Push-up',  sets: 3, reps: 10, restSec: 60 },
          { name: 'Pike Push-up',     sets: 3, reps: 12, restSec: 60 },
          { name: 'Triceps Dip',      sets: 3, reps: 15, restSec: 45 },
          { name: 'Inverted Row',     sets: 3, reps: 12, restSec: 60 },
          { name: 'Shoulder Tap',     sets: 3, reps: 20, restSec: 45 },
        ],
      },
      {
        title: 'HIIT Cardio Blast',
        level: 'advanced', muscleGroup: 'full_body', kcalPerMin: 14,
        category: 'FITNESS',
        description: 'Đốt mỡ tối đa với bài HIIT cường độ cao — 20 phút = 300 kcal',
        exercises: [
          { name: 'Burpee',           sets: 4, reps: 15,        restSec: 30 },
          { name: 'High Knees',       sets: 4, durationSec: 30, restSec: 20 },
          { name: 'Jump Squat',       sets: 4, reps: 20,        restSec: 30 },
          { name: 'Mountain Climber', sets: 4, durationSec: 30, restSec: 20 },
          { name: 'Box Jump',         sets: 3, reps: 10,        restSec: 45 },
          { name: 'Jumping Jacks',    sets: 3, durationSec: 30, restSec: 20 },
          { name: 'Tuck Jump',        sets: 3, reps: 12,        restSec: 30 },
        ],
      },
      {
        title: 'Leg Day Power',
        level: 'intermediate', muscleGroup: 'lower_body', kcalPerMin: 9,
        category: 'FITNESS',
        description: 'Tập chân toàn diện — squat, deadlift và lunge biến thể',
        exercises: [
          { name: 'Squat',                 sets: 4, reps: 15,        restSec: 60 },
          { name: 'Bulgarian Split Squat', sets: 3, reps: 12,        restSec: 90 },
          { name: 'Romanian Deadlift',     sets: 3, reps: 10,        restSec: 90 },
          { name: 'Lunge',                 sets: 3, reps: 12,        restSec: 60 },
          { name: 'Glute Bridge',          sets: 3, reps: 20,        restSec: 60 },
          { name: 'Calf Raise',            sets: 4, reps: 25,        restSec: 45 },
          { name: 'Wall Sit',              sets: 3, durationSec: 60, restSec: 60 },
          { name: 'Step-up',               sets: 3, reps: 12,        restSec: 45 },
        ],
      },
      {
        title: 'Core & Abs Shredder',
        level: 'intermediate', muscleGroup: 'core', kcalPerMin: 7,
        category: 'FITNESS',
        description: 'Bài tập cơ bụng 6 múi — plank, crunch và biến thể',
        exercises: [
          { name: 'Plank Hold',      sets: 3, durationSec: 60, restSec: 30 },
          { name: 'Crunch',          sets: 3, reps: 25,        restSec: 45 },
          { name: 'Bicycle Crunch',  sets: 3, reps: 20,        restSec: 45 },
          { name: 'Leg Raise',       sets: 3, reps: 15,        restSec: 60 },
          { name: 'Russian Twist',   sets: 3, reps: 20,        restSec: 45 },
          { name: 'Side Plank',      sets: 2, durationSec: 30, restSec: 30 },
          { name: 'V-up',            sets: 3, reps: 12,        restSec: 45 },
          { name: 'Flutter Kick',    sets: 3, durationSec: 30, restSec: 30 },
          { name: 'Hollow Body Hold',sets: 3, durationSec: 20, restSec: 30 },
        ],
      },
      {
        title: 'Morning Yoga Flow',
        level: 'beginner', muscleGroup: 'full_body', kcalPerMin: 4,
        category: 'MOOD', moodTargets: [1, 2, 3], focusType: 'RELAX',
        description: 'Yoga buổi sáng thư giãn tinh thần và kéo giãn cơ thể cho ngày mới',
        exercises: [
          { name: "Child's Pose",        sets: 1, durationSec: 60, restSec: 10 },
          { name: 'Cat-Cow Stretch',     sets: 1, durationSec: 45, restSec: 10 },
          { name: 'Downward Dog',        sets: 1, durationSec: 45, restSec: 10 },
          { name: 'Warrior I',           sets: 2, durationSec: 30, restSec: 10 },
          { name: 'Pigeon Pose',         sets: 2, durationSec: 40, restSec: 10 },
          { name: 'Seated Forward Fold', sets: 1, durationSec: 60, restSec: 10 },
          { name: 'Supine Spinal Twist', sets: 2, durationSec: 30, restSec: 10 },
        ],
      },
      {
        title: 'Stress Relief Breathing',
        level: 'beginner', muscleGroup: 'core', kcalPerMin: 2,
        category: 'MOOD', moodTargets: [1, 2], focusType: 'BREATHING',
        description: 'Bài thở sâu giảm stress ngay lập tức — phù hợp mọi nơi mọi lúc',
        exercises: [
          { name: 'Box Breathing 4-4-4-4', sets: 1, durationSec: 120, restSec: 15 },
          { name: 'Belly Breathing',        sets: 1, durationSec: 90,  restSec: 15 },
          { name: '4-7-8 Breathing',        sets: 1, durationSec: 90,  restSec: 15 },
          { name: 'Alternate Nostril',      sets: 1, durationSec: 60,  restSec: 10 },
          { name: 'Coherent Breathing',     sets: 1, durationSec: 120, restSec: 10 },
        ],
      },
      {
        title: 'Energy Boost Mindfulness',
        level: 'beginner', muscleGroup: 'full_body', kcalPerMin: 3,
        category: 'MOOD', moodTargets: [2, 3, 4], focusType: 'MINDFULNESS',
        description: 'Chánh niệm tập trung — tăng năng lượng và sự hiện diện trong ngày',
        exercises: [
          { name: 'Body Scan Meditation',    sets: 1, durationSec: 120, restSec: 10 },
          { name: 'Mindful Walking',         sets: 1, durationSec: 180, restSec: 10 },
          { name: 'Gratitude Reflection',    sets: 1, durationSec: 60,  restSec: 10 },
          { name: 'Power Pose',              sets: 2, durationSec: 30,  restSec: 10 },
          { name: 'Visualization',           sets: 1, durationSec: 90,  restSec: 10 },
          { name: 'Energizing Breath',       sets: 1, durationSec: 60,  restSec: 10 },
        ],
      },
      {
        title: 'Power Push Pull',
        level: 'advanced', muscleGroup: 'upper_body', kcalPerMin: 10,
        category: 'FITNESS',
        description: 'Phân chia push-pull cổ điển — kích thước và sức mạnh tối đa',
        exercises: [
          { name: 'Wide-grip Pull-up',    sets: 4, reps: 10, restSec: 90 },
          { name: 'Close-grip Chin-up',   sets: 3, reps: 8,  restSec: 90 },
          { name: 'Archer Push-up',       sets: 3, reps: 8,  restSec: 75 },
          { name: 'One-arm Push-up Prep', sets: 3, reps: 5,  restSec: 90 },
          { name: 'Inverted Row',         sets: 3, reps: 15, restSec: 60 },
          { name: 'Diamond Push-up',      sets: 3, reps: 10, restSec: 60 },
          { name: 'Pike Push-up',         sets: 3, reps: 10, restSec: 60 },
        ],
      },
      {
        title: 'Plyometric Explosive',
        level: 'advanced', muscleGroup: 'lower_body', kcalPerMin: 13,
        category: 'FITNESS',
        description: 'Bài tập bùng nổ tăng tốc độ và sức mạnh cơ nhanh',
        exercises: [
          { name: 'Squat',          sets: 2, reps: 10, restSec: 45 },
          { name: 'Depth Jump',     sets: 4, reps: 8,  restSec: 90 },
          { name: 'Broad Jump',     sets: 3, reps: 10, restSec: 75 },
          { name: 'Lateral Bound',  sets: 3, reps: 12, restSec: 60 },
          { name: 'Tuck Jump',      sets: 3, reps: 10, restSec: 60 },
          { name: 'Single-leg Hop', sets: 3, reps: 10, restSec: 60 },
          { name: 'Box Jump',       sets: 3, reps: 8,  restSec: 75 },
        ],
      },
      {
        title: 'Flexibility & Mobility',
        level: 'beginner', muscleGroup: 'full_body', kcalPerMin: 3,
        category: 'MOOD', moodTargets: [1, 2, 3, 4], focusType: 'RELAX',
        description: 'Cải thiện độ linh hoạt và giảm đau nhức sau ngày dài ngồi làm việc',
        exercises: [
          { name: 'Inchworm',                 sets: 2, reps: 8,         restSec: 20 },
          { name: 'Hip Flexor Stretch',       sets: 2, durationSec: 60, restSec: 10 },
          { name: 'Thoracic Spine Rotation',  sets: 2, durationSec: 45, restSec: 10 },
          { name: 'Pigeon Pose',              sets: 2, durationSec: 60, restSec: 10 },
          { name: 'Neck Roll',                sets: 1, durationSec: 30, restSec: 10 },
          { name: 'Shoulder Cross Stretch',   sets: 2, durationSec: 30, restSec: 10 },
          { name: 'Quad Stretch',             sets: 2, durationSec: 30, restSec: 10 },
          { name: 'Calf Stretch',             sets: 2, durationSec: 30, restSec: 10 },
        ],
      },
      {
        title: '30-Min Fat Burn',
        level: 'intermediate', muscleGroup: 'full_body', kcalPerMin: 11,
        category: 'FITNESS',
        description: 'Đốt mỡ trong 30 phút với circuit training cường độ vừa',
        exercises: [
          { name: 'Jump Rope (mô phỏng)', sets: 3, durationSec: 60, restSec: 30 },
          { name: 'Squat Jump',           sets: 3, reps: 15,        restSec: 45 },
          { name: 'Burpee',               sets: 3, reps: 10,        restSec: 45 },
          { name: 'Plank to Push-up',     sets: 3, reps: 10,        restSec: 45 },
          { name: 'Lateral Shuffle',      sets: 3, durationSec: 30, restSec: 30 },
          { name: 'Speed Skater',         sets: 3, reps: 20,        restSec: 45 },
          { name: 'Mountain Climber',     sets: 3, durationSec: 30, restSec: 30 },
        ],
      },
      {
        title: 'Shoulder & Neck Relief',
        level: 'beginner', muscleGroup: 'upper_body', kcalPerMin: 3,
        category: 'MOOD', moodTargets: [1, 2, 3], focusType: 'RELAX',
        description: 'Giảm đau vai gáy dành cho dân văn phòng — thực hiện ngay tại bàn làm việc',
        exercises: [
          { name: 'Chin Tuck',                sets: 3, reps: 15,        restSec: 15 },
          { name: 'Shoulder Shrug',           sets: 3, reps: 15,        restSec: 15 },
          { name: 'Doorway Chest Stretch',    sets: 2, durationSec: 45, restSec: 10 },
          { name: 'Levator Scapulae Stretch', sets: 2, durationSec: 30, restSec: 10 },
          { name: 'Upper Trap Stretch',       sets: 2, durationSec: 30, restSec: 10 },
          { name: 'Neck Roll',                sets: 1, durationSec: 30, restSec: 10 },
          { name: 'T-spine Rotation',         sets: 2, durationSec: 30, restSec: 10 },
        ],
      },
      {
        title: 'Calisthenics L2',
        level: 'intermediate', muscleGroup: 'full_body', kcalPerMin: 9,
        category: 'FITNESS',
        description: 'Calisthenics trung cấp — kiểm soát cơ thể, sức bền và thẩm mỹ',
        exercises: [
          { name: 'Pull-up',               sets: 4, reps: 8,         restSec: 90  },
          { name: 'Pseudo Planche Push-up',sets: 4, reps: 10,        restSec: 90  },
          { name: 'L-sit Hold',            sets: 4, durationSec: 15, restSec: 60  },
          { name: 'Tuck Planche Hold',     sets: 3, durationSec: 10, restSec: 90  },
          { name: 'Muscle-up Prep',        sets: 3, reps: 5,         restSec: 120 },
          { name: 'Dragon Flag Negative',  sets: 3, reps: 5,         restSec: 90  },
          { name: 'Hollow Body Hold',      sets: 3, durationSec: 20, restSec: 45  },
        ],
      },
      {
        title: 'Night Stretch Routine',
        level: 'beginner', muscleGroup: 'full_body', kcalPerMin: 2,
        category: 'MOOD', moodTargets: [1, 2, 3, 4, 5], focusType: 'RELAX',
        description: 'Kéo giãn trước khi ngủ — thư giãn cơ bắp và cải thiện chất lượng giấc ngủ',
        exercises: [
          { name: 'Supine Spinal Twist',      sets: 2, durationSec: 60,  restSec: 10 },
          { name: 'Legs Up The Wall',         sets: 1, durationSec: 120, restSec: 10 },
          { name: 'Happy Baby Pose',          sets: 1, durationSec: 60,  restSec: 10 },
          { name: 'Seated Butterfly Stretch', sets: 1, durationSec: 60,  restSec: 10 },
          { name: 'Figure Four Stretch',      sets: 2, durationSec: 45,  restSec: 10 },
          { name: "Child's Pose",             sets: 1, durationSec: 60,  restSec: 10 },
          { name: 'Progressive Muscle Relax', sets: 1, durationSec: 120, restSec: 0  },
        ],
      },
      {
        title: 'Quick Lunch Break Workout',
        level: 'beginner', muscleGroup: 'full_body', kcalPerMin: 7,
        category: 'FITNESS',
        description: 'Bài tập 15 phút giờ nghỉ trưa — không cần dụng cụ, không cần thay đồ',
        exercises: [
          { name: 'Desk Push-up',   sets: 3, reps: 20,        restSec: 45 },
          { name: 'Chair Squat',    sets: 3, reps: 15,        restSec: 45 },
          { name: 'Standing March', sets: 2, durationSec: 30, restSec: 20 },
          { name: 'Calf Raise',     sets: 3, reps: 25,        restSec: 30 },
          { name: 'Torso Rotation', sets: 2, reps: 15,        restSec: 20 },
          { name: 'Shoulder Shrug', sets: 2, reps: 15,        restSec: 15 },
          { name: 'Wrist Flexor Stretch', sets: 1, durationSec: 30, restSec: 10 },
        ],
      },
      // ─── 14 WORKOUT MỚI ───────────────────────────────────────────────────────
      {
        title: 'Glute & Hamstring Focus',
        level: 'intermediate', muscleGroup: 'lower_body', kcalPerMin: 8,
        category: 'FITNESS',
        description: 'Tập mông và gân kheo chuyên sâu — vòng 3 săn chắc, tư thế đẹp hơn',
        exercises: [
          { name: 'Hip Thrust',            sets: 4, reps: 15, restSec: 60 },
          { name: 'Glute Bridge',          sets: 3, reps: 20, restSec: 45 },
          { name: 'Romanian Deadlift',     sets: 4, reps: 10, restSec: 90 },
          { name: 'Bulgarian Split Squat', sets: 3, reps: 12, restSec: 90 },
          { name: 'Reverse Lunge',         sets: 3, reps: 12, restSec: 60 },
          { name: 'Sumo Squat',            sets: 3, reps: 15, restSec: 60 },
          { name: 'Superman',              sets: 3, reps: 15, restSec: 45 },
        ],
      },
      {
        title: 'Push Day Hypertrophy',
        level: 'intermediate', muscleGroup: 'upper_body', kcalPerMin: 8,
        category: 'FITNESS',
        description: 'Bài ngày push tăng cơ bắp — ngực, vai, tay sau',
        exercises: [
          { name: 'Push-up',          sets: 4, reps: 15, restSec: 60 },
          { name: 'Pike Push-up',     sets: 4, reps: 12, restSec: 60 },
          { name: 'Diamond Push-up',  sets: 3, reps: 10, restSec: 60 },
          { name: 'Archer Push-up',   sets: 3, reps: 8,  restSec: 75 },
          { name: 'Dips',             sets: 4, reps: 12, restSec: 60 },
          { name: 'Triceps Dip',      sets: 3, reps: 15, restSec: 45 },
          { name: 'Shoulder Tap',     sets: 3, reps: 20, restSec: 30 },
        ],
      },
      {
        title: 'Pull Day Strength',
        level: 'intermediate', muscleGroup: 'upper_body', kcalPerMin: 9,
        category: 'FITNESS',
        description: 'Bài ngày pull — lưng rộng, tay trước và cơ xô dây phát triển mạnh',
        exercises: [
          { name: 'Pull-up',            sets: 4, reps: 8,  restSec: 90 },
          { name: 'Wide-grip Pull-up',  sets: 3, reps: 8,  restSec: 90 },
          { name: 'Close-grip Chin-up', sets: 3, reps: 10, restSec: 90 },
          { name: 'Inverted Row',       sets: 4, reps: 12, restSec: 60 },
          { name: 'Muscle-up Prep',     sets: 3, reps: 5,  restSec: 90 },
          { name: 'Superman',           sets: 3, reps: 15, restSec: 45 },
        ],
      },
      {
        title: 'Mobility Morning Routine',
        level: 'beginner', muscleGroup: 'full_body', kcalPerMin: 3,
        category: 'FITNESS',
        description: 'Khởi động cơ thể với mobility — linh hoạt khớp và kích hoạt cơ trước khi tập',
        exercises: [
          { name: 'Inchworm',              sets: 2, reps: 8,         restSec: 20 },
          { name: 'Squat to Stand',        sets: 2, reps: 10,        restSec: 20 },
          { name: 'World Greatest Stretch',sets: 2, reps: 6,         restSec: 20 },
          { name: 'Leg Swing',             sets: 2, reps: 15,        restSec: 15 },
          { name: 'Arm Circle',            sets: 2, durationSec: 30, restSec: 15 },
          { name: 'T-spine Rotation',      sets: 2, reps: 10,        restSec: 15 },
          { name: 'Ankle Circle',          sets: 2, durationSec: 20, restSec: 10 },
          { name: 'Hip Flexor Stretch',    sets: 2, durationSec: 40, restSec: 15 },
        ],
      },
      {
        title: 'Beginner Cardio Burn',
        level: 'beginner', muscleGroup: 'full_body', kcalPerMin: 8,
        category: 'FITNESS',
        description: 'Cardio nhẹ nhàng cho người mới — tăng nhịp tim và đốt calo hiệu quả',
        exercises: [
          { name: 'Jumping Jacks',        sets: 3, durationSec: 45, restSec: 30 },
          { name: 'High Knees',           sets: 3, durationSec: 30, restSec: 30 },
          { name: 'Jump Rope (mô phỏng)', sets: 3, durationSec: 45, restSec: 30 },
          { name: 'Mountain Climber',     sets: 3, durationSec: 30, restSec: 30 },
          { name: 'Standing March',       sets: 3, durationSec: 45, restSec: 20 },
          { name: 'Squat Jump',           sets: 3, reps: 12,        restSec: 40 },
          { name: 'Lateral Shuffle',      sets: 3, durationSec: 30, restSec: 30 },
        ],
      },
      {
        title: 'Advanced Core Challenge',
        level: 'advanced', muscleGroup: 'core', kcalPerMin: 8,
        category: 'FITNESS',
        description: 'Core nâng cao — kiểm soát cơ bụng sâu, tăng sức mạnh xoắn và kháng lực',
        exercises: [
          { name: 'Hollow Body Hold',  sets: 4, durationSec: 30, restSec: 45 },
          { name: 'Dragon Flag Negative', sets: 4, reps: 5,      restSec: 90 },
          { name: 'L-sit Hold',        sets: 4, durationSec: 15, restSec: 60 },
          { name: 'V-up',              sets: 4, reps: 15,        restSec: 45 },
          { name: 'Russian Twist',     sets: 4, reps: 25,        restSec: 45 },
          { name: 'Flutter Kick',      sets: 3, durationSec: 45, restSec: 30 },
          { name: 'Side Plank',        sets: 3, durationSec: 45, restSec: 30 },
          { name: 'Leg Raise',         sets: 3, reps: 15,        restSec: 45 },
        ],
      },
      {
        title: 'Total Body Burner',
        level: 'advanced', muscleGroup: 'full_body', kcalPerMin: 13,
        category: 'FITNESS',
        description: 'Đốt cháy toàn bộ cơ thể — circuit training kết hợp sức mạnh và cardio',
        exercises: [
          { name: 'Burpee',           sets: 5, reps: 10,        restSec: 30 },
          { name: 'Jump Squat',       sets: 4, reps: 15,        restSec: 30 },
          { name: 'Push-up',          sets: 4, reps: 15,        restSec: 30 },
          { name: 'Mountain Climber', sets: 4, durationSec: 30, restSec: 20 },
          { name: 'Pull-up',          sets: 3, reps: 8,         restSec: 60 },
          { name: 'Tuck Jump',        sets: 3, reps: 12,        restSec: 30 },
          { name: 'Plank Hold',       sets: 3, durationSec: 45, restSec: 30 },
          { name: 'High Knees',       sets: 3, durationSec: 30, restSec: 20 },
        ],
      },
      {
        title: 'Mindful Morning Meditation',
        level: 'beginner', muscleGroup: 'full_body', kcalPerMin: 2,
        category: 'MOOD', moodTargets: [1, 2, 3, 4, 5], focusType: 'MINDFULNESS',
        description: 'Buổi sáng chánh niệm — thiết lập tư duy tích cực và bình an cho ngày mới',
        exercises: [
          { name: 'Body Scan Meditation',         sets: 1, durationSec: 180, restSec: 10 },
          { name: 'Belly Breathing',              sets: 1, durationSec: 120, restSec: 10 },
          { name: 'Gratitude Reflection',         sets: 1, durationSec: 90,  restSec: 10 },
          { name: 'Loving Kindness Meditation',   sets: 1, durationSec: 120, restSec: 10 },
          { name: 'Visualization',                sets: 1, durationSec: 90,  restSec: 10 },
          { name: 'Journaling Prompt',            sets: 1, durationSec: 180, restSec: 0  },
        ],
      },
      {
        title: 'Evening Wind Down',
        level: 'beginner', muscleGroup: 'full_body', kcalPerMin: 2,
        category: 'MOOD', moodTargets: [1, 2, 3], focusType: 'RELAX',
        description: 'Thư giãn buổi tối — giải phóng stress và chuẩn bị cho giấc ngủ sâu',
        exercises: [
          { name: 'Wim Hof Breathing',      sets: 1, durationSec: 120, restSec: 10 },
          { name: 'Chest Opener',           sets: 1, durationSec: 60,  restSec: 10 },
          { name: 'Eye of the Needle',      sets: 2, durationSec: 45,  restSec: 10 },
          { name: 'Lizard Stretch',         sets: 2, durationSec: 45,  restSec: 10 },
          { name: 'Legs Up The Wall',       sets: 1, durationSec: 120, restSec: 10 },
          { name: 'Progressive Muscle Relax', sets: 1, durationSec: 90, restSec: 0  },
        ],
      },
      {
        title: 'Posture Correction',
        level: 'beginner', muscleGroup: 'upper_body', kcalPerMin: 3,
        category: 'MOOD', moodTargets: [1, 2, 3, 4], focusType: 'RELAX',
        description: 'Sửa tư thế cho dân văn phòng — mở ngực, tăng cường lưng trên',
        exercises: [
          { name: 'Chest Opener',             sets: 2, durationSec: 60, restSec: 10 },
          { name: 'T-spine Rotation',         sets: 3, reps: 10,        restSec: 20 },
          { name: 'Superman',                 sets: 3, reps: 15,        restSec: 30 },
          { name: 'Chin Tuck',                sets: 3, reps: 15,        restSec: 15 },
          { name: 'Shoulder Cross Stretch',   sets: 2, durationSec: 40, restSec: 10 },
          { name: 'Doorway Chest Stretch',    sets: 2, durationSec: 45, restSec: 10 },
          { name: 'Standing Side Stretch',    sets: 2, durationSec: 30, restSec: 10 },
        ],
      },
      {
        title: 'Speed & Agility Drill',
        level: 'advanced', muscleGroup: 'lower_body', kcalPerMin: 12,
        category: 'FITNESS',
        description: 'Tăng tốc độ và phản xạ — bài tập agility cho vận động viên',
        exercises: [
          { name: 'High Knees',       sets: 4, durationSec: 30, restSec: 20 },
          { name: 'Lateral Shuffle',  sets: 4, durationSec: 30, restSec: 20 },
          { name: 'Speed Skater',     sets: 4, reps: 20,        restSec: 30 },
          { name: 'Broad Jump',       sets: 3, reps: 10,        restSec: 60 },
          { name: 'Lateral Bound',    sets: 3, reps: 12,        restSec: 45 },
          { name: 'Tuck Jump',        sets: 3, reps: 10,        restSec: 45 },
          { name: 'Single-leg Hop',   sets: 3, reps: 12,        restSec: 45 },
          { name: 'Jump Squat',       sets: 3, reps: 15,        restSec: 30 },
        ],
      },
      {
        title: 'Beginner Back & Core',
        level: 'beginner', muscleGroup: 'core', kcalPerMin: 5,
        category: 'FITNESS',
        description: 'Xây nền tảng lưng và cơ bụng cho người mới — giảm đau lưng và cải thiện tư thế',
        exercises: [
          { name: 'Superman',        sets: 3, reps: 15,        restSec: 45 },
          { name: 'Glute Bridge',    sets: 3, reps: 20,        restSec: 45 },
          { name: 'Dead Bug',        sets: 3, reps: 10,        restSec: 45 },
          { name: 'Plank',           sets: 3, durationSec: 30, restSec: 45 },
          { name: 'Crunch',          sets: 3, reps: 20,        restSec: 45 },
          { name: 'Side Plank',      sets: 2, durationSec: 20, restSec: 30 },
          { name: 'Shoulder Tap',    sets: 3, reps: 16,        restSec: 30 },
        ],
      },
      {
        title: 'Anti-Anxiety Flow',
        level: 'beginner', muscleGroup: 'full_body', kcalPerMin: 3,
        category: 'MOOD', moodTargets: [1, 2], focusType: 'BREATHING',
        description: 'Giảm lo âu nhanh chóng — kết hợp thở có kiểm soát và chuyển động nhẹ',
        exercises: [
          { name: 'Box Breathing 4-4-4-4', sets: 1, durationSec: 120, restSec: 15 },
          { name: 'Coherent Breathing',    sets: 1, durationSec: 120, restSec: 10 },
          { name: '4-7-8 Breathing',       sets: 1, durationSec: 90,  restSec: 15 },
          { name: 'Body Scan Meditation',  sets: 1, durationSec: 120, restSec: 10 },
          { name: 'Mindful Walking',       sets: 1, durationSec: 120, restSec: 10 },
          { name: "Child's Pose",          sets: 1, durationSec: 60,  restSec: 10 },
        ],
      },
      {
        title: 'Squat & Lunge Ladder',
        level: 'intermediate', muscleGroup: 'lower_body', kcalPerMin: 9,
        category: 'FITNESS',
        description: 'Ladder lên xuống với squat và lunge — thử thách sức bền cơ chân',
        exercises: [
          { name: 'Squat',                 sets: 4, reps: 20, restSec: 45 },
          { name: 'Sumo Squat',            sets: 3, reps: 15, restSec: 45 },
          { name: 'Jump Squat',            sets: 3, reps: 12, restSec: 60 },
          { name: 'Lunge',                 sets: 4, reps: 12, restSec: 45 },
          { name: 'Reverse Lunge',         sets: 3, reps: 12, restSec: 45 },
          { name: 'Bulgarian Split Squat', sets: 3, reps: 10, restSec: 90 },
          { name: 'Calf Raise',            sets: 4, reps: 25, restSec: 30 },
          { name: 'Wall Sit',              sets: 3, durationSec: 60, restSec: 60 },
        ],
      },

      // ─── MOOD WORKOUTS ────────────────────────────────────────────────────────
      {
        title: 'Happy Endorphin Run',
        level: 'intermediate', muscleGroup: 'full_body', kcalPerMin: 9,
        category: 'MOOD', moodTargets: [3, 4, 5], focusType: 'CARDIO',
        description: 'Cardio bùng nổ giải phóng endorphin — khuếch đại tâm trạng tốt thành năng lượng đỉnh cao',
        exercises: [
          { name: 'Jumping Jacks',        sets: 3, durationSec: 45, restSec: 20 },
          { name: 'High Knees',           sets: 3, durationSec: 40, restSec: 20 },
          { name: 'Jump Rope (mô phỏng)', sets: 3, durationSec: 50, restSec: 25 },
          { name: 'Squat Jump',           sets: 3, reps: 15,        restSec: 30 },
          { name: 'Burpee',               sets: 3, reps: 8,         restSec: 40 },
          { name: 'Speed Skater',         sets: 3, reps: 20,        restSec: 30 },
          { name: 'Mountain Climber',     sets: 3, durationSec: 35, restSec: 25 },
        ],
      },
      {
        title: 'Mood Boost HIIT',
        level: 'intermediate', muscleGroup: 'full_body', kcalPerMin: 11,
        category: 'MOOD', moodTargets: [4, 5], focusType: 'CARDIO',
        description: 'HIIT cường độ cao cho ngày tràn năng lượng — đốt calo và khuếch đại sự hưng phấn',
        exercises: [
          { name: 'Burpee',           sets: 4, reps: 10,        restSec: 20 },
          { name: 'Jump Squat',       sets: 4, reps: 15,        restSec: 20 },
          { name: 'High Knees',       sets: 4, durationSec: 30, restSec: 15 },
          { name: 'Mountain Climber', sets: 4, durationSec: 30, restSec: 15 },
          { name: 'Lateral Bound',    sets: 3, reps: 12,        restSec: 25 },
          { name: 'Tuck Jump',        sets: 3, reps: 10,        restSec: 30 },
          { name: 'Speed Skater',     sets: 3, reps: 20,        restSec: 20 },
        ],
      },
      {
        title: 'Confidence Strength',
        level: 'intermediate', muscleGroup: 'full_body', kcalPerMin: 8,
        category: 'MOOD', moodTargets: [3, 4, 5], focusType: 'STRENGTH',
        description: 'Bài tập sức mạnh giúp tăng sự tự tin — cảm giác mạnh mẽ từ trong ra ngoài',
        exercises: [
          { name: 'Push-up',               sets: 4, reps: 15, restSec: 60 },
          { name: 'Pull-up',               sets: 3, reps: 8,  restSec: 90 },
          { name: 'Squat',                 sets: 4, reps: 20, restSec: 60 },
          { name: 'Glute Bridge',          sets: 3, reps: 20, restSec: 45 },
          { name: 'Plank',                 sets: 3, durationSec: 45, restSec: 45 },
          { name: 'Diamond Push-up',       sets: 3, reps: 12, restSec: 60 },
          { name: 'Bulgarian Split Squat', sets: 3, reps: 10, restSec: 75 },
        ],
      },
      {
        title: 'Power Release',
        level: 'advanced', muscleGroup: 'full_body', kcalPerMin: 10,
        category: 'MOOD', moodTargets: [4, 5], focusType: 'STRENGTH',
        description: 'Xả năng lượng dư thừa qua sức mạnh bùng nổ — hoàn hảo khi bạn đang ở đỉnh form',
        exercises: [
          { name: 'Wide-grip Pull-up',     sets: 4, reps: 10, restSec: 75 },
          { name: 'Archer Push-up',        sets: 4, reps: 8,  restSec: 75 },
          { name: 'Squat Jump',            sets: 4, reps: 15, restSec: 40 },
          { name: 'Bulgarian Split Squat', sets: 3, reps: 12, restSec: 75 },
          { name: 'Dips',                  sets: 4, reps: 12, restSec: 60 },
          { name: 'Box Jump',              sets: 3, reps: 10, restSec: 60 },
          { name: 'Hollow Body Hold',      sets: 3, durationSec: 30, restSec: 45 },
        ],
      },
      {
        title: 'Gentle Sad Day Flow',
        level: 'beginner', muscleGroup: 'full_body', kcalPerMin: 2,
        category: 'MOOD', moodTargets: [1], focusType: 'RELAX',
        description: 'Chuyển động nhẹ nhàng cho ngày buồn — không áp lực, chỉ cần hiện diện với cơ thể',
        exercises: [
          { name: "Child's Pose",               sets: 1, durationSec: 90,  restSec: 5  },
          { name: 'Belly Breathing',            sets: 1, durationSec: 120, restSec: 10 },
          { name: 'Supine Spinal Twist',        sets: 2, durationSec: 60,  restSec: 5  },
          { name: 'Legs Up The Wall',           sets: 1, durationSec: 180, restSec: 10 },
          { name: 'Loving Kindness Meditation', sets: 1, durationSec: 120, restSec: 5  },
          { name: 'Progressive Muscle Relax',   sets: 1, durationSec: 120, restSec: 0  },
        ],
      },
      {
        title: 'Focus & Flow Breath',
        level: 'beginner', muscleGroup: 'core', kcalPerMin: 2,
        category: 'MOOD', moodTargets: [2, 3, 4], focusType: 'BREATHING',
        description: 'Hơi thở chủ động giúp tập trung và vào trạng thái flow — lý tưởng trước giờ học hoặc làm việc',
        exercises: [
          { name: 'Belly Breathing',       sets: 1, durationSec: 90,  restSec: 10 },
          { name: 'Box Breathing 4-4-4-4', sets: 2, durationSec: 90,  restSec: 15 },
          { name: 'Energizing Breath',     sets: 1, durationSec: 60,  restSec: 10 },
          { name: 'Coherent Breathing',    sets: 1, durationSec: 120, restSec: 10 },
          { name: 'Visualization',         sets: 1, durationSec: 90,  restSec: 10 },
          { name: 'Power Pose',            sets: 2, durationSec: 30,  restSec: 10 },
        ],
      },
      {
        title: 'Peak Performance Mind',
        level: 'beginner', muscleGroup: 'full_body', kcalPerMin: 2,
        category: 'MOOD', moodTargets: [4, 5], focusType: 'MINDFULNESS',
        description: 'Chánh niệm nâng cao hiệu suất — khi bạn đang rất tốt, hãy tận dụng tối đa trạng thái đó',
        exercises: [
          { name: 'Energizing Breath',          sets: 1, durationSec: 60,  restSec: 10 },
          { name: 'Visualization',              sets: 1, durationSec: 120, restSec: 10 },
          { name: 'Power Pose',                 sets: 3, durationSec: 30,  restSec: 10 },
          { name: 'Gratitude Reflection',       sets: 1, durationSec: 90,  restSec: 10 },
          { name: 'Loving Kindness Meditation', sets: 1, durationSec: 90,  restSec: 10 },
          { name: 'Journaling Prompt',          sets: 1, durationSec: 120, restSec: 0  },
        ],
      },
      {
        title: 'Grounding Reset',
        level: 'beginner', muscleGroup: 'full_body', kcalPerMin: 2,
        category: 'MOOD', moodTargets: [1, 2, 3], focusType: 'MINDFULNESS',
        description: 'Quay về hiện tại — bài chánh niệm giúp thoát khỏi vòng lặp suy nghĩ tiêu cực',
        exercises: [
          { name: '4-7-8 Breathing',        sets: 2, durationSec: 90,  restSec: 15 },
          { name: 'Body Scan Meditation',   sets: 1, durationSec: 180, restSec: 10 },
          { name: 'Mindful Walking',        sets: 1, durationSec: 120, restSec: 10 },
          { name: 'Gratitude Reflection',   sets: 1, durationSec: 90,  restSec: 10 },
          { name: 'Alternate Nostril',      sets: 1, durationSec: 60,  restSec: 10 },
          { name: 'Journaling Prompt',      sets: 1, durationSec: 120, restSec: 0  },
        ],
      },
      {
        title: 'Anxiety SOS',
        level: 'beginner', muscleGroup: 'full_body', kcalPerMin: 2,
        category: 'MOOD', moodTargets: [1, 2], focusType: 'BREATHING',
        description: 'Bộ công cụ khẩn cấp khi lo âu bùng phát — 3 kỹ thuật thở + neo đất nhanh trong 15 phút',
        exercises: [
          { name: 'Grounding 5-4-3-2-1',    sets: 1, durationSec: 90,  restSec: 10 },
          { name: 'Box Breathing 4-4-4-4',  sets: 3, durationSec: 60,  restSec: 15 },
          { name: 'Pursed Lip Breathing',   sets: 2, durationSec: 60,  restSec: 10 },
          { name: 'STOP Mindfulness',       sets: 2, durationSec: 60,  restSec: 10 },
          { name: 'Body Scan Meditation',   sets: 1, durationSec: 120, restSec: 10 },
          { name: "Child's Pose",           sets: 1, durationSec: 90,  restSec: 0  },
        ],
      },
      {
        title: 'Self-Compassion Reset',
        level: 'beginner', muscleGroup: 'full_body', kcalPerMin: 2,
        category: 'MOOD', moodTargets: [1, 2, 3], focusType: 'MINDFULNESS',
        description: 'Chữa lành tự phê phán — bài thực hành tự từ bi dựa trên nghiên cứu tâm lý học',
        exercises: [
          { name: 'Belly Breathing',            sets: 1, durationSec: 90,  restSec: 10 },
          { name: 'Self-Compassion Break',      sets: 2, durationSec: 90,  restSec: 15 },
          { name: 'Emotional Labelling',        sets: 1, durationSec: 60,  restSec: 10 },
          { name: 'Loving Kindness Meditation', sets: 1, durationSec: 120, restSec: 10 },
          { name: 'Gratitude Reflection',       sets: 1, durationSec: 90,  restSec: 10 },
          { name: 'Journaling Prompt',          sets: 1, durationSec: 120, restSec: 0  },
        ],
      },
      {
        title: 'Morning Sun Salutation',
        level: 'beginner', muscleGroup: 'full_body', kcalPerMin: 4,
        category: 'MOOD', moodTargets: [2, 3, 4, 5], focusType: 'RELAX',
        description: 'Chào mặt trời buổi sáng — luồng yoga cổ điển đánh thức toàn bộ cơ thể và tâm trí',
        exercises: [
          { name: 'Belly Breathing',      sets: 1, durationSec: 60,  restSec: 10 },
          { name: 'Sun Salutation A',     sets: 3, durationSec: 90,  restSec: 20 },
          { name: 'Warrior I',            sets: 2, durationSec: 45,  restSec: 15 },
          { name: 'Warrior II',           sets: 2, durationSec: 45,  restSec: 15 },
          { name: 'Triangle Pose',        sets: 2, durationSec: 40,  restSec: 15 },
          { name: 'Cobra Pose',           sets: 2, durationSec: 40,  restSec: 15 },
          { name: 'Restorative Savasana', sets: 1, durationSec: 120, restSec: 0  },
        ],
      },
      {
        title: 'Yin Deep Release',
        level: 'beginner', muscleGroup: 'full_body', kcalPerMin: 2,
        category: 'MOOD', moodTargets: [1, 2, 3], focusType: 'RELAX',
        description: 'Yin yoga giữ sâu — giải phóng căng thẳng tích tụ trong cân cơ và các khớp sâu',
        exercises: [
          { name: 'Yin Hip Opener',       sets: 2, durationSec: 180, restSec: 15 },
          { name: 'Pigeon Pose',          sets: 2, durationSec: 180, restSec: 15 },
          { name: 'Supine Spinal Twist',  sets: 2, durationSec: 120, restSec: 10 },
          { name: 'Lizard Stretch',       sets: 2, durationSec: 120, restSec: 10 },
          { name: 'Eye of the Needle',    sets: 2, durationSec: 120, restSec: 10 },
          { name: 'Restorative Savasana', sets: 1, durationSec: 180, restSec: 0  },
        ],
      },
      {
        title: 'Qigong Energy Flow',
        level: 'beginner', muscleGroup: 'full_body', kcalPerMin: 3,
        category: 'MOOD', moodTargets: [2, 3, 4], focusType: 'MINDFULNESS',
        description: 'Khí công cổ truyền — kết hợp chuyển động chậm, hơi thở và ý niệm để lưu thông năng lượng',
        exercises: [
          { name: 'Belly Breathing',   sets: 1, durationSec: 60,  restSec: 10 },
          { name: 'Qigong Flow',       sets: 1, durationSec: 240, restSec: 20 },
          { name: 'Hip Circle',        sets: 2, durationSec: 60,  restSec: 10 },
          { name: 'Spinal Wave',       sets: 2, durationSec: 60,  restSec: 10 },
          { name: 'Shoulder Rolls',    sets: 2, durationSec: 30,  restSec: 10 },
          { name: 'Seated Meditation', sets: 1, durationSec: 120, restSec: 0  },
        ],
      },
      {
        title: 'Anger Release Flow',
        level: 'intermediate', muscleGroup: 'full_body', kcalPerMin: 6,
        category: 'MOOD', moodTargets: [1, 2], focusType: 'CARDIO',
        description: 'Xả tức giận an toàn qua chuyển động — đốt năng lượng âm và chuyển hoá cảm xúc nặng nề',
        exercises: [
          { name: 'Shaking Therapy',       sets: 1, durationSec: 120, restSec: 20 },
          { name: 'Burpee',                sets: 3, reps: 10,         restSec: 30 },
          { name: 'Mountain Climber',      sets: 3, durationSec: 30,  restSec: 20 },
          { name: 'Jump Squat',            sets: 3, reps: 12,         restSec: 30 },
          { name: 'Dance Freestyle',       sets: 1, durationSec: 90,  restSec: 20 },
          { name: 'Box Breathing 4-4-4-4', sets: 1, durationSec: 120, restSec: 10 },
          { name: 'Restorative Savasana',  sets: 1, durationSec: 120, restSec: 0  },
        ],
      },
      {
        title: 'Tai Chi Calm',
        level: 'beginner', muscleGroup: 'full_body', kcalPerMin: 3,
        category: 'MOOD', moodTargets: [1, 2, 3, 4], focusType: 'MINDFULNESS',
        description: 'Thái cực quyền — chuyển động thiền định chậm rãi tăng cân bằng, tập trung và bình an nội tâm',
        exercises: [
          { name: 'Belly Breathing',    sets: 1, durationSec: 60,  restSec: 10 },
          { name: 'Tai Chi Basic Form', sets: 1, durationSec: 300, restSec: 20 },
          { name: 'Shoulder Rolls',     sets: 2, durationSec: 30,  restSec: 10 },
          { name: 'Hip Circle',         sets: 2, durationSec: 45,  restSec: 10 },
          { name: 'Tree Pose',          sets: 2, durationSec: 45,  restSec: 10 },
          { name: 'Seated Meditation',  sets: 1, durationSec: 120, restSec: 0  },
        ],
      },
      {
        title: 'Dopamine Boost Dance',
        level: 'beginner', muscleGroup: 'full_body', kcalPerMin: 5,
        category: 'MOOD', moodTargets: [1, 2, 3, 4], focusType: 'CARDIO',
        description: 'Tăng dopamine qua vũ điệu tự do — không cần kỹ năng, chỉ cần để cơ thể tự nhiên di chuyển',
        exercises: [
          { name: 'Energizing Breath', sets: 1, durationSec: 60,  restSec: 10 },
          { name: 'Shoulder Rolls',    sets: 1, durationSec: 30,  restSec: 5  },
          { name: 'Dance Freestyle',   sets: 3, durationSec: 120, restSec: 30 },
          { name: 'Jumping Jacks',     sets: 2, durationSec: 30,  restSec: 20 },
          { name: 'Speed Skater',      sets: 2, reps: 15,         restSec: 30 },
          { name: 'Coherent Breathing',sets: 1, durationSec: 90,  restSec: 0  },
        ],
      },
      {
        title: 'Bedtime Wind Down Yoga',
        level: 'beginner', muscleGroup: 'full_body', kcalPerMin: 2,
        category: 'MOOD', moodTargets: [1, 2, 3], focusType: 'RELAX',
        description: 'Yoga ngủ ngon — chuỗi 7 tư thế thư giãn kết hợp thở sâu giúp đi vào giấc ngủ nhanh hơn',
        exercises: [
          { name: '4-7-8 Breathing',      sets: 2, durationSec: 90,  restSec: 15 },
          { name: 'Seated Forward Fold',  sets: 1, durationSec: 90,  restSec: 10 },
          { name: 'Bridge Pose',          sets: 2, durationSec: 60,  restSec: 15 },
          { name: 'Supine Spinal Twist',  sets: 2, durationSec: 75,  restSec: 10 },
          { name: 'Happy Baby Pose',      sets: 1, durationSec: 90,  restSec: 10 },
          { name: 'Legs Up The Wall',     sets: 1, durationSec: 180, restSec: 10 },
          { name: 'Restorative Savasana', sets: 1, durationSec: 180, restSec: 0  },
        ],
      },
      {
        title: 'Open Awareness Session',
        level: 'beginner', muscleGroup: 'core', kcalPerMin: 2,
        category: 'MOOD', moodTargets: [2, 3, 4, 5], focusType: 'MINDFULNESS',
        description: 'Thiền nhận thức mở rộng — luyện tập quan sát không phán xét để tăng sự hiện diện toàn diện',
        exercises: [
          { name: 'Coherent Breathing',        sets: 1, durationSec: 90,  restSec: 10 },
          { name: 'Open Awareness Meditation', sets: 1, durationSec: 180, restSec: 15 },
          { name: 'Breath Counting',           sets: 1, durationSec: 120, restSec: 10 },
          { name: 'Emotional Labelling',       sets: 1, durationSec: 60,  restSec: 10 },
          { name: 'Mindful Walking',           sets: 1, durationSec: 120, restSec: 10 },
          { name: 'Journaling Prompt',         sets: 1, durationSec: 120, restSec: 0  },
        ],
      },
    ];

    for (const { exercises: exList, ...planData } of PLANS) {
      const workout = await this.workoutRepo.save(this.workoutRepo.create(planData as any)) as unknown as Workout;
      const exEntities = exList.map((ex, i) => {
        const meta = EXERCISE_GIF_MAP[ex.name] ?? {};
        const entity = new WorkoutExercise();
        entity.name        = ex.name;
        entity.reps        = ex.reps        ?? null;
        entity.durationSec = ex.durationSec ?? null;
        entity.sets        = ex.sets        ?? null;
        entity.restSec     = ex.restSec     ?? null;
        entity.gifUrl      = meta.gifUrl;
        entity.description = meta.description;
        entity.orderIndex  = i;
        entity.workout     = workout;
        return entity;
      });
      await this.exerciseRepo.save(exEntities);
    }

    this.logger.log(`Workouts: seeded ${PLANS.length} workouts`);
    return this.workoutRepo.find();
  }

  // ─── CHALLENGES (12 thử thách) ───────────────────────────────────────────────

  private async seedChallenges(): Promise<Challenge[]> {
    const existing = await this.challengeRepo.count();
    if (existing > 0) {
      this.logger.log('Challenges: already seeded — skip');
      return this.challengeRepo.find();
    }

    const ITEMS = [
      {
        name: '7 Ngày Tập Liên Tiếp',
        description: 'Hoàn thành ít nhất 1 buổi tập mỗi ngày trong 7 ngày liên tiếp — xây dựng thói quen vàng.',
        type: 'WORKOUT', isActive: true, isPublic: true,
        targetCount: 7, durationDays: 7,
        rule: { source: 'WORKOUT', requireConsecutive: true, maxPerDay: 1 },
      },
      {
        name: '30 Ngày Kiên Trì',
        description: 'Tập luyện 30 ngày không ngừng nghỉ — bước ngoặt thay đổi toàn bộ thói quen sức khoẻ.',
        type: 'WORKOUT', isActive: true, isPublic: true,
        targetCount: 30, durationDays: 30,
        rule: { source: 'WORKOUT', maxPerDay: 1 },
      },
      {
        name: 'Tuần HIIT Cháy Mỡ',
        description: 'Hoàn thành 5 buổi HIIT trong 7 ngày — đốt mỡ và nâng cao thể lực tối đa.',
        type: 'WORKOUT', isActive: true, isPublic: true,
        targetCount: 5, durationDays: 7,
        rule: { source: 'WORKOUT', maxPerDay: 1 },
      },
      {
        name: '50 Buổi Tập Trong Năm',
        description: 'Chinh phục cột mốc 50 buổi tập — dành cho những người muốn tiến xa.',
        type: 'WORKOUT', isActive: true, isPublic: true,
        targetCount: 50, durationDays: 365,
        rule: { source: 'WORKOUT', maxPerDay: 2 },
      },
      {
        name: '7 Ngày Tâm Trạng Vui',
        description: 'Ghi nhận tâm trạng ≥4/5 mỗi ngày trong 7 ngày liên tiếp — hành trình hạnh phúc.',
        type: 'MOOD', isActive: true, isPublic: true,
        targetCount: 7, durationDays: 7,
        rule: { source: 'MOOD', minValue: 4, requireConsecutive: true, maxPerDay: 1 },
      },
      {
        name: 'Thiền 14 Ngày',
        description: 'Thực hành thiền định 14 ngày — giảm stress, tăng tập trung và cân bằng cảm xúc.',
        type: 'MOOD', isActive: true, isPublic: true,
        targetCount: 14, durationDays: 14,
        rule: { source: 'MOOD', maxPerDay: 1 },
      },
      {
        name: '30 Ngày Ghi Nhật Ký Tâm Trạng',
        description: 'Ghi chép cảm xúc mỗi ngày trong 30 ngày — hiểu rõ bản thân hơn.',
        type: 'MOOD', isActive: true, isPublic: true,
        targetCount: 30, durationDays: 30,
        rule: { source: 'MOOD', maxPerDay: 1 },
      },
      {
        name: '10 Buổi Yoga & Mindfulness',
        description: 'Hoàn thành 10 buổi yoga hoặc chánh niệm — cân bằng thể chất và tinh thần.',
        type: 'MOOD', isActive: true, isPublic: true,
        targetCount: 10, durationDays: 30,
        rule: { source: 'MOOD', maxPerDay: 1 },
      },
      {
        name: 'Thói Quen 21 Ngày',
        description: '21 ngày để hình thành thói quen — khoa học chứng minh, ý chí thực hành.',
        type: 'HABIT', isActive: true, isPublic: true,
        targetCount: 21, durationDays: 21,
        rule: { source: 'WORKOUT', maxPerDay: 1 },
      },
      {
        name: '100 Buổi Huyền Thoại',
        description: 'Chinh phục 100 buổi tập — cột mốc của những người thực sự nghiêm túc với sức khoẻ.',
        type: 'WORKOUT', isActive: true, isPublic: true,
        targetCount: 100, durationDays: 180,
        rule: { source: 'WORKOUT', maxPerDay: 2 },
      },
      {
        name: 'Tết Sức Khoẻ 45 Ngày',
        description: 'Challenge đặc biệt mùa hè: 45 ngày xây dựng lối sống lành mạnh toàn diện.',
        type: 'HABIT', isActive: true, isPublic: true,
        targetCount: 45, durationDays: 45,
        rule: { source: 'WORKOUT', maxPerDay: 1 },
      },
      {
        name: 'Morning Ritual 14 Ngày',
        description: '14 ngày thực hành buổi sáng: tập thể dục + ghi chép tâm trạng + uống đủ nước.',
        type: 'HABIT', isActive: true, isPublic: true,
        targetCount: 14, durationDays: 14,
        rule: { source: 'MOOD', maxPerDay: 1 },
      },
    ];

    const entities = ITEMS.map((c) => this.challengeRepo.create(c as any)) as unknown as Challenge[];
    const saved = await this.challengeRepo.save(entities);
    this.logger.log(`Challenges: seeded ${saved.length} items`);
    return saved as Challenge[];
  }

  // ─── ACHIEVEMENTS (25 thành tích) ────────────────────────────────────────────

  private async seedAchievements(): Promise<Achievement[]> {
    const existing = await this.achievementRepo.count();
    if (existing > 0) {
      this.logger.log('Achievements: already seeded — skip');
      return this.achievementRepo.find();
    }

    const ITEMS = [
      // Workout
      { code: 'FIRST_WORKOUT',    name: 'Bắt Đầu Hành Trình',      description: 'Hoàn thành buổi tập đầu tiên',        category: 'WORKOUT', trigger: 'WORKOUT_COMPLETED', condition: { field: 'workoutCount', operator: '>=', value: 1 },   points: 10,  isHidden: false, hiddenLevel: 0 },
      { code: 'WORKOUT_5',        name: 'Dần Thành Thói Quen',      description: 'Hoàn thành 5 buổi tập',               category: 'WORKOUT', trigger: 'WORKOUT_COMPLETED', condition: { field: 'workoutCount', operator: '>=', value: 5 },   points: 30,  isHidden: false, hiddenLevel: 0 },
      { code: 'WORKOUT_10',       name: 'Kiên Trì Là Sức Mạnh',     description: 'Hoàn thành 10 buổi tập',              category: 'WORKOUT', trigger: 'WORKOUT_COMPLETED', condition: { field: 'workoutCount', operator: '>=', value: 10 },  points: 50,  isHidden: false, hiddenLevel: 0 },
      { code: 'WORKOUT_30',       name: 'Chiến Binh Sức Khoẻ',      description: 'Hoàn thành 30 buổi tập',              category: 'WORKOUT', trigger: 'WORKOUT_COMPLETED', condition: { field: 'workoutCount', operator: '>=', value: 30 },  points: 150, isHidden: false, hiddenLevel: 0 },
      { code: 'WORKOUT_100',      name: 'Huyền Thoại Phòng Gym',    description: 'Hoàn thành 100 buổi tập',             category: 'WORKOUT', trigger: 'WORKOUT_COMPLETED', condition: { field: 'workoutCount', operator: '>=', value: 100 }, points: 500, isHidden: true,  hiddenLevel: 1, hint: 'Hoàn thành thật nhiều buổi tập để mở khoá...' },
      { code: 'CALORIES_1000',    name: 'Lò Đốt Năng Lượng',        description: 'Đốt tổng cộng 1000 kcal',             category: 'WORKOUT', trigger: 'WORKOUT_COMPLETED', condition: { field: 'totalKcal', operator: '>=', value: 1000 },  points: 80,  isHidden: false, hiddenLevel: 0 },
      { code: 'CALORIES_10000',   name: 'Siêu Nhân Calorie',         description: 'Đốt tổng cộng 10000 kcal',            category: 'WORKOUT', trigger: 'WORKOUT_COMPLETED', condition: { field: 'totalKcal', operator: '>=', value: 10000 }, points: 300, isHidden: true,  hiddenLevel: 1, hint: 'Đốt đủ nhiều calorie để mở khoá...' },
      { code: 'NIGHT_OWL',        name: 'Cú Đêm',                   description: 'Tập luyện sau 23:00',                 category: 'WORKOUT', trigger: 'WORKOUT_COMPLETED', condition: { field: 'workoutHour', operator: '>=', value: 23 },  points: 30,  isHidden: true,  hiddenLevel: 1, hint: 'Ai đó thích tập lúc nửa đêm...' },
      { code: 'EARLY_BIRD_GYM',   name: 'Chim Sơn Ca Sáng Sớm',     description: 'Tập luyện trước 6:00 sáng',           category: 'WORKOUT', trigger: 'WORKOUT_COMPLETED', condition: { field: 'workoutHour', operator: '<=', value: 6 },   points: 40,  isHidden: true,  hiddenLevel: 1, hint: 'Dành cho người yêu buổi sáng sớm...' },
      // Mood
      { code: 'FIRST_MOOD',       name: 'Tâm Trạng Ngày Mới',       description: 'Ghi nhận tâm trạng lần đầu',          category: 'MOOD',    trigger: 'MOOD_CREATED',     condition: { field: 'moodCount', operator: '>=', value: 1 },     points: 5,   isHidden: false, hiddenLevel: 0 },
      { code: 'MOOD_STREAK_7',    name: 'Tuần Bình Yên',             description: 'Ghi nhận tâm trạng 7 ngày liên tiếp', category: 'MOOD',    trigger: 'MOOD_CREATED',     condition: { field: 'moodStreak', operator: '>=', value: 7 },    points: 50,  isHidden: false, hiddenLevel: 0 },
      { code: 'MOOD_STREAK_30',   name: 'Nhật Ký Tâm Hồn',          description: 'Ghi nhận tâm trạng 30 ngày liên tiếp',category: 'MOOD',    trigger: 'MOOD_CREATED',     condition: { field: 'moodStreak', operator: '>=', value: 30 },   points: 200, isHidden: false, hiddenLevel: 0 },
      { code: 'MOOD_HAPPY_10',    name: 'Nguồn Năng Lượng Tích Cực', description: 'Ghi nhận tâm trạng vui ≥4 tổng 10 lần', category: 'MOOD', trigger: 'MOOD_CREATED',     condition: { field: 'happyMoodCount', operator: '>=', value: 10 },points: 60,  isHidden: false, hiddenLevel: 0 },
      // Challenge
      { code: 'FIRST_CHALLENGE',  name: 'Thách Thức Bắt Đầu',       description: 'Tham gia thử thách đầu tiên',          category: 'CHALLENGE', trigger: 'CHALLENGE_JOINED',    condition: { field: 'challengeJoinCount',    operator: '>=', value: 1 }, points: 15,  isHidden: false, hiddenLevel: 0 },
      { code: 'CHALLENGE_DONE_1', name: 'Người Chinh Phục',          description: 'Hoàn thành 1 thử thách',               category: 'CHALLENGE', trigger: 'CHALLENGE_COMPLETED', condition: { field: 'challengeCompleteCount', operator: '>=', value: 1 }, points: 75,  isHidden: false, hiddenLevel: 0 },
      { code: 'CHALLENGE_DONE_5', name: 'Vô Địch Thử Thách',         description: 'Hoàn thành 5 thử thách',               category: 'CHALLENGE', trigger: 'CHALLENGE_COMPLETED', condition: { field: 'challengeCompleteCount', operator: '>=', value: 5 }, points: 250, isHidden: false, hiddenLevel: 0 },
      // Social
      { code: 'FIRST_POST',       name: 'Lời Đầu Chia Sẻ',          description: 'Đăng bài viết đầu tiên trong cộng đồng',category: 'SOCIAL', trigger: 'POST_CREATED',   condition: { field: 'postCount',   operator: '>=', value: 1 },  points: 10,  isHidden: false, hiddenLevel: 0 },
      { code: 'POST_10',          name: 'Người Kể Chuyện',           description: 'Đăng 10 bài viết trong cộng đồng',    category: 'SOCIAL', trigger: 'POST_CREATED',   condition: { field: 'postCount',   operator: '>=', value: 10 }, points: 60,  isHidden: false, hiddenLevel: 0 },
      { code: 'FIRST_FRIEND',     name: 'Không Còn Đơn Độc',         description: 'Kết bạn lần đầu tiên',                category: 'SOCIAL', trigger: 'FRIEND_ADDED',   condition: { field: 'friendCount', operator: '>=', value: 1 },  points: 20,  isHidden: false, hiddenLevel: 0 },
      { code: 'FRIENDS_10',       name: 'Đại Sứ Cộng Đồng',         description: 'Có 10 người bạn trong cộng đồng',     category: 'SOCIAL', trigger: 'FRIEND_ADDED',   condition: { field: 'friendCount', operator: '>=', value: 10 }, points: 100, isHidden: false, hiddenLevel: 0 },
      // Event
      { code: 'FIRST_EVENT',      name: 'Người Tham Gia Sự Kiện',    description: 'Đăng ký tham gia sự kiện đầu tiên',   category: 'EVENT',  trigger: 'EVENT_JOIN',     condition: { field: 'eventJoinCount',     operator: '>=', value: 1 }, points: 20,  isHidden: false, hiddenLevel: 0 },
      { code: 'EVENT_COMPLETE_1', name: 'Hoàn Thành Sự Kiện',        description: 'Hoàn thành sự kiện đầu tiên',         category: 'EVENT',  trigger: 'EVENT_COMPLETE', condition: { field: 'eventCompleteCount', operator: '>=', value: 1 }, points: 100, isHidden: false, hiddenLevel: 0 },
      { code: 'EVENT_COMPLETE_3', name: 'Nhà Vô Địch Sự Kiện',       description: 'Hoàn thành 3 sự kiện',                category: 'EVENT',  trigger: 'EVENT_COMPLETE', condition: { field: 'eventCompleteCount', operator: '>=', value: 3 }, points: 250, isHidden: false, hiddenLevel: 0 },
      // System
      { code: 'EARLY_ADOPTER',    name: 'Người Tiên Phong',          description: 'Một trong những người dùng đầu tiên của HealthHub', category: 'SYSTEM', trigger: 'SYSTEM', condition: { field: 'userId', operator: '<=', value: 50 }, points: 200, isHidden: true, hiddenLevel: 3, hint: 'Dành cho những người đặc biệt...' },
      { code: 'LEVEL_10',         name: 'Thập Cấp Anh Hào',          description: 'Đạt cấp độ 10',                       category: 'SYSTEM', trigger: 'LEVEL_UP', condition: { field: 'level', operator: '>=', value: 10 }, points: 150, isHidden: false, hiddenLevel: 0 },
    ];

    const entities = ITEMS.map((a) => this.achievementRepo.create(a as any)) as unknown as Achievement[];
    const saved = await this.achievementRepo.save(entities);
    this.logger.log(`Achievements: seeded ${saved.length} items`);
    return saved as Achievement[];
  }

  // ─── EVENTS (10 sự kiện) ─────────────────────────────────────────────────────

  private async seedEvents(users: User[]): Promise<Event[]> {
    const existing = await this.eventRepo.count();
    if (existing > 0) {
      this.logger.log('Events: already seeded — skip');
      return this.eventRepo.find({ relations: ['createdBy'] });
    }

    const admin = users.find((u) => u.role === UserRole.ADMIN) ?? users[0];

    const ITEMS = [
      {
        title: 'Thử Thách Plank 30 Ngày',
        description: 'Bắt đầu từ 30 giây, tăng 5 giây mỗi ngày — sau 30 ngày bạn sẽ plank được 5 phút! Theo dõi tiến độ và chia sẻ kết quả mỗi ngày.',
        type: 'online', scope: EventScope.PUBLIC, link: 'https://meet.google.com/plank-30d',
        startTime: daysAgo(5), endTime: daysFromNow(25, 23, 59),
        maxParticipants: 1000, createdBy: admin,
      },
      {
        title: 'Tuần Lễ Sức Khoẻ Cộng Đồng',
        description: 'Sự kiện sức khoẻ cộng đồng lớn nhất tháng — cùng nhau xây dựng lối sống lành mạnh trong 7 ngày với các chuyên gia hàng đầu.',
        type: 'online', scope: EventScope.PUBLIC, link: 'https://meet.google.com/healthhub-week',
        startTime: daysFromNow(2), endTime: daysFromNow(8, 22),
        maxParticipants: 500, createdBy: admin,
      },
      {
        title: 'Marathon Ảo 5K',
        description: 'Thử thách chạy 5km mỗi ngày trong 3 ngày liên tiếp. Ghi lại kết quả, chụp ảnh và chia sẻ với cộng đồng để nhận huy hiệu đặc biệt.',
        type: 'offline', scope: EventScope.PUBLIC,
        startTime: daysFromNow(5), endTime: daysFromNow(7, 21),
        maxParticipants: 200, createdBy: admin,
      },
      {
        title: 'Workshop: Dinh Dưỡng Cho Người Luyện Tập',
        description: 'Chuyên gia dinh dưỡng Dr. Nguyễn Thị Hương chia sẻ bí quyết ăn uống khoa học, tối ưu hiệu quả tập luyện và phục hồi cơ bắp.',
        type: 'online', scope: EventScope.PUBLIC, link: 'https://zoom.us/healthhub-nutrition',
        startTime: daysFromNow(10, 19), endTime: daysFromNow(10, 21),
        maxParticipants: 300, createdBy: admin,
      },
      {
        title: 'Yoga Sunrise Series — 5 Buổi',
        description: 'Series 5 buổi yoga livestream mỗi sáng 6:30. Phù hợp mọi trình độ, không cần dụng cụ. Kết thúc mỗi buổi với 10 phút thiền hướng dẫn.',
        type: 'online', scope: EventScope.PUBLIC, link: 'https://meet.google.com/yoga-sunrise',
        startTime: daysFromNow(14, 6, 30), endTime: daysFromNow(18, 7, 30),
        maxParticipants: 150, createdBy: admin,
      },
      {
        title: 'Tháng Hè Sức Mạnh — 21 Ngày',
        description: '21 ngày xây dựng thói quen: tập luyện buổi sáng + uống 2L nước + ghi nhận tâm trạng. Hoàn thành nhận badge đặc biệt và tặng phẩm.',
        type: 'online', scope: EventScope.PUBLIC,
        startTime: daysAgo(10), endTime: daysFromNow(11, 23, 59),
        maxParticipants: 800, createdBy: admin,
      },
      {
        title: 'Run For Health — Chạy Vì Cộng Đồng',
        description: 'Mỗi km bạn chạy, HealthHub sẽ đóng góp 5,000đ cho quỹ trẻ em suy dinh dưỡng. Tổng tối đa 50 triệu đồng. Hãy chạy vì một điều ý nghĩa hơn!',
        type: 'offline', scope: EventScope.PUBLIC,
        startTime: daysFromNow(20), endTime: daysFromNow(27, 22),
        maxParticipants: 2000, createdBy: admin,
      },
      {
        title: 'Hội Thảo: Sức Khoẻ Tâm Lý Sau COVID',
        description: 'Chuyên gia tâm lý chia sẻ cách phục hồi tinh thần, quản lý lo âu và xây dựng sức đề kháng tâm lý trong thời đại mới.',
        type: 'online', scope: EventScope.PUBLIC, link: 'https://zoom.us/mental-health-post-covid',
        startTime: daysFromNow(25, 14), endTime: daysFromNow(25, 16, 30),
        maxParticipants: 500, createdBy: admin,
      },
      {
        title: 'HealthHub Anniversary Challenge',
        description: 'Kỷ niệm 1 năm HealthHub ra mắt! Thử thách tổng hợp 30 ngày: workout + mood + water intake. Top 10 người hoàn thành sớm nhất nhận phần thưởng.',
        type: 'online', scope: EventScope.PUBLIC,
        startTime: daysAgo(3), endTime: daysFromNow(27, 23, 59),
        maxParticipants: 999, createdBy: admin,
      },
      {
        title: 'Bootcamp Cuối Tuần — 4 Tuần',
        description: 'Bootcamp thứ 7 & CN, mỗi buổi 60 phút. 4 tuần liên tiếp với 3 cấp độ: Beginner / Intermediate / Advanced. Huấn luyện viên chứng nhận bởi NASM.',
        type: 'offline', scope: EventScope.PUBLIC,
        startTime: daysFromNow(3), endTime: daysFromNow(31, 18),
        maxParticipants: 60, createdBy: admin,
      },
    ];

    const entities = ITEMS.map((e) => this.eventRepo.create(e as any)) as unknown as Event[];
    await this.eventRepo.save(entities);
    this.logger.log(`Events: seeded ${entities.length} items`);
    return this.eventRepo.find({ relations: ['createdBy'] });
  }

  // ─── GROUPS (MongoDB, 8 nhóm) ────────────────────────────────────────────────

  private async seedGroups(users: User[]): Promise<any[]> {
    const existing = await this.groupModel.countDocuments();
    if (existing > 0) { this.logger.log('Groups: already seeded — skip'); return []; }

    const normalUsers = users.filter((u) => u.role === UserRole.USER);
    const idStr = (u: User) => String(u.id);
    const ids = normalUsers.map(idStr);

    const GROUPS = [
      {
        name: 'Hội Chạy Bộ Sài Gòn',
        description: 'Nhóm dành cho những người đam mê chạy bộ tại TP.HCM — chia sẻ lịch tập, địa điểm, và kết quả mỗi tuần.',
        type: 'public',
        createdBy: ids[0], creator: { name: normalUsers[0].fullName, avatar: '' },
        members: ids.slice(0, 12), memberCount: 12,
      },
      {
        name: 'Gym & Fitness Hà Nội',
        description: 'Cộng đồng gym Hà Nội — tips tập luyện, dinh dưỡng, review phòng gym và thách nhau PRs mỗi tuần.',
        type: 'public',
        createdBy: ids[1], creator: { name: normalUsers[1].fullName, avatar: '' },
        members: ids.slice(2, 10), memberCount: 8,
      },
      {
        name: 'Yoga & Mindfulness Vietnam',
        description: 'Không gian an lành cho những ai yêu thích yoga, thiền định và chánh niệm. Chia sẻ routine sáng hàng ngày.',
        type: 'public',
        createdBy: ids[2], creator: { name: normalUsers[2].fullName, avatar: '' },
        members: ids.slice(1, 9), memberCount: 8,
      },
      {
        name: 'Healthy Eating Vietnam',
        description: 'Chia sẻ công thức nấu ăn lành mạnh, meal prep và kế hoạch dinh dưỡng. Mỗi tuần có 1 thách thức ẩm thực mới.',
        type: 'public',
        createdBy: ids[3], creator: { name: normalUsers[3].fullName, avatar: '' },
        members: ids.slice(0, 14), memberCount: 14,
      },
      {
        name: 'Calisthenics Việt Nam',
        description: 'Cộng đồng bodyweight training — từ beginner đến advanced. Học pull-up, muscle-up và handstand cùng nhau.',
        type: 'public',
        createdBy: ids[4], creator: { name: normalUsers[4].fullName, avatar: '' },
        members: ids.slice(3, 11), memberCount: 8,
      },
      {
        name: 'Mental Wellness Club',
        description: 'Cùng nhau chăm sóc sức khoẻ tinh thần — chia sẻ trải nghiệm, cảm xúc và hỗ trợ lẫn nhau trong hành trình healing.',
        type: 'public',
        createdBy: ids[5], creator: { name: normalUsers[5].fullName, avatar: '' },
        members: ids.slice(5, 18), memberCount: 13,
      },
      {
        name: 'Team HealthHub Elite',
        description: 'Nhóm riêng tư cho thành viên tích cực nhất HealthHub — thử thách độc quyền, phần thưởng đặc biệt mỗi tháng.',
        type: 'private',
        createdBy: ids[0], creator: { name: normalUsers[0].fullName, avatar: '' },
        members: ids.slice(0, 6), memberCount: 6,
      },
      {
        name: 'Tập Cùng Nhau — Hỗ Trợ Nữ Giới',
        description: 'Không gian an toàn dành riêng cho chị em — chia sẻ hành trình tập luyện, dinh dưỡng và cân bằng cuộc sống.',
        type: 'public',
        createdBy: ids[6], creator: { name: normalUsers[6].fullName, avatar: '' },
        members: ids.slice(6, 20), memberCount: 14,
      },
    ];

    const saved = await this.groupModel.insertMany(GROUPS);
    this.logger.log(`Groups: seeded ${saved.length} items`);
    return saved;
  }

  // ─── WORKOUT LOGS (8–12 logs/user × 20 users ≈ 200+ logs) ────────────────────

  private async seedWorkoutLogs(users: User[], workouts: Workout[]) {
    const existing = await this.logRepo.count();
    if (existing > 0) { this.logger.log('WorkoutLogs: already seeded — skip'); return; }
    if (!workouts.length) return;

    const fitnessWorkouts = workouts.filter((w) => w.category === 'FITNESS');
    const allWorkouts = workouts;
    const normalUsers = users.filter((u) => u.role === UserRole.USER);

    const NOTES = [
      'Cảm giác rất tốt hôm nay!', 'Hơi mệt nhưng cố gắng hoàn thành',
      'PR mới — tự hào về bản thân', 'Tập nhẹ hơn do đang phục hồi',
      'Tuyệt vời, năng lượng cao cả ngày', 'Khó hơn dự kiến nhưng xong rồi!',
      'Streak tiếp tục!', 'Tập cùng bạn — vui hơn nhiều',
      null, null, null,
    ];

    const logs: WorkoutLog[] = [];
    for (const user of normalUsers) {
      const numLogs = rand(8, 18);
      for (let i = 0; i < numLogs; i++) {
        const workout = pick(i % 5 === 0 ? allWorkouts : fitnessWorkouts);
        // bắt đầu từ 8 ngày trước để không rơi vào tuần hiện tại
        const daysOffset = rand(8, 90);
        const hour = pick([6, 7, 8, 9, 17, 18, 19, 20, 21]);
        const dur = rand(20, 60);
        const logDate = daysAgo(daysOffset, hour);
        logs.push(Object.assign(new WorkoutLog(), {
          user,
          workout,
          durationMin: dur,
          kcal: dur * (workout.kcalPerMin ?? 7),
          startedAt: logDate,
          note: pick(NOTES) ?? undefined,
        }));
      }
    }

    // Dùng insert() để bypass @CreateDateColumn và set startedAt tùy ý
    for (const log of logs) {
      await this.logRepo.createQueryBuilder()
        .insert().into('workout_logs')
        .values({
          userId: (log as any).user?.id,
          workoutId: (log as any).workout?.id,
          durationMin: (log as any).durationMin,
          kcal: (log as any).kcal,
          startedAt: (log as any).startedAt,
          note: (log as any).note ?? null,
        }).execute();
    }
    this.logger.log(`WorkoutLogs: seeded ${logs.length} records`);
  }

  // ─── MOOD ENTRIES (MongoDB, 20–45 entries/user ≈ 600+ records) ──────────────

  private async seedMoodEntries(users: User[]) {
    const existing = await this.moodModel.countDocuments();
    if (existing > 0) { this.logger.log('MoodEntries: already seeded — skip'); return; }

    const MOODS = [
      { score: -2, emoji: '😢', color: '#94a3b8', tags: ['buồn', 'mệt mỏi', 'khó chịu'] },
      { score: -1, emoji: '😔', color: '#64748b', tags: ['lo lắng', 'căng thẳng', 'áp lực'] },
      { score:  0, emoji: '😐', color: '#F59E0B', tags: ['bình thường', 'ổn', 'trung bình'] },
      { score:  1, emoji: '😊', color: '#10B981', tags: ['vui vẻ', 'tốt', 'hài lòng'] },
      { score:  2, emoji: '😄', color: '#3B82F6', tags: ['tuyệt vời', 'hạnh phúc', 'xuất sắc'] },
    ];

    const NOTES = [
      'Hôm nay tập xong cảm thấy rất nhẹ nhõm', 'Deadline dồn dập quá, stress thật',
      'Ngủ đủ giấc, sáng dậy tràn đầy năng lượng', 'Trời đẹp, đi dạo một lúc thấy khác hẳn',
      'Ăn ngon ngủ yên — cuộc sống thật đơn giản', 'Bạn bè họp mặt, vui cả ngày',
      'Hơi đau đầu, không tập được hôm nay', 'Hoàn thành dự án quan trọng!',
      null, null, null, null,
    ];

    const normalUsers = users.filter((u) => u.role === UserRole.USER);
    const entries: any[] = [];

    for (const user of normalUsers) {
      const numDays = rand(20, 50);
      const usedDays = new Set<string>();

      for (let i = 0; i < numDays * 1.5 && usedDays.size < numDays; i++) {
        const offset = rand(0, 90);
        const d = daysAgo(offset);
        d.setHours(0, 0, 0, 0);
        const key = dateStr(d);
        if (usedDays.has(key)) continue;
        usedDays.add(key);

        const mood = pick(MOODS);
        entries.push({
          userId: user.id,
          date: d,
          mood: { emoji: mood.emoji, color: mood.color, score: mood.score },
          note: pick(NOTES) ?? undefined,
          tags: [pick(mood.tags)],
        });
      }
    }

    await this.moodModel.insertMany(entries);
    this.logger.log(`MoodEntries: seeded ${entries.length} records`);
  }

  // ─── BODY METRICS (5–10 records/user ≈ 130+ records) ─────────────────────────

  private async seedBodyMetrics(users: User[]) {
    const existing = await this.bodyMetricRepo.count();
    if (existing > 0) { this.logger.log('BodyMetrics: already seeded — skip'); return; }

    const normalUsers = users.filter((u) => u.role === UserRole.USER);
    const records: BodyMetric[] = [];

    // Mỗi user có profile cơ thể riêng, đo nhiều lần theo thời gian
    const baseProfiles: Record<number, { w: number; h: number; hr: number; bpS: number; bpD: number }> = {};
    normalUsers.forEach((u, i) => {
      baseProfiles[u.id] = {
        w: rand(50, 90),
        h: rand(155, 185),
        hr: rand(60, 80),
        bpS: rand(110, 130),
        bpD: rand(70, 85),
      };
    });

    for (const user of normalUsers) {
      const base = baseProfiles[user.id];
      const numRecords = rand(5, 10);

      for (let i = 0; i < numRecords; i++) {
        const weeksAgo = i * rand(1, 3); // đo cách nhau 1–3 tuần
        const wDelta = (Math.random() - 0.5) * 2; // ±1 kg mỗi lần đo
        const weight = Math.round((base.w + wDelta * i) * 10) / 10;
        const height = base.h;
        const bmi = Math.round((weight / ((height / 100) ** 2)) * 10) / 10;

        records.push(Object.assign(new BodyMetric(), {
          user,
          userId: user.id,
          weight,
          height,
          bmi,
          heartRate: base.hr + rand(-5, 5),
          bloodPressureSystolic: base.bpS + rand(-5, 5),
          bloodPressureDiastolic: base.bpD + rand(-3, 3),
          recordedAt: daysAgo(weeksAgo * 7),
          note: i === 0 ? 'Đo lần đầu khi bắt đầu dùng HealthHub' : undefined,
        }));
      }
    }

    for (const r of records) {
      await this.bodyMetricRepo.createQueryBuilder()
        .insert().into('body_metrics')
        .values({
          userId: (r as any).userId,
          weight: (r as any).weight,
          height: (r as any).height,
          bmi: (r as any).bmi,
          heartRate: (r as any).heartRate,
          bloodPressureSystolic: (r as any).bloodPressureSystolic,
          bloodPressureDiastolic: (r as any).bloodPressureDiastolic,
          note: (r as any).note ?? null,
          recordedAt: (r as any).recordedAt,
        }).execute();
    }
    this.logger.log(`BodyMetrics: seeded ${records.length} records`);
  }

  // ─── DAILY STEPS (45 ngày × 20 users ≈ 900 records) ─────────────────────────

  private async seedDailySteps(users: User[]) {
    const existing = await this.stepsRepo.count();
    if (existing > 0) { this.logger.log('DailySteps: already seeded — skip'); return; }

    const normalUsers = users.filter((u) => u.role === UserRole.USER);
    const records: DailySteps[] = [];

    for (const user of normalUsers) {
      const goalSteps = pick([8000, 10000, 12000]);
      const numDays = rand(30, 50);

      for (let i = 0; i < numDays; i++) {
        const d = daysAgo(i);
        records.push(this.stepsRepo.create({
          userId: user.id,
          date: dateStr(d),
          steps: rand(2000, 14000),
          goalSteps,
        }));
      }
    }

    await this.stepsRepo.save(records);
    this.logger.log(`DailySteps: seeded ${records.length} records`);
  }

  // ─── WATER LOGS (3–6 logs/day × 20 days × 20 users ≈ 2000+ records) ──────────

  private async seedWaterLogs(users: User[]) {
    const existing = await this.waterRepo.count();
    if (existing > 0) { this.logger.log('WaterLogs: already seeded — skip'); return; }

    const normalUsers = users.filter((u) => u.role === UserRole.USER);
    const records: WaterLog[] = [];
    const AMOUNTS = [150, 200, 250, 300, 350, 500];

    for (const user of normalUsers) {
      const numDays = rand(15, 25);
      for (let d = 0; d < numDays; d++) {
        const numLogs = rand(3, 7);
        for (let l = 0; l < numLogs; l++) {
          const logDate = daysAgo(d, rand(7, 22), rand(0, 59));
          records.push({
            user,
            userId: user.id,
            amount: pick(AMOUNTS),
            loggedAt: logDate,
          } as any);
        }
      }
    }

    // Dùng QueryBuilder để override @CreateDateColumn
    for (const r of records) {
      await this.waterRepo.createQueryBuilder()
        .insert().into('water_logs')
        .values({
          userId: (r as any).userId,
          amount: (r as any).amount,
          loggedAt: (r as any).loggedAt,
        }).execute();
    }
    this.logger.log(`WaterLogs: seeded ${records.length} records`);
  }

  // ─── USER CHALLENGES (mỗi user tham gia 3–6 challenge) ──────────────────────

  private async seedUserChallenges(users: User[], challenges: Challenge[]) {
    const existing = await this.uChallengeRepo.count();
    if (existing > 0) { this.logger.log('UserChallenges: already seeded — skip'); return; }
    if (!challenges.length) return;

    const normalUsers = users.filter((u) => u.role === UserRole.USER);
    const records: UserChallenge[] = [];

    for (const user of normalUsers) {
      const shuffled = [...challenges].sort(() => Math.random() - 0.5);
      const num = rand(3, 6);

      for (let i = 0; i < num && i < shuffled.length; i++) {
        const ch = shuffled[i];
        const completed = Math.random() > 0.5;
        const streak = rand(1, Math.min(ch.targetCount, 15));
        const count = completed ? ch.targetCount : rand(1, ch.targetCount - 1);

        records.push(Object.assign(new UserChallenge(), {
          user,
          challenge: ch,
          status: completed ? 'completed' : (Math.random() > 0.8 ? 'failed' : 'ongoing'),
          completedCount: count,
          currentStreak: completed ? 0 : streak,
          maxStreak: completed ? ch.targetCount : streak,
          joinedAt: daysAgo(rand(5, 60)),
          lastCompletedDate: dateStr(daysAgo(rand(0, 3))),
          todayCount: 0,
          todayKey: null,
        }));
      }
    }

    for (const r of records) {
      await this.uChallengeRepo.createQueryBuilder()
        .insert().into('user_challenges')
        .values({
          userId:            (r as any).user?.id,
          challengeId:       (r as any).challenge?.id,
          status:            (r as any).status,
          completedCount:    (r as any).completedCount,
          currentStreak:     (r as any).currentStreak,
          maxStreak:         (r as any).maxStreak,
          joinedAt:          (r as any).joinedAt,
          lastCompletedDate: (r as any).lastCompletedDate,
          todayCount:        0,
          todayKey:          null,
        }).orIgnore()  // bỏ qua nếu unique constraint vi phạm
        .execute();
    }
    this.logger.log(`UserChallenges: seeded ${records.length} records`);
  }

  // ─── USER ACHIEVEMENTS (mỗi user mở khoá 3–8 thành tích) ────────────────────

  private async seedUserAchievements(users: User[], achievements: Achievement[]) {
    const existing = await this.uAchRepo.count();
    if (existing > 0) { this.logger.log('UserAchievements: already seeded — skip'); return; }
    if (!achievements.length) return;

    const normalUsers = users.filter((u) => u.role === UserRole.USER);
    // Achievements dễ mở khoá trước
    const common = achievements.filter((a) => [
      'FIRST_WORKOUT', 'FIRST_MOOD', 'FIRST_CHALLENGE', 'FIRST_FRIEND', 'FIRST_POST', 'FIRST_EVENT',
      'WORKOUT_5', 'WORKOUT_10', 'MOOD_STREAK_7', 'CHALLENGE_DONE_1',
    ].includes(a.code));
    const rare = achievements.filter((a) => !common.find((c) => c.id === a.id));

    const records: UserAchievement[] = [];

    for (const user of normalUsers) {
      // Mỗi user mở khoá 3–5 common + 0–3 rare
      const numCommon = rand(3, Math.min(5, common.length));
      const numRare = rand(0, 3);
      const picked = new Set<number>();

      const addAch = (ach: Achievement) => {
        if (picked.has(ach.id)) return;
        picked.add(ach.id);
        records.push(Object.assign(new UserAchievement(), {
          user, achievement: ach,
          earnedAt: daysAgo(rand(1, 90)),
        }));
      };

      [...common].sort(() => Math.random() - 0.5).slice(0, numCommon).forEach(addAch);
      [...rare].sort(() => Math.random() - 0.5).slice(0, numRare).forEach(addAch);
    }

    for (const r of records) {
      await this.uAchRepo.createQueryBuilder()
        .insert().into('user_achievements')
        .values({
          userId:        (r as any).user?.id,
          achievementId: (r as any).achievement?.id,
          earnedAt:      (r as any).earnedAt,
        }).orIgnore()
        .execute();
    }
    this.logger.log(`UserAchievements: seeded ${records.length} records`);
  }

  // ─── EVENT REGISTRATIONS (mỗi event có 5–25 người đăng ký) ─────────────────

  private async seedEventRegistrations(users: User[], events: Event[]) {
    const existing = await this.regRepo.count();
    if (existing > 0) { this.logger.log('EventRegistrations: already seeded — skip'); return; }
    if (!events.length) return;

    const normalUsers = users.filter((u) => u.role === UserRole.USER);
    const records: EventRegistration[] = [];
    const STATUSES: ('registered' | 'checked_in' | 'completed' | 'cancelled')[] = [
      'registered', 'registered', 'checked_in', 'checked_in', 'completed', 'cancelled',
    ];

    for (const event of events) {
      const numReg = rand(5, Math.min(25, normalUsers.length));
      const shuffled = [...normalUsers].sort(() => Math.random() - 0.5).slice(0, numReg);
      const now = new Date();
      const start = new Date(event.startTime);
      const end   = new Date(event.endTime);
      const isOngoing = start <= now && end >= now;
      const isEnded   = end < now;

      for (const user of shuffled) {
        const status = isEnded ? 'completed' : (isOngoing ? pick(STATUSES) : 'registered');
        const totalDays = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / 86400_000));
        const checkInCount = status === 'completed' ? totalDays
          : status === 'checked_in' ? rand(1, Math.min(totalDays - 1, 10))
          : 0;
        const progress = Math.min(100, Math.round((checkInCount / totalDays) * 100));

        records.push(Object.assign(new EventRegistration(), {
          event, user, status,
          checkInCount, progress,
          lastCheckInDate: checkInCount > 0 ? daysAgo(rand(0, 3)) : undefined,
          completedAt: status === 'completed' ? daysAgo(rand(0, 5)) : undefined,
          registeredAt: daysAgo(rand(1, 15)),
        }));
      }
    }

    for (const r of records) {
      await this.regRepo.createQueryBuilder()
        .insert().into('event_registrations')
        .values({
          eventId:          (r as any).event?.id,
          userId:           (r as any).user?.id,
          status:           (r as any).status,
          checkInCount:     (r as any).checkInCount,
          progress:         (r as any).progress,
          lastCheckInDate:  (r as any).lastCheckInDate ?? null,
          completedAt:      (r as any).completedAt ?? null,
          registeredAt:     (r as any).registeredAt,
        }).orIgnore()
        .execute();
    }
    this.logger.log(`EventRegistrations: seeded ${records.length} records`);
  }

  // ─── COMMUNITY POSTS ─────────────────────────────────────────────────────────

  async reseedPosts() {
    const users = await this.userRepo.find();
    await this.postModel.deleteMany({});
    this.logger.log('Posts: cleared old data');
    await this.seedPosts(users, []);
  }

  private async seedPosts(users: User[], _groups: any[]) {
    const existing = await this.postModel.countDocuments();
    if (existing > 0) { this.logger.log('Posts: already seeded — skip'); return; }

    const normalUsers = users.filter((u) => u.role === UserRole.USER);

    // ── Bài chỉ có text ──────────────────────────────────────────────────────
    const TEXT_ONLY: string[] = [
      'Sáng nay hoàn thành {workout} — cảm giác tràn đầy năng lượng cho cả ngày! Ai cùng tập buổi sáng không? 💪☀️',
      'Ngày {day} streak rồi, không dừng được nữa! Consistency is key 🔥 #HealthHub',
      'Vừa thử {workout} lần đầu, khó hơn tưởng nhiều nhưng mà ghiền rồi 😅💪',
      'Tip nhỏ: uống 500ml nước ngay khi thức dậy giúp mình tỉnh táo hơn hẳn. Ai thử chưa? 💧',
      'Hoàn thành thử thách {day} ngày tập liên tiếp! Cảm ơn cộng đồng HealthHub đã cổ vũ 🏆❤️',
      'Mood hôm nay 5/5 — tập xong, ăn ngon, ngủ sớm. Life is good 🌟',
      'Sau {day} ngày kiên trì, cơ thể mình thay đổi rõ rệt. Tin vào quá trình, đừng bỏ cuộc! ✨',
      'Rest day hôm nay nhưng vẫn đi bộ 8000 bước và thiền 15 phút. Recovery cũng là training 😄',
      'Bạn có biết không? Ngủ đủ 7–8 tiếng giúp giảm mỡ hiệu quả hơn cardio. Ưu tiên giấc ngủ! 🌙',
      'Tháng này tập được {day} buổi — personal record mới! Cảm ơn mọi người đã push mình 🎯',
      'Ai có tips ăn gì sau tập để phục hồi nhanh? Mình đang thử chuối + whey, thấy ổn 🥗',
      'Yoga buổi sáng 20 phút > cà phê về mặt tỉnh táo. Ai không tin thì thử đi 😂 #MorningRoutine',
      'Kỷ niệm 100 ngày dùng HealthHub — từ không biết squat là gì đến tập mỗi ngày 💯🎉',
      'Thử thách plank: ngày đầu 20 giây, hôm nay {day} phút. Tất cả nhờ kiên trì mỗi ngày! 💪',
      'Ghi nhận tâm trạng mỗi ngày thay đổi mindset của mình hoàn toàn. Recommend mọi người!',
      'Tuần này kết hợp {workout} với chạy bộ — cardio tăng rõ rệt sau 2 tuần 🏃‍♂️',
      'Ăn clean {day} ngày liên tiếp — da sáng hơn, bụng nhẹ hơn, ngủ ngon hơn. Không phải ngẫu nhiên đâu 🥦',
      'Bắt đầu theo dõi calories hôm nay — giật mình vì lâu nay ăn ít hơn mức cần thiết 😱',
      'Cuối tuần vẫn tập, vì kết quả không nghỉ cuối tuần. Stay disciplined! 💯',
      'Mất ngủ tối qua, sáng nay vẫn tập nhẹ 20 phút. Đừng để lý do thắng ý chí! 🌟',
      'Giảm được {day}kg sau 3 tháng — không diet cực đoan, chỉ cần kiên nhẫn và nhất quán 📉',
      'Bắt đầu tập thiền 10 phút mỗi ngày — stress giảm thấy rõ sau 2 tuần. Ai đang bị stress thì thử đi 🧘',
      'Không phải mọi ngày đều đỉnh — hôm nay tập dở nhưng quan trọng là không bỏ buổi 💪',
      'Chạy được 5km liên tục lần đầu trong đời — tim đập loạn mà vẫn tự hào cực 🏅',
      'Hydration check: uống đủ 2.5L hôm nay! Ai cũng nên track lượng nước nhé 💧',
      'Form {workout} của mình đã chuẩn hơn nhiều sau khi nhờ bạn quay lại xem. Video thật sự hữu ích 📱',
      'Tập gym buổi tối thích hơn buổi sáng — ít người, thoải mái hơn, tập lâu hơn 🌙',
      'Cảm giác sau khi hoàn thành {workout} dài {day} phút — endorphin rush có thật mọi người ơi! 🎉',
      'Mục tiêu tháng tới: tăng thêm 5kg tạ ở squat. Ai đang tập leg day cùng không? 🎯',
      'Vừa nhận huy hiệu mới trên HealthHub — nhỏ thôi nhưng có động lực hẳn! 🏆',
      'Lần đầu tham gia event chạy bộ cộng đồng — gặp bao nhiêu người hay ho 🤝🏃',
      'BMI về mức bình thường sau 2 tháng — không cần thuốc, chỉ cần tập đều + ăn đúng ❤️',
      'Chia sẻ lịch tập của mình: Thứ 2/4/6 {workout}, Thứ 3/5 cardio, Thứ 7 yoga, CN nghỉ. Ai copy thì tag mình 😄',
      'Protein sau tập: 2 quả trứng + 1 ly sữa + chuối. Đơn giản, rẻ, hiệu quả 🥚🍌',
      'Water break giữa buổi tập quan trọng lắm đó! Uống đủ nước = tập tốt hơn 💧💪',
    ];

    // ── Bài có 1 ảnh ─────────────────────────────────────────────────────────
    const PHOTO_POSTS: { content: string; img: string }[] = [
      {
        content: 'Buổi tập sáng nay nắng cực đẹp! Ai thích chạy ngoài trời như mình không? 🌞🏃',
        img: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=900&q=85',
      },
      {
        content: 'Check-in góc gym yêu thích — nơi mình nạp năng lượng mỗi sáng 💪🏋️',
        img: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=900&q=85',
      },
      {
        content: 'Meal prep Sunday xong rồi! Cả tuần ăn sạch, không lo nữa 🥦🍗 #MealPrep',
        img: 'https://images.unsplash.com/photo-1547592180-85f173990554?w=900&q=85',
      },
      {
        content: 'Yoga buổi tối giúp mình ngủ ngon hơn hẳn. Ai chưa thử thì thử ngay đi! 🧘‍♀️✨',
        img: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=900&q=85',
      },
      {
        content: 'Đồ gym packed xong rồi — let\'s go! Ngày mới energy mới 🎒🔥',
        img: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=900&q=85',
      },
      {
        content: 'Chạy bộ 10km hoàn thành! Mồ hôi nhiều nhưng tâm trạng cực đỉnh 🏅',
        img: 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=900&q=85',
      },
      {
        content: 'Protein shake sau tập không thể thiếu — whey + chuối + sữa hạnh nhân 🥤💪',
        img: 'https://images.unsplash.com/photo-1622484212851-421d82df9519?w=900&q=85',
      },
      {
        content: 'View từ đỉnh núi sau 2 tiếng leo — công sức xứng đáng! 🏔️🌅',
        img: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=900&q=85',
      },
      {
        content: 'Tập boxing lần đầu — vừa thở không ra vừa muốn đăng ký lớp tiếp theo ngay 🥊😂',
        img: 'https://images.unsplash.com/photo-1549719386-74dfcbf7dbed?w=900&q=85',
      },
      {
        content: 'Buổi chạy bộ sáng sớm khi thành phố còn ngủ — khoảnh khắc yêu thích nhất ngày 🌤️🏃',
        img: 'https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?w=900&q=85',
      },
      {
        content: 'Stretching sau tập không được bỏ! Ai hay bỏ qua bước này thì sẽ hối hận 🤸',
        img: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=900&q=85',
      },
      {
        content: 'Home gym setup mới — không cần ra ngoài vẫn tập đỉnh! 🏠💪 #HomeGym',
        img: 'https://images.unsplash.com/photo-1571902943202-507ec2618e8f?w=900&q=85',
      },
      {
        content: 'Salad bowl hôm nay: rau xanh + trứng + bơ + hạt + dầu olive. Ngon mà đủ chất 🥗',
        img: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=900&q=85',
      },
      {
        content: 'Spin class sáng nay mệt kinh khủng nhưng mồ hôi ra nhiều cảm giác đã lắm 🚴‍♀️🔥',
        img: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=900&q=85',
      },
      {
        content: 'Golden hour chạy bộ — kết thúc ngày với hoàng hôn và endorphin, không gì bằng 🌇🏃',
        img: 'https://images.unsplash.com/photo-1504593811423-6dd665756598?w=900&q=85',
      },
      {
        content: 'Deadlift PR mới hôm nay! Form chuẩn + tạ nặng = ngày thành công 🏋️‍♂️💥',
        img: 'https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?w=900&q=85',
      },
      {
        content: 'Healthy breakfast: acai bowl với granola và trái cây tươi — start the day right! 🫐🍓',
        img: 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=900&q=85',
      },
      {
        content: 'Pool workout hôm nay — bơi 30 phút nhẹ khớp mà đốt calo cực tốt 🏊',
        img: 'https://images.unsplash.com/photo-1530549387789-4c1017266635?w=900&q=85',
      },
      {
        content: 'Tập nhóm với bạn thân — vui + có người push = hiệu quả gấp đôi 👫💪',
        img: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=900&q=85',
      },
      {
        content: 'Chuỗi ngày tập luyện không nghỉ — mỗi ngày một chút, kết quả sẽ đến 🌟',
        img: 'https://images.unsplash.com/photo-1590487988256-9ed24133863e?w=900&q=85',
      },
      {
        content: 'After-workout selfie! Mệt mà vui — ai hiểu cảm giác này không? 😅🔥',
        img: 'https://images.unsplash.com/photo-1609899537878-4d47a4e29490?w=900&q=85',
      },
      {
        content: 'Buổi tập HIIT 20 phút — đốt nhiều calo hơn chạy bộ 1 tiếng. Hiệu quả không? Tuyệt đối! ⚡',
        img: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=900&q=85',
      },
      {
        content: 'Bữa sáng trước tập: yến mạch + chuối + mật ong. Đơn giản mà đủ năng lượng 🥣',
        img: 'https://images.unsplash.com/photo-1517093728432-a0440f8d45af?w=900&q=85',
      },
      {
        content: 'Tập plank mỗi ngày — core mạnh hơn, lưng đỡ đau hơn. Ai đang bị đau lưng thì thử 🧱',
        img: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=900&q=85',
      },
      {
        content: 'Squat challenge tuần này: 100 cái/ngày. Ngày 3 rồi, chân mỏi nhưng không dừng! 🦵🔥',
        img: 'https://images.unsplash.com/photo-1574680096145-d05b474e2155?w=900&q=85',
      },
    ];

    // ── Bài có 2–3 ảnh ────────────────────────────────────────────────────────
    const MULTI_PHOTO_POSTS: { content: string; imgs: string[] }[] = [
      {
        content: 'Before vs After 3 tháng — không filter, không chỉnh sửa. Chỉ cần tập đều và ăn đúng! 💪🔥',
        imgs: [
          'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=900&q=85',
          'https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?w=900&q=85',
        ],
      },
      {
        content: 'Weekend gym session + healthy meal prep = tuần mới đầy năng lượng! 🏋️🥗',
        imgs: [
          'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=900&q=85',
          'https://images.unsplash.com/photo-1547592180-85f173990554?w=900&q=85',
        ],
      },
      {
        content: 'Morning routine của mình: 6am yoga → 7am chạy bộ → 8am breakfast 🌅🧘🏃🥣',
        imgs: [
          'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=900&q=85',
          'https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?w=900&q=85',
          'https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=900&q=85',
        ],
      },
      {
        content: 'Team workout hôm nay 🤩 Cảm ơn các bạn đã tập cùng, vui hơn tập một mình nhiều!',
        imgs: [
          'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=900&q=85',
          'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=900&q=85',
        ],
      },
      {
        content: 'Bộ sưu tập đồ tập mới — mua rồi không có lý do để không tập 😂👟👕',
        imgs: [
          'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=900&q=85',
          'https://images.unsplash.com/photo-1591291621164-2c6367723315?w=900&q=85',
        ],
      },
      {
        content: 'Recap tháng 6: {day} buổi tập, 3 PR mới, -2kg. Tháng 7 phải xịn hơn! 📊💪',
        imgs: [
          'https://images.unsplash.com/photo-1590487988256-9ed24133863e?w=900&q=85',
          'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=900&q=85',
          'https://images.unsplash.com/photo-1504593811423-6dd665756598?w=900&q=85',
        ],
      },
    ];

    const WORKOUTS = ['Full Body', 'HIIT', 'Yoga', 'Plank', 'Calisthenics', 'Leg Day', 'Upper Body', 'Core', 'Cardio', 'Pilates'];
    const posts: any[] = [];

    for (const user of normalUsers) {
      const numPosts = rand(6, 14);
      for (let i = 0; i < numPosts; i++) {
        const roll = Math.random();
        const daysOffset = rand(0, 75);
        const likes = normalUsers
          .filter(() => Math.random() > 0.5)
          .map((u) => String(u.id));

        let content: string;
        let media: string[] = [];

        if (roll < 0.40) {
          // 40% — text only
          const tpl = pick(TEXT_ONLY);
          content = tpl
            .replace(/{workout}/g, pick(WORKOUTS))
            .replace(/{day}/g, String(rand(3, 30)));
        } else if (roll < 0.78) {
          // 38% — 1 ảnh
          const p = pick(PHOTO_POSTS);
          content = p.content.replace(/{day}/g, String(rand(3, 30)));
          media = [p.img];
        } else {
          // 22% — multi ảnh
          const p = pick(MULTI_PHOTO_POSTS);
          content = p.content
            .replace(/{workout}/g, pick(WORKOUTS))
            .replace(/{day}/g, String(rand(10, 28)));
          media = p.imgs;
        }

        posts.push({
          userId: String(user.id),
          user: { name: user.fullName, avatar: '' },
          content,
          media,
          likeCount: likes.length,
          likes,
          commentCount: rand(0, 20),
          status: 'approved',
          isHidden: false,
          createdAt: daysAgo(daysOffset, rand(6, 22)),
        });
      }
    }

    await this.postModel.insertMany(posts);
    this.logger.log(`Posts: seeded ${posts.length} records`);
  }

  // ─── FRIENDS (quan hệ bạn bè 2 chiều) ────────────────────────────────────────

  private async seedFriends(users: User[]) {
    const existing = await this.friendRepo.count();
    if (existing > 0) { this.logger.log('Friends: already seeded — skip'); return; }

    const normalUsers = users.filter((u) => u.role === UserRole.USER);
    // Demo users là 5 user đầu (user1..user5)
    const demoUsers = normalUsers.filter((u) =>
      ['user1','user2','user3','user4','user5'].includes(u.username),
    );
    const otherUsers = normalUsers.filter((u) =>
      !['user1','user2','user3','user4','user5'].includes(u.username),
    );

    // Cặp bạn bè cố định giữa 5 demo users (đầy đủ để test chat, feed)
    const DEMO_PAIRS: [string, string][] = [
      ['user1','user2'], ['user1','user3'], ['user1','user4'], ['user1','user5'],
      ['user2','user3'], ['user2','user4'], ['user2','user5'],
      ['user3','user4'], ['user3','user5'],
      ['user4','user5'],
    ];

    const rows: any[] = [];
    const addPair = (a: User, b: User) => {
      rows.push({ userId: a.id, friendId: b.id });
      rows.push({ userId: b.id, friendId: a.id });
    };

    const findUser = (username: string) => demoUsers.find((u) => u.username === username);
    for (const [ua, ub] of DEMO_PAIRS) {
      const a = findUser(ua);
      const b = findUser(ub);
      if (a && b) addPair(a, b);
    }

    // Mỗi demo user kết bạn thêm 3–5 user trong nhóm other
    for (const demo of demoUsers) {
      const shuffled = [...otherUsers].sort(() => Math.random() - 0.5).slice(0, rand(3, 5));
      for (const other of shuffled) addPair(demo, other);
    }

    // Các user thường cũng có bạn bè với nhau (3–6 cặp ngẫu nhiên)
    const usedPairs = new Set<string>();
    for (const u of otherUsers) {
      const targets = [...otherUsers].sort(() => Math.random() - 0.5).slice(0, rand(2, 5));
      for (const t of targets) {
        if (t.id === u.id) continue;
        const key = [Math.min(u.id, t.id), Math.max(u.id, t.id)].join('-');
        if (usedPairs.has(key)) continue;
        usedPairs.add(key);
        addPair(u, t);
      }
    }

    for (const r of rows) {
      await this.friendRepo.createQueryBuilder()
        .insert().into('friends')
        .values(r)
        .orIgnore()
        .execute();
    }
    this.logger.log(`Friends: seeded ${rows.length / 2} pairs (${rows.length} rows)`);
  }

  // ─── FRIEND REQUESTS (lời mời kết bạn pending để test) ──────────────────────

  private async seedFriendRequests(users: User[]) {
    const existing = await this.friendRequestRepo.count();
    if (existing > 0) { this.logger.log('FriendRequests: already seeded — skip'); return; }

    const normalUsers = users.filter((u) => u.role === UserRole.USER);
    const demoUsers   = normalUsers.filter((u) =>
      ['user1','user2','user3','user4','user5'].includes(u.username),
    );
    const otherUsers  = normalUsers.filter((u) =>
      !['user1','user2','user3','user4','user5'].includes(u.username),
    );

    const rows: any[] = [];

    // Mỗi demo user nhận 2–3 lời mời pending từ các user thường
    for (const demo of demoUsers) {
      const senders = [...otherUsers].sort(() => Math.random() - 0.5).slice(0, rand(2, 3));
      for (const sender of senders) {
        rows.push({ fromUserId: sender.id, toUserId: demo.id, status: 'pending' });
      }
    }

    // user1 gửi lời mời đến 2 user thường chưa là bạn
    const u1 = normalUsers.find((u) => u.username === 'user1');
    if (u1) {
      const targets = [...otherUsers].sort(() => Math.random() - 0.5).slice(0, 2);
      for (const t of targets) {
        rows.push({ fromUserId: u1.id, toUserId: t.id, status: 'pending' });
      }
    }

    for (const r of rows) {
      await this.friendRequestRepo.createQueryBuilder()
        .insert().into('friend_request')
        .values(r)
        .orIgnore()
        .execute();
    }
    this.logger.log(`FriendRequests: seeded ${rows.length} pending requests`);
  }

  // ─── CHAT ROOMS + MESSAGES (MongoDB) ─────────────────────────────────────────

  private async seedChatRooms(users: User[]) {
    const existing = await this.chatRoomModel.countDocuments();
    if (existing > 0) { this.logger.log('ChatRooms: already seeded — skip'); return; }

    const normalUsers = users.filter((u) => u.role === UserRole.USER);
    const demoUsers   = normalUsers.filter((u) =>
      ['user1','user2','user3','user4','user5'].includes(u.username),
    );
    const otherUsers  = normalUsers.filter((u) =>
      !['user1','user2','user3','user4','user5'].includes(u.username),
    );

    const MESSAGES_POOL = [
      'Hôm nay bạn có tập không?', 'Mình vừa hoàn thành buổi HIIT 30 phút xong! 💪',
      'Bạn có tips nào để tập plank lâu hơn không?', 'Streak 7 ngày rồi, không dừng được 🔥',
      'Sáng nay dậy sớm chạy 5km, cảm giác tuyệt lắm', 'Ai muốn thách nhau challenge không?',
      'Hôm nay rest day — nhưng vẫn đi bộ 10k bước 😄', 'Cơ bụng của mình đang tiến bộ hơn nhiều rồi!',
      'Mình vừa đạt level 10, vui quá!', 'Cùng nhau hoàn thành thử thách 30 ngày nhé?',
      'Bạn dùng app theo dõi calories không?', 'Chế độ ăn của bạn như thế nào?',
      'Mình mới bắt đầu tập yoga, có kinh nghiệm gì chia sẻ không?',
      'Buổi tối đi bộ hay tập gym tốt hơn nhỉ?', 'Uống protein shake sau tập có cần thiết không?',
      'Mình vừa leo lên level mới, cảm giác amazing!', 'Cùng nhau check-in sáng mai nha! 🌅',
      'Achievement mới unlock rồi, quá đã 🏆', 'Bạn tập bài nào hiệu quả nhất vậy?',
      'Hôm nay tâm trạng 5 sao vì tập xong thấy khỏe lắm!',
    ];

    const rooms: any[] = [];
    const msgsByRoom: { participants: string[]; msgs: any[] }[] = [];

    const idStr = (u: User) => String(u.id);

    // Chat giữa tất cả các cặp demo users (10 phòng)
    for (let i = 0; i < demoUsers.length; i++) {
      for (let j = i + 1; j < demoUsers.length; j++) {
        const a = demoUsers[i];
        const b = demoUsers[j];
        const lastMsg = pick(MESSAGES_POOL);
        const lastAt  = daysAgo(rand(0, 7), rand(8, 22));
        rooms.push({ participants: [idStr(a), idStr(b)], lastMessage: lastMsg, lastMessageAt: lastAt });
        const numMsgs = rand(5, 15);
        const msgs: any[] = [];
        for (let k = 0; k < numMsgs; k++) {
          const sender = k % 2 === 0 ? a : b;
          msgs.push({ senderId: idStr(sender), text: pick(MESSAGES_POOL), readBy: [idStr(a), idStr(b)], createdAt: daysAgo(rand(0, 7), rand(8, 22)) });
        }
        msgsByRoom.push({ participants: [idStr(a), idStr(b)], msgs });
      }
    }

    // Mỗi demo user cũng có 2–3 phòng chat với user thường
    for (const demo of demoUsers) {
      const targets = [...otherUsers].sort(() => Math.random() - 0.5).slice(0, rand(2, 3));
      for (const other of targets) {
        const lastMsg = pick(MESSAGES_POOL);
        const lastAt  = daysAgo(rand(0, 14), rand(8, 22));
        rooms.push({ participants: [idStr(demo), idStr(other)], lastMessage: lastMsg, lastMessageAt: lastAt });
        const numMsgs = rand(3, 8);
        const msgs: any[] = [];
        for (let k = 0; k < numMsgs; k++) {
          const sender = k % 2 === 0 ? demo : other;
          msgs.push({ senderId: idStr(sender), text: pick(MESSAGES_POOL), readBy: [idStr(demo), idStr(other)], createdAt: daysAgo(rand(0, 14), rand(8, 22)) });
        }
        msgsByRoom.push({ participants: [idStr(demo), idStr(other)], msgs });
      }
    }

    const savedRooms = await this.chatRoomModel.insertMany(rooms);

    // Insert messages với roomId tương ứng
    let totalMsgs = 0;
    for (let i = 0; i < savedRooms.length; i++) {
      const roomId = String((savedRooms[i] as any)._id);
      const msgGroup = msgsByRoom[i];
      if (!msgGroup) continue;
      const msgsWithRoom = msgGroup.msgs.map((m) => ({ ...m, roomId }));
      await this.chatMessageModel.insertMany(msgsWithRoom);
      totalMsgs += msgsWithRoom.length;
    }

    this.logger.log(`ChatRooms: seeded ${savedRooms.length} rooms, ${totalMsgs} messages`);
  }
}

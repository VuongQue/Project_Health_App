/**
 * Standalone seeder — thêm 8 MOOD workouts mới vào DB.
 * Chạy: npx ts-node -r tsconfig-paths/register src/database/mood-workout.seeder.ts
 *
 * Script tự động skip workout nếu title đã tồn tại.
 */

import 'reflect-metadata';
import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import { Workout } from '../modules/fitness/entities/workout.entity';
import { WorkoutExercise } from '../modules/fitness/entities/workout-exercise.entity';
import { EXERCISE_GIF_MAP } from './exercise-gif.map';

dotenv.config();

const AppDataSource = new DataSource({
  type: 'mysql',
  host:     process.env.DB_HOST     || 'localhost',
  port:     Number(process.env.DB_PORT) || 3306,
  username: process.env.DB_USERNAME || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME     || 'healthhub',
  entities: [Workout, WorkoutExercise],
  synchronize: false,
});

type ExDef = { name: string; reps?: number; durationSec?: number; sets?: number; restSec?: number };
type WorkoutDef = {
  title: string; level: string; muscleGroup: string; kcalPerMin: number;
  category: 'MOOD'; focusType: string; moodTargets: number[];
  description: string; exercises: ExDef[];
};

const NEW_MOOD_WORKOUTS: WorkoutDef[] = [
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

  // ─── 10 MOOD WORKOUTS BỔ SUNG ────────────────────────────────────────────────

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
      { name: 'Belly Breathing',         sets: 1, durationSec: 90,  restSec: 10 },
      { name: 'Self-Compassion Break',   sets: 2, durationSec: 90,  restSec: 15 },
      { name: 'Emotional Labelling',     sets: 1, durationSec: 60,  restSec: 10 },
      { name: 'Loving Kindness Meditation', sets: 1, durationSec: 120, restSec: 10 },
      { name: 'Gratitude Reflection',    sets: 1, durationSec: 90,  restSec: 10 },
      { name: 'Journaling Prompt',       sets: 1, durationSec: 120, restSec: 0  },
    ],
  },
  {
    title: 'Morning Sun Salutation',
    level: 'beginner', muscleGroup: 'full_body', kcalPerMin: 4,
    category: 'MOOD', moodTargets: [2, 3, 4, 5], focusType: 'RELAX',
    description: 'Chào mặt trời buổi sáng — luồng yoga cổ điển đánh thức toàn bộ cơ thể và tâm trí',
    exercises: [
      { name: 'Belly Breathing',   sets: 1, durationSec: 60,  restSec: 10 },
      { name: 'Sun Salutation A',  sets: 3, durationSec: 90,  restSec: 20 },
      { name: 'Warrior I',         sets: 2, durationSec: 45,  restSec: 15 },
      { name: 'Warrior II',        sets: 2, durationSec: 45,  restSec: 15 },
      { name: 'Triangle Pose',     sets: 2, durationSec: 40,  restSec: 15 },
      { name: 'Cobra Pose',        sets: 2, durationSec: 40,  restSec: 15 },
      { name: 'Restorative Savasana', sets: 1, durationSec: 120, restSec: 0 },
    ],
  },
  {
    title: 'Yin Deep Release',
    level: 'beginner', muscleGroup: 'full_body', kcalPerMin: 2,
    category: 'MOOD', moodTargets: [1, 2, 3], focusType: 'RELAX',
    description: 'Yin yoga giữ sâu — giải phóng căng thẳng tích tụ trong cân cơ và các khớp sâu',
    exercises: [
      { name: 'Yin Hip Opener',        sets: 2, durationSec: 180, restSec: 15 },
      { name: 'Pigeon Pose',           sets: 2, durationSec: 180, restSec: 15 },
      { name: 'Supine Spinal Twist',   sets: 2, durationSec: 120, restSec: 10 },
      { name: 'Lizard Stretch',        sets: 2, durationSec: 120, restSec: 10 },
      { name: 'Eye of the Needle',     sets: 2, durationSec: 120, restSec: 10 },
      { name: 'Restorative Savasana',  sets: 1, durationSec: 180, restSec: 0  },
    ],
  },
  {
    title: 'Qigong Energy Flow',
    level: 'beginner', muscleGroup: 'full_body', kcalPerMin: 3,
    category: 'MOOD', moodTargets: [2, 3, 4], focusType: 'MINDFULNESS',
    description: 'Khí công cổ truyền — kết hợp chuyển động chậm, hơi thở và ý niệm để lưu thông năng lượng',
    exercises: [
      { name: 'Belly Breathing',  sets: 1, durationSec: 60,  restSec: 10 },
      { name: 'Qigong Flow',      sets: 1, durationSec: 240, restSec: 20 },
      { name: 'Hip Circle',       sets: 2, durationSec: 60,  restSec: 10 },
      { name: 'Spinal Wave',      sets: 2, durationSec: 60,  restSec: 10 },
      { name: 'Shoulder Rolls',   sets: 2, durationSec: 30,  restSec: 10 },
      { name: 'Seated Meditation',sets: 1, durationSec: 120, restSec: 0  },
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
      { name: 'Belly Breathing',   sets: 1, durationSec: 60,  restSec: 10 },
      { name: 'Tai Chi Basic Form',sets: 1, durationSec: 300, restSec: 20 },
      { name: 'Shoulder Rolls',    sets: 2, durationSec: 30,  restSec: 10 },
      { name: 'Hip Circle',        sets: 2, durationSec: 45,  restSec: 10 },
      { name: 'Tree Pose',         sets: 2, durationSec: 45,  restSec: 10 },
      { name: 'Seated Meditation', sets: 1, durationSec: 120, restSec: 0  },
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
      { name: '4-7-8 Breathing',        sets: 2, durationSec: 90,  restSec: 15 },
      { name: 'Seated Forward Fold',    sets: 1, durationSec: 90,  restSec: 10 },
      { name: 'Bridge Pose',            sets: 2, durationSec: 60,  restSec: 15 },
      { name: 'Supine Spinal Twist',    sets: 2, durationSec: 75,  restSec: 10 },
      { name: 'Happy Baby Pose',        sets: 1, durationSec: 90,  restSec: 10 },
      { name: 'Legs Up The Wall',       sets: 1, durationSec: 180, restSec: 10 },
      { name: 'Restorative Savasana',   sets: 1, durationSec: 180, restSec: 0  },
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

async function run() {
  await AppDataSource.initialize();
  const workoutRepo  = AppDataSource.getRepository(Workout);
  const exerciseRepo = AppDataSource.getRepository(WorkoutExercise);

  let added = 0;
  let skipped = 0;

  for (const { exercises: exList, ...planData } of NEW_MOOD_WORKOUTS) {
    const existing = await workoutRepo.findOne({ where: { title: planData.title } });
    if (existing) {
      console.log(`[skip] ${planData.title}`);
      skipped++;
      continue;
    }

    const workout = await workoutRepo.save(workoutRepo.create(planData as any)) as unknown as Workout;

    const entities = exList.map((ex, i) => {
      const meta = EXERCISE_GIF_MAP[ex.name] ?? {};
      const e = new WorkoutExercise();
      e.name        = ex.name;
      e.reps        = ex.reps        ?? null;
      e.durationSec = ex.durationSec ?? null;
      e.sets        = ex.sets        ?? null;
      e.restSec     = ex.restSec     ?? null;
      e.gifUrl      = meta.gifUrl    ?? null;
      e.description = meta.description ?? null;
      e.orderIndex  = i;
      e.workout     = workout;
      return e;
    });

    await exerciseRepo.save(entities);
    console.log(`[added] ${planData.title} (${exList.length} exercises)`);
    added++;
  }

  await AppDataSource.destroy();
  console.log(`\nDone: ${added} added, ${skipped} skipped.`);
}

run().catch((err) => { console.error(err); process.exit(1); });

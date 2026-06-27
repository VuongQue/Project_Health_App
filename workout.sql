USE healthhub;

-- =========================
-- RESET DATA
-- =========================
SET FOREIGN_KEY_CHECKS = 0;
TRUNCATE TABLE workout_exercises;
TRUNCATE TABLE workouts;
SET FOREIGN_KEY_CHECKS = 1;

-- =========================
-- INSERT WORKOUTS
-- =========================
INSERT INTO workouts
(title, level, muscleGroup, videoUrl, kcalPerMin, description, category, moodTargets, focusType, createdAt)
VALUES
-- ===== FITNESS (20) =====
('Full Body Beginner', 'Beginner', 'Full Body', NULL, 6, 'Toàn thân cho người mới', 'FITNESS', '3,4,5', 'STRENGTH', NOW()),
('Upper Body Strength', 'Intermediate', 'Upper', NULL, 8, 'Tăng sức mạnh thân trên', 'FITNESS', '4,5', 'STRENGTH', NOW()),
('Lower Body Burn', 'Intermediate', 'Legs', NULL, 9, 'Đốt mỡ chân', 'FITNESS', '4,5', 'STRENGTH', NOW()),
('Core Stability', 'Beginner', 'Core', NULL, 5, 'Ổn định core', 'FITNESS', '3,4', 'STRENGTH', NOW()),
('HIIT 15 Minutes', 'Advanced', 'Cardio', NULL, 12, 'HIIT 15 phút', 'FITNESS', '5', 'CARDIO', NOW()),
('Cardio Burn', 'Beginner', 'Cardio', NULL, 7, 'Cardio nhẹ', 'FITNESS', '3,4,5', 'CARDIO', NOW()),
('Chest Builder', 'Intermediate', 'Chest', NULL, 8, 'Tập ngực', 'FITNESS', '4,5', 'STRENGTH', NOW()),
('Back Strength', 'Intermediate', 'Back', NULL, 8, 'Tập lưng', 'FITNESS', '4,5', 'STRENGTH', NOW()),
('Leg Day Intense', 'Advanced', 'Legs', NULL, 11, 'Ngày tập chân', 'FITNESS', '5', 'STRENGTH', NOW()),
('Quick Cardio', 'Beginner', 'Cardio', NULL, 6, 'Cardio nhanh', 'FITNESS', '3,4', 'CARDIO', NOW()),
('Full Body Burn', 'Intermediate', 'Full Body', NULL, 9, 'Đốt mỡ toàn thân', 'FITNESS', '4,5', 'CARDIO', NOW()),
('Strength Circuit', 'Advanced', 'Full Body', NULL, 10, 'Circuit sức mạnh', 'FITNESS', '5', 'STRENGTH', NOW()),
('Upper Body Tone', 'Beginner', 'Upper', NULL, 6, 'Săn chắc thân trên', 'FITNESS', '3,4', 'STRENGTH', NOW()),
('Lower Body Shape', 'Beginner', 'Legs', NULL, 6, 'Tạo form chân', 'FITNESS', '3,4', 'STRENGTH', NOW()),
('Endurance Cardio', 'Intermediate', 'Cardio', NULL, 9, 'Cardio sức bền', 'FITNESS', '4,5', 'CARDIO', NOW()),
('Power Workout', 'Advanced', 'Full Body', NULL, 12, 'Sức mạnh toàn thân', 'FITNESS', '5', 'STRENGTH', NOW()),
('Core Burn', 'Intermediate', 'Core', NULL, 7, 'Đốt mỡ bụng', 'FITNESS', '4,5', 'STRENGTH', NOW()),
('Morning Energy', 'Beginner', 'Full Body', NULL, 6, 'Năng lượng buổi sáng', 'FITNESS', '3,4', 'CARDIO', NOW()),
('Fat Burn Express', 'Intermediate', 'Cardio', NULL, 10, 'Đốt mỡ nhanh', 'FITNESS', '4,5', 'CARDIO', NOW()),
('Athlete Challenge', 'Advanced', 'Full Body', NULL, 13, 'Thử thách nâng cao', 'FITNESS', '5', 'STRENGTH', NOW()),

-- ===== MOOD (10) =====
('Breathing 4-7-8', 'Beginner', 'Mind', NULL, 1, 'Bài thở giảm stress', 'MOOD', '1,2', 'BREATHING', NOW()),
('Mindful Stretch 10 min', 'Beginner', 'Relax', NULL, 2, 'Stretch thư giãn', 'MOOD', '1,2,3', 'RELAX', NOW()),
('Calm Yoga Flow', 'Beginner', 'Relax', NULL, 3, 'Yoga nhẹ', 'MOOD', '2,3', 'MINDFULNESS', NOW()),
('Stress Release', 'Beginner', 'Mind', NULL, 2, 'Giải phóng stress', 'MOOD', '1,2', 'RELAX', NOW()),
('Evening Relaxation', 'Beginner', 'Relax', NULL, 1, 'Thư giãn buổi tối', 'MOOD', '1,2', 'RELAX', NOW()),
('Mood Balance', 'Beginner', 'Mind', NULL, 2, 'Cân bằng cảm xúc', 'MOOD', '2,3', 'MINDFULNESS', NOW()),
('Positive Energy Flow', 'Beginner', 'Mind', NULL, 3, 'Năng lượng tích cực', 'MOOD', '3,4', 'MINDFULNESS', NOW()),
('Light Yoga for Mood', 'Beginner', 'Relax', NULL, 3, 'Yoga cải thiện mood', 'MOOD', '2,3,4', 'RELAX', NOW()),
('Focus & Breath', 'Beginner', 'Mind', NULL, 2, 'Tập trung hơi thở', 'MOOD', '2,3', 'BREATHING', NOW()),
('Gratitude Session', 'Beginner', 'Mind', NULL, 1, 'Biết ơn', 'MOOD', '3,4', 'MINDFULNESS', NOW());

-- =========================
-- INSERT WORKOUT EXERCISES
-- =========================

-- Full Body Beginner
INSERT INTO workout_exercises (workoutId, name, durationSec, reps, orderIndex)
SELECT id, 'Jumping Jacks', 30, NULL, 0 FROM workouts WHERE title='Full Body Beginner';
INSERT INTO workout_exercises (workoutId, name, durationSec, reps, orderIndex)
SELECT id, 'Bodyweight Squat', NULL, 12, 1 FROM workouts WHERE title='Full Body Beginner';
INSERT INTO workout_exercises (workoutId, name, durationSec, reps, orderIndex)
SELECT id, 'Push-up (Knees)', NULL, 8, 2 FROM workouts WHERE title='Full Body Beginner';
INSERT INTO workout_exercises (workoutId, name, durationSec, reps, orderIndex)
SELECT id, 'Plank', 20, NULL, 3 FROM workouts WHERE title='Full Body Beginner';

-- Upper Body Strength
INSERT INTO workout_exercises (workoutId, name, durationSec, reps, orderIndex)
SELECT id, 'Push-up', NULL, 12, 0 FROM workouts WHERE title='Upper Body Strength';
INSERT INTO workout_exercises (workoutId, name, durationSec, reps, orderIndex)
SELECT id, 'Shoulder Tap', NULL, 16, 1 FROM workouts WHERE title='Upper Body Strength';
INSERT INTO workout_exercises (workoutId, name, durationSec, reps, orderIndex)
SELECT id, 'Plank Hold', 30, NULL, 2 FROM workouts WHERE title='Upper Body Strength';

-- Lower Body Burn
INSERT INTO workout_exercises (workoutId, name, durationSec, reps, orderIndex)
SELECT id, 'Squat', NULL, 15, 0 FROM workouts WHERE title='Lower Body Burn';
INSERT INTO workout_exercises (workoutId, name, durationSec, reps, orderIndex)
SELECT id, 'Lunges', NULL, 10, 1 FROM workouts WHERE title='Lower Body Burn';
INSERT INTO workout_exercises (workoutId, name, durationSec, reps, orderIndex)
SELECT id, 'Wall Sit', 30, NULL, 2 FROM workouts WHERE title='Lower Body Burn';

-- Core Stability
INSERT INTO workout_exercises (workoutId, name, durationSec, reps, orderIndex)
SELECT id, 'Crunch', NULL, 15, 0 FROM workouts WHERE title='Core Stability';
INSERT INTO workout_exercises (workoutId, name, durationSec, reps, orderIndex)
SELECT id, 'Leg Raise', NULL, 10, 1 FROM workouts WHERE title='Core Stability';
INSERT INTO workout_exercises (workoutId, name, durationSec, reps, orderIndex)
SELECT id, 'Plank', 40, NULL, 2 FROM workouts WHERE title='Core Stability';

-- HIIT 15 Minutes
INSERT INTO workout_exercises (workoutId, name, durationSec, reps, orderIndex)
SELECT id, 'High Knees', 30, NULL, 0 FROM workouts WHERE title='HIIT 15 Minutes';
INSERT INTO workout_exercises (workoutId, name, durationSec, reps, orderIndex)
SELECT id, 'Burpees', NULL, 10, 1 FROM workouts WHERE title='HIIT 15 Minutes';
INSERT INTO workout_exercises (workoutId, name, durationSec, reps, orderIndex)
SELECT id, 'Mountain Climbers', 30, NULL, 2 FROM workouts WHERE title='HIIT 15 Minutes';

-- Cardio Burn
INSERT INTO workout_exercises (workoutId, name, durationSec, reps, orderIndex)
SELECT id, 'Jump Rope', 40, NULL, 0 FROM workouts WHERE title='Cardio Burn';
INSERT INTO workout_exercises (workoutId, name, durationSec, reps, orderIndex)
SELECT id, 'Jog in Place', 60, NULL, 1 FROM workouts WHERE title='Cardio Burn';

-- Chest Builder
INSERT INTO workout_exercises (workoutId, name, durationSec, reps, orderIndex)
SELECT id, 'Push-up', NULL, 15, 0 FROM workouts WHERE title='Chest Builder';
INSERT INTO workout_exercises (workoutId, name, durationSec, reps, orderIndex)
SELECT id, 'Wide Push-up', NULL, 10, 1 FROM workouts WHERE title='Chest Builder';

-- Back Strength
INSERT INTO workout_exercises (workoutId, name, durationSec, reps, orderIndex)
SELECT id, 'Superman Hold', 30, NULL, 0 FROM workouts WHERE title='Back Strength';
INSERT INTO workout_exercises (workoutId, name, durationSec, reps, orderIndex)
SELECT id, 'Reverse Snow Angel', NULL, 12, 1 FROM workouts WHERE title='Back Strength';

-- Leg Day Intense
INSERT INTO workout_exercises (workoutId, name, durationSec, reps, orderIndex)
SELECT id, 'Jump Squat', NULL, 15, 0 FROM workouts WHERE title='Leg Day Intense';
INSERT INTO workout_exercises (workoutId, name, durationSec, reps, orderIndex)
SELECT id, 'Lunges', NULL, 12, 1 FROM workouts WHERE title='Leg Day Intense';
INSERT INTO workout_exercises (workoutId, name, durationSec, reps, orderIndex)
SELECT id, 'Wall Sit', 45, NULL, 2 FROM workouts WHERE title='Leg Day Intense';

-- Quick Cardio
INSERT INTO workout_exercises (workoutId, name, durationSec, reps, orderIndex)
SELECT id, 'Jumping Jacks', 45, NULL, 0 FROM workouts WHERE title='Quick Cardio';
INSERT INTO workout_exercises (workoutId, name, durationSec, reps, orderIndex)
SELECT id, 'Fast Feet', 30, NULL, 1 FROM workouts WHERE title='Quick Cardio';

-- Full Body Burn
INSERT INTO workout_exercises (workoutId, name, durationSec, reps, orderIndex)
SELECT id, 'Burpees', NULL, 12, 0 FROM workouts WHERE title='Full Body Burn';
INSERT INTO workout_exercises (workoutId, name, durationSec, reps, orderIndex)
SELECT id, 'Push-up', NULL, 10, 1 FROM workouts WHERE title='Full Body Burn';
INSERT INTO workout_exercises (workoutId, name, durationSec, reps, orderIndex)
SELECT id, 'Plank', 30, NULL, 2 FROM workouts WHERE title='Full Body Burn';

-- Strength Circuit
INSERT INTO workout_exercises (workoutId, name, durationSec, reps, orderIndex)
SELECT id, 'Squat', NULL, 15, 0 FROM workouts WHERE title='Strength Circuit';
INSERT INTO workout_exercises (workoutId, name, durationSec, reps, orderIndex)
SELECT id, 'Push-up', NULL, 12, 1 FROM workouts WHERE title='Strength Circuit';
INSERT INTO workout_exercises (workoutId, name, durationSec, reps, orderIndex)
SELECT id, 'Plank', 40, NULL, 2 FROM workouts WHERE title='Strength Circuit';

-- Upper Body Tone
INSERT INTO workout_exercises (workoutId, name, durationSec, reps, orderIndex)
SELECT id, 'Wall Push-up', NULL, 15, 0 FROM workouts WHERE title='Upper Body Tone';
INSERT INTO workout_exercises (workoutId, name, durationSec, reps, orderIndex)
SELECT id, 'Arm Circles', 30, NULL, 1 FROM workouts WHERE title='Upper Body Tone';

-- Lower Body Shape
INSERT INTO workout_exercises (workoutId, name, durationSec, reps, orderIndex)
SELECT id, 'Glute Bridge', NULL, 15, 0 FROM workouts WHERE title='Lower Body Shape';
INSERT INTO workout_exercises (workoutId, name, durationSec, reps, orderIndex)
SELECT id, 'Side Leg Raise', NULL, 12, 1 FROM workouts WHERE title='Lower Body Shape';

-- Endurance Cardio
INSERT INTO workout_exercises (workoutId, name, durationSec, reps, orderIndex)
SELECT id, 'Jog in Place', 90, NULL, 0 FROM workouts WHERE title='Endurance Cardio';
INSERT INTO workout_exercises (workoutId, name, durationSec, reps, orderIndex)
SELECT id, 'High Knees', 45, NULL, 1 FROM workouts WHERE title='Endurance Cardio';

-- Power Workout
INSERT INTO workout_exercises (workoutId, name, durationSec, reps, orderIndex)
SELECT id, 'Burpees', NULL, 15, 0 FROM workouts WHERE title='Power Workout';
INSERT INTO workout_exercises (workoutId, name, durationSec, reps, orderIndex)
SELECT id, 'Jump Squat', NULL, 15, 1 FROM workouts WHERE title='Power Workout';

-- Core Burn
INSERT INTO workout_exercises (workoutId, name, durationSec, reps, orderIndex)
SELECT id, 'Bicycle Crunch', NULL, 20, 0 FROM workouts WHERE title='Core Burn';
INSERT INTO workout_exercises (workoutId, name, durationSec, reps, orderIndex)
SELECT id, 'Plank', 45, NULL, 1 FROM workouts WHERE title='Core Burn';

-- Morning Energy
INSERT INTO workout_exercises (workoutId, name, durationSec, reps, orderIndex)
SELECT id, 'Arm Swings', 30, NULL, 0 FROM workouts WHERE title='Morning Energy';
INSERT INTO workout_exercises (workoutId, name, durationSec, reps, orderIndex)
SELECT id, 'Jumping Jacks', 45, NULL, 1 FROM workouts WHERE title='Morning Energy';

-- Fat Burn Express
INSERT INTO workout_exercises (workoutId, name, durationSec, reps, orderIndex)
SELECT id, 'Mountain Climbers', 45, NULL, 0 FROM workouts WHERE title='Fat Burn Express';
INSERT INTO workout_exercises (workoutId, name, durationSec, reps, orderIndex)
SELECT id, 'Burpees', NULL, 10, 1 FROM workouts WHERE title='Fat Burn Express';

-- Athlete Challenge
INSERT INTO workout_exercises (workoutId, name, durationSec, reps, orderIndex)
SELECT id, 'Burpees', NULL, 20, 0 FROM workouts WHERE title='Athlete Challenge';
INSERT INTO workout_exercises (workoutId, name, durationSec, reps, orderIndex)
SELECT id, 'Plank Hold', 60, NULL, 1 FROM workouts WHERE title='Athlete Challenge';

-- ===== MOOD WORKOUTS =====

-- Breathing 4-7-8
INSERT INTO workout_exercises (workoutId, name, durationSec, reps, orderIndex)
SELECT id, 'Inhale (4s)', 4, NULL, 0 FROM workouts WHERE title='Breathing 4-7-8';
INSERT INTO workout_exercises (workoutId, name, durationSec, reps, orderIndex)
SELECT id, 'Hold Breath (7s)', 7, NULL, 1 FROM workouts WHERE title='Breathing 4-7-8';
INSERT INTO workout_exercises (workoutId, name, durationSec, reps, orderIndex)
SELECT id, 'Exhale (8s)', 8, NULL, 2 FROM workouts WHERE title='Breathing 4-7-8';

-- Mindful Stretch 10 min
INSERT INTO workout_exercises (workoutId, name, durationSec, reps, orderIndex)
SELECT id, 'Neck Stretch', 30, NULL, 0 FROM workouts WHERE title='Mindful Stretch 10 min';
INSERT INTO workout_exercises (workoutId, name, durationSec, reps, orderIndex)
SELECT id, 'Shoulder Stretch', 30, NULL, 1 FROM workouts WHERE title='Mindful Stretch 10 min';
INSERT INTO workout_exercises (workoutId, name, durationSec, reps, orderIndex)
SELECT id, 'Forward Fold', 45, NULL, 2 FROM workouts WHERE title='Mindful Stretch 10 min';

-- Calm Yoga Flow
INSERT INTO workout_exercises (workoutId, name, durationSec, reps, orderIndex)
SELECT id, 'Child Pose', 60, NULL, 0 FROM workouts WHERE title='Calm Yoga Flow';
INSERT INTO workout_exercises (workoutId, name, durationSec, reps, orderIndex)
SELECT id, 'Cat-Cow', 45, NULL, 1 FROM workouts WHERE title='Calm Yoga Flow';

-- Stress Release
INSERT INTO workout_exercises (workoutId, name, durationSec, reps, orderIndex)
SELECT id, 'Deep Breathing', 60, NULL, 0 FROM workouts WHERE title='Stress Release';
INSERT INTO workout_exercises (workoutId, name, durationSec, reps, orderIndex)
SELECT id, 'Seated Twist', 45, NULL, 1 FROM workouts WHERE title='Stress Release';

-- Evening Relaxation
INSERT INTO workout_exercises (workoutId, name, durationSec, reps, orderIndex)
SELECT id, 'Legs Up The Wall', 90, NULL, 0 FROM workouts WHERE title='Evening Relaxation';
INSERT INTO workout_exercises (workoutId, name, durationSec, reps, orderIndex)
SELECT id, 'Slow Breathing', 60, NULL, 1 FROM workouts WHERE title='Evening Relaxation';

-- Mood Balance
INSERT INTO workout_exercises (workoutId, name, durationSec, reps, orderIndex)
SELECT id, 'Box Breathing', 60, NULL, 0 FROM workouts WHERE title='Mood Balance';
INSERT INTO workout_exercises (workoutId, name, durationSec, reps, orderIndex)
SELECT id, 'Gentle Neck Roll', 30, NULL, 1 FROM workouts WHERE title='Mood Balance';

-- Positive Energy Flow
INSERT INTO workout_exercises (workoutId, name, durationSec, reps, orderIndex)
SELECT id, 'Sun Salutation (Slow)', 90, NULL, 0 FROM workouts WHERE title='Positive Energy Flow';
INSERT INTO workout_exercises (workoutId, name, durationSec, reps, orderIndex)
SELECT id, 'Standing Stretch', 45, NULL, 1 FROM workouts WHERE title='Positive Energy Flow';

-- Light Yoga for Mood
INSERT INTO workout_exercises (workoutId, name, durationSec, reps, orderIndex)
SELECT id, 'Seated Forward Fold', 60, NULL, 0 FROM workouts WHERE title='Light Yoga for Mood';
INSERT INTO workout_exercises (workoutId, name, durationSec, reps, orderIndex)
SELECT id, 'Butterfly Stretch', 45, NULL, 1 FROM workouts WHERE title='Light Yoga for Mood';

-- Focus & Breath
INSERT INTO workout_exercises (workoutId, name, durationSec, reps, orderIndex)
SELECT id, 'Focused Breathing', 90, NULL, 0 FROM workouts WHERE title='Focus & Breath';
INSERT INTO workout_exercises (workoutId, name, durationSec, reps, orderIndex)
SELECT id, 'Eye Relaxation', 60, NULL, 1 FROM workouts WHERE title='Focus & Breath';

-- Gratitude Session
INSERT INTO workout_exercises (workoutId, name, durationSec, reps, orderIndex)
SELECT id, 'Gratitude Breathing', 60, NULL, 0 FROM workouts WHERE title='Gratitude Session';
INSERT INTO workout_exercises (workoutId, name, durationSec, reps, orderIndex)
SELECT id, 'Body Scan Relaxation', 120, NULL, 1 FROM workouts WHERE title='Gratitude Session';

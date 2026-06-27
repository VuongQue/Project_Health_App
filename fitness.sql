use healthhub;

INSERT INTO workouts (id, title, level, muscleGroup, videoUrl, kcalPerMin, createdAt)
VALUES
(1, 'Full Body Beginner', 'Beginner', 'Full Body', 'https://example.com/video1.mp4', 8, NOW()),
(2, 'HIIT Fat Burn', 'Intermediate', 'Cardio', 'https://example.com/video2.mp4', 12, NOW()),
(3, 'Leg Strength', 'Intermediate', 'Legs', 'https://example.com/video3.mp4', 10, NOW()),
(4, 'Chest Shred', 'Advanced', 'Chest', 'https://example.com/video4.mp4', 11, NOW()),
(5, 'Yoga Flexibility', 'Beginner', 'Flexibility', 'https://example.com/video5.mp4', 5, NOW()),
(6, 'Quick Workout', 'Beginner', 'Full Body', 'https://example.com/quick.mp4', 7, NOW());

INSERT INTO workout_exercises (workoutId, name, durationSec, reps, orderIndex)
VALUES
-- Workout 1
(1, 'Jumping Jacks', 30, NULL, 0),
(1, 'Push Ups', NULL, 12, 1),
(1, 'Plank', 45, NULL, 2),

-- Workout 2
(2, 'Burpees', 30, NULL, 0),
(2, 'Mountain Climbers', 45, NULL, 1),
(2, 'High Knees', 30, NULL, 2),

-- Workout 3
(3, 'Squats', NULL, 20, 0),
(3, 'Lunges', NULL, 16, 1),
(3, 'Wall Sit', 60, NULL, 2),

-- Workout 4
(4, 'Bench Press', NULL, 12, 0),
(4, 'Incline Dumbbell Press', NULL, 10, 1),
(4, 'Chest Fly', NULL, 14, 2),

-- Workout 5
(5, 'Sun Salutation', 60, NULL, 0),
(5, 'Child Pose', 45, NULL, 1),
(5, 'Downward Dog', 40, NULL, 2),

-- Quick Workout
(6, 'Quick Jump Rope', 30, NULL, 0),
(6, 'Fast Squats', NULL, 15, 1),
(6, 'Fast Push Ups', NULL, 10, 2);

INSERT INTO workout_plans (id, userId, name, goalType, weeks, createdAt)
VALUES
(1, 1, 'Lose Weight 4 Weeks', 'lose', 4, NOW()),
(2, 1, 'Muscle Gain 8 Weeks', 'gain', 8, NOW());

INSERT INTO workout_logs (userId, workoutId, durationMin, kcal, startedAt, note)
VALUES
(1, 1, 20, 160, DATE_SUB(NOW(), INTERVAL 1 DAY), 'Good session'),
(1, 2, 15, 180, DATE_SUB(NOW(), INTERVAL 2 DAY), 'HIIT was intense'),
(1, 3, 25, 250, DATE_SUB(NOW(), INTERVAL 3 DAY), 'Legs burning'),
(1, 5, 30, 150, DATE_SUB(NOW(), INTERVAL 10 DAY), 'Yoga relaxing');


INSERT INTO workout_sessions (userId, workoutId, currentExerciseIndex, completed)
VALUES
(1, 1, 1, false),
(1, 3, 3, true);



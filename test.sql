Use healthhub;
SET FOREIGN_KEY_CHECKS = 0;

-- ============================
--  USERS (bạn đã có rồi, giữ nguyên)
-- ============================
-- id: 1 → a@example.com  
-- id: 2 → a@gmail.com

-- Không insert users nữa để tránh duplicate


-- ============================
--  CLEAR OLD DATA
-- ============================
TRUNCATE TABLE user_achievements;
TRUNCATE TABLE achievements;
TRUNCATE TABLE user_challenges;
TRUNCATE TABLE challenges;
TRUNCATE TABLE workout_logs;
TRUNCATE TABLE workout_plans;
TRUNCATE TABLE workouts;
TRUNCATE TABLE notifications;

-- ============================
--  ACHIEVEMENTS
-- ============================
INSERT INTO achievements (id, code, name, description)
VALUES
  (1, 'FIRST_CHALLENGE', 'First Challenge Completed', 'Complete your first challenge.'),
  (2, 'SEVEN_DAY_STREAK', '7-Day Streak', 'Log your mood for 7 days straight.'),
  (3, 'CARDIO_HERO', 'Cardio Hero', 'Finish 10 cardio workouts.');

-- ============================
--  USER ACHIEVEMENTS
-- ============================
INSERT INTO user_achievements (id, earnedAt, userId, achievementId)
VALUES
  (1, NOW(), 1, 1 ),
  (2, NOW(), 1, 2),
  (3, NOW(), 2, 1 );


-- ============================
--  CHALLENGES
-- ============================
INSERT INTO challenges (id, name, description, durationDays, createdAt)
VALUES
  (1, '30-Day Cardio Master', 'Daily cardio workout to boost stamina.', 30, NOW()),
  (2, '14-Day Mindfulness', 'Track mood & meditate daily.', 14, NOW());

-- ============================
--  USER CHALLENGES
-- ============================
INSERT INTO user_challenges (id, userId, challengeId, status, completedDays, lastCompletedDate, joinedAt)
VALUES
  (1, 1, 1, 'ongoing', 12, NULL, NOW()),
  (2, 2, 2, 'ongoing', 5, NULL, NOW());

-- ============================
--  WORKOUTS
-- ============================
INSERT INTO workouts (id, title, level, muscleGroup, videoUrl, kcalPerMin, createdAt) VALUES
  (1, 'Cardio Session Beginner', 'easy', 'fullbody', 'https://example.com/video1.mp4', 8, NOW()),
  (2, 'Strength Training Basic', 'medium', 'upperbody', 'https://example.com/video2.mp4', 10, NOW());

-- ============================
--  WORKOUT PLANS
-- ============================
INSERT INTO workout_plans (id, name, goalType, weeks, createdAt, userId) VALUES
  (1, 'Weekly Starter Plan', 'cardio', 4, NOW(), 1),
  (2, 'Balanced Routine', 'strength', 4, NOW(), 2);

-- ============================
--  WORKOUT LOGS (4 logs mỗi user)
-- ============================
INSERT INTO workout_logs (id, durationMin, kcal, startedAt, note, userId, workoutId) VALUES
  (1, 40, 300, DATE_SUB(NOW(), INTERVAL 0 DAY), 'Good session', 1, 1),
  (2, 40, 300, DATE_SUB(NOW(), INTERVAL 1 DAY), 'Feeling strong', 1, 2),
  (3, 40, 300, DATE_SUB(NOW(), INTERVAL 2 DAY), 'Tired but ok', 1, 1),
  (4, 40, 300, DATE_SUB(NOW(), INTERVAL 3 DAY), 'Nice workout', 1, 2),

  (5, 30, 220, DATE_SUB(NOW(), INTERVAL 0 DAY), 'Nice session', 2, 1),
  (6, 30, 220, DATE_SUB(NOW(), INTERVAL 1 DAY), 'Light day', 2, 2),
  (7, 30, 220, DATE_SUB(NOW(), INTERVAL 2 DAY), 'Push harder', 2, 1),
  (8, 30, 220, DATE_SUB(NOW(), INTERVAL 3 DAY), 'Solid training', 2, 2);


-- ============================
--  NOTIFICATIONS
-- ============================
INSERT INTO notifications (id, userId, type, message, isRead, createdAt)
VALUES
  (1, 1, 'SYSTEM', 'Welcome to HealthHub! 🎉', 0, NOW()),
  (2, 1, 'CHALLENGE', 'You joined 30-Day Cardio Master!', 0, NOW()),
  (3, 2, 'SYSTEM', 'Welcome to HealthHub! 🎉', 0, NOW());

SET FOREIGN_KEY_CHECKS = 1;

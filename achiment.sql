USE healthhub;
INSERT INTO achievements
(code, name, description, category, `trigger`, `condition`, isHidden, hiddenLevel, hint, points)
VALUES
('NEW_USER', 'Người mới', 'Đăng ký tài khoản thành công',
 'SYSTEM', 'USER_REGISTER',
 '{"field":"register","operator":"==","value":1}',
 1, 1, 'Chào mừng bạn đến với hành trình mới', 5),

('FIRST_LOGIN', 'Lần đầu ghé thăm', 'Đăng nhập lần đầu tiên',
 'SYSTEM', 'USER_LOGIN',
 '{"field":"loginCount","operator":"==","value":1}',
 1, 1, 'Một khởi đầu quen thuộc', 5),

('COMPLETE_PROFILE', 'Hồ sơ hoàn chỉnh', 'Hoàn thiện hồ sơ cá nhân',
 'SYSTEM', 'PROFILE_UPDATED',
 '{"field":"profileComplete","operator":"==","value":1}',
 1, 1, 'Một chút thông tin về bạn', 10);

/* =====================================================
   WORKOUT – BASIC
===================================================== */
INSERT INTO achievements
(code, name, description, category, `trigger`, `condition`, isHidden, hiddenLevel, hint, points)
VALUES
('FIRST_WORKOUT', 'Bước đầu tiên', 'Hoàn thành bài tập đầu tiên',
 'WORKOUT', 'WORKOUT_COMPLETED',
 '{"field":"workoutCount","operator":"==","value":1}',
 1, 1, 'Hãy thử bắt đầu vận động hôm nay', 10),

('WORKOUT_5', 'Khởi động', 'Hoàn thành 5 bài tập',
 'WORKOUT', 'WORKOUT_COMPLETED',
 '{"field":"workoutCount","operator":">=","value":5}',
 0, 0, NULL, 15),

('WORKOUT_10', 'Không bỏ cuộc', 'Hoàn thành 10 bài tập',
 'WORKOUT', 'WORKOUT_COMPLETED',
 '{"field":"workoutCount","operator":">=","value":10}',
 0, 0, NULL, 20),

('WORKOUT_20', 'Chăm chỉ', 'Hoàn thành 20 bài tập',
 'WORKOUT', 'WORKOUT_COMPLETED',
 '{"field":"workoutCount","operator":">=","value":20}',
 0, 0, NULL, 30);

/* =====================================================
   STREAK / CONSISTENCY
===================================================== */
INSERT INTO achievements
(code, name, description, category, `trigger`, `condition`, isHidden, hiddenLevel, hint, points)
VALUES
('STREAK_3', 'Bắt đầu đều đặn', '3 ngày liên tiếp tập luyện',
 'STREAK', 'WORKOUT_COMPLETED',
 '{"field":"streak","operator":">=","value":3}',
 0, 0, NULL, 15),

('STREAK_7', 'Không bỏ cuộc', '7 ngày liên tiếp tập luyện',
 'STREAK', 'WORKOUT_COMPLETED',
 '{"field":"streak","operator":">=","value":7}',
 0, 0, NULL, 25),

('STREAK_14', 'Thói quen hình thành', '14 ngày liên tiếp tập luyện',
 'STREAK', 'WORKOUT_COMPLETED',
 '{"field":"streak","operator":">=","value":14}',
 0, 0, NULL, 40);

/* =====================================================
   MOOD / MENTAL HEALTH
===================================================== */
INSERT INTO achievements
(code, name, description, category, `trigger`, `condition`, isHidden, hiddenLevel, hint, points)
VALUES
('FIRST_MOOD', 'Lắng nghe bản thân', 'Ghi nhận cảm xúc đầu tiên',
 'MOOD', 'MOOD_CREATED',
 '{"field":"moodCount","operator":"==","value":1}',
 1, 1, 'Cảm xúc cũng quan trọng như cơ thể', 10),

('MOOD_7', 'Quan sát cảm xúc', 'Ghi mood 7 ngày',
 'MOOD', 'MOOD_CREATED',
 '{"field":"moodCount","operator":">=","value":7}',
 0, 0, NULL, 20),

('MOOD_30', 'Hiểu bản thân', 'Ghi mood 30 ngày',
 'MOOD', 'MOOD_CREATED',
 '{"field":"moodCount","operator":">=","value":30}',
 0, 0, NULL, 40);

/* =====================================================
   HIDDEN ACHIEVEMENTS (CÓ HINT)
===================================================== */
INSERT INTO achievements
(code, name, description, category, `trigger`, `condition`, isHidden, hiddenLevel, hint, points)
VALUES
('COMEBACK', 'Trở lại mạnh mẽ', 'Quay lại tập luyện sau thời gian gián đoạn',
 'WORKOUT', 'WORKOUT_COMPLETED',
 '{"field":"comeback","operator":"==","value":1}',
 1, 2, 'Có người quay lại sau một thời gian...', 25),

('ALL_ROUNDER', 'Toàn diện', 'Vừa tập luyện vừa theo dõi cảm xúc',
 'SYSTEM', 'SYSTEM_CHECK',
 '{"field":"allRounder","operator":"==","value":1}',
 1, 2, 'Cơ thể và cảm xúc đều được quan tâm', 30);

/* =====================================================
   SECRET / EASTER EGG ACHIEVEMENTS
===================================================== */
INSERT INTO achievements
(code, name, description, category, `trigger`, `condition`, isHidden, hiddenLevel, hint, points)
VALUES
('EARLY_BIRD', 'Chim dậy sớm', 'Tập luyện trước 6 giờ sáng',
 'WORKOUT', 'WORKOUT_COMPLETED',
 '{"field":"earlyWorkout","operator":"==","value":1}',
 1, 3, NULL, 30),

('BIRTHDAY_MOOD', 'Một ngày đặc biệt', 'Ghi mood đúng ngày sinh nhật',
 'MOOD', 'MOOD_CREATED',
 '{"field":"birthday","operator":"==","value":1}',
 1, 3, NULL, 40);
export interface IUserChallenge {
  id: number;
  challengeId: number;

  name: string;
  description: string;
  type: string;

  targetCount: number;     // 🎯 tổng mục tiêu
  completedCount: number;  // ✅ đã làm

  progress: number;        // 0 → 1
  status: "ongoing" | "completed" | "failed";

  currentStreak?: number;
  maxStreak?: number;

  joinedAt: string;
  lastCompletedDate?: string | null;
}

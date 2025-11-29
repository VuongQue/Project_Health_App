export interface IUserChallenge {
  id: number;
  challengeId: number;
  name: string;
  description: string;
  durationDays: number;
  completedDays: number;
  daysRemaining: number;
  progress: number;     // 0 → 1
  status: string;
  joinedAt: string;
}

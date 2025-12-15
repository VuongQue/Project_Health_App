export type ChallengeSource = 'MOOD' | 'WORKOUT' | 'HABIT';
export type ChallengeStatus = 'ongoing' | 'completed' | 'failed';
export type ChallengeType = 'MOOD' | 'WORKOUT' | 'HABIT';

export interface ChallengeRule {
  source: ChallengeSource;
  minValue?: number;            // ví dụ mood >= 4
  requireConsecutive?: boolean; // ví dụ 7 ngày liên tiếp
  maxPerDay?: number;           // mặc định 1 (tránh spam)
}

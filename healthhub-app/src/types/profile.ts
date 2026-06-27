export interface UserProfile {
  user: {
    fullName: string;
    username: string;
    avatarUrl?: string;
    dailyGoal?: string;  
    level?: number;
    points?: number;
  };
  stats: {
    totalWorkouts: number;
    currentStreak: number;
    badgesEarned: number;
  };
  badges: BadgeItem[];
  challenges: ChallengeItem[];
}

export interface BadgeItem {
  // ===== ACHIEVEMENT (mới) =====
  code?: string;

  unlocked?: boolean;
  locked?: boolean;

  name?: string;          // khi unlocked
  displayName?: string;  // khi locked (???)
  description?: string;
  hint?: string;
  earnedAt?: string;
  points?: number;

  // ===== PROFILE UI (cũ) =====
  date?: string;
  iconUrl?: string;
}


export interface ChallengeItem {
  name: string;
  daysCompleted: number;
  totalDays: number;
  progress: number;
}

export interface UpdateProfileDto {
  fullName?: string;
  username?: string;
  avatarUrl?: string;      // FE dùng avatar
  dailyGoal?: string;   // FE dùng dailyGoal
}


import {
  Flame,
  Star,
  TrendingUp,
  Award,
  Zap,
  Shield,
  Smile,
  RefreshCcw,
  Sunrise,
  Gift,
  UserPlus,
  LogIn,
  UserCheck,
} from "lucide-react-native";

export const ACHIEVEMENT_ICONS: Record<string, any> = {
  // USER
  WELCOME: UserPlus,
  FIRST_LOGIN: LogIn,
  COMPLETE_PROFILE: UserCheck,

  // WORKOUT
  FIRST_WORKOUT: Flame,
  WORKOUT_5: TrendingUp,
  WORKOUT_10: TrendingUp,
  WORKOUT_20: Award,

  // STREAK
  STREAK_3: Zap,
  STREAK_7: Shield,
  STREAK_14: Award,

  // MOOD
  FIRST_MOOD: Smile,
  MOOD_7: Smile,
  MOOD_30: Award,
  BIRTHDAY_MOOD: Gift,

  // SPECIAL
  COMEBACK: RefreshCcw,
  ALL_ROUNDER: Award,
  EARLY_BIRD: Sunrise,
};

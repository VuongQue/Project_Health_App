import axiosClient from "./axiosClient";

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface DailyInsight {
  summary: string;
  highlights: string[];
  suggestions: string[];
  motivationalMessage: string;
}

export interface MealAnalysis {
  estimatedCalories: number;
  protein: number;
  carbs: number;
  fat: number;
  healthScore: number;
  feedback: string;
  suggestions: string[];
}

export interface WorkoutPlan {
  plan: { day: string; workoutTitle: string; workoutId: number; reason: string }[];
  weeklyGoal: string;
  tips: string[];
}

export interface HealthAlert {
  level: "low" | "medium" | "high";
  title: string;
  description: string;
  action: string;
  link?: string;
}

export interface ChatSession {
  _id: string;
  title: string;
  lastActiveAt: string;
  messages: { role: string; content: string }[];
}

export default {
  chat: (messages: ChatMessage[]) =>
    axiosClient.post<{ reply: string }>("/ai/chat", { messages }),

  getDailyInsight: () =>
    axiosClient.get<DailyInsight>("/ai/daily-insight"),

  analyzeMeal: (mealDescription: string, mealType: string) =>
    axiosClient.post<MealAnalysis>("/ai/analyze-meal", { mealDescription, mealType }),

  transcribeMealVoice: (audioBase64: string, mimeType: string) =>
    axiosClient.post<{ transcript: string }>("/ai/transcribe-meal-voice", { audioBase64, mimeType }),

  generateWorkoutPlan: (daysPerWeek: number, goal: string) =>
    axiosClient.post<WorkoutPlan>("/ai/workout-plan", { daysPerWeek, goal }),

  // Session APIs
  getSessions: () =>
    axiosClient.get<ChatSession[]>("/ai/sessions"),

  createSession: (firstMessage: string) =>
    axiosClient.post<ChatSession>("/ai/sessions", { firstMessage }),

  saveMessages: (sessionId: string, messages: { role: string; content: string }[]) =>
    axiosClient.put<ChatSession>(`/ai/sessions/${sessionId}`, { messages }),

  deleteSession: (sessionId: string) =>
    axiosClient.delete(`/ai/sessions/${sessionId}`),

  getHealthAlerts: () =>
    axiosClient.get<{ alerts: HealthAlert[] }>("/ai/health-alerts"),
};

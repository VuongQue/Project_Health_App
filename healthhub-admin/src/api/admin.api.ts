import { api } from "./axios";

/** ========== TYPES (tối thiểu) ========== */
export type PageResult<T> = {
  items: T[];
  total: number;
  page: number;
  limit: number;
};

export type AdminUser = {
  id: number;
  email: string;
  fullName?: string;
  username?: string;
  role: "USER" | "ADMIN" | "TRAINER" | "MODERATOR";
  status: "ACTIVE" | "LOCKED" | string;
  createdAt?: string;
  updatedAt?: string;
};

export type Workout = {
  id: number;
  title: string;
  level: string;
  category?: string;
  kcalPerMin?: number;
  createdAt?: string;
};

export type AdminStats = {
  totalUsers: number;
  totalWorkouts: number;
  totalWorkoutExercises: number;
  totalPosts: number;
  totalUserAchievements: number; // đang count bảng UserAchievement
  totalUserChallenges: number;   // đang count bảng UserChallenge
};

export type CommunityPost = {
  _id: string;
  content: string;
  isHidden?: boolean;
  user?: { name?: string; fullName?: string; username?: string; email?: string };
};

export type Achievement = { id: number; code: string; name: string; points: number };
export type Challenge = { id: number; name: string; type: string; targetCount: number; isActive: boolean };

export type Report = {
  _id: string;
  reporterId: string;
  reporter?: { name?: string; avatar?: string };
  postId?: string;
  targetUserId?: string;
  reason: string;
  description?: string;
  status: "PENDING" | "REVIEWED" | "RESOLVED" | "DISMISSED";
  adminNote?: string;
  createdAt?: string;
  post?: { content?: string };
};

export type UserDetail = AdminUser & {
  warningCount?: number;
  bannedUntil?: string;
  bio?: string;
  avatar?: string;
  level?: number;
  points?: number;
};

/** ========== USERS ========== */
export const adminUsersApi = {
  list: (params: { keyword?: string; page?: number; limit?: number }) =>
    api.get<PageResult<AdminUser>>("/admin/users", { params }),

  detail: (id: number) => api.get<AdminUser>(`/admin/users/${id}`),

  lock: (id: number) => api.patch(`/admin/users/${id}/lock`),
  unlock: (id: number) => api.patch(`/admin/users/${id}/unlock`),

  setRole: (id: number, role: AdminUser["role"]) =>
    api.patch(`/admin/users/${id}/role`, { role }),
};

/** ========== STATS ========== */
export const adminStatsApi = {
  get: () => api.get<AdminStats>("/admin/stats"),
};

/** ========== POSTS ========== */
export const adminPostsApi = {
  list: (params: { keyword?: string; page?: number; limit?: number }) =>
    api.get<PageResult<CommunityPost>>("/admin/posts", { params }),

  hide: (id: string) => api.patch(`/admin/posts/${id}/hide`),
  unhide: (id: string) => api.patch(`/admin/posts/${id}/unhide`),
  remove: (id: string) => api.delete(`/admin/posts/${id}`),
};

/** ========== WORKOUTS ========== */
export const adminWorkoutsApi = {
  list: (params?: { keyword?: string }) =>
    api.get<Workout[]>("/admin/workouts", { params }),

  create: (dto: Partial<Workout>) => api.post("/admin/workouts", dto),
  update: (id: number, dto: Partial<Workout>) => api.put(`/admin/workouts/${id}`, dto),
  remove: (id: number) => api.delete(`/admin/workouts/${id}`),
};

/** ========== ACHIEVEMENTS ========== */
export const adminAchievementsApi = {
  list: () => api.get<Achievement[]>("/admin/achievements"),
  create: (dto: Partial<Achievement>) => api.post("/admin/achievements", dto),
  update: (id: number, dto: Partial<Achievement>) => api.put(`/admin/achievements/${id}`, dto),
  remove: (id: number) => api.delete(`/admin/achievements/${id}`),
};

/** ========== CHALLENGES ========== */
export const adminChallengesApi = {
  list: () => api.get<Challenge[]>("/admin/challenges"),
  create: (dto: Partial<Challenge>) => api.post("/admin/challenges", dto),
  update: (id: number, dto: Partial<Challenge>) => api.put(`/admin/challenges/${id}`, dto),
  remove: (id: number) => api.delete(`/admin/challenges/${id}`),
};

/** ========== EVENTS ========== */
export type AdminEvent = {
  id: number;
  title: string;
  description?: string;
  type: "online" | "offline";
  link?: string;
  coverImage?: string;
  scope: "PUBLIC" | "GROUP";
  groupId?: string;
  maxParticipants?: number;
  conditionType?: "MANUAL" | "WORKOUT" | "STEPS" | "WATER" | "MEDIA";
  conditionValue?: number;
  startTime: string;
  endTime: string;
  createdAt: string;
  createdBy?: { id: number; fullName: string; email: string };
};

export type SubmissionStatus = "pending" | "approved" | "warned" | "fraud" | "appealing" | "restored";

export type AdminSubmission = {
  id: number;
  mediaUrl: string;
  mediaType: "video" | "image";
  userNote?: string;
  status: SubmissionStatus;
  adminReason?: string;
  appealNote?: string;
  appealMediaUrl?: string;
  appealedAt?: string;
  checkInDate: string;
  submittedAt: string;
  user: { id: number; fullName: string; email: string; avatarUrl?: string };
  reviewedBy?: { id: number; fullName: string };
  reviewedAt?: string;
};

export const adminEventsApi = {
  list: () => api.get<AdminEvent[]>("/events"),
  create: (dto: Partial<AdminEvent>) => api.post<AdminEvent>("/events", dto),
  delete: (id: number) => api.delete(`/events/${id}`),
  getParticipants: (id: number) => api.get(`/events/${id}/participants`),
  getSubmissions: (id: number, status?: SubmissionStatus) =>
    api.get<AdminSubmission[]>(`/events/${id}/submissions`, { params: { status } }),
  approveSubmission: (subId: number) =>
    api.patch(`/events/submissions/${subId}/approve`),
  warnSubmission: (subId: number, reason: string) =>
    api.patch(`/events/submissions/${subId}/warn`, { reason }),
  fraudSubmission: (subId: number, reason: string) =>
    api.patch(`/events/submissions/${subId}/fraud`, { reason }),
  resolveAppeal: (subId: number, decision: "restore" | "keep_ban", adminNote?: string) =>
    api.patch(`/events/submissions/${subId}/resolve-appeal`, { decision, adminNote }),
};

/** ========== REPORTS ========== */
export const adminReportsApi = {
  list: (params?: { page?: number; limit?: number; status?: string }) =>
    api.get<PageResult<Report>>("/admin/reports", { params }),
  resolve: (id: string, action: "warn" | "hide" | "dismiss", adminNote?: string) =>
    api.patch(`/admin/reports/${id}/resolve`, { action, adminNote }),
};

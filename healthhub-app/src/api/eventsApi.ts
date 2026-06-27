import axiosClient from "./axiosClient";

export type EventScope = "PUBLIC" | "GROUP";
export type RegistrationStatus = "registered" | "checked_in" | "completed" | "cancelled";
export type EventConditionType = "MANUAL" | "WORKOUT" | "STEPS" | "WATER" | "MEDIA";

export const CONDITION_LABELS: Record<EventConditionType, string> = {
  MANUAL:  "Check-in tay",
  WORKOUT: "Hoàn thành buổi tập",
  STEPS:   "Đạt số bước chân",
  WATER:   "Uống đủ nước",
  MEDIA:   "Nộp video/ảnh minh chứng",
};

export const CONDITION_UNITS: Record<EventConditionType, string> = {
  MANUAL:  "",
  WORKOUT: "buổi/ngày",
  STEPS:   "bước/ngày",
  WATER:   "ml/ngày",
  MEDIA:   "",
};

export type SubmissionStatus = "pending" | "approved" | "warned" | "fraud" | "appealing" | "restored";

export interface EventSubmission {
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
}

export interface EventItem {
  id: number;
  title: string;
  description?: string;
  type: "online" | "offline";
  link?: string;
  coverImage?: string;
  scope: EventScope;
  groupId?: string;
  maxParticipants?: number;
  startTime: string;
  endTime: string;
  createdAt: string;
  createdBy?: { id: number; fullName: string; avatarUrl?: string };
  conditionType?: EventConditionType;
  conditionValue?: number;
  // Thêm bởi client sau khi join với registrations
  registered?: boolean;
  registration?: EventRegistrationItem;
}

export interface EventRegistrationItem {
  id: number;
  status: RegistrationStatus;
  checkInCount: number;
  progress: number;
  lastCheckInDate?: string;
  completedAt?: string;
  registeredAt: string;
  event: EventItem;
}

export interface EventLeaderboardEntry {
  rank: number;
  userId: number;
  fullName: string;
  avatarUrl?: string;
  level: number;
  checkInCount: number;
  progress: number;
  status: RegistrationStatus;
  completedAt?: string;
}

export interface EventDetail extends EventItem {
  registration: EventRegistrationItem | null;
  totalRegistered: number;
}

const eventsApi = {
  // PUBLIC events
  getAll: () => axiosClient.get<EventItem[]>("/events"),

  // GROUP events
  getGroupEvents: (groupId: string) =>
    axiosClient.get<EventItem[]>(`/events/group/${groupId}`),

  // Tạo event (admin: PUBLIC, user: GROUP)
  create: (dto: Partial<EventItem>) =>
    axiosClient.post<EventItem>("/events", dto),

  // Đăng ký / huỷ đăng ký
  register: (id: number) => axiosClient.post(`/events/${id}/register`),
  unregister: (id: number) => axiosClient.delete(`/events/${id}/register`),

  // Check-in hàng ngày
  checkIn: (id: number) => axiosClient.post(`/events/${id}/checkin`),

  // Danh sách đăng ký của tôi
  myRegistrations: () =>
    axiosClient.get<EventRegistrationItem[]>("/events/me/registrations"),

  // Đang diễn ra / sắp tới — cho personal dashboard
  myActiveRegistrations: () =>
    axiosClient.get<EventRegistrationItem[]>("/events/me/active"),

  // Chi tiết 1 event (kèm registration của user)
  getById: (id: number) => axiosClient.get<EventDetail>(`/events/${id}`),

  // Bảng xếp hạng event
  getLeaderboard: (id: number) => axiosClient.get<EventLeaderboardEntry[]>(`/events/${id}/leaderboard`),

  // Xác nhận tiến độ tự động (tự check dữ liệu workout/steps/water)
  verifyProgress: (id: number) => axiosClient.post(`/events/${id}/verify-progress`),

  // Nộp minh chứng ảnh/video
  submitMedia: (id: number, body: { mediaUrl: string; mediaType: 'video' | 'image'; userNote?: string }) =>
    axiosClient.post<EventSubmission>(`/events/${id}/submissions`, body),

  // Lấy submissions của mình trong event này
  mySubmissions: (id: number) => axiosClient.get<EventSubmission[]>(`/events/${id}/submissions/my`),

  // Khiếu nại sau khi bị fraud
  appealSubmission: (subId: number, body: { appealNote: string; appealMediaUrl?: string }) =>
    axiosClient.post(`/events/submissions/${subId}/appeal`, body),

  // Participants của 1 event
  getParticipants: (id: number) => axiosClient.get(`/events/${id}/participants`),

  // Xoá event (admin hoặc creator)
  delete: (id: number) => axiosClient.delete(`/events/${id}`),
};

export default eventsApi;

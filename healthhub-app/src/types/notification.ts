export interface Notification {
  id: number;
  userId: number;
  type: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  icon?: string;
  link?: string;
  metadata?: any;
  priority?: number;
}

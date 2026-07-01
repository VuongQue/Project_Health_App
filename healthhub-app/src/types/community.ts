export interface StoryUser {
  name: string;
  avatar?: string | null;
}

export interface StoryItem {
  id: string;
  user: StoryUser;
  hasStory: boolean;
  isYourStory: boolean;
  media: string[] | null;
  createdAt: string;
}

export interface CommentPreview {
  id: string;
  text: string;
  user: {
    name: string;
    avatar: string;
  };
}

export interface PostItem {
  _id: string;
  content: string;
  media: string[];
  likeCount: number;
  commentCount: number;
  /** Owner user id (string) — dùng để so sánh quyền sở hữu */
  userId: string;
  /** Thông tin tác giả đã denormalize từ backend */
  user?: {
    name: string;
    avatar: string;
  };
  /** Danh sách userId đã like */
  likes?: string[];
  createdAt: string;
  commentPreview: CommentPreview[];
}

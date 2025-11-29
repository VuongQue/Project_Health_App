export interface StoryUser {
  name: string;
  avatar: string;
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
  userId: {
    name: string;
    avatar: string;
  };
  createdAt: string;
  commentPreview: CommentPreview[];
}

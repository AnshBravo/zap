export interface User {
  id: string;
  username: string;
  email?: string;
  bio?: string;
  avatarUrl?: string | null;
  createdAt?: string;
  updatedAt?: string;
  _count?: {
    posts?: number;
    followers?: number;
    following?: number;
  };
}

export interface Post {
  id: string;
  content: string;
  username?: string;
  authorId: string;
  createdAt: string;
  updatedAt: string;
  author: {
    id: string;
    username: string;
    avatarUrl?: string | null;
  };
  _count: {
    likes: number;
    comments: number;
  };
}

export interface Comment {
  id: string;
  content: string;
  postId: string;
  userId: string;
  createdAt: string;
  user: {
    id: string;
    username: string;
    avatarUrl?: string | null;
  };
}

export interface Message {
  id: string;
  content: string;
  senderId: string;
  receiverId: string;
  createdAt: string;
  sender: {
    id: string;
    username: string;
    avatarUrl?: string | null;
  };
}

export interface NotificationItem {
  id: string;
  type: "LIKE" | "COMMENT" | "FOLLOW";
  message: string;
  postId?: string;
  commentId?: string;
  triggerBy?: { id: string; username: string; avatarUrl?: string | null };
  followerId?: string;
  createdAt?: string;
  read?: boolean;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

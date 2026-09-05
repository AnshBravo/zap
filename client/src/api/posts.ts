import axios from "axios";
import api from "./axios";

import { type Post, type Comment } from "../types";

export interface PaginationMeta {
  page: number;
  limit: number;
  totalPosts?: number;
  totalComments?: number;
  totalPages: number;
  hasNextPage: boolean;
}

export interface FeedResponse {
  status: string;
  data: {
    posts: Post[];
    pagination: PaginationMeta;
  };
}

export interface SinglePostResponse {
  status: string;
  data: {
    post: Post;
  };
}

export interface CreatePostPayload {
  content: string; // max 200 chars
  mediaUrl?: string;
  mediaKey?: string;
}

export interface UploadUrlResponse {
  status: string;
  data: {
    uploadUrl: string;
    mediaUrl: string;
    mediaKey: string;
  };
}

export const getUploadUrl = async (
  fileType: string,
): Promise<UploadUrlResponse> => {
  const response = await api.post("/posts/upload-url", { fileType });
  return response.data;
};

export const uploadMediaToS3 = async (
  uploadUrl: string,
  file: File,
): Promise<void> => {
  await axios.put(uploadUrl, file, {
    headers: { "Content-Type": file.type },
  });
};

export interface ToggleLikeResponse {
  status: string;
  message: string;
  liked: boolean;
}

export interface AddCommentPayload {
  content: string;
}

export interface AddCommentResponse {
  status: string;
  message: string;
  data: {
    comment: Comment;
  };
}

export interface GetCommentsResponse {
  status: string;
  data: {
    comments: Comment[];
    pagination: PaginationMeta;
  };
}

export const createPost = async (
  data: CreatePostPayload,
): Promise<SinglePostResponse> => {
  const response = await api.post("/posts", data);
  return response.data;
};

export const postsApi = {
  // POST /api/v1/posts/upload-url
  getUploadUrl,

  uploadMedia: uploadMediaToS3,

  // GET /api/v1/posts?page=1&limit=10
  getFeed: async (page = 1, limit = 10): Promise<FeedResponse> => {
    const response = await api.get("/posts", { params: { page, limit } });
    return response.data;
  },

  // GET /api/v1/posts/:id
  getPostById: async (id: string): Promise<SinglePostResponse> => {
    const response = await api.get(`/posts/${id}`);
    return response.data;
  },

  // POST /api/v1/posts
  createPost,

  // DELETE /api/v1/posts/:id
  deletePost: async (
    id: string,
  ): Promise<{ status: string; message: string }> => {
    const response = await api.delete(`/posts/${id}`);
    return response.data;
  },

  // POST /api/v1/posts/:postId/like
  toggleLike: async (postId: string): Promise<ToggleLikeResponse> => {
    const response = await api.post(`/posts/${postId}/like`);
    return response.data;
  },

  // POST /api/v1/posts/:postId/comments
  addComment: async (
    postId: string,
    payload: AddCommentPayload,
  ): Promise<AddCommentResponse> => {
    const response = await api.post(`/posts/${postId}/comments`, payload);
    return response.data;
  },

  // GET /api/v1/posts/:postId/comments?page=1&limit=10
  getComments: async (
    postId: string,
    page = 1,
    limit = 10,
  ): Promise<GetCommentsResponse> => {
    const response = await api.get(`/posts/${postId}/comments`, {
      params: { page, limit },
    });
    return response.data;
  },

  // DELETE /api/v1/comments/:commentId
  deleteComment: async (
    commentId: string,
  ): Promise<{ status: string; message: string }> => {
    const response = await api.delete(`/comments/${commentId}`);
    return response.data;
  },
};

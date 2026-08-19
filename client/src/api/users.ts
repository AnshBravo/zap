import api from "./axios";
import { type User } from "../types";

export interface UpdateProfilePayload {
  bio?: string;
  avatarUrl?: string;
}

export interface UserProfileResponse {
  status: string;
  data: {
    user: User;
  };
}

export interface ToggleFollowResponse {
  status: string;
  message: string;
  following: boolean;
}

export interface UserListResponse {
  status: string;
  data: {
    followers?: Array<{
      id: string;
      username: string;
      avatarUrl?: string | null;
    }>;
    following?: Array<{
      id: string;
      username: string;
      avatarUrl?: string | null;
    }>;
    pagination: {
      page: number;
      limit: number;
      totalFollowers?: number;
      totalFollowing?: number;
      totalPages: number;
      hasNextPage: boolean;
    };
  };
}

export const usersApi = {
  // GET /api/v1/users/:username
  getProfile: async (username: string): Promise<UserProfileResponse> => {
    const response = await api.get(`/users/${username}`);
    return response.data;
  },

  // PATCH /api/v1/users/me
  updateProfile: async (
    payload: UpdateProfilePayload,
  ): Promise<UserProfileResponse> => {
    const response = await api.patch("/users/me", payload);
    return response.data;
  },

  // POST /api/v1/users/:targetUserId (Toggle Follow/Unfollow)
  toggleFollow: async (targetUserId: string): Promise<ToggleFollowResponse> => {
    const response = await api.post(`/users/${targetUserId}`);
    return response.data;
  },

  // GET /api/v1/users/:targetUserId/followers
  getFollowers: async (
    targetUserId: string,
    page = 1,
    limit = 10,
  ): Promise<UserListResponse> => {
    const response = await api.get(`/users/${targetUserId}/followers`, {
      params: { page, limit },
    });
    return response.data;
  },

  // GET /api/v1/users/:targetUserId/following
  getFollowing: async (
    targetUserId: string,
    page = 1,
    limit = 10,
  ): Promise<UserListResponse> => {
    const response = await api.get(`/users/${targetUserId}/following`, {
      params: { page, limit },
    });
    return response.data;
  },
};

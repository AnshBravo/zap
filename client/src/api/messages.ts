import api from "./axios";
import { type Message } from "../types";

export interface ChatHistoryResponse {
  status: string;
  data: {
    messages: Message[];
    pagination: {
      page: number;
      limit: number;
      totalMessages: number;
      totalPages: number;
      hasNextPage: boolean;
    };
  };
}

export const messagesApi = {
  // GET /api/v1/messages/:otherUserId?page=1&limit=20
  getChatHistory: async (
    otherUserId: string,
    page = 1,
    limit = 20,
  ): Promise<ChatHistoryResponse> => {
    const response = await api.get(`/messages/${otherUserId}`, {
      params: { page, limit },
    });
    return response.data;
  },
};

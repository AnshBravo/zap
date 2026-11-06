import { useEffect, useRef, useState } from "react";
import { getApiErrorMessage } from "../api/errors";
import { messagesApi } from "../api/messages";
import { usersApi } from "../api/users";
import { useAuth } from "../context/useAuth";
import { useSocket } from "../context/useSocket";
import type { Message } from "../types";

interface ChatUser {
  id: string;
  username: string;
  avatarUrl?: string | null;
  isOnline?: boolean;
}

interface MessageItem {
  id: string;
  senderId: string;
  content: string;
  createdAt: string;
}

export interface Conversation {
  id: string;
  participant: ChatUser;
  lastMessage: string;
  updatedAt: string;
  unreadCount: number;
}

function formatMessage(message: Message): MessageItem {
  return {
    id: message.id,
    senderId: message.senderId,
    content: message.content,
    createdAt: new Date(message.createdAt).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    }),
  };
}

export function useMessages() {
  const { user } = useAuth();
  const { socket, isConnected } = useSocket();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedConversation, setSelectedConversation] =
    useState<Conversation | null>(null);
  const [inputText, setInputText] = useState("");
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Record<string, MessageItem[]>>({});
  const [conversationsLoading, setConversationsLoading] = useState(false);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [sendError, setSendError] = useState<string | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, selectedConversation]);

  useEffect(() => {
    if (!socket) return;
    const appendMessage = (incoming: Message) => {
      if (!user) return;
      const message = formatMessage(incoming);
      const conversationId =
        incoming.senderId === user.id ? incoming.receiverId : incoming.senderId;

      setMessages((current) => {
        const existing = current[conversationId] ?? [];
        return existing.some((item) => item.id === message.id)
          ? current
          : { ...current, [conversationId]: [...existing, message] };
      });
      setConversations((current) =>
        current.map((conversation) =>
          conversation.id === conversationId
            ? {
                ...conversation,
                lastMessage: message.content,
                updatedAt: "Just now",
              }
            : conversation,
        ),
      );
    };
    const handleSocketError = (payload: { message?: string }) => {
      setSendError(payload.message || "Message could not be delivered.");
    };

    socket.on("receive_message", appendMessage);
    socket.on("message_sent", appendMessage);
    socket.on("error", handleSocketError);
    return () => {
      socket.off("receive_message", appendMessage);
      socket.off("message_sent", appendMessage);
      socket.off("error", handleSocketError);
    };
  }, [socket, user]);

  const startConversation = async (username: string) => {
    const cleanUsername = username.trim().replace(/^@/, "");
    if (!cleanUsername) {
      setSearchError(null);
      return;
    }

    try {
      setConversationsLoading(true);
      setSearchError(null);
      const profile = await usersApi.getProfile(cleanUsername);
      const participant = profile.data.user;
      const conversationId = participant.id;
      const conversation: Conversation = {
        id: conversationId,
        participant: {
          id: participant.id,
          username: participant.username,
          avatarUrl: participant.avatarUrl,
          isOnline: true,
        },
        lastMessage: "Start the conversation",
        updatedAt: "Now",
        unreadCount: 0,
      };

      setConversations((current) =>
        current.some((item) => item.id === conversationId)
          ? current
          : [conversation, ...current],
      );
      setSelectedConversation(conversation);
      setMessagesLoading(true);
      try {
        const history = await messagesApi.getChatHistory(conversationId, 1, 50);
        setMessages((current) => ({
          ...current,
          [conversationId]: history.data.messages.map(formatMessage),
        }));
      } catch (requestError: unknown) {
        setMessages((current) => ({ ...current, [conversationId]: [] }));
        setSearchError(
          getApiErrorMessage(
            requestError,
            "Chat history could not be loaded.",
          ),
        );
      }
    } catch (requestError: unknown) {
      setSearchError(
        getApiErrorMessage(
          requestError,
          "Could not find a user with that username.",
        ),
      );
    } finally {
      setConversationsLoading(false);
      setMessagesLoading(false);
    }
  };

  const sendMessage = () => {
    if (!inputText.trim() || !selectedConversation || !user) return;
    if (!socket || !isConnected) {
      setSendError("You are offline. Reconnect before sending a message.");
      return;
    }

    setSendError(null);
    socket.emit("send_message", {
      receiverId: selectedConversation.id,
      content: inputText.trim(),
    });
    setInputText("");
  };

  const filteredConversations = conversations.filter((conversation) =>
    conversation.participant.username
      .toLowerCase()
      .includes(searchQuery.toLowerCase()),
  );

  return {
    user,
    isConnected,
    messagesEndRef,
    searchQuery,
    setSearchQuery,
    selectedConversation,
    setSelectedConversation,
    inputText,
    setInputText,
    messages,
    conversationsLoading,
    messagesLoading,
    searchError,
    sendError,
    filteredConversations,
    startConversation,
    sendMessage,
  };
}

import { useState, useEffect, useRef } from "react";
import {
  Search,
  Send,
  Image,
  Smile,
  ArrowLeft,
  MoreVertical,
  CheckCheck,
  Loader2,
} from "lucide-react";
import { motion } from "framer-motion";
import { useAuth } from "../context/AuthContext";
import { useSocket } from "../context/SocketContext";
import { messagesApi } from "../api/messages";
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

interface Conversation {
  id: string;
  participant: ChatUser;
  lastMessage: string;
  updatedAt: string;
  unreadCount: number;
  lastMessageTime?: string;
}

export default function MessagesPage() {
  const { user } = useAuth();
  const { socket, isConnected } = useSocket();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedConversation, setSelectedConversation] =
    useState<Conversation | null>(null);
  const [inputText, setInputText] = useState("");
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Record<string, MessageItem[]>>({});
  const [conversationsLoading, setConversationsLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(false);

  // Auto-scroll to bottom of chat
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, selectedConversation]);

  // Initialize with empty conversations (In a real app, fetch recent conversations from backend)
  useEffect(() => {
    // For now, start with empty conversations list
    // In production, you'd have an endpoint like GET /api/v1/messages/conversations
    setConversations([]);
    setConversationsLoading(false);
  }, []);

  // Load chat history when a conversation is selected
  useEffect(() => {
    if (!selectedConversation) return;

    const loadChatHistory = async () => {
      try {
        setMessagesLoading(true);
        const res = await messagesApi.getChatHistory(
          selectedConversation.participant.id,
          1,
          50,
        );

        // Convert API messages to MessageItem format
        const formattedMessages: MessageItem[] = res.data.messages.map(
          (msg: Message) => ({
            id: msg.id,
            senderId: msg.senderId,
            content: msg.content,
            createdAt: new Date(msg.createdAt).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            }),
          }),
        );

        setMessages((prev) => ({
          ...prev,
          [selectedConversation.id]: formattedMessages,
        }));
      } catch (err) {
        console.error("Failed to load chat history:", err);
      } finally {
        setMessagesLoading(false);
      }
    };

    loadChatHistory();
  }, [selectedConversation?.id]);

  // Listen for real-time WebSocket messages
  useEffect(() => {
    if (!socket) return;

    const handleReceiveMessage = (incomingMsg: {
      conversationId: string;
      message: MessageItem;
    }) => {
      setMessages((prev) => ({
        ...prev,
        [incomingMsg.conversationId]: [
          ...(prev[incomingMsg.conversationId] || []),
          incomingMsg.message,
        ],
      }));

      // Update last message in thread list
      setConversations((prev) =>
        prev.map((c) =>
          c.id === incomingMsg.conversationId
            ? {
                ...c,
                lastMessage: incomingMsg.message.content,
                updatedAt: "Just now",
              }
            : c,
        ),
      );
    };

    socket.on("receive_message", handleReceiveMessage);
    return () => {
      socket.off("receive_message", handleReceiveMessage);
    };
  }, [socket]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !selectedConversation || !user) return;

    const newMessage: MessageItem = {
      id: Date.now().toString(),
      senderId: user.id,
      content: inputText,
      createdAt: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };

    const convId = selectedConversation.id;

    // Update local message list
    setMessages((prev) => ({
      ...prev,
      [convId]: [...(prev[convId] || []), newMessage],
    }));

    // Update thread preview
    setConversations((prev) =>
      prev.map((c) =>
        c.id === convId
          ? { ...c, lastMessage: inputText, updatedAt: "Just now" }
          : c,
      ),
    );

    // Emit socket event if connected
    if (socket && isConnected) {
      socket.emit("send_message", {
        conversationId: convId,
        receiverId: selectedConversation.participant.id,
        message: newMessage,
      });
    }

    setInputText("");
  };

  const filteredConversations = conversations.filter((c) =>
    c.participant.username.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <div className="w-full h-screen flex flex-col sm:flex-row overflow-hidden bg-white dark:bg-black">
      {/* LEFT: Conversation Thread List */}
      <div
        className={`w-full sm:w-80 md:w-96 border-r border-pure-border-light dark:border-pure-border-dark flex flex-col h-full ${
          selectedConversation ? "hidden sm:flex" : "flex"
        }`}
      >
        {/* Header */}
        <div className="p-4 border-b border-pure-border-light dark:border-pure-border-dark flex items-center justify-between">
          <h1 className="text-lg font-black tracking-tight">Messages</h1>
          {isConnected && (
            <span className="flex items-center gap-1.5 text-xs text-emerald-500 font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Live
            </span>
          )}
        </div>

        {/* Search */}
        <div className="p-3 border-b border-pure-border-light dark:border-pure-border-dark">
          <div className="relative flex items-center">
            <Search
              size={16}
              className="absolute left-3 text-pure-gray-light dark:text-pure-gray-dark"
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search direct messages..."
              className="w-full pl-9 pr-4 py-2 text-xs rounded-xl bg-pure-hover-light dark:bg-pure-hover-dark border border-pure-border-light dark:border-pure-border-dark focus:outline-none text-black dark:text-white placeholder:text-pure-gray-light dark:placeholder:text-pure-gray-dark"
            />
          </div>
        </div>

        {/* Conversations List */}
        <div className="flex-1 overflow-y-auto divide-y divide-pure-border-light dark:divide-pure-border-dark">
          {conversationsLoading ? (
            <div className="p-8 flex items-center justify-center">
              <Loader2 className="animate-spin text-black dark:text-white" />
            </div>
          ) : filteredConversations.length > 0 ? (
            filteredConversations.map((conv) => {
              const isSelected = selectedConversation?.id === conv.id;
              return (
                <button
                  key={conv.id}
                  onClick={() => {
                    setSelectedConversation(conv);
                    // Clear unread count on select
                    setConversations((prev) =>
                      prev.map((c) =>
                        c.id === conv.id ? { ...c, unreadCount: 0 } : c,
                      ),
                    );
                  }}
                  className={`w-full p-4 flex gap-3 items-center text-left transition-colors ${
                    isSelected
                      ? "bg-pure-hover-light dark:bg-pure-hover-dark"
                      : "hover:bg-pure-hover-light/40 dark:hover:bg-pure-hover-dark/40"
                  }`}
                >
                  {/* Avatar */}
                  <div className="relative shrink-0">
                    <div className="w-10 h-10 rounded-full bg-black dark:bg-white text-white dark:text-black flex items-center justify-center font-black text-sm uppercase">
                      {conv.participant.avatarUrl ? (
                        <img
                          src={conv.participant.avatarUrl}
                          alt={conv.participant.username}
                          className="w-full h-full rounded-full object-cover"
                        />
                      ) : (
                        conv.participant.username.charAt(0)
                      )}
                    </div>
                    {conv.participant.isOnline && (
                      <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 border-2 border-white dark:border-black" />
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center mb-0.5">
                      <span className="text-sm font-extrabold truncate text-black dark:text-white">
                        @{conv.participant.username}
                      </span>
                      <span className="text-xs text-pure-gray-light dark:text-pure-gray-dark shrink-0">
                        {conv.updatedAt}
                      </span>
                    </div>
                    <p className="text-xs text-pure-gray-light dark:text-pure-gray-dark truncate font-medium">
                      {conv.lastMessage}
                    </p>
                  </div>

                  {/* Unread Badge */}
                  {conv.unreadCount > 0 && (
                    <span className="w-5 h-5 rounded-full bg-black text-white dark:bg-white dark:text-black font-extrabold text-[10px] flex items-center justify-center shrink-0">
                      {conv.unreadCount}
                    </span>
                  )}
                </button>
              );
            })
          ) : (
            <div className="p-8 text-center text-xs font-medium text-pure-gray-light dark:text-pure-gray-dark">
              No conversations found.
            </div>
          )}
        </div>
      </div>

      {/* RIGHT: Selected Active Chat View */}
      <div
        className={`flex-1 flex flex-col h-full bg-white dark:bg-black ${
          !selectedConversation ? "hidden sm:flex" : "flex"
        }`}
      >
        {selectedConversation ? (
          <>
            {/* Active Header */}
            <div className="p-4 border-b border-pure-border-light dark:border-pure-border-dark flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setSelectedConversation(null)}
                  className="sm:hidden p-1.5 rounded-xl hover:bg-pure-hover-light dark:hover:bg-pure-hover-dark"
                >
                  <ArrowLeft size={18} />
                </button>
                <div className="w-8 h-8 rounded-full bg-black dark:bg-white text-white dark:text-black flex items-center justify-center font-bold text-xs uppercase">
                  {selectedConversation.participant.avatarUrl ? (
                    <img
                      src={selectedConversation.participant.avatarUrl}
                      alt={selectedConversation.participant.username}
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    selectedConversation.participant.username.charAt(0)
                  )}
                </div>
                <div>
                  <h2 className="text-sm font-black text-black dark:text-white">
                    @{selectedConversation.participant.username}
                  </h2>
                  <p className="text-[11px] text-pure-gray-light dark:text-pure-gray-dark font-medium">
                    {selectedConversation.participant.isOnline
                      ? "Active now"
                      : "Offline"}
                  </p>
                </div>
              </div>

              <button className="p-1.5 rounded-xl hover:bg-pure-hover-light dark:hover:bg-pure-hover-dark text-pure-gray-light dark:text-pure-gray-dark hover:text-black dark:hover:text-white">
                <MoreVertical size={18} />
              </button>
            </div>

            {/* Message Stream */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messagesLoading ? (
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="animate-spin text-black dark:text-white" />
                </div>
              ) : (messages[selectedConversation.id] || []).length > 0 ? (
                (messages[selectedConversation.id] || []).map((msg) => {
                  const isMe = msg.senderId === (user?.id || "");
                  return (
                    <motion.div
                      key={msg.id}
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}
                    >
                      <div
                        className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-medium leading-relaxed ${
                          isMe
                            ? "bg-black text-white dark:bg-white dark:text-black rounded-br-none"
                            : "bg-pure-hover-light dark:bg-pure-hover-dark text-black dark:text-white rounded-bl-none border border-pure-border-light dark:border-pure-border-dark"
                        }`}
                      >
                        {msg.content}
                      </div>
                      <div className="flex items-center gap-1 mt-1 text-[10px] text-pure-gray-light dark:text-pure-gray-dark px-1">
                        <span>{msg.createdAt}</span>
                        {isMe && (
                          <CheckCheck
                            size={12}
                            className="text-black dark:text-white"
                          />
                        )}
                      </div>
                    </motion.div>
                  );
                })
              ) : (
                <div className="flex items-center justify-center h-full text-xs text-pure-gray-light dark:text-pure-gray-dark">
                  No messages yet. Start the conversation!
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Bar */}
            <form
              onSubmit={handleSendMessage}
              className="p-3 border-t border-pure-border-light dark:border-pure-border-dark flex items-center gap-2"
            >
              <button
                type="button"
                className="p-2 rounded-xl hover:bg-pure-hover-light dark:hover:bg-pure-hover-dark text-pure-gray-light dark:text-pure-gray-dark"
              >
                <Image size={18} />
              </button>
              <button
                type="button"
                className="p-2 rounded-xl hover:bg-pure-hover-light dark:hover:bg-pure-hover-dark text-pure-gray-light dark:text-pure-gray-dark"
              >
                <Smile size={18} />
              </button>

              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Start a new message..."
                className="flex-1 py-2 px-4 text-xs sm:text-sm rounded-xl bg-pure-hover-light dark:bg-pure-hover-dark border border-pure-border-light dark:border-pure-border-dark focus:outline-none text-black dark:text-white placeholder:text-pure-gray-light dark:placeholder:text-pure-gray-dark"
              />

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                disabled={!inputText.trim()}
                type="submit"
                className="p-2.5 rounded-xl bg-black text-white dark:bg-white dark:text-black disabled:opacity-40 disabled:cursor-not-allowed transition-opacity"
              >
                <Send size={16} />
              </motion.button>
            </form>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
            <div className="w-16 h-16 rounded-full bg-pure-hover-light dark:bg-pure-hover-dark flex items-center justify-center mb-4">
              <Send
                size={24}
                className="text-pure-gray-light dark:text-pure-gray-dark"
              />
            </div>
            <h3 className="text-base font-black text-black dark:text-white mb-1">
              Select a message
            </h3>
            <p className="text-xs text-pure-gray-light dark:text-pure-gray-dark max-w-xs font-medium">
              Choose from your existing conversations or start a new one.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

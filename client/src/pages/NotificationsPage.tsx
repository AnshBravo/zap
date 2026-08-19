import React, { useState, useEffect } from "react";
import { Heart, MessageCircle, UserPlus, Zap, BellOff } from "lucide-react";
import { motion } from "framer-motion";

export interface NotificationItem {
  id: string;
  type: "like" | "reply" | "follow";
  user: {
    username: string;
    avatarUrl?: string;
  };
  content?: string;
  createdAt: string;
  read: boolean;
}

interface NotificationsPageProps {
  socket?: any; // Socket.io instance passed via context/props
}

export default function NotificationsPage({ socket }: NotificationsPageProps) {
  const [activeTab, setActiveTab] = useState<"all" | "mentions">("all");
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  useEffect(() => {
    if (!socket) return;

    // Listen for incoming live notifications from backend Socket events
    const handleNotification = (newNotification: NotificationItem) => {
      setNotifications((prev) => [newNotification, ...prev]);
    };

    socket.on("notification", handleNotification);

    return () => {
      socket.off("notification", handleNotification);
    };
  }, [socket]);

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const filteredNotifications = notifications.filter((item) => {
    if (activeTab === "mentions") {
      return item.type === "reply";
    }
    return true;
  });

  const getNotificationIcon = (type: NotificationItem["type"]) => {
    switch (type) {
      case "like":
        return <Heart size={16} className="text-red-500 fill-red-500" />;
      case "reply":
        return (
          <MessageCircle size={16} className="text-blue-500 fill-blue-500" />
        );
      case "follow":
        return <UserPlus size={16} className="text-emerald-500" />;
      default:
        return <Zap size={16} className="text-amber-500" />;
    }
  };

  return (
    <div className="w-full min-h-screen">
      {/* Header */}
      <div className="sticky top-0 z-10 backdrop-blur-md bg-white/80 dark:bg-black/80 border-b border-pure-border-light dark:border-pure-border-dark px-6 py-3 flex items-center justify-between">
        <h1 className="text-lg font-black tracking-tight">Notifications</h1>
        {notifications.some((n) => !n.read) && (
          <button
            onClick={markAllAsRead}
            className="text-xs font-bold text-pure-gray-light dark:text-pure-gray-dark hover:text-black dark:hover:text-white transition-colors"
          >
            Mark all read
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-pure-border-light dark:border-pure-border-dark">
        {(["all", "mentions"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-3.5 text-xs sm:text-sm font-bold capitalize transition-all relative ${
              activeTab === tab
                ? "text-black dark:text-white"
                : "text-pure-gray-light dark:text-pure-gray-dark hover:text-black dark:hover:text-white"
            }`}
          >
            {tab}
            {activeTab === tab && (
              <motion.div
                layoutId="notificationTabIndicator"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-black dark:bg-white"
              />
            )}
          </button>
        ))}
      </div>

      {/* List */}
      {filteredNotifications.length === 0 ? (
        <div className="p-12 text-center text-pure-gray-light dark:text-pure-gray-dark space-y-2">
          <BellOff size={28} className="mx-auto opacity-50" />
          <p className="text-xs font-medium">Nothing to see here yet.</p>
        </div>
      ) : (
        <div className="divide-y divide-pure-border-light dark:divide-pure-border-dark">
          {filteredNotifications.map((item) => (
            <div
              key={item.id}
              className={`p-4 flex gap-3 transition-colors ${
                !item.read
                  ? "bg-pure-hover-light/50 dark:bg-pure-hover-dark/50"
                  : "hover:bg-pure-hover-light/20 dark:hover:bg-pure-hover-dark/20"
              }`}
            >
              <div className="pt-1">{getNotificationIcon(item.type)}</div>

              <div className="flex-1 space-y-1">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-black dark:bg-white text-white dark:text-black flex items-center justify-center font-bold text-xs uppercase">
                    {item.user.avatarUrl ? (
                      <img
                        src={item.user.avatarUrl}
                        alt={item.user.username}
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      item.user.username.charAt(0)
                    )}
                  </div>
                  <span className="text-xs sm:text-sm font-bold">
                    @{item.user.username}
                  </span>
                  {item.type === "follow" && (
                    <span className="text-xs text-pure-gray-light dark:text-pure-gray-dark">
                      followed you
                    </span>
                  )}
                </div>

                {item.content && (
                  <p className="text-xs sm:text-sm leading-relaxed text-pure-gray-light dark:text-pure-gray-dark">
                    {item.content}
                  </p>
                )}

                <p className="text-[10px] text-pure-gray-light dark:text-pure-gray-dark pt-1">
                  {new Date(item.createdAt).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

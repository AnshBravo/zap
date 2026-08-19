import React, { useState } from "react";
import {
  Heart,
  MessageSquare,
  Repeat2,
  UserPlus,
  Zap,
  Settings,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export interface NotificationItem {
  id: string;
  type: "like" | "reply" | "repost" | "follow";
  user: {
    username: string;
    displayName: string;
  };
  content?: string;
  time: string;
  read: boolean;
}

export default function NotificationsPage() {
  const [activeTab, setActiveTab] = useState<"all" | "mentions">("all");

  const [notifications, setNotifications] = useState<NotificationItem[]>([
    {
      id: "1",
      type: "like",
      user: { username: "zapteam", displayName: "Zap Team" },
      content: "liked your Zap: 'Building minimalist web experiences.'",
      time: "10m",
      read: false,
    },
    {
      id: "2",
      type: "follow",
      user: { username: "alex_dev", displayName: "Alex Rivera" },
      content: "followed you",
      time: "1h",
      read: false,
    },
    {
      id: "3",
      type: "reply",
      user: { username: "sarah_k", displayName: "Sarah Chen" },
      content: "replied: 'Clean B&W design system! Very sleek.'",
      time: "3h",
      read: true,
    },
    {
      id: "4",
      type: "repost",
      user: { username: "design_daily", displayName: "Design Daily" },
      content: "reposted your Zap",
      time: "5h",
      read: true,
    },
  ]);

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const filteredNotifications = notifications.filter((n) => {
    if (activeTab === "mentions") return n.type === "reply";
    return true;
  });

  const getNotificationIcon = (type: NotificationItem["type"]) => {
    switch (type) {
      case "like":
        return <Heart size={18} className="text-rose-500 fill-rose-500" />;
      case "reply":
        return (
          <MessageSquare size={18} className="text-black dark:text-white" />
        );
      case "repost":
        return <Repeat2 size={18} className="text-emerald-500" />;
      case "follow":
        return <UserPlus size={18} className="text-black dark:text-white" />;
      default:
        return <Zap size={18} className="text-black dark:text-white" />;
    }
  };

  return (
    <div className="w-full min-h-screen">
      {/* Sticky Header */}
      <div className="sticky top-0 z-10 backdrop-blur-md bg-white/80 dark:bg-black/80 border-b border-pure-border-light dark:border-pure-border-dark px-6 py-3 flex items-center justify-between">
        <h1 className="text-lg font-black tracking-tight">Notifications</h1>
        <div className="flex items-center gap-3">
          {notifications.some((n) => !n.read) && (
            <button
              onClick={markAllAsRead}
              className="text-xs font-bold underline hover:opacity-80 transition-opacity"
            >
              Mark all read
            </button>
          )}
          <button className="p-1.5 rounded-xl hover:bg-pure-hover-light dark:hover:bg-pure-hover-dark transition-colors text-pure-gray-light dark:text-pure-gray-dark hover:text-black dark:hover:text-white">
            <Settings size={18} />
          </button>
        </div>
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
                layoutId="notifTabIndicator"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-black dark:bg-white"
              />
            )}
          </button>
        ))}
      </div>

      {/* Notifications List */}
      <div className="divide-y divide-pure-border-light dark:divide-pure-border-dark">
        <AnimatePresence>
          {filteredNotifications.length > 0 ? (
            filteredNotifications.map((notif) => (
              <motion.div
                key={notif.id}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className={`p-4 flex gap-4 transition-colors ${
                  !notif.read
                    ? "bg-pure-hover-light/60 dark:bg-pure-hover-dark/60"
                    : "hover:bg-pure-hover-light/30 dark:hover:bg-pure-hover-dark/30"
                }`}
              >
                {/* Type Icon */}
                <div className="pt-0.5 shrink-0">
                  {getNotificationIcon(notif.type)}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-black dark:bg-white text-white dark:text-black flex items-center justify-center font-black text-xs shrink-0 uppercase">
                      {notif.user.username.charAt(0)}
                    </div>
                    <span className="text-sm font-extrabold truncate text-black dark:text-white">
                      {notif.user.displayName}
                    </span>
                    <span className="text-xs font-medium text-pure-gray-light dark:text-pure-gray-dark truncate">
                      @{notif.user.username}
                    </span>
                    <span className="text-pure-gray-light dark:text-pure-gray-dark text-xs font-medium ml-auto">
                      {notif.time}
                    </span>
                  </div>

                  <p className="text-sm text-black dark:text-white leading-relaxed pl-9">
                    {notif.content}
                  </p>
                </div>
              </motion.div>
            ))
          ) : (
            <div className="p-12 text-center text-sm font-medium text-pure-gray-light dark:text-pure-gray-dark">
              No {activeTab} notifications yet.
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

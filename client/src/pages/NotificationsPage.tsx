import { useState, useEffect } from "react";
import { Heart, MessageCircle, UserPlus, Zap, BellOff } from "lucide-react";
import { motion } from "framer-motion";
import { useSocket } from "../context/SocketContext";
import type { NotificationItem } from "../types";

export default function NotificationsPage() {
  const { socket } = useSocket();
  const [activeTab, setActiveTab] = useState<"all" | "mentions">("all");
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  useEffect(() => {
    if (!socket) return;

    const handleNotification = (payload: any) => {
      const normalized: NotificationItem = {
        id: `${payload.type}-${payload.postId || payload.followerId || Date.now()}`,
        type: payload.type,
        message: payload.message || "New activity on Zap.",
        postId: payload.postId,
        commentId: payload.commentId,
        followerId: payload.followerId,
        triggerBy: payload.triggeredBy,
        createdAt: new Date().toISOString(),
        read: false,
      };

      setNotifications((prev) => [normalized, ...prev]);
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
      return item.type === "COMMENT";
    }
    return true;
  });

  const getNotificationIcon = (type: NotificationItem["type"]) => {
    switch (type) {
      case "LIKE":
        return <Heart size={16} className="text-red-500 fill-red-500" />;
      case "COMMENT":
        return (
          <MessageCircle size={16} className="text-blue-500 fill-blue-500" />
        );
      case "FOLLOW":
        return <UserPlus size={16} className="text-emerald-500" />;
      default:
        return <Zap size={16} className="text-amber-500" />;
    }
  };

  return (
    <div className="w-full min-h-screen">
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
                    {item.triggerBy?.avatarUrl ? (
                      <img
                        src={item.triggerBy.avatarUrl}
                        alt={item.triggerBy.username}
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      item.triggerBy?.username?.charAt(0) || "Z"
                    )}
                  </div>
                  <span className="text-xs sm:text-sm font-bold">
                    @{item.triggerBy?.username || "zap_user"}
                  </span>
                  {item.type === "FOLLOW" && (
                    <span className="text-xs text-pure-gray-light dark:text-pure-gray-dark">
                      followed you
                    </span>
                  )}
                </div>

                <p className="text-xs sm:text-sm leading-relaxed text-pure-gray-light dark:text-pure-gray-dark">
                  {item.message}
                </p>

                <p className="text-[10px] text-pure-gray-light dark:text-pure-gray-dark pt-1">
                  {item.createdAt
                    ? new Date(item.createdAt).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    : "Just now"}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

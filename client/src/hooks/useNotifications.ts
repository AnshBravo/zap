import { useCallback, useEffect, useMemo, useState } from "react";
import { useSocket } from "../context/useSocket";
import type { NotificationItem } from "../types";

type NotificationPayload = Omit<NotificationItem, "id" | "createdAt" | "read">;
type NotificationTab = "all" | "mentions";

function readNotifications(key: string): NotificationItem[] {
  try {
    const stored = JSON.parse(localStorage.getItem(key) || "[]");
    return Array.isArray(stored) ? (stored as NotificationItem[]) : [];
  } catch {
    return [];
  }
}

export function useNotifications(userId: string | undefined) {
  const { socket } = useSocket();
  const storageKey = userId
    ? `zap_notifications_${userId}`
    : "zap_notifications";
  const [activeTab, setActiveTab] = useState<NotificationTab>("all");
  const [notificationState, setNotificationState] = useState(() => ({
    key: storageKey,
    items: readNotifications(storageKey),
  }));
  const notifications =
    notificationState.key === storageKey
      ? notificationState.items
      : readNotifications(storageKey);

  const updateNotifications = useCallback(
    (update: (current: NotificationItem[]) => NotificationItem[]) => {
      setNotificationState((current) => ({
        key: storageKey,
        items: update(
          current.key === storageKey
            ? current.items
            : readNotifications(storageKey),
        ),
      }));
    },
    [storageKey],
  );

  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(notifications));
  }, [notifications, storageKey]);

  useEffect(() => {
    if (!socket) return;
    const handleNotification = (payload: NotificationPayload) => {
      const now = Date.now();
      const notification: NotificationItem = {
        ...payload,
        id: `${payload.type}-${payload.postId || payload.followerId || now}-${now}`,
        message: payload.message || "New activity on Zap.",
        createdAt: new Date(now).toISOString(),
        read: false,
      };
      updateNotifications((current) => [notification, ...current]);
    };

    socket.on("notification", handleNotification);
    return () => {
      socket.off("notification", handleNotification);
    };
  }, [socket, updateNotifications]);

  const markAllAsRead = () => {
    updateNotifications((current) =>
      current.map((notification) => ({ ...notification, read: true })),
    );
  };

  const filteredNotifications = useMemo(
    () =>
      notifications.filter(
        (notification) =>
          activeTab === "all" || notification.type === "COMMENT",
      ),
    [activeTab, notifications],
  );

  return {
    activeTab,
    setActiveTab,
    notifications,
    filteredNotifications,
    markAllAsRead,
  };
}

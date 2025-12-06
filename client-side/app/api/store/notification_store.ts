import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { NotificationResponseDTO } from "../dto/response/notification.response.dto";
import {
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
} from "../notifications";

interface NotificationState {
  notifications: NotificationResponseDTO[];
  unreadCount: number;
  isLoading: boolean;

  // Actions
  setNotifications: (notifications: NotificationResponseDTO[]) => void;
  addNotification: (notification: NotificationResponseDTO) => void;
  markAsRead: (notificationId: number) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (notificationId: number) => Promise<void>;
  fetchNotifications: () => Promise<void>;
  clearNotifications: () => void;
}

export const useNotificationStore = create<NotificationState>()(
  persist(
    (set, get) => ({
      notifications: [],
      unreadCount: 0,
      isLoading: false,

      setNotifications: (notifications) => {
        const unreadCount = notifications.filter((n) => !n.pressed).length;
        set({ notifications, unreadCount });
      },

      addNotification: (notification) => {
        const currentNotifications = get().notifications;
        // Check if notification already exists
        const exists = currentNotifications.some(
          (n) => n.notificationPkId === notification.notificationPkId
        );
        if (exists) {
          console.log(
            `Notification ${notification.notificationPkId} already exists, skipping duplicate`
          );
          return;
        }
        // Add to the beginning of the list
        const updatedNotifications = [notification, ...currentNotifications];
        const unreadCount = updatedNotifications.filter(
          (n) => !n.pressed
        ).length;
        set({ notifications: updatedNotifications, unreadCount });
      },

      markAsRead: async (notificationId) => {
        try {
          await markNotificationAsRead(notificationId);
          const notifications = get().notifications.map((n) =>
            n.notificationPkId === notificationId ? { ...n, pressed: true } : n
          );
          const unreadCount = notifications.filter((n) => !n.pressed).length;
          set({ notifications, unreadCount });
        } catch (error) {
          console.error("Failed to mark notification as read:", error);
        }
      },

      markAllAsRead: async () => {
        try {
          await markAllNotificationsAsRead();
          const notifications = get().notifications.map((n) => ({
            ...n,
            pressed: true,
          }));
          set({ notifications, unreadCount: 0 });
        } catch (error) {
          console.error("Failed to mark all notifications as read:", error);
        }
      },
      deleteNotification: async (notificationId) => {
        try {
          await deleteNotification(notificationId);
          const notifications = get().notifications.filter(
            (n) => n.notificationPkId !== notificationId
          );
          set({ notifications });
        } catch (error) {
          console.error("Failed to delete notification:", error);
        }
      },

      fetchNotifications: async () => {
        try {
          set({ isLoading: true });
          const notifications = await getNotifications();
          console.log(`Fetched ${notifications.length} notifications`);
          const unreadCount = notifications.filter((n) => !n.pressed).length;
          set({ notifications, unreadCount, isLoading: false });
        } catch (error) {
          console.error("Failed to fetch notifications:", error);
          set({ isLoading: false });
        }
      },

      clearNotifications: () => {
        set({ notifications: [], unreadCount: 0 });
      },
    }),
    {
      name: "notification-storage",
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        notifications: state.notifications,
        unreadCount: state.unreadCount,
      }),
    }
  )
);

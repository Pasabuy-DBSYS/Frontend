import axios from "axios";
import { API_BASE_URL } from "./config";
import { useAuthStore } from "./store/auth_store";
import { NotificationResponseDTO } from "./dto/response/notification.response.dto";

const BASE_URL = `${API_BASE_URL}/Notifications`;

export const getNotifications = async (): Promise<
  NotificationResponseDTO[]
> => {
  try {
    const token = useAuthStore.getState().token;

    const response = await axios.get<NotificationResponseDTO[]>(
      `${BASE_URL}/user`,
      {
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
      }
    );

    console.log(
      `✅ [getNotifications] Fetched ${response.data.length} notifications`
    );
    return response.data;
  } catch (error: any) {
    console.error(
      "❌ [getNotifications] Error:",
      error.response?.data || error.message
    );
    throw error;
  }
};

export const markNotificationAsRead = async (
  notificationId: number
): Promise<NotificationResponseDTO> => {
  try {
    const token = useAuthStore.getState().token;

    console.log(`${BASE_URL}/read/${notificationId}`);
    const response = await axios.patch<NotificationResponseDTO>(
      `${BASE_URL}/read/${notificationId}`,
      {},
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return response.data;
  } catch (error: any) {
    console.error(
      "❌ [markNotificationAsRead] Error:",
      error.response?.data || error.message
    );
    throw error;
  }
};

export const markAllNotificationsAsRead = async (): Promise<void> => {
  try {
    const token = useAuthStore.getState().token;
    await axios.patch(
      `${BASE_URL}/read-all`,
      {},
      {
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
      }
    );
  } catch (error: any) {
    console.error(
      "❌ [markAllNotificationsAsRead] Error:",
      error.response?.data || error.message
    );
    throw error;
  }
};

export const deleteNotification = async (
  notificationId: number
): Promise<void> => {
  try {
    const token = useAuthStore.getState().token;
    await axios.delete(`${BASE_URL}/${notificationId}`, {
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
    });
  } catch (error: any) {
    console.error(
      "❌ [deleteNotification] Error:",
      error.response?.data || error.message
    );
    throw error;
  }
};

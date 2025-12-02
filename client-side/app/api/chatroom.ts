import axios from "axios";
import { API_BASE_URL } from "./config";
import { ChatRoomResponseDTO } from "./dto/response/chat.response.dto";
import { useAuthStore } from "./store/auth_store";

export const getChatRoomByOrderId = async (
  orderId: number
): Promise<ChatRoomResponseDTO> => {
  try {
    const { token } = useAuthStore.getState();
    const response = await axios.get<ChatRoomResponseDTO>(
      `${API_BASE_URL}/ChatRoom/order/${orderId}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    console.log(`CHAT ROOM FETCHED FOR ORDER ${orderId}:`, response.data);
    return response.data;
  } catch (err) {
    console.error("Failed to fetch chat room by order ID", err);
    throw err;
  }
};

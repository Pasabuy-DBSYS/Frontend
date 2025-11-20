import axios from "axios";
import { API_BASE_URL } from "./config";
import {
  MessageImageRequestDTO,
  MessageRequestDTO,
  MessageType,
} from "./dto/request/message.request.dto";
import {
  ChatMessagesResponseDTO,
  ChatRoomResponseDTO,
} from "./dto/response/chat.response.dto";
import { useAuthStore } from "./store/auth_store";
import { useChatsHubStore } from "./store/chat_hub_store";
const BASE_URL = `${API_BASE_URL}/ChatMessages`;

export const postTextMessage = async (
  messageRequest: MessageRequestDTO
): Promise<ChatMessagesResponseDTO> => {
  const { token } = useAuthStore.getState();

  try {
    const { data } = await axios.post<ChatMessagesResponseDTO>(
      `${BASE_URL}/send/text`,
      messageRequest,
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return data;
  } catch (err) {
    console.error("Failed to send chat message", err);
    throw err;
  }
};
export const postImageMessage = async (form: FormData) => {
  const { token } = useAuthStore.getState();

  try {
    const { data } = await axios.post(`${BASE_URL}/send/image`, form, {
      headers: {
        "Content-Type": "multipart/form-data",
        Authorization: `Bearer ${token}`,
      },
    });

    return data;
  } catch (error: any) {
    console.error("❌ Failed to send chat image message.");

    if (error.response) {
      console.error("🔍 Server responded with status:", error.response.status);
      console.error("📝 Server error details:", error.response.data);
      throw new Error(
        error.response.data?.errors?.Image?.[0] ||
          error.response.data?.message ||
          "Server rejected the image upload."
      );
    }

    if (error.request) {
      throw new Error("No response from server. Check your network.");
    }

    throw new Error("Unexpected error sending image message.");
  }
};

export const getMessagesByRoomId = async (
  roomId: number
): Promise<ChatMessagesResponseDTO[]> => {
  try {
    const token = useAuthStore.getState().token;

    console.log(`TOKEN USED FOR MESS ID: ${token}`);
    const { data } = await axios.get<ChatMessagesResponseDTO[]>(
      `${BASE_URL}/${roomId}`,
      {
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return data;
  } catch (err) {
    console.error(`Failed to fetch messages for room ${roomId}`, err);
    throw err;
  }
};

export const loadImageByKey = async (keyarg: string): Promise<any> => {
  const { token } = useAuthStore.getState();

  try {
    const encodedKey = encodeURIComponent(keyarg);

    const { data } = await axios.get(
      `${API_BASE_URL}/Resources/signed-url?key=${encodedKey}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    return data.signedUrl; // your backend returns SignedUrl
  } catch (error) {
    console.error("❌ Failed to load signed image URL");

    if (axios.isAxiosError(error)) {
      console.error("🔍 Status:", error.response?.status);
      console.error("📝 Details:", error.response?.data);
    } else {
      console.error("Unexpected error:", error);
    }

    throw error;
  }
};

export const subscribeToMessages = async (
  roomId: number,
  onReceive: (message: ChatMessagesResponseDTO) => void
): Promise<() => void> => {
  const { connection, initConnection } = useChatsHubStore.getState();

  if (!connection || connection.state !== "Connected") {
    await initConnection();
    console.log(`CONNECTION: ${JSON.stringify(connection)}`);
  }

  const activeConnection = useChatsHubStore.getState().connection!;
  try {
    await activeConnection.invoke("JoinRoom", roomId);
  } catch (err) {
    console.error("Failed to join room:", err);
    throw err;
  }

  const handler = (newMessage: ChatMessagesResponseDTO) => {
    onReceive(newMessage);
  };

  activeConnection.on("ReceiveMessage", handler);

  return () => {
    activeConnection.off("ReceiveMessage", handler);
    activeConnection.invoke("LeaveRoom", roomId).catch(() => {});
  };
};

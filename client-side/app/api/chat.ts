import axios from "axios";
import { API_BASE_URL } from "./config";
import { MessageRequestDTO } from "./dto/request/message.request.dto";
import {
  ChatMessagesResponseDTO,
  ChatRoomResponseDTO,
} from "./dto/response/chat.response.dto";
import { useAuthStore } from "./store/auth_store";
import { useChatsHubStore } from "./store/chat_hub_store";
const BASE_URL = `${API_BASE_URL}/ChatMessages`;

export const postMessage = async (
  messageRequest: MessageRequestDTO
): Promise<ChatMessagesResponseDTO> => {
  const { token } = useAuthStore.getState();

  try {
    const { data } = await axios.post<ChatMessagesResponseDTO>(
      `${BASE_URL}/send`,
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
    // ✅ match backend: pass roomId as a number (SignalR serializes it properly)
    await activeConnection.invoke("JoinRoom", roomId);
  } catch (err) {
    console.error("❌ Failed to join room:", err);
    throw err;
  }

  const handler = (newMessage: ChatMessagesResponseDTO) => {
    onReceive(newMessage);
  };

  activeConnection.on("ReceiveMessage", handler);

  return () => {
    activeConnection.off("ReceiveMessage", handler);
    // optional cleanup — not required for correctness
    activeConnection.invoke("LeaveRoom", roomId).catch(() => {});
  };
};

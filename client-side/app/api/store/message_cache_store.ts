import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { ChatMessagesResponseDTO } from "../dto/response/chat.response.dto";
import { useActiveOrderStore } from "./order_store";
import { useAuthStore } from "./auth_store";
import axios from "axios";
import { API_BASE_URL } from "../config";

const BASE_URL = `${API_BASE_URL}/ChatMessages`;

interface MessageCacheState {
  // Messages keyed by roomId
  messagesByRoom: Record<number, ChatMessagesResponseDTO[]>;

  // Get messages for a specific room
  getMessages: (roomId: number) => ChatMessagesResponseDTO[];

  // Set all messages for a room (replaces existing)
  setMessages: (roomId: number, messages: ChatMessagesResponseDTO[]) => void;

  // Add a single message to a room (for real-time updates)
  addMessage: (roomId: number, message: ChatMessagesResponseDTO) => void;

  // Clear messages for a specific room
  clearRoom: (roomId: number) => void;

  // Clear all cached messages
  clearAll: () => void;

  // Rehydrate messages from API for active order's room
  rehydrateMessages: () => Promise<number | null>;
}

export const useMessageCacheStore = create<MessageCacheState>()(
  persist(
    (set, get) => ({
      messagesByRoom: {},

      getMessages: (roomId: number) => {
        return get().messagesByRoom[roomId] ?? [];
      },

      setMessages: (roomId: number, messages: ChatMessagesResponseDTO[]) => {
        set((state) => ({
          messagesByRoom: {
            ...state.messagesByRoom,
            [roomId]: messages,
          },
        }));
      },

      addMessage: (roomId: number, message: ChatMessagesResponseDTO) => {
        set((state) => {
          const existing = state.messagesByRoom[roomId] ?? [];

          // Avoid duplicates by checking messageIdPK
          const alreadyExists = existing.some(
            (m) => m.messageIdPK === message.messageIdPK
          );
          if (alreadyExists) {
            return state;
          }

          return {
            messagesByRoom: {
              ...state.messagesByRoom,
              [roomId]: [...existing, message],
            },
          };
        });
      },

      clearRoom: (roomId: number) => {
        set((state) => {
          const { [roomId]: _, ...rest } = state.messagesByRoom;
          return { messagesByRoom: rest };
        });
      },

      clearAll: () => {
        set({ messagesByRoom: {} });
      },

      rehydrateMessages: async () => {
        const { token } = useAuthStore.getState();
        const { activeOrder } = useActiveOrderStore.getState();

        const roomId = activeOrder?.chatRoomResponseDTO?.roomIdPK;

        if (!token || !roomId) {
          console.log(
            "🚦 [rehydrateMessages] No token or roomId, skipping rehydration."
          );
          return null;
        }

        try {
          console.log(
            `🔄 [rehydrateMessages] Fetching messages for room: ${roomId}`
          );

          const { data } = await axios.get<ChatMessagesResponseDTO[]>(
            `${BASE_URL}/${roomId}`,
            {
              headers: {
                Accept: "application/json",
                Authorization: `Bearer ${token}`,
              },
            }
          );

          if (data && data.length > 0) {
            console.log(
              `✅ [rehydrateMessages] Fetched ${data.length} messages for room ${roomId}`
            );
            set((state) => ({
              messagesByRoom: {
                ...state.messagesByRoom,
                [roomId]: data,
              },
            }));
          } else {
            console.log(
              `🔍 [rehydrateMessages] No messages found for room ${roomId}`
            );
          }

          return roomId;
        } catch (err: any) {
          const status = err?.response?.status;
          console.error(
            `❌ [rehydrateMessages] Failed to fetch messages (Status: ${
              status || "Network"
            })`,
            err
          );
          return roomId; // Still return roomId even on error so UI can show the room
        }
      },
    }),
    {
      name: "message-cache-storage",
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

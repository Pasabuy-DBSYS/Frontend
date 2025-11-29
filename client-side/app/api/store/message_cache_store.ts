import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { ChatMessagesResponseDTO } from "../dto/response/chat.response.dto";

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
    }),
    {
      name: "message-cache-storage",
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

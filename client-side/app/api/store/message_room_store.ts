import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { useAuthStore } from "./auth_store";
import { useActiveOrderStore } from "./order_store";
import { getChatRoomByOrderId } from "../chatroom";

export interface MessageRoomParticipants {
  roomId: number | null;
  senderId: number | null;
  receiverId: number | null;
}

export interface RoomInfo {
  roomId: number | null;
  myId: number | null;
  otherId: number | null;
  isCourier: boolean;
}

interface MessageRoomState {
  messageRoomParticipants: MessageRoomParticipants | null;
  setMessageRoomParticipants: (request: MessageRoomParticipants) => void;
  clearMessageRoom: () => Promise<void>;
  rehydrateMessageRoom: () => void;

  // Non-persisted (transient state)
  isFocused: boolean;
  setIsFocused: (value: boolean) => void;
}

export const useMessageRoomState = create<MessageRoomState>()(
  persist(
    (set, get) => ({
      messageRoomParticipants: null,
      setMessageRoomParticipants: (request) =>
        set({ messageRoomParticipants: request }),

      isFocused: false,
      setIsFocused: (value) => set({ isFocused: value }),

      clearMessageRoom: async () => {
        set({ messageRoomParticipants: null, isFocused: false });
        await AsyncStorage.removeItem("message-room-participants");
      },

      rehydrateMessageRoom: async () => {
        const { activeOrder } = useActiveOrderStore.getState();

        if (!activeOrder?.chatRoomResponseDTO?.roomIdPK) {
          console.log(
            "🚦 [rehydrateMessageRoom] No active order or chat room, clearing message room."
          );
          get().clearMessageRoom();
          return;
        }
        const chatRoom = await getChatRoomByOrderId(activeOrder.orderIdPK);

        const participants: MessageRoomParticipants = {
          roomId: chatRoom.roomIdPK,
          senderId: activeOrder.courierId ?? null,
          receiverId: activeOrder.customerId ?? null,
        };

        console.log(
          `✅ [rehydrateMessageRoom] Restored from activeOrder: roomId=${chatRoom.roomIdPK}`
        );
        set({ messageRoomParticipants: participants });
      },
    }),
    {
      name: "message-room-participants",
      storage: createJSONStorage(() => AsyncStorage),
      // Only persist messageRoomParticipants, NOT isFocused (transient state)
      partialize: (state) => ({
        messageRoomParticipants: state.messageRoomParticipants,
      }),
    }
  )
);

export const useMessageRoomInfo = (): RoomInfo | null => {
  const { messageRoomParticipants } = useMessageRoomState();
  const currentUserId = useAuthStore((s) => s.user?.userIdPK ?? null);

  if (!messageRoomParticipants || !currentUserId) return null;

  const { senderId, receiverId, roomId } = messageRoomParticipants;
  const isCourier = currentUserId === senderId;

  const myId = currentUserId;
  const otherId = isCourier ? receiverId : senderId;

  const roomInfo: RoomInfo = {
    roomId,
    myId,
    otherId,
    isCourier,
  };

  return roomInfo;
};

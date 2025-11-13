import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { useAuthStore } from "./auth_store";

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
}

export const useMessageRoomState = create<MessageRoomState>()(
  persist(
    (set) => ({
      messageRoomParticipants: null,
      setMessageRoomParticipants: (request) =>
        set({ messageRoomParticipants: request }),
    }),
    {
      name: "message-room-participants",
      storage: createJSONStorage(() => AsyncStorage),
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

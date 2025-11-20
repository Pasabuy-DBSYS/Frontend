import { create } from "zustand";
import { UserResponseDTO } from "../dto/response/auth.response.dto";
import { useAuthStore } from "./auth_store";
import { useActiveOrderStore } from "./order_store";
import { Role } from "@/types/types";
import { getUserById } from "../user";

interface OtherUserState {
  otherUser: UserResponseDTO | null;
  setOtherUser: (otherUserArg: UserResponseDTO | null) => void;
  clearOtherUser: () => void;
}

export const useOtherUserStore = create<OtherUserState>((set) => ({
  otherUser: null,

  setOtherUser: (otherUserArg) =>
    set(() => ({
      otherUser: otherUserArg,
    })),

  clearOtherUser: () =>
    set(() => ({
      otherUser: null,
    })),
}));

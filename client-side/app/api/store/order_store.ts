// src/app/api/store/active_order_store.ts
import { create } from "zustand";
import { OrderResponseDTO } from "../dto/response/auth.response.dto";

interface ActiveOrderState {
  activeOrder: OrderResponseDTO | null;
  setActiveOrder: (order: OrderResponseDTO | null) => void;
  clearActiveOrder: () => void;
}

export const useActiveOrderStore = create<ActiveOrderState>((set) => ({
  activeOrder: null,
  setActiveOrder: (order) => set({ activeOrder: order }),
  clearActiveOrder: () => set({ activeOrder: null }),
}));

import { Order } from "@/types/interfaces";
import { OrderResponseDTO } from "../dto/response/auth.response.dto";
import { create } from "zustand";

interface CourierOrderState {
  activeOrder: OrderResponseDTO | null;
  activeOrderId: number | null;
  setActiveOrder: (order: OrderResponseDTO) => void;
  setActiveOrderId: (orderId: number) => void;
  clearActiveOrder: () => void;
}

export const useCourierOrderStore = create<CourierOrderState>((set) => ({
  activeOrder: null,
  activeOrderId: null,
  setActiveOrder: (order: OrderResponseDTO) => set({ activeOrder: order }),
  setActiveOrderId: (orderId: number) => set({ activeOrderId: orderId }),
  clearActiveOrder: () => set({ activeOrder: null }),
}));

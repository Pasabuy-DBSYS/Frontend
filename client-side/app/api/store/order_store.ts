// src/app/api/store/active_order_store.ts
import { create } from "zustand";
import { OrderResponseDTO } from "../dto/response/auth.response.dto";
import { PostOrderRequestDTO } from "../dto/request/order.request.dto";

interface ActiveOrderState {
  activeOrder: OrderResponseDTO | null;
  tempOrderRequest: PostOrderRequestDTO | null;
  isCancelled: boolean;
  setActiveOrder: (order: OrderResponseDTO | null) => void;
  setTempOrderRequest: (orderRequest: PostOrderRequestDTO) => void;
  setOrderAcceptedShown: (value: boolean) => void;

  setIsCancelled: (arg: boolean) => void;
  orderAcceptedShown: boolean; // <- NEW FLAG

  clearActiveOrder: () => void;
}

export const useActiveOrderStore = create<ActiveOrderState>((set) => ({
  activeOrder: null,
  tempOrderRequest: null,
  isCancelled: false,
  orderAcceptedShown: false, // default: never shown

  setActiveOrder: (order) => set({ activeOrder: order }),
  setOrderAcceptedShown: (value) => set({ orderAcceptedShown: value }),
  setTempOrderRequest: (orderRequest) =>
    set({ tempOrderRequest: orderRequest }),
  setIsCancelled: (arg) => set({ isCancelled: arg }),
  clearActiveOrder: () => set({ activeOrder: null }),
}));

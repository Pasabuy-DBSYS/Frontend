// src/app/api/store/active_order_store.ts
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { OrderResponseDTO } from "../dto/response/order.response.dto";
import { PostOrderRequestDTO } from "../dto/request/order.request.dto";
import axios from "axios";
import { API_BASE_URL } from "../config";
import { useAuthStore } from "./auth_store";
import { Role } from "@/types/types";

interface ActiveOrderState {
  // Persisted state
  activeOrder: OrderResponseDTO | null;
  tempOrderRequest: PostOrderRequestDTO | null;
  pendingReview: boolean;

  // Non-persisted modal visibility (transient state)
  isCancelled: boolean;
  isDelivered: boolean;
  showOrderAccepted: boolean;

  // Actions
  setActiveOrder: (order: OrderResponseDTO | null) => void;
  setTempOrderRequest: (orderRequest: PostOrderRequestDTO | null) => void;
  setIsCancelled: (arg: boolean) => void;
  setIsDelivered: (arg: boolean) => void;
  setShowOrderAccepted: (arg: boolean) => void;
  setPendingReview: (arg: boolean) => void;

  clearActiveOrder: () => void;
  resetModalStates: () => void;
  rehydrateActiveOrder: () => Promise<void>;
}

export const useActiveOrderStore = create<ActiveOrderState>()(
  persist(
    (set) => ({
      // Persisted
      activeOrder: null,
      tempOrderRequest: null,
      pendingReview: false,

      // Non-persisted (will reset on app restart)
      isCancelled: false,
      isDelivered: false,
      showOrderAccepted: false,

      setActiveOrder: (order) => set({ activeOrder: order }),
      setTempOrderRequest: (orderRequest) =>
        set({ tempOrderRequest: orderRequest }),
      setIsCancelled: (arg) => set({ isCancelled: arg }),
      setIsDelivered: (arg) => set({ isDelivered: arg }),
      setShowOrderAccepted: (arg) => set({ showOrderAccepted: arg }),
      setPendingReview: (arg) => set({ pendingReview: arg }),

      // Reset only modal states (not the order itself)
      resetModalStates: () =>
        set({
          isCancelled: false,
          isDelivered: false,
          showOrderAccepted: false,
        }),

      clearActiveOrder: async () => {
        set({
          activeOrder: null,
          tempOrderRequest: null,
          isCancelled: false,
          isDelivered: false,
          showOrderAccepted: false,
          pendingReview: false,
        });

        await AsyncStorage.removeItem("active-order-storage");
      },

      // Fetch active order from server to ensure state is in sync
      rehydrateActiveOrder: async () => {
        try {
          const { token, user } = useAuthStore.getState();
          if (!token || !user) {
            console.log("[rehydrate] No token or user, skipping");
            return;
          }

          const BASE_URL = `${API_BASE_URL}/Orders`;
          const endpoint =
            user.currentRole === Role.COURIER
              ? `${BASE_URL}/courier/activeorder`
              : `${BASE_URL}/customer/activeorder`;

          console.log(`[rehydrate] Fetching active order from: ${endpoint}`);

          const response = await axios.get<OrderResponseDTO>(endpoint, {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          });

          if (response.data) {
            console.log(
              "[rehydrate] Found active order:",
              response.data.orderIdPK
            );
            set({ activeOrder: response.data });
          }
        } catch (err: any) {
          // 404 means no active order - this is expected
          if (err?.response?.status === 404) {
            console.log("[rehydrate] No active order found (404)");
            set({ activeOrder: null });
          } else {
            console.warn(
              "[rehydrate] Failed to fetch active order:",
              err?.message
            );
          }
        }
      },
    }),

    {
      name: "active-order-storage",
      storage: createJSONStorage(() => AsyncStorage),
      // Only persist these specific fields - NOT modal visibility
      partialize: (state) => ({
        activeOrder: state.activeOrder,
        tempOrderRequest: state.tempOrderRequest,
        pendingReview: state.pendingReview,
      }),
    }
  )
);

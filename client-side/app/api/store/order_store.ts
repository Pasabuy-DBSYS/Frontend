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
import {
  getCurrentOrderAsCourier,
  getCurrentOrderAsCustomer,
  getOrderById,
} from "../orders";

interface ActiveOrderState {
  // Persisted state
  activeOrder: OrderResponseDTO | null;
  tempOrderRequest: PostOrderRequestDTO | null;
  pendingReview: boolean;

  // Non-persisted modal visibility (transient state)
  isCancelled: boolean;
  isDelivered: boolean;
  showOrderAccepted: boolean;
  draftOfferedAmount: number;

  // Actions
  setActiveOrder: (order: OrderResponseDTO | null) => void;
  setTempOrderRequest: (orderRequest: PostOrderRequestDTO | null) => void;
  setIsCancelled: (arg: boolean) => void;
  setIsDelivered: (arg: boolean) => void;
  setShowOrderAccepted: (arg: boolean) => void;
  setPendingReview: (arg: boolean) => void;
  setDraftOfferedAmount: (arg: number) => void;

  clearActiveOrder: () => void;
  resetModalStates: () => void;
  rehydrateActiveOrder: () => Promise<void>;
}

export const useActiveOrderStore = create<ActiveOrderState>()(
  persist(
    (set, get) => ({
      // Persisted
      activeOrder: null,
      tempOrderRequest: null,
      pendingReview: false,

      // Non-persisted (will reset on app restart)
      isCancelled: false,
      isDelivered: false,
      showOrderAccepted: false,
      draftOfferedAmount: 0,

      setActiveOrder: (order) => set({ activeOrder: order }),
      setTempOrderRequest: (orderRequest) =>
        set({ tempOrderRequest: orderRequest }),
      setIsCancelled: (arg) => set({ isCancelled: arg }),
      setIsDelivered: (arg) => set({ isDelivered: arg }),
      setShowOrderAccepted: (arg) => set({ showOrderAccepted: arg }),
      setPendingReview: (arg) => set({ pendingReview: arg }),
      setDraftOfferedAmount: (arg) => set({draftOfferedAmount: arg}),

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

      // Refactored function using dynamic API selection
      rehydrateActiveOrder: async () => {
        const { token, user } = useAuthStore.getState();

        // Guard clause for unauthenticated users
        if (!token || !user) {
          console.log("🚦 [rehydrate] No token or user, skipping rehydration.");
          return;
        }

        // 1. Map role to the correct fetching function
        const apiMap = {
          [Role.CUSTOMER]: getCurrentOrderAsCustomer,
          [Role.COURIER]: getCurrentOrderAsCourier,
        };
        const fetchFunction = apiMap[user.currentRole];

        if (!fetchFunction) {
          console.warn(
            "⚠️ [rehydrate] Unknown user role. Clearing local state."
          );
          get().clearActiveOrder();
          return;
        }

        try {
          // 2. Call the determined API function

          console.log(`FUNCTION NAME: ${fetchFunction.name}`);
          const response = await fetchFunction();

          // 3. Centralized success check and update
          // Assuming the API function returns a data object/OrderResponseDTO directly on success
          if (response && response.orderIdPK) {
            console.log(
              `✅ [rehydrate] Found active order: ${response.orderIdPK}`
            );
            console.log(`FETCHED ORDER RESPONSE:`, JSON.stringify(response));

            set({ activeOrder: response });
          } else {
            // API call succeeded but returned null/empty data (treat as no active order)
            console.log(
              "🔍 [rehydrate] API returned no active order (successful call)."
            );
            get().clearActiveOrder();
          }
        } catch (err: any) {
          const status = err?.response?.status;

          // 4. Centralized error handling
          if (status === 404) {
            // Expected behavior when no active order exists
            console.log(
              "🔍 [rehydrate] Server confirmed no active order (404)."
            );
          } else {
            // Handle all other unexpected errors (500, network, etc.)
            console.error(
              `❌ [rehydrate] Failed to fetch order (Status: ${
                status || "Network"
              })`,
              err
            );
          }
          // Always clear the local state on 404 or serious errors to prevent stale data
          get().clearActiveOrder();
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

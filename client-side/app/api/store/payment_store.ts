import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { PaymentsResponseDTO } from "../dto/response/payment.response.dto";
import { useAuthStore } from "./auth_store";
import { useActiveOrderStore } from "./order_store";
import axios from "axios";
import { API_BASE_URL } from "../config";

const URL = `${API_BASE_URL}/Payments`;

interface PaymentStoreState {
  // Persisted state
  payment: PaymentsResponseDTO | null;

  // Actions
  setPayment: (payment: PaymentsResponseDTO | null) => void;
  clearPayment: () => Promise<void>;
  rehydratePayment: () => Promise<void>;

  // Deprecated - keep for backwards compatibility but use setPayment
  payments: PaymentsResponseDTO | null;
  setPayments: (payments: PaymentsResponseDTO | null) => void;
}

export const usePaymentStore = create<PaymentStoreState>()(
  persist(
    (set, get) => ({
      // Persisted
      payment: null,
      payments: null, // Deprecated alias

      setPayment: (payment) => set({ payment, payments: payment }),
      setPayments: (payments) => set({ payment: payments, payments }), // Deprecated alias

      clearPayment: async () => {
        set({ payment: null, payments: null });
        await AsyncStorage.removeItem("payment-storage");
      },

      rehydratePayment: async () => {
        const { token } = useAuthStore.getState();
        const { activeOrder } = useActiveOrderStore.getState();

        // Guard clause for unauthenticated users or no active order
        if (!token) {
          console.log(
            "🚦 [rehydratePayment] No token, skipping payment rehydration."
          );
          return;
        }

        if (!activeOrder?.orderIdPK) {
          console.log(
            "🚦 [rehydratePayment] No active order, clearing payment."
          );
          get().clearPayment();
          return;
        }

        try {
          console.log(
            `🔄 [rehydratePayment] Fetching payment for order: ${activeOrder.orderIdPK}`
          );

          const response = await axios.get<PaymentsResponseDTO>(
            `${URL}/order/${activeOrder.orderIdPK}`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          );

          if (response?.data) {
            console.log(
              `✅ [rehydratePayment] Found payment:`,
              JSON.stringify(response.data)
            );
            set({ payment: response.data, payments: response.data });
          } else {
            console.log("🔍 [rehydratePayment] API returned no payment data.");
            get().clearPayment();
          }
        } catch (err: any) {
          const status = err?.response?.status;

          if (status === 404) {
            // Expected when no payment exists yet
            console.log(
              "🔍 [rehydratePayment] No payment found for this order (404)."
            );
          } else {
            console.error(
              `❌ [rehydratePayment] Failed to fetch payment (Status: ${
                status || "Network"
              })`,
              err
            );
          }
          // Clear on error to prevent stale data
          get().clearPayment();
        }
      },
    }),
    {
      name: "payment-storage",
      storage: createJSONStorage(() => AsyncStorage),
      // Only persist the payment data
      partialize: (state) => ({
        payment: state.payment,
        payments: state.payments,
      }),
    }
  )
);

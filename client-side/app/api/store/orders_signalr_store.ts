// stores/useOrderSignalRStore.ts
import { create } from "zustand";
import { useOrdersHubStore } from "./orders_hub_store";
import { usePaymentStore } from "./payment_store";
import { useActiveOrderStore } from "./order_store";

interface OrderSignalRStore {
  isInitialized: boolean;
  currentOrderId: number | null;
  initialize: (orderIdPK: number) => Promise<void>;
  cleanup: () => void;
}

export const useOrderSignalRStore = create<OrderSignalRStore>((set, get) => ({
  isInitialized: false,
  currentOrderId: null,

  initialize: async (orderIdPK: number) => {
    const { currentOrderId, cleanup } = get();

    const { initConnection, addHandler, invokeHub } =
      useOrdersHubStore.getState();

    try {
      await initConnection();

      // Join the order group to receive updates
      await invokeHub("JoinOrderGroup", orderIdPK);

      addHandler("OrderStatusUpdated", async (orderUpdate: any) => {
        const { setActiveOrder } = useActiveOrderStore.getState();
        setActiveOrder(orderUpdate);
        console.log("[GLOBAL] OrderStatusUpdated received:", orderUpdate);
      });

      addHandler("PaymentProposalRejected", (paymentData: any) => {
        console.log("[GLOBAL] PaymentProposalRejected received:", paymentData);
        usePaymentStore.getState().setPayment(paymentData);
      });

      addHandler("PaymentProposalAccepted", (paymentData: any) => {
        console.log("[GLOBAL] PaymentProposalAccepted received:", paymentData);
        usePaymentStore.getState().setPayment(paymentData);
      });

      set({ isInitialized: true, currentOrderId: orderIdPK });

      console.log(
        `[HUB][GLOBAL] SignalR handlers registered for order ${orderIdPK}`
      );
    } catch (err) {
      console.error("[GLOBAL] SignalR Setup Error:", err);
      set({ isInitialized: false, currentOrderId: null });
    }
  },

  cleanup: () => {
    const { currentOrderId } = get();
    if (!currentOrderId) return;

    try {
      const { removeHandler, invokeHub } = useOrdersHubStore.getState();

      removeHandler("OrderStatusUpdated");
      removeHandler("PaymentProposalAccepted");
      removeHandler("PaymentProposalRejected");

      invokeHub?.("LeaveOrderGroup", currentOrderId.toString());

      set({ isInitialized: false, currentOrderId: null });

      console.log(
        `[HUB][GLOBAL] Cleaned up SignalR handlers for order ${currentOrderId}`
      );
    } catch (e) {
      console.warn("[GLOBAL] Error cleaning up SignalR handlers:", e);
    }
  },
}));

// Initialize immediately if there's already an active order
const currentOrder = useActiveOrderStore.getState().activeOrder;
if (currentOrder?.orderIdPK) {
  useOrderSignalRStore.getState().initialize(currentOrder.orderIdPK);
}

// Subscribe to active order changes from useActiveOrderStore
useActiveOrderStore.subscribe((state) => {
  const orderIdPK = state.activeOrder?.orderIdPK;

  if (orderIdPK) {
    useOrderSignalRStore.getState().initialize(orderIdPK);
  } else {
    useOrderSignalRStore.getState().cleanup();
  }
});

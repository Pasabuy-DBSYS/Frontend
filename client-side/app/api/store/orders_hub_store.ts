import { create } from "zustand";
import * as signalR from "@microsoft/signalr";
import { useAuthStore } from "./auth_store";
import { API_BASE_URL } from "../config";

interface OrdersHubState {
  connection: signalR.HubConnection | null;
  initConnection: () => Promise<void>;
  disconnect: () => Promise<void>;
}

export const useOrdersHubStore = create<OrdersHubState>((set, get) => ({
  connection: null,

  initConnection: async () => {
    const { token } = useAuthStore.getState();
    const existing = get().connection;

    if (existing && existing.state === signalR.HubConnectionState.Connected)
      return;

    const connection = new signalR.HubConnectionBuilder()
      .withUrl(`${API_BASE_URL}/hubs/ordersHub`, {
        accessTokenFactory: () => token ?? "",
      })
      .withAutomaticReconnect()
      .configureLogging(signalR.LogLevel.Information)
      .build();

    connection.onreconnecting(() =>
      console.log("🔄 Reconnecting to OrdersHub")
    );
    connection.onreconnected(() => console.log("✅ Reconnected to OrdersHub"));

    await connection.start();
    console.log("🟢 OrdersHub connected");

    set({ connection });
  },

  disconnect: async () => {
    const connection = get().connection;
    if (connection) {
      await connection.stop();
      console.log("🔴 OrdersHub disconnected");
      set({ connection: null });
    }
  },
}));

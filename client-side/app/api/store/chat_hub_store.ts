import { create } from "zustand";
import * as signalR from "@microsoft/signalr";
import { useAuthStore } from "./auth_store";
import { API_BASE_URL } from "../config";

interface ChatsHubState {
  connection: signalR.HubConnection | null;
  initConnection: () => Promise<void>;
  disconnect: () => Promise<void>;
}

export const useChatsHubStore = create<ChatsHubState>((set, get) => ({
  connection: null,

  initConnection: async () => {
    const { token } = useAuthStore.getState();
    const existing = get().connection;

    if (existing && existing.state === signalR.HubConnectionState.Connected)
      return;

    const connection = new signalR.HubConnectionBuilder()
      .withUrl(`${API_BASE_URL}/hubs/chatsHub`, {
        accessTokenFactory: () => token ?? "",
      })
      .withAutomaticReconnect()
      .configureLogging(signalR.LogLevel.Information)
      .build();

    connection.onreconnecting(() => console.log("🔄 Reconnecting to ChatHub"));
    connection.onreconnected(() => console.log("✅ Reconnected to ChatHub"));

    await connection.start();
    console.log("💬 ChatHub connected");

    set({ connection });
  },

  disconnect: async () => {
    const connection = get().connection;
    if (connection) {
      await connection.stop();
      console.log("🔴 ChatHub disconnected");
      set({ connection: null });
    }
  },
}));

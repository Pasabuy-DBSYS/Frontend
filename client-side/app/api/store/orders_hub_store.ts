// useOrdersHubStore.ts
import { create } from "zustand";
import * as signalR from "@microsoft/signalr";
import { useAuthStore } from "./auth_store";
import { API_BASE_URL } from "../config";

interface OrdersHubState {
  connection: signalR.HubConnection | null;
  isReady: boolean;
  // Store handlers for rebinding on reconnection
  handlers: Map<string, (...args: any[]) => void>;
  // Store joined groups for rejoining on reconnection
  joinedGroups: Set<number>;
  initConnection: () => Promise<signalR.HubConnection>;
  addHandler: (event: string, callback: (...args: any[]) => void) => void;
  removeHandler: (event: string) => void;
  invokeHub: (event: string, ...args: any[]) => Promise<void>;
  disconnect: () => Promise<void>;
}

export const useOrdersHubStore = create<OrdersHubState>((set, get) => ({
  connection: null,
  isReady: false,
  handlers: new Map(),
  joinedGroups: new Set(),

  initConnection: async () => {
    let conn = get().connection;

    // If already connected, return it
    if (conn && conn.state === signalR.HubConnectionState.Connected) {
      return conn;
    }

    // Create connection - accessTokenFactory gets fresh token on each call
    conn = new signalR.HubConnectionBuilder()
      .withUrl(`${API_BASE_URL}/hubs/ordersHub`, {
        accessTokenFactory: () => useAuthStore.getState().token ?? "",
      })
      .withAutomaticReconnect({
        nextRetryDelayInMilliseconds: () => 3000,
      })
      .configureLogging(signalR.LogLevel.Information)
      .build();

    // Reconnected => rebind all stored handlers and rejoin groups
    conn.onreconnected(async () => {
      console.log("🔄 Reconnected to OrdersHub - rebinding handlers");
      const state = get();

      // Rebind all stored handlers
      state.handlers.forEach((callback, event) => {
        console.log(`  ↪ Rebinding handler: ${event}`);
        conn!.off(event);
        conn!.on(event, callback);
      });

      // Rejoin all order groups
      for (const orderId of state.joinedGroups) {
        try {
          console.log(`  ↪ Rejoining group for order: ${orderId}`);
          await conn!.invoke("JoinOrderGroup", orderId);
        } catch (err) {
          console.error(`Failed to rejoin group ${orderId}:`, err);
        }
      }

      set({ isReady: true });
    });

    conn.onreconnecting(() => {
      console.log("⏳ Reconnecting to OrdersHub...");
      set({ isReady: false });
    });

    conn.onclose((error) => {
      console.log("🔴 OrdersHub connection closed", error);
      set({ isReady: false, connection: null });
    });

    // Start connection
    await conn.start();
    console.log("🟢 OrdersHub connected");

    // Wait until fully connected
    while (conn.state !== signalR.HubConnectionState.Connected) {
      await new Promise((res) => setTimeout(res, 50));
    }

    set({ connection: conn, isReady: true });
    return conn;
  },

  // Add SignalR handler safely and store for reconnection
  addHandler: (event, callback) => {
    const conn = get().connection;
    const handlers = get().handlers;

    // Store handler for reconnection rebinding
    handlers.set(event, callback);
    set({ handlers: new Map(handlers) });

    if (!conn) return;
    conn.off(event);
    conn.on(event, callback);
    console.log(`📡 Handler registered: ${event}`);
  },

  // Remove handler and clear from storage
  removeHandler: (event) => {
    const conn = get().connection;
    const handlers = get().handlers;

    handlers.delete(event);
    set({ handlers: new Map(handlers) });

    conn?.off(event);
    console.log(`🚫 Handler removed: ${event}`);
  },

  invokeHub: async (event, ...args) => {
    const conn = get().connection;

    if (!conn) return;

    // // Track joined groups for reconnection
    // if (event === "JoinOrderGroup" && args[0]) {
    //   const joinedGroups = get().joinedGroups;
    //   joinedGroups.add(args[0] as number);
    //   set({ joinedGroups: new Set(joinedGroups) });
    // }

    // // Remove from tracked groups when leaving
    // if (event === "LeaveOrderGroup" && args[0]) {
    //   const joinedGroups = get().joinedGroups;
    //   joinedGroups.delete(args[0] as number);
    //   set({ joinedGroups: new Set(joinedGroups) });
    // }

    await conn.invoke(event, ...args);
  },

  disconnect: async () => {
    const conn = get().connection;
    if (conn) {
      await conn.stop();
      console.log("🔴 OrdersHub disconnected");
      set({
        connection: null,
        isReady: false,
        handlers: new Map(),
        joinedGroups: new Set(),
      });
    }
  },
}));

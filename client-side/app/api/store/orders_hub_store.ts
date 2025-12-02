// useOrdersHubStore.ts
import { create } from "zustand";
import * as signalR from "@microsoft/signalr";
import { useAuthStore } from "./auth_store";
import { API_BASE_URL } from "../config";
import { use } from "react";
import { useActiveOrderStore } from "./order_store";

type RoleGroup = "courier" | "customer" | null;

interface OrdersHubState {
  connection: signalR.HubConnection | null;
  isReady: boolean;
  isConnecting: boolean;
  // Store handlers for rebinding on reconnection
  handlers: Map<string, (...args: any[]) => void>;
  // Store joined groups for rejoining on reconnection
  // Track current role group (courier or customer)
  currentRoleGroup: RoleGroup;
  initConnection: () => Promise<signalR.HubConnection | null>;
  joinRoleGroup: (role: RoleGroup) => Promise<void>;
  addHandler: (event: string, callback: (...args: any[]) => void) => void;
  removeHandler: (event: string) => void;
  invokeHub: (event: string, ...args: any[]) => Promise<void>;
  disconnect: () => Promise<void>;
}

export const useOrdersHubStore = create<OrdersHubState>((set, get) => ({
  connection: null,
  isReady: false,
  isConnecting: false,
  handlers: new Map(),
  currentRoleGroup: null,

  initConnection: async () => {
    const state = get();
    const invokeHub = get().invokeHub;
    let conn = state.connection;

    // If already connected, return it
    if (conn && conn.state === signalR.HubConnectionState.Connected) {
      return conn;
    }

    // Prevent multiple simultaneous connection attempts
    if (state.isConnecting) {
      console.log("⏳ Connection already in progress, waiting...");
      // Wait for the existing connection attempt
      while (get().isConnecting) {
        await new Promise((res) => setTimeout(res, 100));
      }
      return get().connection;
    }

    // Check if token is valid before attempting connection
    const { token, checkTokenValidity } = useAuthStore.getState();
    if (!token || !checkTokenValidity()) {
      console.warn("⚠️ Cannot init SignalR: No valid token");
      return null;
    }

    set({ isConnecting: true });

    try {
      // Create connection - accessTokenFactory gets fresh token on each call
      conn = new signalR.HubConnectionBuilder()
        .withUrl(`${API_BASE_URL}/hubs/ordersHub`, {
          accessTokenFactory: () => useAuthStore.getState().token ?? "",
        })
        .withAutomaticReconnect({
          nextRetryDelayInMilliseconds: (retryContext) => {
            // Stop retrying if token is invalid
            if (!useAuthStore.getState().checkTokenValidity()) {
              console.warn("⚠️ Token invalid, stopping reconnect");
              return null;
            }
            return Math.min(
              3000 * Math.pow(2, retryContext.previousRetryCount),
              30000
            );
          },
        })
        .configureLogging(signalR.LogLevel.Warning)
        .build();

      // Reconnected => rebind all stored handlers and rejoin groups
      conn.onreconnected(async () => {
        console.log("🔄 Reconnected to OrdersHub - rebinding handlers");
        const currentState = get();

        // Rebind all stored handlers
        currentState.handlers.forEach((callback, event) => {
          console.log(`  ↪ Rebinding handler: ${event}`);
          conn!.off(event);
          conn!.on(event, callback);
        });

        // Rejoin role group (courier/customer)
        if (currentState.currentRoleGroup) {
          try {
            const groupMethod =
              currentState.currentRoleGroup === "courier"
                ? "JoinCourierGroup"
                : "JoinCustomerGroup";
            console.log(`  ↪ Rejoining role group: ${groupMethod}`);
            await conn!.invoke(groupMethod);
          } catch (err) {
            console.error("Failed to rejoin role group:", err);
          }
        }

        set({ isReady: true });
      });

      conn.onreconnecting((error) => {
        console.log("⏳ Reconnecting to OrdersHub...", error?.message);
        set({ isReady: false });
      });

      conn.onclose((error) => {
        console.log("🔴 OrdersHub connection closed", error?.message);
        set({ isReady: false, connection: null, isConnecting: false });
      });

      // Start connection
      await conn.start();
      console.log("🟢 OrdersHub connected");

      // Wait until fully connected
      let attempts = 0;
      while (
        conn.state !== signalR.HubConnectionState.Connected &&
        attempts < 50
      ) {
        await new Promise((res) => setTimeout(res, 50));
        attempts++;
      }

      set({ connection: conn, isReady: true, isConnecting: false });
      return conn;
    } catch (error) {
      console.error("❌ Failed to connect to OrdersHub:", error);
      set({ isConnecting: false, isReady: false });
      throw error;
    }
  },

  // Join role group (courier or customer) - tracks it for reconnection
  joinRoleGroup: async (role: RoleGroup) => {
    if (!role) return;

    const conn = get().connection;
    if (!conn || conn.state !== signalR.HubConnectionState.Connected) {
      console.warn("⚠️ Cannot join role group: Not connected");
      return;
    }

    // Check token validity before joining
    if (!useAuthStore.getState().checkTokenValidity()) {
      console.warn("⚠️ Cannot join role group: Token invalid");
      return;
    }

    const groupMethod =
      role === "courier" ? "JoinCourierGroup" : "JoinCustomerGroup";

    try {
      console.log(`📡 Joining ${groupMethod}...`);
      await conn.invoke(groupMethod);
      set({ currentRoleGroup: role });
      console.log(`✅ Joined ${groupMethod}`);
    } catch (error) {
      console.error(`❌ Failed to join ${groupMethod}:`, error);
      throw error;
    }
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

    if (!conn || conn.state !== signalR.HubConnectionState.Connected) {
      console.warn(`⚠️ Cannot invoke ${event}: Not connected`);
      return;
    }

    // Check token validity before invoking
    if (!useAuthStore.getState().checkTokenValidity()) {
      console.warn(`⚠️ Cannot invoke ${event}: Token invalid`);
      return;
    }

    await conn.invoke(event, ...args);
  },

  disconnect: async () => {
    const conn = get().connection;
    if (conn) {
      try {
        await conn.stop();
        console.log("🔴 OrdersHub disconnected");
      } catch (e) {
        console.warn("Disconnect error:", e);
      }
      set({
        connection: null,
        isReady: false,
        isConnecting: false,
        handlers: new Map(),
        currentRoleGroup: null,
      });
    }
  },
}));

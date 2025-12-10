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
  // Store per-order handlers: orderId -> (event -> callback)
  orderHandlers: Map<number, Map<string, (...args: any[]) => void>>;
  // Store joined groups for rejoining on reconnection
  // Track current role group (courier or customer)
  currentRoleGroup: RoleGroup;
  // Track joined order groups to rejoin after reconnect
  joinedOrderIds: Set<number>;
  initConnection: () => Promise<signalR.HubConnection | null>;
  joinRoleGroup: (role: RoleGroup) => Promise<void>;
  joinOrderGroup: (orderId: number) => Promise<void>;
  leaveOrderGroup: (orderId: number) => Promise<void>;
  addHandler: (event: string, callback: (...args: any[]) => void) => void;
  removeHandler: (event: string) => void;
  addOrderHandler: (
    orderId: number,
    event: string,
    callback: (...args: any[]) => void
  ) => void;
  removeOrderHandler: (orderId: number, event: string) => void;
  invokeHub: (event: string, ...args: any[]) => Promise<void>;
  disconnect: () => Promise<void>;
}

export const useOrdersHubStore = create<OrdersHubState>((set, get) => ({
  connection: null,
  isReady: false,
  isConnecting: false,
  handlers: new Map(),
  orderHandlers: new Map(),
  currentRoleGroup: null,
  joinedOrderIds: new Set(),

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

            if (conn) await conn.invoke(groupMethod);
          } catch (err) {
            console.error("Failed to rejoin role group:", err);
          }
        }

        // Rejoin any order groups and rebind per-order handlers
        if (currentState.joinedOrderIds && conn) {
          for (const orderId of Array.from(currentState.joinedOrderIds)) {
            try {
              console.log(`  ↪ Rejoining order group: ${orderId}`);
              await conn.invoke("JoinOrderGroup", orderId);

              const orderMap = currentState.orderHandlers.get(orderId);
              orderMap?.forEach((cb, evt) => {
                console.log(`    ↪ Rebinding order handler: ${evt} for order ${orderId}`);
                conn!.off(evt);
                conn!.on(evt, cb);
              });
            } catch (err) {
              console.error("Failed to rejoin order group:", err);
            }
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
      set({ currentRoleGroup: role });
      console.log(`✅ Joined ${groupMethod}`);
    } catch (error) {
      console.error(`❌ Failed to join ${groupMethod}:`, error);
      throw error;
    }
  },

  // Join a specific order group so the server will send order-scoped events
  joinOrderGroup: async (orderId: number) => {
    const conn = get().connection;
    if (!conn || conn.state !== signalR.HubConnectionState.Connected) {
      console.warn("⚠️ Cannot join order group: Not connected");
      return;
    }

    if (!useAuthStore.getState().checkTokenValidity()) {
      console.warn("⚠️ Cannot join order group: Token invalid");
      return;
    }

    try {
      await conn.invoke("JoinOrderGroup", orderId);
      const joined = new Set(get().joinedOrderIds);
      joined.add(orderId);
      set({ joinedOrderIds: joined });
      console.log(`✅ Joined order group: ${orderId}`);

      // Bind any existing per-order handlers for this order
      const orderMap = get().orderHandlers.get(orderId);
      orderMap?.forEach((cb, evt) => {
        conn.off(evt);
        conn.on(evt, cb);
      });
    } catch (err) {
      console.error("❌ Failed to join order group:", err);
    }
  },

  leaveOrderGroup: async (orderId: number) => {
    const conn = get().connection;
    if (!conn || conn.state !== signalR.HubConnectionState.Connected) {
      console.warn("⚠️ Cannot leave order group: Not connected");
      return;
    }

    try {
      await conn.invoke("LeaveOrderGroup", orderId);
      const joined = new Set(get().joinedOrderIds);
      joined.delete(orderId);
      set({ joinedOrderIds: joined });
      console.log(`✅ Left order group: ${orderId}`);
    } catch (err) {
      console.error("❌ Failed to leave order group:", err);
    }
  },

  // Per-order handler registration
  addOrderHandler: (orderId, event, callback) => {
    const conn = get().connection;
    const orderHandlers = new Map(get().orderHandlers);

    let map = orderHandlers.get(orderId);
    if (!map) {
      map = new Map<string, (...args: any[]) => void>();
      orderHandlers.set(orderId, map);
    }

    map.set(event, callback);
    set({ orderHandlers: new Map(orderHandlers) });

    if (!conn) return;
    conn.off(event);
    conn.on(event, callback);
    console.log(`📡 Order handler registered: ${event} for order ${orderId}`);
  },

  removeOrderHandler: (orderId, event) => {
    const conn = get().connection;
    const orderHandlers = new Map(get().orderHandlers);

    const map = orderHandlers.get(orderId);
    if (map) {
      map.delete(event);
      if (map.size === 0) orderHandlers.delete(orderId);
      set({ orderHandlers: new Map(orderHandlers) });
    }

    conn?.off(event);
    console.log(`🚫 Order handler removed: ${event} for order ${orderId}`);
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
        orderHandlers: new Map(),
        joinedOrderIds: new Set(),
        currentRoleGroup: null,
      });
    }
  },
}));

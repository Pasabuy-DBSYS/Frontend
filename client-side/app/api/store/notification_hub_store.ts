// useNotificationHubStore.ts
import { create } from "zustand";
import * as signalR from "@microsoft/signalr";
import { useAuthStore } from "./auth_store";
import { API_BASE_URL } from "../config";
import { useNotificationStore } from "./notification_store";

interface NotificationHubState {
  connection: signalR.HubConnection | null;
  isReady: boolean;
  isConnecting: boolean;
  // Store handlers for rebinding on reconnection
  handlers: Map<string, (...args: any[]) => void>;
  // Track if user group is joined
  userGroupId: number | null;
  initConnection: () => Promise<signalR.HubConnection | null>;
  joinUserGroup: (userId: number) => Promise<void>;
  leaveUserGroup: (userId: number) => Promise<void>;
  addHandler: (event: string, callback: (...args: any[]) => void) => void;
  removeHandler: (event: string) => void;
  invokeHub: (event: string, ...args: any[]) => Promise<void>;
  disconnect: () => Promise<void>;
}

export const useNotificationHubStore = create<NotificationHubState>(
  (set, get) => ({
    connection: null,
    isReady: false,
    isConnecting: false,
    handlers: new Map(),
    userGroupId: null,

    initConnection: async () => {
      const state = get();
      const { user } = useAuthStore.getState();
      let conn = state.connection;

      // If already connected, return it
      if (conn && conn.state === signalR.HubConnectionState.Connected) {
        return conn;
      }

      // Prevent multiple simultaneous connection attempts
      if (state.isConnecting) {
        console.log("⏳ NotificationHub connection already in progress...");
        while (get().isConnecting) {
          await new Promise((res) => setTimeout(res, 100));
        }
        return get().connection;
      }

      // Check if token is valid before attempting connection
      const { token, checkTokenValidity } = useAuthStore.getState();
      if (!token || !checkTokenValidity()) {
        console.warn("⚠️ Cannot init NotificationHub: No valid token");
        return null;
      }

      set({ isConnecting: true });

      try {
        // Create connection
        conn = new signalR.HubConnectionBuilder()
          .withUrl(`${API_BASE_URL}/hubs/notificationsHub`, {
            accessTokenFactory: () => useAuthStore.getState().token ?? "",
          })
          .withAutomaticReconnect({
            nextRetryDelayInMilliseconds: (retryContext) => {
              if (!useAuthStore.getState().checkTokenValidity()) {
                console.warn(
                  "⚠️ NotificationHub: Token invalid, stopping reconnect"
                );
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

        conn.invoke(`JoinUserGroup`, user?.userIdPK);
        conn.on("ReceiveNotification", (notification) => {
          // Add notification to Zustand store
          useNotificationStore.getState().addNotification(notification);
        });

        // Reconnected => rebind handlers and rejoin user group
        conn.onreconnected(async () => {
          console.log("🔄 Reconnected to NotificationHub");
          const currentState = get();

          // Rebind all stored handlers
          currentState.handlers.forEach((callback, event) => {
            console.log(`  ↪ Rebinding handler: ${event}`);
            conn!.off(event);
            conn!.on(event, callback);
          });

          // Rejoin user group
          if (currentState.userGroupId) {
            try {
              console.log(
                `  ↪ Rejoining user group: ${currentState.userGroupId}`
              );
              await conn!.invoke("JoinUserGroup", currentState.userGroupId);
            } catch (err) {
              console.error("Failed to rejoin user group:", err);
            }
          }

          set({ isReady: true });
        });

        conn.onreconnecting((error) => {
          console.log("⏳ Reconnecting to NotificationHub...", error?.message);
          set({ isReady: false });
        });

        conn.onclose((error) => {
          console.log("🔴 NotificationHub connection closed", error?.message);
          set({ isReady: false, connection: null, isConnecting: false });
        });

        // Start connection
        await conn.start();
        console.log("🟢 NotificationHub connected");

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
        console.error("❌ Failed to connect to NotificationHub:", error);
        set({ isConnecting: false, isReady: false });
        throw error;
      }
    },

    joinUserGroup: async (userId: number) => {
      const conn = get().connection;
      if (!conn || conn.state !== signalR.HubConnectionState.Connected) {
        console.warn("⚠️ Cannot join user group: Not connected");
        return;
      }

      try {
        console.log(`📡 Joining user group: ${userId}`);
        await conn.invoke("JoinUserGroup", userId);
        set({ userGroupId: userId });
        console.log(`✅ Joined user group: ${userId}`);
      } catch (error) {
        console.error("❌ Failed to join user group:", error);
        throw error;
      }
    },

    leaveUserGroup: async (userId: number) => {
      const conn = get().connection;
      if (!conn || conn.state !== signalR.HubConnectionState.Connected) {
        return;
      }

      try {
        console.log(`📡 Leaving user group: ${userId}`);
        await conn.invoke("LeaveUserGroup", userId);
        set({ userGroupId: null });
        console.log(`✅ Left user group: ${userId}`);
      } catch (error) {
        console.error("❌ Failed to leave user group:", error);
      }
    },

    addHandler: (event, callback) => {
      const conn = get().connection;
      const handlers = get().handlers;

      handlers.set(event, callback);
      set({ handlers: new Map(handlers) });

      if (!conn) return;
      conn.off(event);
      conn.on(event, callback);
      console.log(`📡 NotificationHub handler registered: ${event}`);
    },

    removeHandler: (event) => {
      const conn = get().connection;
      const handlers = get().handlers;

      handlers.delete(event);
      set({ handlers: new Map(handlers) });

      conn?.off(event);
      console.log(`🚫 NotificationHub handler removed: ${event}`);
    },

    invokeHub: async (event, ...args) => {
      const conn = get().connection;

      if (!conn || conn.state !== signalR.HubConnectionState.Connected) {
        console.warn(
          `⚠️ Cannot invoke ${event}: NotificationHub not connected`
        );
        return;
      }

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
          console.log("🔴 NotificationHub disconnected");
        } catch (e) {
          console.warn("NotificationHub disconnect error:", e);
        }
        set({
          connection: null,
          isReady: false,
          isConnecting: false,
          handlers: new Map(),
          userGroupId: null,
        });
      }
    },
  })
);

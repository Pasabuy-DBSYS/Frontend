import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { jwtDecode } from "jwt-decode";
import { UserResponseDTO } from "../dto/response/auth.response.dto";
import { getCurrentProfile } from "../user";
import { sortRoutes } from "expo-router/build/sortRoutes";
import { Coordinates } from "@/types/interfaces";

interface DecodedToken {
  exp?: number; // JWT standard expiration (Unix timestamp in seconds)
}

interface AuthState {
  token: string | null;
  user: UserResponseDTO | null;
  isAuthenticated: boolean;
  login: (token: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  checkTokenValidity: () => boolean;
  refreshToken: (newToken: string) => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      user: null,
      isAuthenticated: false,

      login: async (token: string) => {
        const isExpired = (() => {
          try {
            const decoded: DecodedToken = jwtDecode(token);
            console.log("Decoded Token:", JSON.stringify(decoded));

            console.log(`Token: ${get().token}`);
            if (!decoded.exp) return false;
            const now = Date.now() / 1000;
            return decoded.exp < now;
          } catch {
            return true;
          }
        })();

        if (isExpired) {
          console.warn("Token is expired. Login aborted.");
          await get().logout();
          return;
        }

        set({ token, isAuthenticated: true });

        try {
          const user = await getCurrentProfile();
          set({ user });
        } catch (err) {
          console.error("Failed to fetch profile after login:", err);
        }
      },

      logout: async () => {
        try {
          // 1️⃣ Clear in-memory auth state
          set({ token: null, user: null, isAuthenticated: false });

          await useAuthStore.persist.clearStorage();

          console.log(`NEW TOKEN: ${get().token}`);

          console.log("✅ Auth store cleared successfully");
        } catch (err) {
          console.error("❌ Error clearing auth store:", err);
        }
      },

      /** 🔁 Refresh current user info if token is still valid */
      refreshUser: async () => {
        const isValid = get().checkTokenValidity();

        if (!isValid) {
          console.warn("Token expired. Logging out...");
          await get().logout();
          return;
        }

        try {
          const user = await getCurrentProfile();
          set({ user });
        } catch (err) {
          console.error("Failed to refresh user:", err);
        }
      },

      checkTokenValidity: () => {
        const token = get().token;
        if (!token) return false;

        try {
          const decoded: DecodedToken = jwtDecode(token);
          console.log(
            "Decoded Token for validity check:",
            JSON.stringify(decoded)
          );

          if (!decoded.exp) return true;

          const now = Date.now() / 1000;
          const isExpired = decoded.exp < now;

          if (isExpired) {
            console.warn("Stored token expired. Clearing auth...");
            get().logout();
            return false;
          }

          return true;
        } catch {
          console.error("Invalid token format. Clearing auth...");
          get().logout();
          return false;
        }
      },

      refreshToken: async (newToken: string) => {
        await useAuthStore.persist.clearStorage();

        set({ token: newToken, isAuthenticated: true });
      },
    }),
    {
      name: "auth-storage",
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        token: state.token,
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

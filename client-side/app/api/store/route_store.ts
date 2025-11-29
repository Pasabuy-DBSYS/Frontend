// /store/route_store.ts
import { create } from "zustand";
import { Coordinates } from "@/types/interfaces";

interface RouteStore {
  cache: Record<number, Coordinates[]>; // key = orderId
  saveRoute: (orderId: number, coords: Coordinates[]) => void;
  getRoute: (orderId: number) => Coordinates[] | null;
  clearRoute: (orderId: number) => void;
}

export const useRouteStore = create<RouteStore>((set, get) => ({
  cache: {},

  saveRoute: (orderId, coords) =>
    set((state) => ({
      cache: {
        ...state.cache,
        [orderId]: coords,
      },
    })),

  getRoute: (orderId: number) => {
    return get().cache[orderId] ?? null;
  },
  clearRoute: (orderId: number) =>
    set((state) => {
      const newCache = { ...state.cache };
      delete newCache[orderId];
      return { cache: newCache };
    }),
}));

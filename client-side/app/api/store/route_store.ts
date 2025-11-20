// /store/route_store.ts
import { create } from "zustand";
import { Coordinates } from "@/types/interfaces";

interface RouteStore {
  cache: Record<number, Coordinates[]>; // key = orderId
  saveRoute: (orderId: number, coords: Coordinates[]) => void;
  getRoute: (orderId: number) => Coordinates[] | null;
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
}));

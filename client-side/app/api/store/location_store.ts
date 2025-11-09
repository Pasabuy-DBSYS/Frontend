// /app/api/store/location_store.ts
import { create } from "zustand";
import { Coordinates } from "@/types/interfaces";

interface LocationState {
  fullLocation: { returnAddress: string; returnLocation: Coordinates } | null;
  commissionData: {
    address: string;
    specification: string;
    deliveryInstructions: string;
    coordinates: Coordinates;
  };
  
  setFullLocation: (payload: {
    returnAddress: string;
    returnLocation: Coordinates;
  }) => void;
  setCommissionData: (
    partial: Partial<LocationState["commissionData"]>
  ) => void;
  clearLocation: () => void;
}

export const useLocationStore = create<LocationState>((set) => ({
  fullLocation: null,
  commissionData: {
    address: "",
    specification: "",
    deliveryInstructions: "",
    coordinates: { latitude: 0, longitude: 0 },
  },
  setFullLocation: (payload) => set({ fullLocation: payload }),
  setCommissionData: (partial) =>
    set((state) => ({
      commissionData: { ...state.commissionData, ...partial },
    })),
  clearLocation: () =>
    set({
      fullLocation: null,
      commissionData: {
        address: "",
        specification: "",
        deliveryInstructions: "",
        coordinates: { latitude: 0, longitude: 0 },
      },
    }),
}));

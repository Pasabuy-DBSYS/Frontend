import React from "react";
import { TouchableOpacity, View, Text } from "react-native";
import { useNavigation } from "expo-router";
import { CourierTrackingViewNavProp, Role } from "@/types/types";
import { useActiveOrderStore } from "@/app/api/store/order_store";
import { useAuthStore } from "@/app/api/store/auth_store";

export default function ActiveOrderBanner() {
  const { activeOrder } = useActiveOrderStore();
  const navigator = useNavigation<CourierTrackingViewNavProp>();
  const { user } = useAuthStore();
  const role = user?.currentRole === Role.COURIER ? "Courier" : "Customer";
  if (!activeOrder) return null;

  return (
    <View
      activeOpacity={0.8}
      style={{
        position: "absolute",
        bottom: 120, // adjust for bottom nav height
        width: "100%",
        alignItems: "center",
        zIndex: 50,
      }}
    >
      <View
        style={{
          width: "90%",
          maxWidth: 400,
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          backgroundColor: "#4F46E5", // fallback solid color
          borderRadius: 16,
          paddingVertical: 12,
          paddingHorizontal: "5%",
          shadowColor: "#000",
          shadowOpacity: 0.25,
          shadowRadius: 6,
          elevation: 6,
        }}
      >
        <View>
          <Text
            style={{
              color: "white",
              fontWeight: "700",
              fontSize: 14,
              marginBottom: 2,
            }}
          >
            🚗 Active Delivery
          </Text>
          <Text
            style={{
              color: "#E5E7EB",
              fontSize: 12,
              maxWidth: "90%",
            }}
          >
            {activeOrder.deliveryDetailsDTO?.destinationAddress ||
              "Dorm A, Room 203"}{" "}
            — ₱{activeOrder.paymentsResponseDTO?.totalAmount || "120"} | ETA:{" "}
            {"10 mins"}
          </Text>
        </View>
        <TouchableOpacity
          style={{
            backgroundColor: "white",
            borderRadius: 10,
            paddingVertical: 15,
            paddingHorizontal: 10,
          }}
          onPress={() =>
            navigator.navigate(`${role}TrackingView`, {
              orderId: activeOrder.orderIdPK,
            })
          }
        >
          <Text
            style={{
              color: "#4F46E5",
              fontWeight: "700",
              fontSize: 12,
            }}
          >
            View
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

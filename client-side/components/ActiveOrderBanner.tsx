import React from "react";
import { TouchableOpacity, View, Text } from "react-native";
import { useNavigation } from "expo-router";
import { CourierTrackingViewNavProp } from "@/types/types";
import { useActiveOrderStore } from "@/app/api/store/order_store";

export default function ActiveOrderBanner() {
  const { activeOrder } = useActiveOrderStore();
  const navigator = useNavigation<CourierTrackingViewNavProp>();

  if (!activeOrder) return null;

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={() =>
        navigator.navigate("CourierTrackingView", {
          orderId: activeOrder.orderIdPK,
        })
      }
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
          paddingHorizontal: 16,
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
            }}
          >
            {activeOrder.deliveryDetailsDTO?.destinationAddress ||
              "Dorm A, Room 203"}{" "}
            — ₱{activeOrder.paymentsResponseDTO?.totalAmount || "120"} | ETA:{" "}
            {"10 mins"}
          </Text>
        </View>
        <View
          style={{
            backgroundColor: "white",
            borderRadius: 10,
            paddingVertical: 4,
            paddingHorizontal: 10,
          }}
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
        </View>
      </View>
    </TouchableOpacity>
  );
}

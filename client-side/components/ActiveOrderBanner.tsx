import React from "react";
import { TouchableOpacity, View, Text } from "react-native";
import { useNavigation } from "expo-router";
import { CourierTrackingViewNavProp, Role } from "@/types/types";
import { useActiveOrderStore } from "@/app/api/store/order_store";
import { useAuthStore } from "@/app/api/store/auth_store";
import { Status } from "@/app/api/dto/response/order.response.dto";
import { useOtherUserStore } from "@/app/api/store/user_store";
import { Ionicons } from "@expo/vector-icons";

// Clearer stage labels for the order flow
const STATUS_LABELS = [
  "Finding Courier",
  "Courier Assigned",
  "Picking Up",
  "On The Way",
];

// Map order status to progress step (0-3)
const getProgressStep = (status: Status): number => {
  switch (status) {
    case Status.PENDING:
      return 0; // Finding Courier
    case Status.ACCEPTED:
      return 1; // Courier Assigned
    case Status.IN_TRANSIT:
      return 2; // Picking Up / On The Way
    case Status.DELIVERED:
    case Status.WATING_FOR_REVIEW:
    case Status.REVIEWED:
      return 3; // Completed
    default:
      return 0;
  }
};

export default function ActiveOrderBanner() {
  const { activeOrder, pendingReview } = useActiveOrderStore();
  const navigator = useNavigation<CourierTrackingViewNavProp>();
  const { user } = useAuthStore();
  const { otherUser } = useOtherUserStore();
  const role = user?.currentRole === Role.COURIER ? "Courier" : "Customer";

  // Don't show banner if no active order
  if (!activeOrder) return null;

  // Check if order is completed
  const isDeliveredOrder = activeOrder.status === Status.DELIVERED;
  const isCancelledOrder = activeOrder.status === Status.CANCELLED;

  // Don't show banner for CANCELLED orders
  if (isCancelledOrder) return null;

  // Don't show for DELIVERED orders unless customer has pending review
  if (isDeliveredOrder && !pendingReview) return null;

  const handleViewPress = () => {
    // Only go to ReviewOrder if pendingReview AND order is actually DELIVERED
    if (pendingReview && activeOrder.status === Status.DELIVERED) {
      navigator.navigate("ReviewOrder");
      return;
    }

    // Normal case: go to tracking view based on role
    if (role === "Courier") {
      navigator.navigate("CourierTrackingView", {
        orderId: activeOrder.orderIdPK,
      });
    } else {
      navigator.navigate("CustomerTrackingView", {
        orderId: activeOrder.orderIdPK,
      });
    }
  };

  const progressStep = getProgressStep(activeOrder.status);

  // Get the other user's name
  const otherUserName = otherUser
    ? [otherUser.firstName, otherUser.lastName].filter(Boolean).join(" ")
    : role === "Courier"
    ? "Customer"
    : "Courier";

  const deliveryAddress =
    activeOrder.deliveryDetailsDTO?.destinationAddress || "Delivery location";
  const deliveryNotes = activeOrder.deliveryDetailsDTO?.deliveryNotes || "";

  return (
    <View
      style={{
        position: "absolute",
        bottom: 120,
        width: "100%",
        alignItems: "center",
        zIndex: 50,
      }}
    >
      <View
        style={{
          width: "90%",
          maxWidth: 380,
          backgroundColor: "#FFFFFF",
          borderRadius: 12,
          paddingVertical: 12,
          paddingHorizontal: 12,
          shadowColor: "#000",
          shadowOpacity: 0.12,
          shadowRadius: 8,
          shadowOffset: { width: 0, height: 3 },
          elevation: 6,
        }}
      >
        {/* Progress Indicator */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 10,
          }}
        >
          {STATUS_LABELS.map((label, index) => {
            const isActive = index <= progressStep;
            const isCurrent = index === progressStep;
            const isLastItem = index === STATUS_LABELS.length - 1;

            return (
              <React.Fragment key={label}>
                {/* Status Label */}
                <View
                  style={{
                    alignItems: "center",
                    flex: 1,
                  }}
                >
                  <View
                    style={{
                      backgroundColor: isCurrent
                        ? "#22C55E"
                        : isActive
                        ? "#22C55E"
                        : "#E5E7EB",
                      paddingVertical: 3,
                      paddingHorizontal: 6,
                      borderRadius: 10,
                      minWidth: 50,
                      alignItems: "center",
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 8,
                        fontWeight: "600",
                        color: isActive ? "#FFFFFF" : "#6B7280",
                      }}
                    >
                      {label}
                    </Text>
                  </View>
                </View>

                {/* Connecting Line */}
                {!isLastItem && (
                  <View
                    style={{
                      height: 2,
                      flex: 0.4,
                      backgroundColor:
                        index < progressStep ? "#22C55E" : "#E5E7EB",
                      marginHorizontal: -2,
                    }}
                  />
                )}
              </React.Fragment>
            );
          })}
        </View>

        {/* User Info Row */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            marginBottom: 8,
          }}
        >
          <Ionicons
            name="person-outline"
            size={14}
            color="#374151"
            style={{ marginRight: 6 }}
          />
          <Text
            style={{
              fontSize: 13,
              fontWeight: "600",
              color: "#111827",
              flex: 1,
            }}
          >
            {otherUserName}
          </Text>
        </View>

        {/* Delivery Info Row */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "flex-start",
            marginBottom: 10,
          }}
        >
          <Ionicons
            name="location-outline"
            size={14}
            color="#8B5CF6"
            style={{ marginRight: 6, marginTop: 1 }}
          />
          <View style={{ flex: 1 }}>
            <Text
              style={{
                fontSize: 12,
                fontWeight: "600",
                color: "#111827",
              }}
            >
              Delivery
            </Text>
            <Text
              style={{
                fontSize: 11,
                color: "#6B7280",
                marginTop: 1,
              }}
              numberOfLines={1}
            >
              {deliveryAddress}
            </Text>
          </View>
        </View>

        {/* View Button */}
        <TouchableOpacity
          style={{
            backgroundColor: "#4F46E5",
            borderRadius: 10,
            paddingVertical: 8,
            alignItems: "center",
          }}
          onPress={handleViewPress}
        >
          <Text
            style={{
              color: "#FFFFFF",
              fontWeight: "700",
              fontSize: 12,
            }}
          >
            {pendingReview && isDeliveredOrder ? "Leave Review" : "View"}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  KeyboardAvoidingView,
  TouchableWithoutFeedback,
  Keyboard,
  LayoutAnimation,
  Platform,
  UIManager,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Button } from "@/components/Button";
import { Role } from "@/types/types";
import ExpandOrder from "@/components/svg/ExpandOrder";
import { useActiveOrderStore } from "@/app/api/store/order_store";
import { useAuthStore } from "@/app/api/store/auth_store";
import { useOtherUserStore } from "@/app/api/store/user_store";
import {
  Status,
  OrderResponseDTO,
} from "@/app/api/dto/response/order.response.dto";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { CourierTrackingViewNavProp } from "@/types/types";
import {
  getCustomerOrderHistory,
  getCourierOrderHistory,
} from "@/app/api/orders";

// Enable layout animation on Android
if (
  Platform.OS === "android" &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

// Convert Status enum to display string
const getStatusLabel = (status: Status): string => {
  switch (status) {
    case Status.PENDING:
      return "Pending";
    case Status.ACCEPTED:
      return "Accepted";
    case Status.IN_TRANSIT:
      return "In Transit";
    case Status.DELIVERED:
      return "Delivered";
    case Status.WATING_FOR_REVIEW:
      return "Waiting for Review";
    case Status.REVIEWED:
      return "Reviewed";
    case Status.CANCELLED:
      return "Cancelled";
    default:
      return "Unknown";
  }
};

const getStatusColor = (status: Status): string => {
  switch (status) {
    case Status.DELIVERED:
    case Status.REVIEWED:
      return "#96FFB2";
    case Status.IN_TRANSIT:
    case Status.ACCEPTED:
      return "#97C8FF";
    case Status.CANCELLED:
      return "#FC5862";
    case Status.PENDING:
      return "#FFE082";
    default:
      return "#E0E0E0";
  }
};

const getTextColor = (status: Status): string => {
  return status === Status.CANCELLED ? "#FFFFFF" : "#000000";
};

const getText = (status: Status): string => {
  switch (status) {
    case Status.DELIVERED:
    case Status.REVIEWED:
    case Status.WATING_FOR_REVIEW:
      return "Successful Transaction";
    case Status.IN_TRANSIT:
    case Status.PENDING:
    case Status.ACCEPTED:
      return "Upcoming Order";
    case Status.CANCELLED:
      return "Unsuccessful Transaction";
    default:
      return "Error";
  }
};

const getStatusTextColor = (status: Status): string => {
  switch (status) {
    case Status.DELIVERED:
    case Status.REVIEWED:
      return "#4CAF50";
    case Status.IN_TRANSIT:
    case Status.ACCEPTED:
      return "#97C8FF";
    case Status.CANCELLED:
      return "#FC5862";
    default:
      return "#E0E0E0";
  }
};

// Format date for display (Philippine timezone)
const formatOrderTime = (dateString: string | null | undefined): string => {
  console.log(`DATE STRING: ${dateString}`);
  if (!dateString) return "N/A";

  try {
    // Handle PostgreSQL timestamp with time zone format (e.g., "2025-11-28 23:46:30.09339+08")
    // Replace space with T for proper ISO parsing
    const isoString = dateString.replace(" ", "T");
    const date = new Date(isoString);

    // Check if date is valid
    if (isNaN(date.getTime())) {
      console.log("Invalid date string:", dateString);
      return "N/A";
    }

    // Format for Philippine timezone
    const time = new Intl.DateTimeFormat("en-PH", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
      timeZone: "Asia/Manila",
    }).format(date);

    const weekday = new Intl.DateTimeFormat("en-PH", {
      weekday: "short",
      timeZone: "Asia/Manila",
    }).format(date);

    const dateFormatter = new Intl.DateTimeFormat("en-PH", {
      day: "numeric",
      month: "numeric",
      year: "numeric",
      timeZone: "Asia/Manila",
    });
    const parts = dateFormatter.formatToParts(date);
    const day = parts.find((p) => p.type === "day")?.value;
    const month = parts.find((p) => p.type === "month")?.value;
    const year = parts.find((p) => p.type === "year")?.value;

    return `${time}, ${weekday}, ${day}/${month}/${year}`;
  } catch (error) {
    console.error("Error formatting date:", dateString, error);
    return "N/A";
  }
};

const STATUS_LABELS = ["Pending", "Accepted", "Picked up", "In transit"];

// Map order status to progress step (0-3)
const getProgressStep = (status: Status): number => {
  switch (status) {
    case Status.PENDING:
      return 0;
    case Status.ACCEPTED:
      return 1;
    case Status.IN_TRANSIT:
      return 2;
    case Status.DELIVERED:
    case Status.WATING_FOR_REVIEW:
    case Status.REVIEWED:
      return 3;
    default:
      return 0;
  }
};

const OrderHistory = () => {
  const [expandedOrderId, setExpandedOrderId] = useState<number | null>(null);
  const [orders, setOrders] = useState<OrderResponseDTO[]>([]);
  const [loading, setLoading] = useState(true);

  const { activeOrder } = useActiveOrderStore();
  const { user } = useAuthStore();
  const { otherUser } = useOtherUserStore();
  const navigator = useNavigation<CourierTrackingViewNavProp>();

  const isCourier = user?.currentRole === Role.COURIER;

  // Fetch orders from backend
  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true);
        const data = isCourier
          ? await getCourierOrderHistory()
          : await getCustomerOrderHistory();
        setOrders(data);
      } catch (error) {
        console.error("Failed to fetch orders:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [isCourier]);

  const toggleExpand = (orderId: number) => {
    setExpandedOrderId(expandedOrderId === orderId ? null : orderId);
  };

  // Check if active order should be shown
  const showActiveOrder =
    activeOrder &&
    activeOrder.status !== Status.CANCELLED &&
    activeOrder.status !== Status.DELIVERED &&
    activeOrder.status !== Status.REVIEWED;

  const progressStep = activeOrder ? getProgressStep(activeOrder.status) : 0;

  // Get the other user's name
  const otherUserName = otherUser
    ? [otherUser.firstName, otherUser.lastName].filter(Boolean).join(" ")
    : isCourier
    ? "Customer"
    : "Courier";

  const handleViewActiveOrder = () => {
    if (!activeOrder) return;
    if (isCourier) {
      navigator.navigate("CourierTrackingView", {
        orderId: activeOrder.orderIdPK,
      });
    } else {
      navigator.navigate("CustomerTrackingView", {
        orderId: activeOrder.orderIdPK,
      });
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }}>
      <LinearGradient
        colors={isCourier ? ["#FFFFFF", "#545EE1"] : ["#545EE1", "#FFFFFF"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={{
          flex: 1,
          paddingHorizontal: 20,
          paddingTop: "20%",
        }}
      >
        <Text
          style={{
            color: isCourier ? "#333" : "white",
            fontWeight: "700",
            fontSize: 36,
          }}
        >
          Order History
        </Text>

        <Text
          style={{
            color: isCourier ? "#888" : "white",
            fontWeight: "300",
            fontSize: 16,
            marginBottom: 20,
          }}
        >
          Lets you track and review all your past deliveries and orders
        </Text>

        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            marginTop: 10,
          }}
        >
          <View style={{ flex: 1, height: 1, backgroundColor: "#ccc" }} />
          <View
            style={{
              backgroundColor: "#E8E8E8",
              borderRadius: 6,
              paddingHorizontal: 16,
              paddingVertical: 6,
              marginHorizontal: 10,
            }}
          >
            <Text
              style={{
                color: "#333",
                fontWeight: "600",
                fontSize: 12,
                letterSpacing: 0.5,
              }}
            >
              ACTIVE ORDER
            </Text>
          </View>
          <View style={{ flex: 1, height: 1, backgroundColor: "#ccc" }} />
        </View>

        {/* Active Order Section */}
        {showActiveOrder ? (
          <View style={{ marginBottom: 10 }}>
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 8,
              }}
            >
              <Text
                style={{
                  fontSize: 12,
                  fontWeight: "600",
                  color: "#666",
                  letterSpacing: 1,
                }}
              >
                ACTIVE {isCourier ? "DELIVERY" : "ORDER"}
              </Text>
              <TouchableOpacity onPress={handleViewActiveOrder}>
                <Text
                  style={{
                    fontSize: 12,
                    color: "#545EE1",
                    fontWeight: "500",
                  }}
                >
                  Tap to Expand
                </Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              onPress={handleViewActiveOrder}
              activeOpacity={0.9}
              style={{
                backgroundColor: "#FFFFFF",
                borderRadius: 12,
                padding: 12,
                shadowColor: "#000",
                shadowOpacity: 0.1,
                shadowRadius: 8,
                shadowOffset: { width: 0, height: 2 },
                elevation: 3,
              }}
            >
              {/* Header with name and delivery number */}
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 10,
                }}
              >
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <View
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 16,
                      backgroundColor: "#545EE1",
                      justifyContent: "center",
                      alignItems: "center",
                      marginRight: 8,
                    }}
                  >
                    <Ionicons name="person" size={16} color="#fff" />
                  </View>
                  <Text
                    style={{ fontWeight: "600", fontSize: 14, color: "#111" }}
                  >
                    {otherUserName}
                  </Text>
                </View>
                <View style={{ alignItems: "flex-end" }}>
                  <Text
                    style={{
                      backgroundColor: getStatusColor(activeOrder.status),
                      color: getTextColor(activeOrder.status),
                      borderRadius: 6,
                      paddingHorizontal: 8,
                      paddingVertical: 2,
                      fontWeight: "500",
                      fontSize: 11,
                    }}
                  >
                    {getStatusLabel(activeOrder.status)}
                  </Text>
                </View>
              </View>

              {/* Delivery Number */}
              <View style={{ marginBottom: 10 }}>
                <Text style={{ fontSize: 12, color: "#888" }}>
                  {isCourier ? "Delivery" : "Order"} No.
                </Text>
                <Text
                  style={{ fontSize: 16, fontWeight: "700", color: "#111" }}
                >
                  #{activeOrder?.orderIdPK}
                </Text>
              </View>

              {/* Progress Indicator */}
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  marginBottom: 12,
                }}
              >
                {STATUS_LABELS.map((label, index) => (
                  <View
                    key={label}
                    style={{
                      backgroundColor:
                        index <= progressStep ? "#4CAF50" : "#E8E8E8",
                      paddingHorizontal: 8,
                      paddingVertical: 4,
                      borderRadius: 12,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 9,
                        fontWeight: "600",
                        color: index <= progressStep ? "#fff" : "#888",
                      }}
                    >
                      {label}
                    </Text>
                  </View>
                ))}
              </View>

              {/* View Button */}
              <TouchableOpacity
                onPress={handleViewActiveOrder}
                style={{
                  backgroundColor: "#545EE1",
                  borderRadius: 20,
                  paddingVertical: 10,
                  alignItems: "center",
                }}
              >
                <Text
                  style={{ color: "#fff", fontWeight: "600", fontSize: 14 }}
                >
                  On the way
                </Text>
              </TouchableOpacity>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={{ alignItems: "center", marginTop: 15 }}>
            <Text style={{ color: "#666", fontSize: 14 }}>
              No active orders
            </Text>
          </View>
        )}

        {/* History Label */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            marginVertical: 15,
          }}
        >
          <View style={{ flex: 1, height: 1, backgroundColor: "#ccc" }} />
          <View
            style={{
              backgroundColor: "#E8E8E8",
              borderRadius: 6,
              paddingHorizontal: 16,
              paddingVertical: 6,
              marginHorizontal: 10,
            }}
          >
            <Text
              style={{
                color: "#333",
                fontWeight: "600",
                fontSize: 12,
                letterSpacing: 0.5,
              }}
            >
              HISTORY
            </Text>
          </View>
          <View style={{ flex: 1, height: 1, backgroundColor: "#ccc" }} />
        </View>

        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          {loading ? (
            <View
              style={{
                flex: 1,
                justifyContent: "center",
                alignItems: "center",
                paddingVertical: 40,
              }}
            >
              <ActivityIndicator size="large" color="#545EE1" />
              <Text style={{ marginTop: 10, color: "#666" }}>
                Loading orders...
              </Text>
            </View>
          ) : orders.length === 0 ? (
            <View
              style={{
                flex: 1,
                justifyContent: "center",
                alignItems: "center",
                paddingVertical: 40,
              }}
            >
              <Text style={{ color: "#666", fontSize: 16 }}>
                No {isCourier ? "deliveries" : "orders"} found
              </Text>
            </View>
          ) : (
            <FlatList
              nestedScrollEnabled={true}
              data={orders}
              keyExtractor={(item) => item.orderIdPK.toString()}
              ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
              contentContainerStyle={{ paddingBottom: 100 }}
              renderItem={({ item }) => (
                <TouchableOpacity
                  onPress={() => toggleExpand(item.orderIdPK)}
                  activeOpacity={0.9}
                  style={{
                    backgroundColor: "white",
                    borderRadius: 10,
                    padding: 16,
                    elevation: 2,
                    shadowColor: "#000",
                    shadowOpacity: 0.1,
                    shadowRadius: 4,
                    shadowOffset: { width: 0, height: 2 },
                  }}
                >
                  {/* Header Row */}
                  <View
                    style={{
                      flexDirection: "row",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                    }}
                  >
                    <View
                      style={{ flexDirection: "row", alignItems: "flex-start" }}
                    >
                      <View
                        style={{
                          width: 24,
                          height: 24,
                          borderRadius: 12,
                          backgroundColor:
                            item.status === Status.CANCELLED
                              ? "#FC5862"
                              : "#4CAF50",
                          justifyContent: "center",
                          alignItems: "center",
                          marginRight: 10,
                          marginTop: 2,
                        }}
                      >
                        <Ionicons
                          name={
                            item.status === Status.CANCELLED
                              ? "close"
                              : "checkmark"
                          }
                          size={14}
                          color="#fff"
                        />
                      </View>
                      <View>
                        <Text style={{ fontSize: 14, color: "#666" }}>
                          Order No.
                        </Text>
                        <Text
                          style={{
                            fontSize: 18,
                            fontWeight: "700",
                            color: "#000",
                          }}
                        >
                          #{item.orderIdPK}
                        </Text>
                      </View>
                    </View>

                    <View style={{ alignItems: "flex-end" }}>
                      <Text
                        style={{
                          backgroundColor:
                            item.status === Status.CANCELLED
                              ? "#FC5862"
                              : "#96FFB2",
                          color:
                            item.status === Status.CANCELLED
                              ? "#FFFFFF"
                              : "#000000",
                          borderRadius: 4,
                          paddingHorizontal: 10,
                          paddingVertical: 4,
                          fontWeight: "500",
                          fontSize: 12,
                        }}
                      >
                        {item.status === Status.CANCELLED
                          ? "Delivery Failed"
                          : "Delivered"}
                      </Text>
                      <Text
                        style={{ fontSize: 12, color: "#888", marginTop: 6 }}
                      >
                        {formatOrderTime(item.created_at)}
                      </Text>
                    </View>
                  </View>

                  {expandedOrderId === item.orderIdPK && (
                    <View
                      style={{
                        marginTop: 15,
                        borderTopWidth: 1,
                        borderColor: "#ddd",
                        paddingTop: 15,
                        gap: 20,
                      }}
                    >
                      {/* Buy Section */}
                      <View>
                        <Text
                          style={{
                            fontWeight: "700",
                            fontSize: 16,
                            paddingVertical: 5,
                          }}
                        >
                          🛒 Buy
                        </Text>
                        <Text style={{ color: "#555" }}>
                          {item.deliveryDetailsDTO?.destinationAddress || "N/A"}
                        </Text>
                        <View
                          style={{
                            borderWidth: 1,
                            borderColor: "#ccc",
                            borderRadius: 8,
                            padding: 8,
                            marginTop: 6,
                            gap: 10,
                          }}
                        >
                          <Text>{item.request || "No specification"}</Text>
                        </View>
                      </View>

                      {/* Delivery Instructions */}
                      <View>
                        <Text
                          style={{
                            fontWeight: "700",
                            fontSize: 16,
                            paddingVertical: 5,
                          }}
                        >
                          Delivery Instructions:
                        </Text>
                        <View
                          style={{
                            borderWidth: 1,
                            borderColor: "#ccc",
                            borderRadius: 8,
                            padding: 8,
                            marginTop: 6,
                          }}
                        >
                          <Text>
                            {item.deliveryDetailsDTO?.deliveryNotes ||
                              "No instructions"}
                          </Text>
                        </View>
                      </View>

                      {/* Delivery Section */}
                      <View>
                        <Text
                          style={{
                            fontWeight: "700",
                            fontSize: 16,
                            paddingVertical: 5,
                          }}
                        >
                          📍 Delivery
                        </Text>
                        <Text style={{ color: "#555" }}>
                          {item.deliveryDetailsDTO?.customerAddress || "N/A"}
                        </Text>
                        <View
                          style={{
                            flexDirection: "row",
                            alignItems: "center",
                            marginTop: 6,
                            paddingVertical: 5,
                          }}
                        >
                          <Text style={{ fontWeight: "600" }}>
                            Delivery Fee:
                          </Text>
                          <View
                            style={{
                              borderWidth: 1,
                              borderColor: "#aaa",
                              borderRadius: 6,
                              paddingHorizontal: 8,
                              marginLeft: 5,
                            }}
                          >
                            <Text style={{ fontWeight: "600" }}>
                              ₱
                              {item.paymentsResponseDTO?.deliveryFee?.toFixed(
                                2
                              ) || "0.00"}
                            </Text>
                          </View>
                        </View>
                      </View>

                      {/* Success Status */}
                      <View
                        style={{
                          alignItems: "center",
                          borderWidth: 1,
                          borderColor: getStatusTextColor(item.status),
                          borderRadius: 20,
                          paddingVertical: 10,
                          marginTop: 10,
                        }}
                      >
                        <Text
                          style={{
                            color: getStatusTextColor(item.status),
                            fontWeight: "900",
                          }}
                        >
                          {getText(item.status)}
                        </Text>
                      </View>
                    </View>
                  )}
                </TouchableOpacity>
              )}
            />
          )}
        </TouchableWithoutFeedback>
      </LinearGradient>
    </KeyboardAvoidingView>
  );
};

export default OrderHistory;

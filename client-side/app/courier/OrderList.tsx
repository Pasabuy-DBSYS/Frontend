import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  LayoutAnimation,
  Platform,
  UIManager,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Button } from "@/components/Button";
import ExpandOrder from "@/components/svg/ExpandOrder";
import MinimizeOrderIcon from "@/components/svg/MinimizeOrderIcon";
import NoOrderPoster from "@/components/svg/NoOrderPoster";
import { useNavigation } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import { CourierTrackingViewNavProp } from "@/types/types";
import PickIcon from "@/components/svg/PickIcon";
import LocationBlueIcon from "@/components/svg/LocationBlueIcon";
import ConfirmPickupModal from "@/components/modals/ConfirmDeliver";
import {
  OrderResponseDTO,
  Status,
} from "../api/dto/response/order.response.dto";
import {
  acceptOrderById,
  fetchOrderRealtime,
  getOrderById,
  getOrderByStatus,
  stopOrderRealtime,
} from "../api/orders";
import { useAuthStore } from "../api/store/auth_store";
import * as Location from "expo-location";
import { AcceptOrderRequestDTO } from "../api/dto/request/order.request.dto";
import { Coordinates } from "@/types/interfaces";
import { useActiveOrderStore } from "../api/store/order_store";

if (
  Platform.OS === "android" &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const OrderList = () => {
  const [expandedOrderId, setExpandedOrderId] = useState<number | null>(null);
  const navigator = useNavigation<CourierTrackingViewNavProp>();
  const [showConfirm, setShowConfirm] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);
  const { activeOrder, clearActiveOrder } = useActiveOrderStore();
  const [orders, setOrders] = useState<OrderResponseDTO[] | null>(null);
  const [location, setLocation] = useState<Coordinates | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isAccepting, setIsAccepting] = useState(false);

  const { user } = useAuthStore();

  const routeCourierTrackingView = async (orderId: number) => {
    console.log(`Order Id: ${orderId}`);
    const activeOrder = await getOrderById(orderId);

    navigator.navigate("CourierTrackingView", { orderId: orderId });
    setShowConfirm(false);
  };

  const getLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setErrorMsg("Permission to access location was denied");
        return;
      }

      const currentLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const coords: Coordinates = currentLocation.coords;
      setLocation(coords);

      console.log("📍 Current location:", JSON.stringify(coords)); // use local variable, not state
      return coords; // return it so you can use it immediately
    } catch (err) {
      console.error("Error getting location:", err);
      setErrorMsg("Failed to retrieve location");
    }
  };

  const acceptOrder = async (orderId: number) => {
    try {
      const coords = await getLocation(); // use the returned value
      const request: AcceptOrderRequestDTO = {
        courierId: user?.userIdPK!,
        courierLatitude: coords?.latitude ?? 0,
        courierLongitude: coords?.longitude ?? 0,
      };

      const response = await acceptOrderById(orderId, request);
      console.log("Order accepted:", response);
      return response;
    } catch (err: any) {
      console.error("Error accepting order:", err.message);
      throw err;
    }
  };

  // Fetch pending orders when screen is focused (and no active order)
  useFocusEffect(
    useCallback(() => {
      // Always rehydrate activeOrder from backend on focus
      (async () => {
        try {
          await useActiveOrderStore.getState().rehydrateActiveOrder();
        } catch (err) {
          console.error("[OrderList] Failed to rehydrate activeOrder:", err);
        }
      })();

      console.log(
        `[OrderList] Screen focused, activeOrder: ${
          useActiveOrderStore.getState().activeOrder?.orderIdPK ?? "none"
        }`
      );

      const activeOrder = useActiveOrderStore.getState().activeOrder;
      if (activeOrder) {
        // Don't fetch if courier has an active order
        console.log("[OrderList] Courier has active order, skipping fetch");
        return;
      }

      // Fetch pending orders
      const loadOrders = async () => {
        try {
          console.log("[OrderList] Fetching pending orders...");
          const pendingOrders = await getOrderByStatus(Status.PENDING);
          console.log(
            `[OrderList] Fetched ${pendingOrders?.length ?? 0} pending orders`
          );
          setOrders(pendingOrders);
        } catch (err: any) {
          console.error(
            "[OrderList] Failed to fetch pending orders:",
            err.message
          );
          setOrders([]);
        }
      };

      loadOrders();

      // Setup realtime listener for new orders
      fetchOrderRealtime((newOrder) => {
        console.log(
          `[OrderList] Realtime order update: ${newOrder.orderIdPK}, status: ${newOrder.status}`
        );
        if (newOrder.status === Status.PENDING) {
          // Add new pending order (avoid duplicates)
          setOrders((prev) => {
            if (!prev) return [newOrder];
            const exists = prev.some((o) => o.orderIdPK === newOrder.orderIdPK);
            return exists ? prev : [newOrder, ...prev];
          });
        } else {
          // Remove order from list if it's no longer pending
          setOrders((prev) =>
            prev ? prev.filter((o) => o.orderIdPK !== newOrder.orderIdPK) : null
          );
        }
      });

      return () => {
        console.log("[OrderList] Screen unfocused, stopping realtime");
        stopOrderRealtime();
      };
    }, [])
  );

  const onConfirmPickup = (orderId: number) => {
    setSelectedOrderId(orderId);
    setShowConfirm(true);
  };

  const handleConfirmPickup = async () => {
    if (!selectedOrderId || isAccepting) return;

    setIsAccepting(true);
    try {
      await acceptOrder(selectedOrderId);
      // Remove from list immediately
      setOrders((prev) =>
        prev ? prev.filter((o) => o.orderIdPK !== selectedOrderId) : null
      );
      setShowConfirm(false);
      routeCourierTrackingView(selectedOrderId);
    } catch (err) {
      console.error("Failed to accept order:", err);
      setShowConfirm(false);
    } finally {
      setIsAccepting(false);
      setSelectedOrderId(null);
    }
  };

  const toggleExpand = (orderId: number, order: OrderResponseDTO) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedOrderId(expandedOrderId === orderId ? null : orderId);
    console.log(`Order details: ${JSON.stringify(order)}`);
  };

  const hasOrders = Array.isArray(orders) && orders.length > 0;

  return (
    <LinearGradient
      colors={["#FFFFFF", "#545EE1"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      style={{
        flex: 1,
        paddingHorizontal: 20,
        paddingTop: "20%",
      }}
    >
      {/* Single modal outside FlatList */}
      <ConfirmPickupModal
        visible={showConfirm}
        onCancel={() => {
          setShowConfirm(false);
          setSelectedOrderId(null);
        }}
        onConfirm={handleConfirmPickup}
        title="Confirm Pickup"
        message="Are you sure you want to pick up this order?"
        confirmText={isAccepting ? "Accepting..." : "Yes, pick up"}
        cancelText="No"
      />

      <View style={{ flex: 1 }}>
        <Text style={{ color: "#333", fontWeight: "700", fontSize: 36 }}>
          Orders
        </Text>
        <Text
          style={{
            color: "#888",
            fontWeight: "300",
            fontSize: 18,
            marginBottom: hasOrders ? 20 : 0,
          }}
        >
          List of available orders
        </Text>

        {!hasOrders ? (
          <View
            style={{
              flex: 1,
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <NoOrderPoster />
            <Text style={{ marginTop: 20, color: "#2B2E35", fontSize: 25 }}>
              No New Orders
            </Text>
          </View>
        ) : (
          <FlatList
            data={orders}
            keyExtractor={(item) => item.orderIdPK.toString()}
            ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
            contentContainerStyle={{ paddingBottom: 100 }}
            renderItem={({ item }) => {
              if (item.customerId === user?.userIdPK) {
                return null;
              }
              const isExpanded = expandedOrderId === item.orderIdPK;
              return (
                <TouchableOpacity
                  style={{
                    backgroundColor: "white",
                    borderRadius: 10,
                    padding: 16,
                    elevation: 2,
                  }}
                  onPress={() => toggleExpand(item.orderIdPK, item)}
                  activeOpacity={1} // keeps it fully opaque on press
                >
                  {/* Header */}
                  <View
                    style={{
                      flexDirection: "row",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <View>
                      <Text style={{ fontSize: 18, color: "#000" }}>
                        Order No.
                      </Text>
                      <Text style={{ fontSize: 18, fontWeight: "600" }}>
                        #{item.orderIdPK}
                      </Text>
                    </View>

                    <TouchableOpacity
                      onPress={() => toggleExpand(item.orderIdPK, item)}
                      activeOpacity={0.7}
                    >
                      {isExpanded ? (
                        <MinimizeOrderIcon width={18} height={18} />
                      ) : (
                        <ExpandOrder width={18} height={18} />
                      )}
                    </TouchableOpacity>
                  </View>

                  {/* Expanded Content */}
                  {isExpanded && (
                    <View
                      style={{
                        marginTop: 15,
                        borderTopWidth: 1,
                        borderColor: "#ddd",
                        paddingTop: 15,
                        gap: 20,
                      }}
                    >
                      <View>
                        <View
                          style={{ flexDirection: "column", marginBottom: 10 }}
                        >
                          <View
                            style={{
                              flexDirection: "row",
                              alignItems: "center",
                            }}
                          >
                            <View style={{ marginRight: 8 }}>
                              <PickIcon width={20} height={20} />
                            </View>

                            <Text
                              style={{
                                fontWeight: "700",
                                fontSize: 18,
                                paddingVertical: 5,
                              }}
                            >
                              Buy
                            </Text>
                          </View>

                          <Text style={{ color: "#555", marginLeft: 28 }}>
                            {item.deliveryDetailsDTO?.destinationAddress}
                          </Text>
                        </View>

                        <View
                          style={{
                            borderWidth: 1,
                            borderColor: "#154D71",
                            borderRadius: 8,
                            padding: 8,
                            marginTop: 6,
                            gap: 10,
                          }}
                        >
                          <Text> {item.request}</Text>
                        </View>
                      </View>

                      <View>
                        <Text
                          style={{
                            fontWeight: "700",
                            fontSize: 18,
                            paddingVertical: 5,
                          }}
                        >
                          Delivery Instructions:
                        </Text>
                        <View
                          style={{
                            borderWidth: 1,
                            borderColor: "#154D71",
                            borderRadius: 8,
                            padding: 8,
                            marginTop: 6,
                          }}
                        >
                          <Text>{item.deliveryDetailsDTO?.deliveryNotes}</Text>
                        </View>
                      </View>

                      <View>
                        <View
                          style={{ flexDirection: "column", marginBottom: 10 }}
                        >
                          {/* Row: Icon + Label */}
                          <View
                            style={{
                              flexDirection: "row",
                              alignItems: "center",
                            }}
                          >
                            <View style={{ marginRight: 8 }}>
                              <LocationBlueIcon width={20} height={20} />
                            </View>

                            <Text
                              style={{
                                fontWeight: "700",
                                fontSize: 18,
                                paddingVertical: 5,
                              }}
                            >
                              Delivery
                            </Text>
                          </View>

                          {/* Delivery Location */}
                          <Text
                            style={{
                              color: "#555",
                              marginLeft: 28, // aligns text under label
                              lineHeight: 20,
                            }}
                          >
                            {item.deliveryDetailsDTO?.customerAddress}
                          </Text>
                        </View>

                        <View
                          style={{
                            flexDirection: "row",
                            alignItems: "center",
                            marginTop: 6,
                            paddingVertical: 5,
                          }}
                        >
                          <Text style={{ fontWeight: "600", fontSize: 18 }}>
                            Delivery Fee:
                          </Text>
                          <View
                            style={{
                              borderWidth: 1,
                              borderColor: "#aaa",
                              paddingHorizontal: 8,
                              marginLeft: 5,
                              height: 25,
                              justifyContent: "center",
                              marginRight: 5,
                            }}
                          >
                            <Text style={{ fontWeight: "600" }}>
                              {item.paymentsResponseDTO?.deliveryFee}
                            </Text>
                          </View>
                        </View>
                      </View>

                      <View style={{ alignItems: "center", marginTop: 10 }}>
                        <Button
                          onPress={() => {
                            onConfirmPickup(item.orderIdPK);
                          }}
                          textColor="white"
                          fontWeight="bold"
                          fontSize={17}
                          title="Confirm pickup"
                          height={50}
                          width="90%"
                          borderRadius={30}
                          backgroundColor="#545EE1"
                        />
                      </View>
                    </View>
                  )}
                </TouchableOpacity>
              );
            }}
          />
        )}
      </View>
    </LinearGradient>
  );
};

export default OrderList;

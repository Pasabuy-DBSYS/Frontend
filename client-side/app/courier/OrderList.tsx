import React, { useActionState, useEffect, useState } from "react";
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
import { order_list } from "@/constants/order_list";
import NoOrderPoster from "@/components/svg/NoOrderPoster";
import { useNavigation } from "expo-router";
import { CourierTrackingViewNavProp } from "@/types/types";
import PickIcon from "@/components/svg/PickIcon";
import LocationBlueIcon from "@/components/svg/LocationBlueIcon";
import ConfirmPickupModal from "@/components/modals/ConfirmDeliver";
import { OrderResponseDTO } from "../api/dto/response/auth.response.dto";
import axios from "axios";
import {
  acceptOrderById,
  fetchOrderRealtime,
  getOrderById,
  getOrderByStatus,
  stopOrderRealtime,
} from "../api/orders";
import { Status } from "../api/dto/response/order.response.dto";
import { useAuthStore } from "../api/store/auth_store";
import * as Location from "expo-location";
import { AcceptOrderRequestDTO } from "../api/dto/request/order.request.dto";
import * as SignalR from "@microsoft/signalr";
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
  const { activeOrder, clearActiveOrder } = useActiveOrderStore();
  const [orders, setOrders] = useState<OrderResponseDTO[] | null>(null);
  const [location, setLocation] = useState<Coordinates | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

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

  const fetchPendingOrders = async (): Promise<OrderResponseDTO[]> => {
    try {
      const response = await getOrderByStatus(Status.PENDING);

      setOrders(response);

      return response;
    } catch (err: any) {
      console.error(err.response.data);
      throw err;
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

  useEffect(() => {
    console.log(`ACTIVE ORDER: ${JSON.stringify(activeOrder)}`);
    if (!activeOrder) {
      fetchPendingOrders();
      fetchOrderRealtime((newOrder) => {
        if (newOrder.status === Status.PENDING) {
          setOrders((prev) => (prev ? [newOrder, ...prev] : [newOrder]));
        }
      });
    }
  }, []);

  const onConfirmPickup = () => {
    setShowConfirm(true);
  };

  const toggleExpand = (orderId: number, order: OrderResponseDTO) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedOrderId(expandedOrderId === orderId ? null : orderId);
    console.log(`Order details: ${JSON.stringify(order)}`);
  };

  const hasOrders = Array.isArray(orders) && orders.length > 0;

  return (
    <LinearGradient
      colors={["#545EE1", "#FFFFFF"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      style={{
        flex: 1,
        paddingHorizontal: 20,
        paddingTop: "20%",
      }}
    >
      <View style={{ flex: 1 }}>
        <Text style={{ color: "white", fontWeight: "700", fontSize: 36 }}>
          Orders
        </Text>
        <Text
          style={{
            color: "white",
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
                  <ConfirmPickupModal
                    visible={showConfirm}
                    onCancel={() => setShowConfirm(false)}
                    onConfirm={() => {
                      acceptOrder(item.orderIdPK);
                      routeCourierTrackingView(item.orderIdPK);
                    }}
                    title="Confirm Pickup"
                    message="Are you sure you want to pick up this order?"
                    confirmText="Yes, pick up"
                    cancelText="No"
                  />
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
                              {item.paymentsResponseDTO?.itemsFee}
                            </Text>
                          </View>
                        </View>
                      </View>

                      <View style={{ alignItems: "center", marginTop: 10 }}>
                        <Button
                          onPress={() => {
                            onConfirmPickup();
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

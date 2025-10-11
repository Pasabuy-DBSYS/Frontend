import React, { useState } from "react";
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
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { deliveries, orders } from "@/constants/orders";
import { Order } from "@/types/interfaces";
import { Button } from "@/components/Button";
import { HistoryMode } from "@/types/types";
import ExpandOrder from "@/components/svg/ExpandOrder";

// Enable layout animation on Android
if (
  Platform.OS === "android" &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const getStatusColor = (status: string): string => {
  switch (status) {
    case "Delivered":
      return "#96FFB2";
    case "In Transit":
      return "#97C8FF";
    case "Cancelled":
    case "Delivery Failed":
      return "#FC5862";
    default:
      return "#E0E0E0";
  }
};

const getTextColor = (status: string): string => {
  return status === "Cancelled" || status === "Delivery Failed"
    ? "#FFFFFF"
    : "#000000";
};

const getText = (status: string): string => {
  switch (status) {
    case "Delivered":
      return "Successful Transaction";
    case "In Transit":
    case "Pending":
      return "Upcoming Order";
    case "Delivery Failed":
    case "Cancelled":
      return "Unsuccessful Transaction";
    default:
      return "Error";
  }
};

const getStatusTextColor = (status: string): string => {
  switch (status) {
    case "Delivered":
      return "#4CAF50";
    case "In Transit":
      return "#97C8FF";
    case "Cancelled":
    case "Delivery Failed":
      return "#FC5862";
    default:
      return "#E0E0E0";
  }
};

const OrderHistory = () => {
  const [expandedOrderId, setExpandedOrderId] = useState<number | null>(null);
  const [orderHistoryMode, setOrderHistoryMode] =
    useState<HistoryMode>("Order");

  const toggleExpand = (orderId: number) => {
    setExpandedOrderId(expandedOrderId === orderId ? null : orderId);
  };

  return (
    <ScrollView>
      <KeyboardAvoidingView style={{ flex: 1 }}>
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
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
            <Text style={{ color: "white", fontWeight: "700", fontSize: 36 }}>
              Order History
            </Text>

            <Text
              style={{
                color: "white",
                fontWeight: "300",
                fontSize: 16,
                marginBottom: 20,
              }}
            >
              Lets you track and review all your past deliveries and orders
            </Text>

            <View
              style={{
                display: "flex",
                flexDirection: "row",
                justifyContent: "center",
              }}
            >
              <Button
                title="Orders"
                onPress={() => setOrderHistoryMode("Order")}
                backgroundColor={
                  orderHistoryMode === "Order" ? "#545EE1" : "#FFFFFF"
                }
                textColor={
                  orderHistoryMode === "Order"
                    ? "#FFFFFF"
                    : "rgba(0, 0, 0, 0.3)"
                }
                borderRadius={30}
                fontSize={15}
                fontWeight="bold"
                padding={10}
                margin={10}
                width={124}
                height={35}
              />

              <Button
                title="Deliveries"
                onPress={() => setOrderHistoryMode("Deliveries")}
                backgroundColor={
                  orderHistoryMode === "Deliveries" ? "#545EE1" : "#FFFFFF"
                }
                textColor={
                  orderHistoryMode === "Deliveries"
                    ? "#FFFFFF"
                    : "rgba(0, 0, 0, 0.3)"
                }
                borderColor="#545EE1"
                borderWidth={1}
                borderRadius={30}
                fontSize={15}
                fontWeight="bold"
                padding={10}
                margin={10}
                width={124}
                height={35}
              />
            </View>

            <FlatList
              nestedScrollEnabled={true}
              scrollEnabled={false}
              data={orderHistoryMode === "Order" ? orders : deliveries}
              keyExtractor={(item) => item.orderId.toString()}
              ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
              renderItem={({ item }) => (
                <View
                  style={{
                    backgroundColor: "white",
                    borderRadius: 10,
                    padding: 16,
                    elevation: 2,
                  }}
                >
                  {/* Header Row */}
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
                        #{item.orderId}
                      </Text>
                    </View>

                    <View style={{ alignItems: "flex-end" }}>
                      <Text
                        style={{
                          backgroundColor: getStatusColor(item.orderStatus),
                          color: getTextColor(item.orderStatus),
                          borderRadius: 6,
                          paddingHorizontal: 10,
                          paddingVertical: 4,
                          fontWeight: "500",
                        }}
                      >
                        {item.orderStatus}
                      </Text>
                      <Text
                        style={{ fontSize: 12, color: "#555", marginTop: 4 }}
                      >
                        {item.formattedTime}
                      </Text>
                    </View>
                  </View>

                  <TouchableOpacity
                    onPress={() => toggleExpand(item.orderId)}
                    style={{
                      alignSelf: "center",
                      backgroundColor: "transparent",
                      paddingHorizontal: 20,
                      borderRadius: 8,
                      marginTop: 10,
                    }}
                  >
                    <ExpandOrder />
                  </TouchableOpacity>

                  {expandedOrderId === item.orderId && (
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
                          {item.locationBought}
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
                          <Text>{item.specification}</Text>
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
                          <Text>{item.instructions}</Text>
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
                          {item.placeDelivered}
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
                            <Text style={{ fontWeight: "600" }}>₱50</Text>
                          </View>
                        </View>
                      </View>

                      {/* Success Status */}
                      <View
                        style={{
                          alignItems: "center",
                          borderWidth: 1,
                          borderColor: getStatusTextColor(item.orderStatus),
                          borderRadius: 20,
                          paddingVertical: 10,
                          marginTop: 10,
                        }}
                      >
                        <Text
                          style={{
                            color: getStatusTextColor(item.orderStatus),
                            fontWeight: "900",
                          }}
                        >
                          {getText(item.orderStatus)}
                        </Text>
                      </View>
                    </View>
                  )}
                </View>
              )}
            />
          </LinearGradient>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </ScrollView>
  );
};

export default OrderHistory;

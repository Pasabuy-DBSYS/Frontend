import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Dimensions,
  Platform,
  ScrollView,
} from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import SwitchIcon from "@/components/svg/SwitchIcon";
import SwitchRole from "../../components/modals/SwitchRole";
import { useNavigation } from "@react-navigation/native";
import { useAuthStore } from "../api/store/auth_store";
import { changeRole } from "../api/user";
import { useActiveOrderStore } from "../api/store/order_store";
import { Status } from "../api/dto/response/order.response.dto";
import { LinearGradient } from "expo-linear-gradient";

const screenWidth = Dimensions.get("window").width;

const Home = () => {
  const [toggleModal, setToggleModal] = useState<boolean>(false);
  const navigator = useNavigation();
  const { user } = useAuthStore();
  const { activeOrder } = useActiveOrderStore();

  const hasActiveOrder =
    activeOrder &&
    activeOrder.status !== Status.CANCELLED &&
    activeOrder.status !== Status.DELIVERED &&
    activeOrder.status !== Status.REVIEWED;

  const switchRole = () => {
    if (hasActiveOrder) {
      return; // Don't allow switching if there's an active order
    }
    setToggleModal(true);
  };

  const switchRolePersist = async () => {
    try {
      console.log(`OLD TOKEN: ${useAuthStore.getState().token}`);
      const { newToken } = await changeRole();
      await useAuthStore.getState().refreshToken(newToken);
      console.log(`NEW TOKEN: ${newToken}`);
    } catch (error) {
      console.error("Error changing role:", error);
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 18) return "Good Afternoon";
    return "Good Evening";
  };
  return (
    <LinearGradient
      colors={["#545EE1", "#FFFFFF"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      style={{ flex: 1 }}
    >
      <View style={{ flex: 1 }}>
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingBottom: 30, paddingTop: 40 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View
            style={{
              paddingHorizontal: 24,
              paddingTop: 20,
            }}
          >
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <View>
                <Text style={{ fontSize: 14, color: "#888" }}>
                  {getGreeting()} 👋
                </Text>
                <Text
                  style={{
                    fontSize: 28,
                    fontWeight: "bold",
                    color: "#333",
                    marginTop: 4,
                  }}
                >
                  {user?.firstName || "User"}
                </Text>
              </View>
              <TouchableOpacity
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 24,
                  backgroundColor: "#F5F5F5",
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                <Ionicons
                  name="notifications-outline"
                  size={24}
                  color="#545EE1"
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Role Card */}
          <View style={{ paddingHorizontal: 24, marginTop: 24 }}>
            <View
              style={{
                backgroundColor: "#F5F7FF",
                borderRadius: 20,
                padding: 20,
                borderWidth: 1,
                borderColor: "#E8EBFF",
              }}
            >
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <View>
                  <Text
                    style={{
                      fontSize: 14,
                      color: "#888",
                    }}
                  >
                    Currently logged in as
                  </Text>
                  <Text
                    style={{
                      fontSize: 22,
                      fontWeight: "bold",
                      color: "#545EE1",
                      marginTop: 4,
                    }}
                  >
                    Commissioner
                  </Text>
                </View>
                <TouchableOpacity
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    backgroundColor: hasActiveOrder ? "#ccc" : "#545EE1",
                    paddingVertical: 10,
                    paddingHorizontal: 16,
                    borderRadius: 12,
                    gap: 8,
                    opacity: hasActiveOrder ? 0.6 : 1,
                  }}
                  onPress={switchRole}
                  disabled={!!hasActiveOrder}
                >
                  <SwitchIcon />
                  <Text style={{ color: "white", fontWeight: "600" }}>
                    Switch
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Active Order Banner */}
          {hasActiveOrder && (
            <View style={{ paddingHorizontal: 24, marginTop: 24 }}>
              <TouchableOpacity
                style={{
                  backgroundColor: "#4CAF50",
                  borderRadius: 16,
                  padding: 16,
                  flexDirection: "row",
                  alignItems: "center",
                }}
                onPress={() =>
                  navigator.navigate(
                    "CustomerTrackingView" as never,
                    {
                      orderId: activeOrder.orderIdPK,
                    } as never
                  )
                }
              >
                <View
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 24,
                    backgroundColor: "rgba(255,255,255,0.2)",
                    justifyContent: "center",
                    alignItems: "center",
                  }}
                >
                  <MaterialCommunityIcons
                    name="truck-delivery"
                    size={24}
                    color="white"
                  />
                </View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text
                    style={{ fontSize: 16, fontWeight: "700", color: "white" }}
                  >
                    Order in Progress
                  </Text>
                  <Text
                    style={{ fontSize: 13, color: "rgba(255,255,255,0.8)" }}
                  >
                    Tap to track your delivery
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={24} color="white" />
              </TouchableOpacity>
            </View>
          )}
          {/* Quick Actions */}
          <View style={{ paddingHorizontal: 24, marginTop: 24 }}>
            <Text
              style={{
                fontSize: 18,
                fontWeight: "700",
                color: "#333",
                marginBottom: 16,
              }}
            >
              Quick Actions
            </Text>
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
              }}
            >
              <TouchableOpacity
                style={{
                  backgroundColor: "white",
                  borderRadius: 20,
                  padding: 20,
                  alignItems: "center",
                  width: (screenWidth - 64) / 2,
                  shadowColor: "#000",
                  shadowOpacity: 0.1,
                  shadowRadius: 10,
                  elevation: 5,
                }}
                onPress={() => navigator.navigate("Orders" as never)}
              >
                <View
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: 16,
                    backgroundColor: "#E8EBFF",
                    justifyContent: "center",
                    alignItems: "center",
                    marginBottom: 12,
                  }}
                >
                  <Ionicons name="add-circle" size={28} color="#545EE1" />
                </View>
                <Text
                  style={{ fontSize: 15, fontWeight: "600", color: "#333" }}
                >
                  New Order
                </Text>
                <Text
                  style={{
                    fontSize: 12,
                    color: "#888",
                    marginTop: 4,
                    textAlign: "center",
                  }}
                >
                  Request a delivery
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={{
                  backgroundColor: "white",
                  borderRadius: 20,
                  padding: 20,
                  alignItems: "center",
                  width: (screenWidth - 64) / 2,
                  shadowColor: "#000",
                  shadowOpacity: 0.1,
                  shadowRadius: 10,
                  elevation: 5,
                }}
                onPress={() => navigator.navigate("OrderHistory" as never)}
              >
                <View
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: 16,
                    backgroundColor: "#E8EBFF",
                    justifyContent: "center",
                    alignItems: "center",
                    marginBottom: 12,
                  }}
                >
                  <Ionicons name="time" size={28} color="#545EE1" />
                </View>
                <Text
                  style={{ fontSize: 15, fontWeight: "600", color: "#333" }}
                >
                  History
                </Text>
                <Text
                  style={{
                    fontSize: 12,
                    color: "#888",
                    marginTop: 4,
                    textAlign: "center",
                  }}
                >
                  View past orders
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Stats Section */}
          <View style={{ paddingHorizontal: 24, marginTop: 24 }}>
            <Text
              style={{
                fontSize: 18,
                fontWeight: "700",
                color: "#333",
                marginBottom: 16,
              }}
            >
              Your Stats
            </Text>

            <View
              style={{
                backgroundColor: "white",
                borderRadius: 20,
                padding: 20,
                shadowColor: "#000",
                shadowOpacity: 0.1,
                shadowRadius: 10,
                elevation: 5,
              }}
            >
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-around",
                }}
              >
                <View style={{ alignItems: "center" }}>
                  <View
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: 24,
                      backgroundColor: "#E8EBFF",
                      justifyContent: "center",
                      alignItems: "center",
                      marginBottom: 8,
                    }}
                  >
                    <Ionicons name="receipt" size={22} color="#545EE1" />
                  </View>
                  <Text
                    style={{ fontSize: 24, fontWeight: "bold", color: "#333" }}
                  >
                    12
                  </Text>
                  <Text style={{ fontSize: 12, color: "#888" }}>
                    Total Orders
                  </Text>
                </View>

                <View
                  style={{
                    width: 1,
                    backgroundColor: "#E0E0E0",
                    marginHorizontal: 16,
                  }}
                />

                <View style={{ alignItems: "center" }}>
                  <View
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: 24,
                      backgroundColor: "#FFF3E0",
                      justifyContent: "center",
                      alignItems: "center",
                      marginBottom: 8,
                    }}
                  >
                    <Ionicons name="wallet" size={22} color="#FF9800" />
                  </View>
                  <Text
                    style={{ fontSize: 24, fontWeight: "bold", color: "#333" }}
                  >
                    ₱850
                  </Text>
                  <Text style={{ fontSize: 12, color: "#888" }}>
                    Total Spent
                  </Text>
                </View>

                <View
                  style={{
                    width: 1,
                    backgroundColor: "#E0E0E0",
                    marginHorizontal: 16,
                  }}
                />

                <View style={{ alignItems: "center" }}>
                  <View
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: 24,
                      backgroundColor: "#E8F5E9",
                      justifyContent: "center",
                      alignItems: "center",
                      marginBottom: 8,
                    }}
                  >
                    <Ionicons name="star" size={22} color="#4CAF50" />
                  </View>
                  <Text
                    style={{ fontSize: 24, fontWeight: "bold", color: "#333" }}
                  >
                    4.8
                  </Text>
                  <Text style={{ fontSize: 12, color: "#888" }}>Rating</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Tips Section */}
          <View style={{ paddingHorizontal: 24, marginTop: 24 }}>
            <View
              style={{
                backgroundColor: "#FFF9E6",
                borderRadius: 16,
                padding: 16,
                borderWidth: 1,
                borderColor: "#FFE082",
              }}
            >
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <Ionicons name="bulb" size={24} color="#FFB300" />
                <Text
                  style={{
                    fontSize: 14,
                    color: "#333",
                    marginLeft: 12,
                    flex: 1,
                  }}
                >
                  Tip: Be specific with your order details for faster delivery!
                </Text>
              </View>
            </View>
          </View>
        </ScrollView>

        <SwitchRole
          isVisible={toggleModal}
          onClose={() => setToggleModal(false)}
          onConfirm={() => {
            switchRolePersist();
            setToggleModal(false);
            navigator.reset({
              index: 0,
              routes: [{ name: "CourierNavigationBar" as never }],
            });
          }}
        />
      </View>
    </LinearGradient>
  );
};

export default Home;

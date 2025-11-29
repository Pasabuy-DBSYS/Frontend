import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Dimensions,
  Platform,
  SafeAreaView,
  ScrollView,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import SwitchIcon from "@/components/svg/SwitchIcon";
import SwitchRole from "../../components/modals/SwitchRole";
import { useNavigation } from "@react-navigation/native";
import { changeRole } from "../api/user";
import { useAuthStore } from "../api/store/auth_store";
import { useActiveOrderStore } from "../api/store/order_store";
import { Status } from "../api/dto/response/order.response.dto";

const screenWidth = Dimensions.get("window").width;

const CourierHome = () => {
  const [toggleModal, setToggleModal] = useState<boolean>(false);
  const navigator = useNavigation();
  const { user } = useAuthStore();
  const { activeOrder } = useActiveOrderStore();

  const hasActiveDelivery =
    activeOrder &&
    activeOrder.status !== Status.CANCELLED &&
    activeOrder.status !== Status.DELIVERED &&
    activeOrder.status !== Status.REVIEWED;

  const switchRole = () => {
    if (hasActiveDelivery) {
      return; // Don't allow switching if there's an active delivery
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
      colors={["#FFFFFF", "#545EE1"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      style={{ flex: 1 }}
    >
      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingBottom: 30 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View
            style={{
              paddingHorizontal: 24,
              paddingTop: Platform.OS === "android" ? 50 : 20,
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
                  {user?.firstName || "Courier"}
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
                    Courier
                  </Text>
                </View>
                <TouchableOpacity
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    backgroundColor: hasActiveDelivery ? "#ccc" : "#545EE1",
                    paddingVertical: 10,
                    paddingHorizontal: 16,
                    borderRadius: 12,
                    gap: 8,
                    opacity: hasActiveDelivery ? 0.6 : 1,
                  }}
                  onPress={switchRole}
                  disabled={!!hasActiveDelivery}
                >
                  <SwitchIcon />
                  <Text style={{ color: "white", fontWeight: "600" }}>
                    Switch
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Active Delivery Banner */}
          {hasActiveDelivery && (
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
                    "CourierTrackingView" as never,
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
                    name="truck-fast"
                    size={24}
                    color="white"
                  />
                </View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text
                    style={{ fontSize: 16, fontWeight: "700", color: "white" }}
                  >
                    Active Delivery
                  </Text>
                  <Text
                    style={{ fontSize: 13, color: "rgba(255,255,255,0.8)" }}
                  >
                    Tap to continue delivery
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
                onPress={() => navigator.navigate("OrderList" as never)}
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
                  <Ionicons name="search" size={28} color="#545EE1" />
                </View>
                <Text
                  style={{ fontSize: 15, fontWeight: "600", color: "#333" }}
                >
                  Find Orders
                </Text>
                <Text
                  style={{
                    fontSize: 12,
                    color: "#888",
                    marginTop: 4,
                    textAlign: "center",
                  }}
                >
                  Accept deliveries
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
                  View past deliveries
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
                color: "white",
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
                    <MaterialCommunityIcons
                      name="truck-check"
                      size={22}
                      color="#545EE1"
                    />
                  </View>
                  <Text
                    style={{ fontSize: 24, fontWeight: "bold", color: "#333" }}
                  >
                    48
                  </Text>
                  <Text style={{ fontSize: 12, color: "#888" }}>
                    Deliveries
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
                    <Ionicons name="cash" size={22} color="#4CAF50" />
                  </View>
                  <Text
                    style={{ fontSize: 24, fontWeight: "bold", color: "#333" }}
                  >
                    ₱2,450
                  </Text>
                  <Text style={{ fontSize: 12, color: "#888" }}>Earnings</Text>
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
                      backgroundColor: "#FFF8E1",
                      justifyContent: "center",
                      alignItems: "center",
                      marginBottom: 8,
                    }}
                  >
                    <Ionicons name="star" size={22} color="#FFC107" />
                  </View>
                  <Text
                    style={{ fontSize: 24, fontWeight: "bold", color: "#333" }}
                  >
                    4.9
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
                backgroundColor: "rgba(255,255,255,0.2)",
                borderRadius: 16,
                padding: 16,
                borderWidth: 1,
                borderColor: "rgba(255,255,255,0.3)",
              }}
            >
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <Ionicons name="bulb" size={24} color="#FFD700" />
                <Text
                  style={{
                    fontSize: 14,
                    color: "white",
                    marginLeft: 12,
                    flex: 1,
                  }}
                >
                  Tip: Quick responses lead to better ratings and more orders!
                </Text>
              </View>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>

      <SwitchRole
        isVisible={toggleModal}
        onClose={() => setToggleModal(false)}
        onConfirm={() => {
          setToggleModal(false);
          switchRolePersist();
          navigator.reset({
            index: 0,
            routes: [{ name: "CustomerNavigationBar" as never }],
          });
        }}
      />
    </LinearGradient>
  );
};

export default CourierHome;

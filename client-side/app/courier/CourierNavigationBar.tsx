import Home from "@/app/customer/CustomerHome";
import Orders from "@/app/customer/Orders";
import { useNavigation, useRoute } from "@react-navigation/native";
import React, { useState, useRef, useEffect, use } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Animated,
  Dimensions,
} from "react-native";
import HomeIcon from "../../components/svg/HomeIcon";
import CartIcon from "../../components/svg/CartIcon";
import ProfileIcon from "../../components/svg/ProfileIcon";
import HistoryIcon from "../../components/svg/HistoryIcon";
import NotifcationIcon from "../../components/svg/NotifcationIcon";
import OrderHistory from "@/app/customer/OrderHistory";
import Profile from "@/components/Profile";
import CourierHome from "./CourierHome";
import OrdersIcon from "@/components/svg/OrdersIcon";
import OrderList from "./OrderList";
import ActiveOrderBanner from "@/components/ActiveOrderBanner";
import MessagePage from "@/components/MessagePage";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useOrdersHubStore } from "../api/store/orders_hub_store";
import Notifications from "@/components/Notifications";
import {
  estimateDeliveryTime,
  receiveOrderStatusRealtime,
} from "../api/orders";
import { useMessageRoomState } from "../api/store/message_room_store";
import { usePaymentStore } from "../api/store/payment_store";
import { Status } from "../api/dto/response/order.response.dto";
import { useActiveOrderStore } from "../api/store/order_store";
import * as Location from "expo-location";
import { Coordinates } from "@/types/interfaces";

const CourierNavigationBar = () => {
  const [activeTab, setActiveTab] = useState(2);
  const { width } = Dimensions.get("window");
  const route = useRoute<any>();
  const navPage = route.params?.navPage;
  const { disconnect, isReady } = useOrdersHubStore();
  const activeTabReceived = route.params?.activeTab;
  const [deliveryTime, setDeliveryTime] = useState<any>({});

  // Get active order from store
  const { activeOrder, setActiveOrder } = useActiveOrderStore();
  const [tempActiveOrder, setTempActiveOrder] = useState<any>();

  const navItems = [
    { icon: <OrdersIcon />, name: "Orders" },
    { icon: <NotifcationIcon />, name: "Notification" },
    { icon: <HomeIcon />, name: "Home" },
    { icon: <HistoryIcon />, name: "History" },
    { icon: <ProfileIcon />, name: "Profile" },
  ];

  // SignalR connection is now handled globally by useOrderSignalRStore
  useEffect(() => {
    console.log(`📡 CourierNavigationBar mounted, SignalR ready: ${isReady}`);

    // Restore messageRoomParticipants from persisted activeOrder
    const { rehydrateMessageRoom } = useMessageRoomState.getState();
    rehydrateMessageRoom();

    return () => {
      console.log("🔄 CourierNavigationBar unmounting");
    };
  }, [isReady]);

  const receiveOrderStatus = async () => {
    await receiveOrderStatusRealtime();
  };

  useEffect(() => {
    receiveOrderStatus();
  }, []);

  // 📍 NEW: Location Tracking useEffect
  useEffect(() => {
    let subscription: Location.LocationSubscription | undefined; // Only start tracking if there is an active order
    if (!activeOrder?.orderIdPK) {
      console.log("No active order, location tracking paused.");
      return;
    }
    const { initConnection, addHandler, removeHandler, invokeHub } =
      useOrdersHubStore.getState();

    const startTracking = async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        console.warn("Location permission not granted");
        return;
      }

      try {
        await initConnection(); // Ensure SignalR is connected

        subscription = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.BestForNavigation,
            timeInterval: 2000, // Update every 2 seconds (or adjust)
            distanceInterval: 5, // Only update when moved 5 meters
          },
          async (location) => {
            const courierCoords = {
              latitude: location.coords.latitude,
              longitude: location.coords.longitude,
            };

            // 1. Update global store (useLocationStore is assumed)
            // useLocationStore.setCourierLocation(courierCoords);

            // 2. Send location via SignalR
            // We only call invokeHub here. The update to the actual
            // ActiveOrder state (like `courierLatitude`) should ideally happen
            // via an API call or a SignalR response handler to ensure sync.
            await invokeHub(
              "UpdateCourierLocation",
              activeOrder.orderIdPK,
              courierCoords.latitude,
              courierCoords.longitude
            );

            console.log(
              `[NAVBAR] Sent location update for Order ${activeOrder.orderIdPK}`
            );

            const customerLocation: Coordinates = {
              latitude: activeOrder.deliveryDetailsDTO.customerLatitude,
              longitude: activeOrder.deliveryDetailsDTO.customerLongitude,
            };

            const tempTime = await estimateDeliveryTime(
              courierCoords,
              customerLocation
            );

            setDeliveryTime(tempTime);
          }
        );
      } catch (err) {
        console.error("[NAVBAR] Location Tracking or SignalR Error:", err);
      }
    };

    startTracking();

    return () => {
      console.log("[NAVBAR] Stopping Location Tracking subscription.");
      subscription?.remove();
    };
    // Dependency includes activeOrder to react to order changes (e.g., cancellation)
  }, [activeOrder]);

  // Scale animation (no lift)
  const scaleAnims = useRef(
    navItems.map((_, i) => new Animated.Value(i === 2 ? 1.2 : 1))
  ).current;

  /** Animate icon scale only */
  useEffect(() => {
    navItems.forEach((_, index) => {
      const isActive = index === activeTab;
      Animated.spring(scaleAnims[index], {
        toValue: isActive ? 1.2 : 1,
        friction: 6,
        tension: 100,
        useNativeDriver: true,
      }).start();
    });
  }, [activeTab]);

  useEffect(() => {
    if (navPage !== undefined && navPage !== null) {
      setActiveTab(navPage);
    } else if (activeTabReceived !== undefined && activeTabReceived !== null) {
      setActiveTab(activeTabReceived);
    }
  }, [navPage, activeTabReceived]);

  const handlePress = (index: number) => {
    setActiveTab(index);
  };

  const hideBanner = activeTab === 4;

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: "white",
      }}
    >
      {/* Content Area - takes full space, content scrolls under navbar */}
      <View
        style={{
          flex: 1,
          backgroundColor: "white",
        }}
      >
        {activeTab === 2 && <CourierHome setActiveTab={setActiveTab} />}
        {(activeTab === 0 || navPage) && <OrderList />}
        {activeTab === 3 && <OrderHistory />}
        {activeTab === 4 && <Profile />}
        {activeTab === 1 && <Notifications />}
      </View>

      {/* Floating Navigation Bar - always on top */}
      <View
        style={{
          alignItems: "center",
          justifyContent: "center",
          position: "absolute",
          bottom: 50,
          left: 0,
          right: 0,
          zIndex: 999,
          elevation: 999,
        }}
      >
        {/* Purple Bar */}
        <View
          style={{
            flexDirection: "row",
            backgroundColor: "#545EE1",
            width: width - 40,
            height: 50,
            borderRadius: 28,
            justifyContent: "space-evenly",
            alignItems: "center",
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.6,
            shadowRadius: 6,
            elevation: 10,
          }}
        >
          {navItems.map((_, index) => (
            <TouchableOpacity
              key={index}
              onPress={() => handlePress(index)}
              activeOpacity={0.8}
              style={{
                flex: 1,
                alignItems: "center",
                justifyContent: "center",
                height: "100%",
              }}
            ></TouchableOpacity>
          ))}
        </View>

        {/* Icon Layer */}
        <View
          style={{
            position: "absolute",
            bottom: 0,
            flexDirection: "row",
            width: width - 40,
            height: 40,
            justifyContent: "space-evenly",
            alignItems: "center",
            zIndex: 1000,
            elevation: 1000,
            pointerEvents: "none",
          }}
        >
          {navItems.map((item, index) => (
            <View
              key={index}
              style={{
                flex: 1,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Animated.View
                style={{
                  transform: [{ scale: scaleAnims[index] }],
                  width: 50,
                  height: 50,
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                {item.icon}
              </Animated.View>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
};

export default CourierNavigationBar;

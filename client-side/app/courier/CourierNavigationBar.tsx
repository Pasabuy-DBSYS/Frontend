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
import { receiveOrderStatusRealtime } from "../api/orders";
import { useActiveOrderStore } from "../api/store/order_store";
import { useMessageRoomState } from "../api/store/message_room_store";

const CourierNavigationBar = () => {
  const [activeTab, setActiveTab] = useState(2);
  const { width } = Dimensions.get("window");
  const route = useRoute<any>();
  const navPage = route.params?.navPage;
  const { disconnect, isReady } = useOrdersHubStore();
  const activeTabReceived = route.params?.activeTab;

  const navItems = [
    { icon: <OrdersIcon />, name: "Orders" },
    { icon: <NotifcationIcon />, name: "Notification" },
    { icon: <HomeIcon />, name: "Home" },
    { icon: <HistoryIcon />, name: "History" },
    { icon: <ProfileIcon />, name: "Profile" },
  ];

  // SignalR connection is already initialized in App.tsx
  // Just log the connection status here
  useEffect(() => {
    console.log(`📡 CourierNavigationBar mounted, SignalR ready: ${isReady}`);

    // Restore messageRoomParticipants from persisted activeOrder
    const { rehydrateMessageRoom } = useMessageRoomState.getState();
    rehydrateMessageRoom();

    return () => {
      // Don't disconnect here - let App.tsx manage the connection lifecycle
      console.log("🔄 CourierNavigationBar unmounting");
    };
  }, [isReady]);

  const receiveOrderStatus = async () => {
    await receiveOrderStatusRealtime();
  };

  useEffect(() => {
    receiveOrderStatus();
  }, []);
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

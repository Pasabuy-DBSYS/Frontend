import Home from "@/app/customer/CustomerHome";
import Orders from "@/app/customer/Orders";
import { useNavigation, useRoute } from "@react-navigation/native";
import React, { useState, useRef, useEffect, act } from "react";
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
import ActiveOrderBanner from "@/components/ActiveOrderBanner";
import { receiveOrderRealtime } from "../api/orders";
import { useOrdersHubStore } from "../api/store/orders_hub_store";

const CustomerNavigationBar = () => {
  const [activeTab, setActiveTab] = useState(2);
  const { width } = Dimensions.get("window");
  const route = useRoute<any>();
  const navPage = route.params?.navPage;
  const { disconnect } = useOrdersHubStore();

  const navItems = [
    { icon: <CartIcon />, name: "Cart" },
    { icon: <NotifcationIcon />, name: "Notification" },
    { icon: <HomeIcon />, name: "Home" },
    { icon: <HistoryIcon />, name: "History" },
    { icon: <ProfileIcon />, name: "Profile" },
  ];

  useEffect(() => {
    let isMounted = true;

    const initRealtime = async () => {
      try {
        await receiveOrderRealtime();
        console.log("✅ Connected to OrdersHub for real-time updates");
      } catch (err) {
        console.error("❌ Failed to connect to OrdersHub:", err);
      }
    };

    initRealtime();

    return () => {
      if (isMounted) {
        disconnect(); // safely stop connection when user leaves customer side
        console.log("🛑 Disconnected from OrdersHub");
        isMounted = false;
      }
    };
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
    }
  }, [navPage]);

  const handlePress = (index: number) => {
    setActiveTab(index);
  };

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: "white",
      }}
    >
      {/* Main Screens */}
      <View
        style={{
          flex: 1,
          backgroundColor: "white",
          maxHeight: "90%",
          paddingBottom: "5%",
        }}
      >
        {activeTab === 2 && <Home />}
        {(activeTab === 0 || navPage) && <Orders />}
        {activeTab === 3 && <OrderHistory />}
        {activeTab === 4 && <Profile />}
      </View>

      {/* Fixed Navbar */}
      <View
        style={{
          alignItems: "center",
          justifyContent: "center",
          position: "absolute",
          bottom: 50,
          width: "100%",
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
            elevation: 8,
            zIndex: 1,
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
            zIndex: 3,
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
                <Animated.Text>{item.icon}</Animated.Text>
              </Animated.View>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
};

export default CustomerNavigationBar;

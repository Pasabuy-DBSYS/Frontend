import Home from "@/app/courier/Home";
import Orders from "@/app/customer/Orders";
import { useNavigation, useRoute } from "@react-navigation/native";
import React, { useState, useRef, useEffect, Profiler } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Animated,
  Dimensions,
} from "react-native";
import HomeIcon from "./svg/couriers/HomeIcon";
import CartIcon from "./svg/couriers/CartIcon";
import ProfileIcon from "./svg/couriers/ProfileIcon";
import HistoryIcon from "./svg/couriers/HistoryIcon";
import NotifcationIcon from "./svg/couriers/NotifcationIcon";
import OrderHistory from "@/app/customer/OrderHistory";
import Profile from "@/app/customer/Profile";

const CourierNavigationBar = () => {
  const [activeTab, setActiveTab] = useState(2);
  const { width, height } = Dimensions.get("window");
  const route = useRoute<any>();

  const navPage = route.params?.navPage;

  const navItems = [
    { icon: <CartIcon />, name: "Cart" },
    { icon: <NotifcationIcon />, name: "Notification" },
    { icon: <HomeIcon />, name: "Home" },
    { icon: <HistoryIcon />, name: "History" },
    { icon: <ProfileIcon />, name: "Profile" },
  ];

  const navigation = useNavigation();
  const scaleAnims = useRef(
    navItems.map((_, i) => new Animated.Value(i === 2 ? 1.2 : 1))
  ).current;
  const translateYAnims = useRef(
    navItems.map((_, i) => new Animated.Value(i === 2 ? -25 : 0))
  ).current;
  const backgroundOpacity = useRef(
    navItems.map((_, i) => new Animated.Value(i === 2 ? 1 : 0))
  ).current;

  useEffect(() => {
    navItems.forEach((_, index) => {
      const isActive = index === activeTab;
      Animated.parallel([
        Animated.spring(scaleAnims[index], {
          toValue: isActive ? 1.2 : 1,
          friction: 6,
          tension: 100,
          useNativeDriver: true,
        }),
        Animated.spring(translateYAnims[index], {
          toValue: isActive ? -25 : 0,
          friction: 8,
          tension: 100,
          useNativeDriver: true,
        }),
        Animated.timing(backgroundOpacity[index], {
          toValue: isActive ? 1 : 0,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
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
        justifyContent: "flex-end",
        alignItems: "center", // center horizontally
        paddingBottom: "10%",
        backgroundColor: "white",
      }}
    >
      <View
        style={{
          backgroundColor: "white",
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: "90%",
        }}
      >
        {activeTab === 2 && <Home />}
        {(activeTab === 0 || navPage) && <Orders />}
        {activeTab === 3 && <OrderHistory />}
        {activeTab === 4 && <Profile />}
      </View>
      {/* Navbar group */}
      <View
        style={{
          alignItems: "center",
          position: "relative",
        }}
      >
        {/* Purple bar */}
        <View
          style={{
            flexDirection: "row",
            backgroundColor: "#545EE1",
            width: width - 40,
            height: 80,
            borderRadius: 28,
            justifyContent: "space-evenly",
            alignItems: "center",
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.6,
            shadowRadius: 6,
            elevation: 8,
            overflow: "visible",
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
              }}
            >
              <View style={{ width: 70, height: 70 }} />
            </TouchableOpacity>
          ))}
        </View>
        {/* White curved bar */}
        <View
          style={{
            width: width,
            height: "50%",
            backgroundColor: "#FFFFFF",
            borderBottomLeftRadius: 20,
            borderBottomRightRadius: 20,
            position: "absolute",
            bottom: 55,
            zIndex: 2,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 3 },
            shadowOpacity: 0.3,
            shadowRadius: 1,
            elevation: 8,
          }}
        />
        <View
          style={{
            position: "absolute",
            bottom: 0,
            flexDirection: "row",
            width: width - 40,
            height: 56,
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
              {/* White circle behind active icon */}
              <Animated.View
                style={{
                  position: "absolute",
                  bottom: -10,
                  width: 80,
                  height: 80,
                  borderRadius: 50,
                  backgroundColor: "white",
                  opacity: backgroundOpacity[index],
                  transform: [{ translateY: translateYAnims[index] }],
                }}
              />
              {/* Icon */}
              <Animated.View
                style={{
                  transform: [
                    { scale: scaleAnims[index] },
                    { translateY: translateYAnims[index] },
                  ],
                  width: 50,
                  height: 50,
                  borderRadius: 35,
                  justifyContent: "center",
                  alignItems: "center",
                  backgroundColor:
                    activeTab === index ? "#545EE1" : "transparent",
                }}
              >
                <Text style={{ fontSize: 26 }}>{item.icon}</Text>
              </Animated.View>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
};

export default CourierNavigationBar;

import Home from "@/app/customer/CustomerHome";
import Orders from "@/app/customer/Orders";
import { useNavigation, useRoute } from "@react-navigation/native";
import React, { useState, useRef, useEffect, act, use } from "react";
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
import { useActiveOrderStore } from "../api/store/order_store";
import { useMessageRoomState } from "../api/store/message_room_store";
import Notifications from "@/components/Notifications";
import { usePaymentStore } from "../api/store/payment_store";
import { Status } from "../api/dto/response/order.response.dto";

const CustomerNavigationBar = () => {
  const [activeTab, setActiveTab] = useState(2);
  const { width } = Dimensions.get("window");
  const route = useRoute<any>();
  const navPage = route.params?.navPage;
  const { disconnect, isReady } = useOrdersHubStore();

  const { activeOrder, setActiveOrder } = useActiveOrderStore();

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
        // Restore messageRoomParticipants from persisted activeOrder
        const { rehydrateMessageRoom } = useMessageRoomState.getState();
        rehydrateMessageRoom();

        // Only setup handlers - connection is already established in App.tsx
        await receiveOrderRealtime();
        console.log("✅ OrdersHub handlers registered for real-time updates");
      } catch (err) {
        console.error("❌ Failed to setup OrdersHub handlers:", err);
      }
    };

    initRealtime();

    return () => {
      if (isMounted) {
        // Don't disconnect here - let App.tsx manage the connection lifecycle
        console.log("🔄 CustomerNavigationBar unmounting");
        isMounted = false;
      }
    };
  }, []);

  // SignalR: Listen for Courier Location Updates and Order Status Updates
  useEffect(() => {
    if (!activeOrder?.orderIdPK) return;

    const { initConnection, addHandler, removeHandler, invokeHub } =
      useOrdersHubStore.getState();

    const setupSignalR = async () => {
      try {
        await initConnection();
        console.log(
          "[HUB][CUSTOMER-NAVBAR] CustomerNavigationBar connected OrdersHub and joining order group"
        );

        // Join the order group to receive updates
        console.log(
          `[HUB][CUSTOMER-NAVBAR] JoinOrderGroup from CustomerNavigationBar orderId=${activeOrder.orderIdPK}`
        );
        await invokeHub("JoinOrderGroup", activeOrder.orderIdPK);

        // Handler for courier location updates - Update active order with courier location
        addHandler("CourierLocationUpdated", async (locationData: any) => {
          console.log(
            "📍 [OTIN] YAWA BAAI CourierLocationUpdated received:",
            locationData
          );

          // Update active order with new courier location so it persists
          if (activeOrder && activeOrder.deliveryDetailsDTO) {
            setActiveOrder({
              ...activeOrder,
              deliveryDetailsDTO: {
                ...activeOrder.deliveryDetailsDTO,
                courierLatitude: locationData.courierLatitude,
                courierLongitude: locationData.courierLongitude,
              },
            });
          }
        });

        // Handler for when order is accepted by a courier
        addHandler("OrderAccepted", (updatedOrder: any) => {
          console.log(
            "📬 [CUSTOMERNAVBAR] OrderAccepted received:",
            updatedOrder
          );
          setActiveOrder(updatedOrder);
        });

        // Handler for payment proposal from courier
        addHandler("PaymentProposalAccepted", (paymentData: any) => {
          console.log(
            "💰 [CUSTOMERNAVBAR] PaymentProposal received:",
            paymentData
          );
          usePaymentStore.getState().setPayment(paymentData);
        });

        addHandler("PaymentProposalRejected", (paymentData: any) => {
          console.log(
            "❌ [NAVBAR] PaymentProposalRejected received:",
            paymentData
          );
          usePaymentStore.getState().setPayment(paymentData);
        });

        // Handler for order status updates (DELIVERED, CANCELLED, etc.)
        addHandler("OrderStatusUpdated", (updatedOrder: any) => {
          console.log("♻️ [NAVBAR] OrderStatusUpdated received:", updatedOrder);
          setActiveOrder(updatedOrder);
        });
      } catch (err) {
        console.error("[NAVBAR] SignalR Setup Error:", err);
      }
    };

    setupSignalR();

    // Cleanup: Remove handlers when component unmounts or order changes
    return () => {
      console.log("[HUB][CUSTOMER-NAVBAR] Cleaning up SignalR handlers");
      const { removeHandler } = useOrdersHubStore.getState();
      removeHandler("CourierLocationUpdated");
      removeHandler("OrderAccepted");
      removeHandler("PaymentProposalAccepted");
      removeHandler("PaymentProposalRejected");
      removeHandler("OrderStatusUpdated");
    };
  }, [activeOrder?.orderIdPK]);

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
        {activeTab === 2 && <Home setActiveTab={setActiveTab} />}
        {activeTab === 0 && <Orders />}
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

export default CustomerNavigationBar;

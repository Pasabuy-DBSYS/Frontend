import React, { useEffect, useState } from "react";
import { NavigationContainer, useRoute } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { StatusBar } from "expo-status-bar";
import { ActivityIndicator, View } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

import GetStartedScreen from "./app/auth/GetStartedScreen";
import Welcome from "./app/auth/Welcome";
import LoginScreen from "./app/auth/login-screen/LoginScreen";
import ForgotPasswordScreen from "./app/auth/login-screen/ForgotPasswordScreen";
import VerifyEmail from "./app/auth/login-screen/VerifyEmail";
import CustomerNavigationBar from "./app/customer/CustomerNavigationBar";
import CourierNavigationBar from "./app/courier/CourierNavigationBar";
import RegisterStack from "./app/auth/RegisterStack";
import ChangePassword from "./app/auth/ChangePassword";
import { useAuthStore } from "./app/api/store/auth_store";
import { Role } from "./types/types";
import LocationPicker from "./components/LocationPicker";
import Orders from "./app/customer/Orders";
import OrderHistory from "./app/customer/OrderHistory";
import CourierTrackingView from "./app/courier/CourierTrackingView";
import OrderList from "./app/courier/OrderList";
import CourierHome from "./app/courier/CourierHome";
import MessagePage from "./components/MessagePage";
import CustomerTrackingView from "./app/customer/CustomerTrackingView";
import ReviewOrder from "./components/ReviewOrder";
import { useRouteStore } from "./app/api/store/route_store";
import { useOrdersHubStore } from "./app/api/store/orders_hub_store";
import { useActiveOrderStore } from "./app/api/store/order_store";
import Home from "./app/customer/CustomerHome";
import Settings from "./components/Settings";

const Stack = createNativeStackNavigator();

export default function App() {
  const { token, user, checkTokenValidity, refreshUser } = useAuthStore();
  const [initialRoute, setInitialRoute] = useState<string | null>(null);
  useEffect(() => {
    const init = async () => {
      try {
        const { initConnection, invokeHub, disconnect } =
          useOrdersHubStore.getState();
        const { rehydrateActiveOrder } = useActiveOrderStore.getState();
        const hasVisited = await AsyncStorage.getItem("hasVisited");

        // 🔹 First-time launch or after clear cache
        if (!hasVisited) {
          await AsyncStorage.setItem("hasVisited", "true");
          setInitialRoute("GetStarted");
          return;
        }

        // 🔹 Returning user
        const valid = checkTokenValidity();
        if (!valid) {
          setInitialRoute("Welcome"); // or "LoginScreen"
          await AsyncStorage.removeItem("active-order-storage");
          await AsyncStorage.removeItem("message-room-participants");
          await disconnect();
          return;
        }

        // 🔹 Token valid: refresh user profile and route by role
        await refreshUser();
        const updatedUser = useAuthStore.getState().user;

        // 🔹 Rehydrate active order from server (not local storage)
        await rehydrateActiveOrder();
        console.log("[rehydrate] Active order synced from server");

        await initConnection();

        if (updatedUser?.currentRole === Role.COURIER) {
          setInitialRoute("CourierNavigationBar");
          console.log("[HUB][COURIER] Connecting OrdersHub + JoinCourierGroup");
          await invokeHub("JoinCourierGroup");
        } else if (updatedUser?.currentRole === Role.CUSTOMER) {
          setInitialRoute("CustomerNavigationBar");
          console.log(
            "[HUB][CUSTOMER] Connecting OrdersHub + JoinCustomerGroup"
          );
          await invokeHub("JoinCustomerGroup");
        } else {
          setInitialRoute("Welcome");
        }
      } catch (err) {
        console.error("App init failed:", err);
        setInitialRoute("GetStarted");
      }
    };

    init();
  }, [token]);

  if (!initialRoute) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: "#fff",
        }}
      >
        <ActivityIndicator size="large" color="#545EE1" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <StatusBar style="light" backgroundColor="#545EE1" />
      <Stack.Navigator
        screenOptions={{ headerShown: false }}
        initialRouteName={initialRoute}
      >
        <Stack.Screen name="GetStarted" component={GetStartedScreen} />
        <Stack.Screen name="Welcome" component={Welcome} />
        <Stack.Screen name="RegisterFlow" component={RegisterStack} />
        <Stack.Screen name="LoginScreen" component={LoginScreen} />
        <Stack.Screen
          name="ForgotPasswordScreen"
          component={ForgotPasswordScreen}
        />
        <Stack.Screen name="VerifyEmail" component={VerifyEmail} />
        <Stack.Screen name="ChangePassword" component={ChangePassword} />
        <Stack.Screen
          name="CustomerNavigationBar"
          component={CustomerNavigationBar}
        />
        <Stack.Screen
          name="CourierNavigationBar"
          component={CourierNavigationBar}
        />

        <Stack.Screen name="Orders" component={Orders} />
        <Stack.Screen name="LocationPicker" component={LocationPicker} />
        <Stack.Screen name="OrderHistory" component={OrderHistory} />
        <Stack.Screen name="CourierHome" component={CourierHome} />
        <Stack.Screen name="OrderList" component={OrderList} />
        <Stack.Screen name="CustomerHome" component={Home} />
        <Stack.Screen name="Settings" component={Settings} />
        <Stack.Screen
          name="CourierTrackingView"
          component={CourierTrackingView}
        />
        <Stack.Screen name="MessagePage" component={MessagePage}></Stack.Screen>
        <Stack.Screen
          name="CustomerTrackingView"
          component={CustomerTrackingView}
        ></Stack.Screen>
        <Stack.Screen name="ReviewOrder" component={ReviewOrder} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

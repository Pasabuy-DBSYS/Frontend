import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { StatusBar } from "expo-status-bar";
import GetStartedScreen from "./app/auth/GetStartedScreen";
import Welcome from "./app/auth/Welcome";
import PhoneNumberPage from "./app/auth/register-screen/PhoneNumberPage";
import VerifyPhoneNumber from "./app/auth/register-screen/VerifyPhoneNumber";
import VerifyEmailAdress from "./app/auth/register-screen/VerifyEmailAdress";
import PersonalInformation from "./app/auth/register-screen/PersonalInformation";
import StudentIdVerify from "./app/auth/register-screen/StudentIdVerify";
import InsuranceVerification from "./app/auth/register-screen/InsuranceVerification";
import ApplicationSuccessful from "./app/auth/register-screen/ApplicationSuccessful";
import LoginScreen from "./app/auth/login-screen/LoginScreen";
import ForgotPasswordScreen from "./app/auth/login-screen/ForgotPasswordScreen";
import VerifyEmail from "./app/auth/login-screen/VerifyEmail";
import AddNameScreen from "./app/auth/register-screen/AddNameScreen";
import VeryifyingAccount from "./app/auth/register-screen/VeryifyingAccount";
import NavigationBar from "./components/CourierNavigationBar";
import Home from "./app/courier/Home";
import Orders from "./app/customer/Orders";
import CourierNavigationBar from "./components/CourierNavigationBar";
import LocationPicker from "./components/LocationPicker";
import OrderHistory from "./app/customer/OrderHistory";
import Settings from "./components/Settings";
import ChangePassword from "./app/auth/ChangePassword";

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <StatusBar style="light" backgroundColor="#545EE1" />
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
        }}
        initialRouteName="CourierNavigationBar"
      >
        <Stack.Screen name="GetStarted" component={GetStartedScreen} />
        <Stack.Screen name="Welcome" component={Welcome} />
        <Stack.Screen name="PhoneNumber" component={PhoneNumberPage} />
        <Stack.Screen name="VerifyPhoneNumber" component={VerifyPhoneNumber} />
        <Stack.Screen name="VerifyEmailAddress" component={VerifyEmailAdress} />
        <Stack.Screen
          name="PersonalInformation"
          component={PersonalInformation}
        />
        <Stack.Screen name="StudentIdVerify" component={StudentIdVerify} />
        <Stack.Screen
          name="InsuranceVerification"
          component={InsuranceVerification}
        />

        <Stack.Screen
          name="ApplicationSuccessful"
          component={ApplicationSuccessful}
        />
        <Stack.Screen name="LoginScreen" component={LoginScreen} />
        <Stack.Screen
          name="ForgotPasswordScreen"
          component={ForgotPasswordScreen}
        />
        <Stack.Screen name="VerifyEmail" component={VerifyEmail} />
        <Stack.Screen name="AddNameScreen" component={AddNameScreen} />
        <Stack.Screen name="VeryifyingAccount" component={VeryifyingAccount} />
        <Stack.Screen
          name="CourierNavigationBar"
          component={CourierNavigationBar}
        />
        <Stack.Screen name="Home" component={Home} />
        <Stack.Screen name="Orders" component={Orders} />
        <Stack.Screen name="LocationPicker" component={LocationPicker} />
        <Stack.Screen name="OrderHistory" component={OrderHistory} />
        <Stack.Screen name="Settings" component={Settings}></Stack.Screen>
        <Stack.Screen name="ChangePassword" component={ChangePassword} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

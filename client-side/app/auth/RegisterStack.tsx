import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import AddNameScreen from "../auth/register-screen/AddNameScreen";
import PhoneNumberPage from "../auth/register-screen/PhoneNumberPage";
import VerifyPhoneNumber from "../auth/register-screen/VerifyPhoneNumber";
import VerifyEmailAdress from "../auth/register-screen/VerifyEmailAdress";
import PersonalInformation from "../auth/register-screen/PersonalInformation";
import StudentIdVerify from "../auth/register-screen/StudentIdVerify";
import InsuranceVerification from "../auth/register-screen/InsuranceVerification";
import VeryifyingAccount from "../auth/register-screen/VeryifyingAccount";
import ApplicationSuccessful from "../auth/register-screen/ApplicationSuccessful";
import { RegisterProvider } from "../context/RegisterContext";

const Stack = createNativeStackNavigator();

/**
 * Registration-only flow
 * Wrapped with UserRegistrationProvider
 */
export default function RegisterStack() {
  return (
    <RegisterProvider>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="AddNameScreen" component={AddNameScreen} />
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
        <Stack.Screen name="VeryifyingAccount" component={VeryifyingAccount} />
        <Stack.Screen
          name="ApplicationSuccessful"
          component={ApplicationSuccessful}
        />
      </Stack.Navigator>
    </RegisterProvider>
  );
}

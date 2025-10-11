import { DimensionValue } from "react-native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RouteProp } from "@react-navigation/native";
import { Coordinates, LocationPickerParams } from "./interfaces";

export type ButtonProps = {
  title: string;
  onPress: () => void;
  backgroundColor?: string;
  textColor?: string;
  borderColor?: string;
  borderWidth?: number;
  borderRadius?: number;
  fontSize?: number;
  fontWeight?: FontWeight;
  padding?: number;
  margin?: number;
  width?: DimensionValue; // FIXED
  height?: DimensionValue; // FIXED
  marginTop?: number;
};

export type DeliveryStatusType =
  | "Delivered"
  | "In Transit"
  | "Delivery Failed"
  | "Pending"
  | "Cancelled";

export type FontWeight =
  | "normal"
  | "bold"
  | "100"
  | "200"
  | "300"
  | "400"
  | "500"
  | "600"
  | "700"
  | "800"
  | "900";

export type HistoryMode = "Order" | "Deliveries";
export type AuthLeftButtonProps = {
  onPress: () => void;
  size?: number;
  color?: string;
};

export type RootStackParamList = {
  GetStarted: undefined;
  Welcome: undefined;
  PhoneNumber: undefined;
  VerifyPhoneNumber: undefined;
  VerifyEmailAddress: undefined;
  PersonalInformation: undefined;
  StudentIdVerify: undefined;
  InsuranceVerification: undefined;
  ApplicationSuccessful: undefined;
  LoginScreen: undefined;
  ForgotPasswordScreen: undefined;
  VerifyEmail: undefined;
  AddNameScreen: undefined;
  VeryifyingAccount: undefined;
  CourierNavigationBar: undefined;
  Home: undefined;
  Orders:
    | {
        returnAddress: string;
        returnLocation: Coordinates;
      }
    | undefined; // allow it to be optional  LocationPicker: undefined;
  LocationPicker: {
    returnAddress: string;
    returnLocation: Coordinates;
  };
};

export type LocationPickerNavProp =
  NativeStackNavigationProp<RootStackParamList>;

export type OrdersNavProp = NativeStackNavigationProp<
  RootStackParamList,
  "Orders"
>;

export type OrdersRouteProp = RouteProp<RootStackParamList, "Orders">;

export type LocationPickerRouteProp = RouteProp<
  RootStackParamList,
  "LocationPicker"
>;

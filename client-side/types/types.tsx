import { DimensionValue } from "react-native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RouteProp } from "@react-navigation/native";
import { Coordinates, LocationPickerParams, Order } from "./interfaces";

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
  marginBottom?: number;
};
export enum Role {
  COURIER = 1,
  CUSTOMER = 0,
}
export enum VerificationInfoStatus {
  PENDING,
  ACCEPTED,
  REJECTED,
}

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

export type RegisterStackParamList = {
  AddNameScreen: undefined;
  PhoneNumber: undefined;
  VerifyPhoneNumber: undefined;
  VerifyEmailAddress: undefined;
  PersonalInformation: undefined;
  StudentIdVerify: undefined;
  InsuranceVerification: undefined;
  VeryifyingAccount: undefined;
  ApplicationSuccessful: undefined;
};

export type RootStackParamList = {
  GetStarted: undefined;
  Welcome: undefined;

  RegisterFlow: { screen?: keyof RegisterStackParamList } | undefined;

  CustomerNavigationBar: undefined;
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

  CourierNavigationBar: { activeTab: number };
  Home: undefined;
  CourierTrackingView: { orderId: number } | { activeTab: number };
  Orders:
    | {
        returnAddress: string;
        returnLocation: Coordinates;
      }
    | undefined;
  LocationPicker: {
    returnAddress: string;
    returnLocation: Coordinates;
  };
  OrderHistory: { mode: HistoryMode } | undefined;
  MessagePage: undefined;
  CustomerTrackingView: { orderId: number };
  ReviewOrder: undefined;
};

export type RootNav = NativeStackNavigationProp<RootStackParamList>;

export type CourierTrackingViewNavProp = NativeStackNavigationProp<
  RootStackParamList,
  "CourierTrackingView",
  "CustomerTrackingView"
>;

export type CourierTrackingViewRouteProp = RouteProp<
  RootStackParamList,
  "CourierTrackingView"
>;

export type CustomerTrackingViewNavProp = NativeStackNavigationProp<
  RootStackParamList,
  "CustomerTrackingView"
>;

export type CustomerTrackingViewRouteProp = RouteProp<
  RootStackParamList,
  "CustomerTrackingView"
>;
export type LocationPickerNavProp =
  NativeStackNavigationProp<RootStackParamList>;

export type OrdersNavProp = NativeStackNavigationProp<
  RootStackParamList,
  "Orders"
>;

export type MessagePageNavProp = NativeStackNavigationProp<RootStackParamList>;
export type MessageRoute = RouteProp<RootStackParamList, "MessagePage">;

export type OrdersRouteProp = RouteProp<RootStackParamList, "Orders">;

export type LocationPickerRouteProp = RouteProp<
  RootStackParamList,
  "LocationPicker"
>;

export type ConfirmDeliverProps = {
  visible: boolean;
  title?: string;
  message?: string;
  confirmText?: string; // optional override
  cancelText?: string; // optional override
  onConfirm: () => void;
  onCancel: () => void;
};

export type LogoutRoutePrope = RouteProp<RootStackParamList, "LoginScreen">;

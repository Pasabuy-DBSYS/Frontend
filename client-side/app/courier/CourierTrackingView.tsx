import AuthLeftButton from "@/components/svg/AuthLeftButton";
import {
  CourierTrackingViewNavProp,
  CourierTrackingViewRouteProp,
} from "@/types/types";
import { useRoute, useNavigation } from "@react-navigation/native";
import React, { act, useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  Animated,
  Dimensions,
  PanResponder,
  TouchableOpacity,
  Image,
} from "react-native";
import MapView, { Marker, Polyline } from "react-native-maps";
import { orders } from "@/constants/orders"; // ✅ ensure this matches your import
import { Coordinates, Order, UserOrder } from "@/types/interfaces";
import DeliverProfileIcon from "@/components/svg/DeliverProfileIcon";
import LocationVioletIcon from "@/components/svg/LocationVioletIcon";
import { Button } from "@/components/Button";
import LocationBlueIcon from "@/components/svg/LocationBlueIcon";
import PickIcon from "@/components/svg/PickIcon";
import ConfirmPickupModal from "@/components/modals/ConfirmDeliver";
import CancelDeliver from "@/components/modals/CancelDeliver";
import { getCurrentOrderAsCourier, getOrderById } from "../api/orders";
import { OrderResponseDTO } from "../api/dto/response/auth.response.dto";
import * as Location from "expo-location";
import { GEOAPIFY_KEY } from "@env";
import { useActiveOrderStore } from "../api/store/order_store";

const { height } = Dimensions.get("window");

const CourierTrackingView = () => {
  const collapsedHeight = height * 0.2;
  const expandedHeight = height * 0.6;
  const animatedHeight = useRef(new Animated.Value(collapsedHeight)).current;

  const { activeOrder, setActiveOrder } = useActiveOrderStore();

  const [coordinates, setCoordinates] = useState<Coordinates[]>([]);
  const [expanded, setExpanded] = useState(false);

  const [showConfirm, setShowConfirm] = useState(false);
  const [courierLocation, setCourierLocation] = useState<Coordinates>();
  const [destinationLocation, setDestinationLocation] = useState<Coordinates>();
  const navigator = useNavigation<CourierTrackingViewNavProp>();

  const fetchRoute = async (start: Coordinates, end: Coordinates) => {
    try {
      const url = `https://api.geoapify.com/v1/routing?waypoints=${start.latitude},${start.longitude}|${end.latitude},${end.longitude}&mode=drive&apiKey=${GEOAPIFY_KEY}`;
      const res = await fetch(url);
      const data = await res.json();

      const routeCoords = data.features[0].geometry.coordinates[0].map(
        ([lon, lat]: [number, number]) => ({
          latitude: lat,
          longitude: lon,
        })
      );

      return routeCoords;
    } catch (error) {
      console.error("Error fetching route:", error);
      return [];
    }
  };

  useEffect(() => {
    const init = async () => {
      if (!activeOrder) return; // wait for order
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") {
          console.warn("Permission to access location was denied");
          return;
        }

        const current = await Location.getCurrentPositionAsync({});
        const courierCoords = {
          latitude: current.coords.latitude,
          longitude: current.coords.longitude,
        };
        setCourierLocation(courierCoords);

        const destinationCoords: Coordinates = {
          latitude: activeOrder.deliveryDetailsDTO?.locationLatitude ?? 0,
          longitude: activeOrder.deliveryDetailsDTO?.locationLongitude ?? 0,
        };
        setDestinationLocation(destinationCoords);

        const routeCoords = await fetchRoute(courierCoords, destinationCoords);
        setCoordinates(routeCoords);
      } catch (error) {
        console.error("❌ Error initializing courier tracking:", error);
      }
    };

    init();
  }, [activeOrder]);

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gesture) => Math.abs(gesture.dy) > 10,
      onPanResponderMove: (_, gesture) => {
        const newHeight = expandedHeight - gesture.dy;
        if (newHeight <= expandedHeight && newHeight >= collapsedHeight) {
          animatedHeight.setValue(newHeight);
        }
      },
      onPanResponderRelease: (_, gesture) => {
        if (gesture.dy < -50) {
          // Swipe up -> expand
          Animated.spring(animatedHeight, {
            toValue: expandedHeight,
            useNativeDriver: false,
          }).start();
          setExpanded(true);
        } else if (gesture.dy > 50) {
          setTimeout(() => {
            setExpanded(false);
          }, 130);
          Animated.spring(animatedHeight, {
            toValue: collapsedHeight,
            useNativeDriver: false,
          }).start();
        } else {
          // Snap to current state
          Animated.spring(animatedHeight, {
            toValue: expanded ? expandedHeight : collapsedHeight,
            useNativeDriver: false,
          }).start();
        }
      },
    })
  ).current;

  // Early return for invalid orderId
  if (!activeOrder) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: "#545EE1",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <Text style={{ color: "#fff", fontSize: 18 }}>
          Order not found or loading...
        </Text>
      </View>
    );
  }

  const destination = { latitude: 10.2923, longitude: 123.8999 };

  const triggerConfirmPickup = () => {
    setShowConfirm(true);
  };
  return (
    <View style={{ flex: 1, backgroundColor: "#545EE1" }}>
      {/* Header Section */}
      <View
        style={{
          height: 110,
          backgroundColor: "#545EE1",
          paddingHorizontal: 20,
          paddingTop: 60,
          zIndex: 2,
        }}
      >
        <CancelDeliver
          visible={showConfirm}
          onCancel={() => setShowConfirm(false)}
          onConfirm={() => {
            setShowConfirm(false);
            navigator.goBack();
          }}
        />
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <AuthLeftButton onPress={() => navigator.goBack()} color="#fff" />
          <Text
            style={{
              color: "#fff",
              fontSize: 20,
              fontWeight: "700",
              marginLeft: 16,
            }}
          >
            Location
          </Text>
        </View>
      </View>

      {/* Map Section */}
      <View
        style={{
          flex: 1,
          marginTop: -30,
          borderTopLeftRadius: 20,
          borderTopRightRadius: 20,
          overflow: "hidden",
        }}
      >
        <MapView
          style={{ flex: 1 }}
          region={
            courierLocation
              ? {
                  latitude: courierLocation.latitude,
                  longitude: courierLocation.longitude,
                  latitudeDelta: 0.05,
                  longitudeDelta: 0.05,
                }
              : undefined
          }
        >
          <Marker
            coordinate={courierLocation ?? { latitude: 0, longitude: 0 }}
            title="Courier"
          >
            <Image
              source={require("@/assets/images/CourierMarkerPin.png")}
              style={{ width: 50, height: 50 }}
              resizeMode="contain"
            />
          </Marker>

          <Marker
            coordinate={destinationLocation ?? { latitude: 0, longitude: 0 }}
            title="Destination"
          >
            <Image
              source={require("@/assets/images/DestinationMarkerPin.png")}
              style={{ width: 40, height: 45 }}
              resizeMode="contain"
            />
          </Marker>

          <Polyline
            coordinates={coordinates}
            strokeColor="#4A6CF7"
            strokeWidth={6}
          />
        </MapView>
      </View>

      {/* Bottom Sheet */}
      <Animated.View
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          height: animatedHeight,
          backgroundColor: "#fff",
          borderTopLeftRadius: 20,
          borderTopRightRadius: 20,
          padding: 16,
          shadowColor: "#000",
          shadowOpacity: 0.15,
          shadowRadius: 8,
          elevation: 6,
        }}
        {...panResponder.panHandlers}
      >
        {/* Handle bar */}
        <View style={{ alignItems: "center", marginBottom: 10 }}>
          <View
            style={{
              width: 40,
              height: 5,
              backgroundColor: "#ccc",
              borderRadius: 3,
              marginBottom: 6,
            }}
          />
        </View>

        {/* Delivery info */}
        <View>
          {/* Delivery Info Section */}
          <View style={{ flexDirection: "column", gap: 10 }}>
            {/* Row: Icon + Name */}
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              {/* Left section: Icon + Name */}
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <DeliverProfileIcon
                  width={26}
                  height={24}
                  style={{ marginRight: 10 }}
                />
                <Text
                  style={{ fontWeight: "700", fontSize: 18, color: "#111" }}
                >
                  boang
                </Text>
              </View>

              {/* Right section: Message button */}
              <Button
                onPress={() => {
                  navigator.navigate("MessagePage");
                }}
                title="Message"
                width={85}
                height={30}
                borderRadius={20}
                backgroundColor="#545EE1"
                textColor="white"
              />
            </View>

            {/* Row: Icon + Delivery Details */}
            <View style={{ flexDirection: "row", alignItems: "flex-start" }}>
              <LocationVioletIcon
                width={26}
                height={24}
                style={{ marginRight: 10, marginTop: 2 }}
              />
              <View style={{ flex: 1 }}>
                <Text
                  style={{ color: "#777", fontSize: 15, fontWeight: "500" }}
                >
                  Delivery
                </Text>
                <Text
                  style={{
                    color: "#555",
                    fontSize: 14,
                    lineHeight: 20,
                    marginTop: 2,
                  }}
                >
                  static
                </Text>
              </View>
            </View>
          </View>

          {expanded && (
            <>
              <View
                style={{
                  marginTop: 15,
                  borderTopWidth: 1,
                  borderColor: "#ddd",
                  paddingTop: 15,
                  gap: 20,
                }}
              >
                <View>
                  <View
                    style={{
                      display: "flex",
                      flexDirection: "row",
                      justifyContent: "space-between",
                    }}
                  >
                    <View style={{ flexDirection: "column", marginBottom: 10 }}>
                      <View
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                        }}
                      >
                        <View style={{ marginRight: 8 }}>
                          <PickIcon width={20} height={20} />
                        </View>

                        <Text
                          style={{
                            fontWeight: "700",
                            fontSize: 18,
                            paddingVertical: 5,
                          }}
                        >
                          Buy
                        </Text>
                      </View>

                      <Text style={{ color: "#555", marginLeft: 28 }}>
                        {activeOrder?.deliveryDetailsDTO?.destinationAddress}
                      </Text>
                    </View>

                    <View
                      style={{
                        flexDirection: "column",
                        marginBottom: 10,
                        marginRight: 15,
                      }}
                    >
                      <Text
                        style={{
                          fontWeight: "700",
                          paddingVertical: 5,
                        }}
                      >
                        Order No.
                      </Text>
                      <Text style={{ color: "#555" }}>
                        #{activeOrder?.orderIdPK}
                      </Text>
                    </View>
                  </View>

                  <View
                    style={{
                      borderWidth: 1,
                      borderColor: "#154D71",
                      borderRadius: 8,
                      padding: 8,
                      marginTop: 6,
                      gap: 10,
                    }}
                  >
                    <Text>{activeOrder?.request}</Text>
                  </View>
                </View>

                <View>
                  <Text
                    style={{
                      fontWeight: "700",
                      fontSize: 18,
                      paddingVertical: 5,
                    }}
                  >
                    Delivery Instructions:
                  </Text>
                  <View
                    style={{
                      borderWidth: 1,
                      borderColor: "#154D71",
                      borderRadius: 8,
                      padding: 8,
                      marginTop: 6,
                    }}
                  >
                    <Text>
                      {activeOrder?.deliveryDetailsDTO?.deliveryNotes}
                    </Text>
                  </View>
                </View>

                <View>
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      marginTop: 6,
                      paddingVertical: 5,
                    }}
                  >
                    <Text style={{ fontWeight: "600", fontSize: 18 }}>
                      Delivery Fee:
                    </Text>
                    <View
                      style={{
                        borderWidth: 1,
                        borderColor: "#aaa",
                        paddingHorizontal: 8,
                        marginLeft: 5,
                        height: 25,
                        justifyContent: "center",
                        marginRight: 5,
                      }}
                    >
                      <Text style={{ fontWeight: "600" }}>
                        {activeOrder?.paymentsResponseDTO?.itemsFee}
                      </Text>
                    </View>
                  </View>
                  <Text style={{ color: "#555", marginTop: 10 }}>
                    Note: You only have 10 minutes to cancel the delivery
                  </Text>
                </View>
              </View>
            </>
          )}
        </View>
      </Animated.View>
    </View>
  );
};

export default CourierTrackingView;

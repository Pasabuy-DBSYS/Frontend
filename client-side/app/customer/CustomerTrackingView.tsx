import AuthLeftButton from "@/components/svg/AuthLeftButton";
import {
  CourierTrackingViewNavProp,
  CourierTrackingViewRouteProp,
  CustomerTrackingViewNavProp,
} from "@/types/types";
import { useRoute, useNavigation } from "@react-navigation/native";
import React, { act, useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  Animated,
  Dimensions,
  PanResponder,
  TouchableOpacity,
  Image,
  Easing,
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
import {
  getCurrentOrderAsCourier,
  getOrderById,
  postOrder,
} from "../api/orders";
import { OrderResponseDTO } from "../api/dto/response/auth.response.dto";
import * as Location from "expo-location";
import { GEOAPIFY_KEY } from "@env";
import { useActiveOrderStore } from "../api/store/order_store";
import { useOtherUser } from "../api/hook/useOtherUser";
import Loading from "@/components/Loading";
import { useRouteStore } from "../api/store/route_store";
import AnimatedDots from "@/components/AnimatedDots";
import EditOrder from "@/components/svg/EditOrder";
import CancelOrder from "@/components/svg/CancelOrder";
import OrderCancelled from "@/components/modals/OrderCancelled";
import { PostOrderRequestDTO } from "../api/dto/request/order.request.dto";
import OrderAccepted from "@/components/modals/OrderAccepted";

const { height } = Dimensions.get("window");

const CustomerTrackingView = () => {
  const courierInfo = useOtherUser();
  const [collapsedHeight, setCollapsedHeight] = useState(height * 0.15);

  const [expandedHeight, setExpandedHeight] = useState(height * 0.6);
  const animatedHeight = useRef(new Animated.Value(collapsedHeight)).current;
  const [showOrderAccepted, setShowOrderAccepted] = useState(false);

  const heightRef = useRef(collapsedHeight);

  const {
    activeOrder,
    orderAcceptedShown,
    isCancelled,
    tempOrderRequest,
    setActiveOrder,
    setIsCancelled,
    setOrderAcceptedShown,
  } = useActiveOrderStore();

  const [coordinates, setCoordinates] = useState<Coordinates[]>([]);
  const [expanded, setExpanded] = useState(false);

  const [showConfirm, setShowConfirm] = useState(false);

  const [courierLocation, setCourierLocation] = useState<Coordinates>();
  const [destinationLocation, setDestinationLocation] = useState<Coordinates>();
  const navigator = useNavigation<CustomerTrackingViewNavProp>();
  const actionAnim = useRef(new Animated.Value(0)).current; // 0 = hidden, 1 = visible

  const [showActions, setShowActions] = useState(false);

  const reOrder = async () => {
    try {
      const request: PostOrderRequestDTO | null =
        useActiveOrderStore.getState().tempOrderRequest;

      if (!request) return;

      const createOrderResponse = await postOrder(request);

      useActiveOrderStore.setState({ activeOrder: createOrderResponse });
    } catch (err) {
      console.log(err);
    }
  };
  const fetchRoute = async (
    start: Coordinates,
    end: Coordinates,
    orderId: number
  ) => {
    const cached = useRouteStore.getState().getRoute(orderId);

    if (cached) {
      console.log("Customer: Using cached route");
      return cached;
    }

    console.log("Customer: Fetching new route…");

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

      useRouteStore.getState().saveRoute(orderId, routeCoords);

      return routeCoords;
    } catch (error) {
      console.error("Error fetching route:", error);
      return [];
    }
  };
  useEffect(() => {
    if (activeOrder?.status === 1) {
      setShowOrderAccepted(true);
    }
    setTimeout(() => setShowOrderAccepted(false), 2000);
  }, [activeOrder?.status]);

  useEffect(() => {
    if (!activeOrder) return;

    if (activeOrder.status === 0) {
      setCollapsedHeight(height * 0.15);
      setExpandedHeight(height * 0.36);
    } else {
      setCollapsedHeight(height * 0.15);
      setExpandedHeight(height * 0.6);
    }

    animatedHeight.setValue((heightRef.current = collapsedHeight));
  }, [activeOrder?.status]);

  useEffect(() => {
    console.log("UPDATED expandedHeight:", expandedHeight);

    heightRef.current = collapsedHeight;
  }, [expandedHeight]);

  useEffect(() => {
    console.log("REAL expandedHeight:", expandedHeight);
  }, [expandedHeight]);

  useEffect(() => {
    if (!activeOrder) return;

    // Only trigger ONCE
    if (activeOrder.status === 1 && !orderAcceptedShown) {
      setShowOrderAccepted(true);
      setOrderAcceptedShown(true);

      setTimeout(() => setShowOrderAccepted(false), 2000);
    }
  }, [activeOrder?.status]);
  useEffect(() => {
    const init = async () => {
      const orderId = activeOrder?.orderIdPK;

      if (!orderId) return;

      const customerLat = activeOrder.deliveryDetailsDTO?.locationLatitude ?? 0;
      const customerLng =
        activeOrder.deliveryDetailsDTO?.locationLongitude ?? 0;

      setDestinationLocation({
        latitude: customerLat,
        longitude: customerLng,
      });

      const cached = useRouteStore.getState().getRoute(orderId);

      if (cached) {
        console.log("Customer: Instant cached route (no GPS, no fetch)");
        setCoordinates(cached);
        return;
      }

      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") return;

        const current = await Location.getCurrentPositionAsync({});
        const courierCoords = {
          latitude: current.coords.latitude,
          longitude: current.coords.longitude,
        };

        setCourierLocation(courierCoords);

        const routeCoords = await fetchRoute(
          courierCoords,
          { latitude: customerLat, longitude: customerLng },
          orderId
        );

        setCoordinates(routeCoords);
      } catch (err) {
        console.error("Customer route init error:", err);
      }
    };

    init();
  }, [activeOrder]);

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dy) > 10,

        onPanResponderMove: (_, g) => {
          const current = heightRef.current;
          const newHeight = current - g.dy;

          if (newHeight <= expandedHeight && newHeight >= collapsedHeight) {
            animatedHeight.setValue(newHeight);
          }
        },

        onPanResponderRelease: (_, g) => {
          const current = heightRef.current;
          if (g.dy < -50) {
            Animated.spring(animatedHeight, {
              toValue: expandedHeight,
              useNativeDriver: false,
            }).start();
            setExpanded(true);
          } else if (g.dy > 50) {
            Animated.spring(animatedHeight, {
              toValue: collapsedHeight,
              useNativeDriver: false,
            }).start();
            setExpanded(false);
          } else {
            const midpoint = (collapsedHeight + expandedHeight) / 2;
            const target =
              current > midpoint ? expandedHeight : collapsedHeight;

            Animated.spring(animatedHeight, {
              toValue: target,
              useNativeDriver: false,
            }).start();

            setExpanded(target === expandedHeight);
          }
        },
      }),
    [collapsedHeight, expandedHeight]
  );

  useEffect(() => {
    console.log(`CURRENT CONDITION:
      IS EXPANDED: ${expanded}
      ORDER STATUS: ${activeOrder?.status}`);
  }, [expanded]);

  useEffect(() => {
    if (expanded) {
      actionAnim.setValue(0);

      Animated.timing(actionAnim, {
        toValue: 1,
        duration: 250,
        easing: Easing.out(Easing.quad),
        useNativeDriver: false,
      }).start();
    } else {
      // First fade opacity
      Animated.timing(actionAnim, {
        toValue: 0,
        duration: 200,
        easing: Easing.in(Easing.quad),
        useNativeDriver: false,
      }).start();
    }
  }, [expanded]);

  const triggerConfirmPickup = () => {
    setShowConfirm(true);
  };
  return (
    <View style={{ flex: 1, backgroundColor: "#545EE1" }}>
      <OrderAccepted visible={showOrderAccepted}></OrderAccepted>
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
        <OrderCancelled
          visible={isCancelled}
          onCancel={() => {
            setIsCancelled(false);
            navigator.goBack();
          }}
          onConfirm={async () => {
            await reOrder();
            setIsCancelled(false);
          }}
        ></OrderCancelled>
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
                  latitudeDelta: 0.01,
                  longitudeDelta: 0.01,
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
        {/* Handle Bar */}
        <View style={{ alignItems: "center", marginBottom: 12 }}>
          <View
            style={{
              width: 40,
              height: 5,
              backgroundColor: "#ccc",
              borderRadius: 3,
            }}
          />
        </View>

        {/* ====================================================== */}
        {/* 1. COLLAPSED + STATUS = 0 (Looking for Courier)        */}
        {/* ====================================================== */}
        {!expanded && activeOrder?.status === 0 && (
          <View style={{ alignItems: "center", width: "100%" }}>
            <Text
              style={{
                fontSize: 20,
                fontWeight: "700",
                color: "#222",
                marginBottom: 6,
              }}
            >
              Looking for Courier <AnimatedDots />
            </Text>

            <View style={{ flexDirection: "row", alignItems: "flex-start" }}>
              <LocationVioletIcon
                width={26}
                height={24}
                style={{ marginRight: 10, marginTop: 2 }}
              />
              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    color: "#000000ff",
                    fontSize: 15,
                    fontWeight: "500",
                  }}
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
                  {activeOrder.deliveryDetailsDTO?.destinationAddress}
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* ====================================================== */}
        {/* 2. EXPANDED + STATUS = 0 (Waiting – EDIT + CANCEL)     */}
        {/* ====================================================== */}
        {expanded && activeOrder?.status === 0 && (
          <View style={{ width: "100%" }}>
            {/* Title */}
            <View style={{ alignItems: "center" }}>
              <Text
                style={{
                  fontSize: 20,
                  fontWeight: "700",
                  color: "#222",
                  marginBottom: 6,
                }}
              >
                Looking for Courier <AnimatedDots />
              </Text>
            </View>

            {/* Actions Row (Animated) */}
            <View
              style={{
                flexDirection: "row",
                justifyContent: "center",
                paddingHorizontal: 10,
              }}
            >
              <Animated.View
                style={{
                  overflow: "hidden",
                  opacity: actionAnim,
                  height: actionAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, 80],
                  }),
                }}
              >
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-evenly",
                    alignItems: "center",
                    width: "100%",
                  }}
                >
                  <EditOrder height={64} width={64} />
                  <CancelOrder height={64} width={64} />
                </View>
              </Animated.View>
            </View>

            {/* DELIVERY SECTION */}
            <View style={{ flexDirection: "row" }}>
              <View style={{ flexDirection: "column" }}>
                <LocationVioletIcon
                  width={26}
                  height={24}
                  style={{ marginRight: 10, marginTop: 2 }}
                />
                <View
                  style={{
                    width: 1,
                    backgroundColor: "black",
                    marginVertical: 10,
                    marginLeft: 12,
                    height: 40, // adjust as needed
                  }}
                />
              </View>

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
                  {activeOrder?.deliveryDetailsDTO?.customerAddress}
                </Text>
              </View>
            </View>

            <View
              style={{
                display: "flex",
                flexDirection: "row",
                justifyContent: "space-between",
              }}
            ></View>

            <View style={{ flexDirection: "row" }}>
              <PickIcon
                width={26}
                height={24}
                style={{ marginRight: 10, marginTop: 2 }}
              />

              <View style={{ flex: 1 }}>
                <Text
                  style={{ color: "#777", fontSize: 15, fontWeight: "500" }}
                >
                  Buy
                </Text>

                <Text
                  style={{
                    color: "#555",
                    fontSize: 14,
                    lineHeight: 20,
                    marginTop: 2,
                    maxWidth: "75%",
                  }}
                >
                  {activeOrder?.deliveryDetailsDTO?.destinationAddress}
                </Text>
              </View>

              <View style={{ flexDirection: "column", marginRight: 15 }}>
                <Text style={{ fontWeight: "700" }}>Order No.</Text>
                <Text style={{ color: "#555" }}>#{activeOrder?.orderIdPK}</Text>
              </View>
            </View>
          </View>
        )}

        {!expanded && activeOrder?.status === 1 && (
          <View>
            <View style={{ flexDirection: "column", gap: 10 }}>
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <DeliverProfileIcon
                    width={26}
                    height={24}
                    style={{ marginRight: 10 }}
                  />
                  <Text
                    style={{ fontWeight: "700", fontSize: 18, color: "#111" }}
                  >
                    {courierInfo?.firstName}
                  </Text>
                </View>

                <Button
                  onPress={() => navigator.navigate("MessagePage")}
                  title="Message"
                  width={85}
                  height={30}
                  borderRadius={20}
                  backgroundColor="#545EE1"
                  textColor="white"
                />
              </View>

              <View style={{ flexDirection: "row" }}>
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
                  <Text style={{ color: "#555", fontSize: 14 }}>
                    {activeOrder.deliveryDetailsDTO?.destinationAddress}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        )}

        {expanded && activeOrder?.status === 1 && (
          <View style={{ marginTop: 15, gap: 20 }}>
            <View>
              <View style={{ flexDirection: "column", gap: 10 }}>
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <View style={{ flexDirection: "row", alignItems: "center" }}>
                    <DeliverProfileIcon
                      width={26}
                      height={24}
                      style={{ marginRight: 10 }}
                    />
                    <Text
                      style={{ fontWeight: "700", fontSize: 18, color: "#111" }}
                    >
                      {courierInfo?.firstName}
                    </Text>
                  </View>

                  <Button
                    onPress={() => navigator.navigate("MessagePage")}
                    title="Message"
                    width={85}
                    height={30}
                    borderRadius={20}
                    backgroundColor="#545EE1"
                    textColor="white"
                  />
                </View>

                <View style={{ flexDirection: "row" }}>
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
                      style={{ color: "#555", fontSize: 14, maxWidth: "75%" }}
                    >
                      {activeOrder.deliveryDetailsDTO?.destinationAddress}
                    </Text>
                  </View>
                </View>
              </View>
            </View>
            <View>
              <View
                style={{
                  display: "flex",
                  flexDirection: "row",
                  justifyContent: "space-between",
                }}
              >
                <View style={{ flexDirection: "column", marginBottom: 10 }}>
                  <View style={{ flexDirection: "row", alignItems: "center" }}>
                    <PickIcon
                      width={20}
                      height={20}
                      style={{ marginRight: 8 }}
                    />
                    <Text style={{ fontWeight: "700", fontSize: 18 }}>Buy</Text>
                  </View>

                  <Text
                    style={{ marginLeft: 28, color: "#555", maxWidth: "75%" }}
                  >
                    {activeOrder?.deliveryDetailsDTO?.destinationAddress}
                  </Text>
                </View>

                <View style={{ flexDirection: "column", marginRight: 15 }}>
                  <Text style={{ fontWeight: "700" }}>Order No.</Text>
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
              <Text style={{ fontWeight: "700", fontSize: 18 }}>
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
                <Text>{activeOrder?.deliveryDetailsDTO?.deliveryNotes}</Text>
              </View>
            </View>

            <View>
              <View style={{ flexDirection: "row", alignItems: "center" }}>
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
        )}
      </Animated.View>
    </View>
  );
};

export default CustomerTrackingView;

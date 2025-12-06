import AuthLeftButton from "@/components/svg/AuthLeftButton";
import {
  CourierTrackingViewNavProp,
  CourierTrackingViewRouteProp,
} from "@/types/types";
import { useRoute, useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import React, { act, use, useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  Animated,
  Dimensions,
  PanResponder,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from "react-native";
import MapView, {
  Marker,
  Polyline,
  AnimatedRegion,
  MarkerAnimated,
} from "react-native-maps";
import { orders } from "@/constants/orders";
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
  receiveOrderRealtime,
  updateOrderById,
} from "../api/orders";
import * as Location from "expo-location";
import { GEOAPIFY_KEY } from "@env";
import { useActiveOrderStore } from "../api/store/order_store";
import { useOtherUserStore } from "../api/store/user_store";
import { useOtherUser } from "../api/hook/useOtherUser";
import Loading from "@/components/Loading";
import { useRouteStore } from "../api/store/route_store";
import { changeRole } from "../api/user";
import { Status } from "../api/dto/response/order.response.dto";
import { useOrdersHubStore } from "../api/store/orders_hub_store";
import AsyncStorage from "@react-native-async-storage/async-storage";
import StudentGraphics from "@/components/svg/StudentGraphics";
import OrderCancelledCourier from "@/components/modals/CourierOrderCancelled";
import OrderDelivered from "@/components/modals/OrderDelivered";
import { usePaymentStore } from "../api/store/payment_store";
import {
  hp,
  wp,
  fp,
  ms,
  sp,
  br,
  iconSize,
  SCREEN_HEIGHT,
  SCREEN_WIDTH,
} from "@/constants/responsive";

// Helper function to calculate distance between two coordinates (in meters)
const getDistance = (coord1: Coordinates, coord2: Coordinates): number => {
  const R = 6371e3; // Earth's radius in meters
  const lat1 = (coord1.latitude * Math.PI) / 180;
  const lat2 = (coord2.latitude * Math.PI) / 180;
  const deltaLat = ((coord2.latitude - coord1.latitude) * Math.PI) / 180;
  const deltaLon = ((coord2.longitude - coord1.longitude) * Math.PI) / 180;

  const a =
    Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
    Math.cos(lat1) *
      Math.cos(lat2) *
      Math.sin(deltaLon / 2) *
      Math.sin(deltaLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
};

const CourierTrackingView = () => {
  // --- START: ALL HOOKS MUST BE AT THE TOP ---
  const customerInfo = useOtherUser();
  const [collapsedHeight, setCollapsedHeight] = useState(hp(20)); // ~20% of screen height
  const [expandedHeight, setExpandedHeight] = useState(hp(75)); // ~65% of screen height
  const animatedHeight = useRef(new Animated.Value(collapsedHeight)).current;

  const { activeOrder, setActiveOrder } = useActiveOrderStore();

  // Get payment to check if cancellation should be disabled
  const payment = usePaymentStore((state) => state.payment);
  const isPaymentConfirmed = payment?.isItemsFeeConfirmed === true;

  const [coordinates, setCoordinates] = useState<Coordinates[]>([]);

  const [routeCoords, setRouteCoords] = useState<Coordinates[]>([]);

  const [tempActiveOrder, setTempActiveOrder] = useState<any>();
  const [orderCancelledModal, setOrderCancelledModal] =
    useState<boolean>(false);

  const [expanded, setExpanded] = useState(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [orderCancelled, setOrderCancelled] = useState<boolean>(false);

  const [showConfirm, setShowConfirm] = useState(false);
  const [destinationLocation, setDestinationLocation] = useState<Coordinates>();
  const navigator = useNavigation<CourierTrackingViewNavProp>();
  const orderId = activeOrder?.orderIdPK;
  const mapRef = useRef<MapView>(null);
  const [myLocation, setMyLocation] = useState<Coordinates | null>(null);

  const initialHeight = hp(18); // ~18% of screen height
  const [trackCourierLocation, setTrackCourierLocation] = useState<Coordinates>(
    {
      latitude: activeOrder?.deliveryDetailsDTO?.courierLatitude ?? 0,
      longitude: activeOrder?.deliveryDetailsDTO?.courierLongitude ?? 0,
    }
  );
  const [isDelivered, setIsDelivered] = useState(false);

  const [phase, setPhase] = useState<"pickup" | "delivery">("pickup");
  const [isNearPickup, setIsNearPickup] = useState(false);
  const PICKUP_RADIUS = 100;

  // Animated courier location
  const courierLocation = useRef(
    new AnimatedRegion({
      latitude: activeOrder?.deliveryDetailsDTO?.courierLatitude ?? 0,
      longitude: activeOrder?.deliveryDetailsDTO?.courierLongitude ?? 0,
      latitudeDelta: 0.01,
      longitudeDelta: 0.01,
    })
  ).current;

  // Map region state (This initialization relies on activeOrder, so it must be inside the component body)
  const [mapRegion, setMapRegion] = useState({
    latitude: activeOrder?.deliveryDetailsDTO?.locationLatitude ?? 0,
    longitude: activeOrder?.deliveryDetailsDTO?.locationLongitude ?? 0,
    latitudeDelta: 0.02,
    longitudeDelta: 0.02,
  });

  // Pinned location (pickup point) (These constants are calculated based on activeOrder, which is a hook result)
  const pinnedLocation: Coordinates = {
    latitude: activeOrder?.deliveryDetailsDTO?.locationLatitude ?? 0,
    longitude: activeOrder?.deliveryDetailsDTO?.locationLongitude ?? 0,
  };

  // Customer location (delivery point)
  const customerLocation: Coordinates = {
    latitude: activeOrder?.deliveryDetailsDTO?.customerLatitude ?? 0,
    longitude: activeOrder?.deliveryDetailsDTO?.customerLongitude ?? 0,
  };

  // Current courier position ref for calculations
  const currentCourierPos = useRef<Coordinates>({
    latitude: activeOrder?.deliveryDetailsDTO?.courierLatitude ?? 0,
    longitude: activeOrder?.deliveryDetailsDTO?.courierLongitude ?? 0,
  });
  // --- END: ALL HOOKS MUST BE AT THE TOP ---

  // Recalculate polyline whenever courier location or phase changes
  useEffect(() => {
    if (!trackCourierLocation) return;
    // ... (rest of useEffect logic)
    const destination = phase === "pickup" ? pinnedLocation : customerLocation;
    // ... validation logic ...
    (async () => {
      try {
        const newRoute = await fetchRoute(trackCourierLocation, destination);
        if (Array.isArray(newRoute) && newRoute.length >= 2) {
          setCoordinates(newRoute);
        } else {
          setCoordinates([trackCourierLocation, destination]);
        }
      } catch (e) {
        setCoordinates([trackCourierLocation, destination]);
      }
    })();
  }, [trackCourierLocation, phase]);

  useEffect(() => {
    console.log(
      `ACTIVE ORDER UPDATED COURIER TRACKING VIEW SIDE: ${JSON.stringify(
        activeOrder
      )}`
    );
  }, [activeOrder]);

  const fetchRoute = async (
    start: Coordinates,
    end: Coordinates,
    cacheKey?: number
  ) => {
    if (!orderId) return [];

    const routeKey = cacheKey ?? orderId;
    const cached = useRouteStore.getState().getRoute(routeKey);

    console.log("Fetching new route");

    try {
      const url = `https://api.geoapify.com/v1/routing?waypoints=${start.latitude},${start.longitude}|${end.latitude},${end.longitude}&mode=walk&apiKey=${GEOAPIFY_KEY}`;

      const res = await fetch(url);
      const data = await res.json();

      const routeCoords = data.features[0].geometry.coordinates[0].map(
        ([lon, lat]: [number, number]) => ({
          latitude: lat,
          longitude: lon,
        })
      );

      useRouteStore.getState().saveRoute(routeKey, routeCoords);

      return routeCoords;
    } catch (error) {
      console.error("Error fetching route:", error);
      return [];
    }
  };

  // Handle "Picked Up" button press
  const handlePickedUp = async () => {
    if (!activeOrder) return;
    setPhase("delivery");

    // Get current courier position
    const courierCoords = currentCourierPos.current;

    setDestinationLocation(customerLocation);

    // Update map region to show courier and customer
    const midLat = (courierCoords.latitude + customerLocation.latitude) / 2;
    const midLng = (courierCoords.longitude + customerLocation.longitude) / 2;
    const latDelta =
      Math.abs(courierCoords.latitude - customerLocation.latitude) * 1.5;
    const lngDelta =
      Math.abs(courierCoords.longitude - customerLocation.longitude) * 1.5;

    setMapRegion({
      latitude: midLat,
      longitude: midLng,
      latitudeDelta: Math.max(latDelta, 0.02),
      longitudeDelta: Math.max(lngDelta, 0.02),
    });

    await updateOrderById(activeOrder?.orderIdPK, Status.PICKED_UP);
    await updateOrderById(activeOrder?.orderIdPK, Status.IN_TRANSIT);
  };

  useEffect(() => {
    const changePolyLine = async () => {
      if (!activeOrder) return;
      const courierCoords = currentCourierPos.current;

      console.log(`PHASE: ${phase}`);
      if (phase === "pickup") {
        const newRoute = await fetchRoute(courierCoords, pinnedLocation);

        setCoordinates(newRoute);
      } else if (phase === "delivery") {
        const newRoute = await fetchRoute(courierCoords, customerLocation);

        setCoordinates(newRoute);
      }
    };

    changePolyLine();
  }, [trackCourierLocation, phase]);
  // --- THE PREVIOUS if (!activeOrder) BLOCK WAS HERE, CAUSING THE ERROR ---

  useEffect(() => {
    let subscription: Location.LocationSubscription;
    if (!orderId) return;
    const { initConnection, addHandler, removeHandler, invokeHub } =
      useOrdersHubStore.getState();

    const startTracking = async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        console.warn("Location permission not granted");
        return;
      }

      subscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.BestForNavigation,
          timeInterval: 1000,
          distanceInterval: 5, // Only update when moved 5 meters
        },
        async (location) => {
          const courierCoords = {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
          };

          // Update current position ref
          currentCourierPos.current = courierCoords;

          // Animate courier marker smoothly
          courierLocation
            .timing({
              latitude: courierCoords.latitude,
              longitude: courierCoords.longitude,
              latitudeDelta: 0.01,
              longitudeDelta: 0.01,
              duration: 500,
              useNativeDriver: false,
            } as any)
            .start();

          setTrackCourierLocation(courierCoords);

          // Check if near pickup location (only during pickup phase)
          if (phase === "pickup") {
            const distance = getDistance(courierCoords, pinnedLocation);
            setIsNearPickup(distance <= PICKUP_RADIUS);
            console.log(
              `Distance to pickup: ${distance.toFixed(0)}m, Near: ${
                distance <= PICKUP_RADIUS
              }`
            );
          }

          // Determine destination based on phase
          const destination =
            phase === "pickup" ? pinnedLocation : customerLocation;

          // Update polyline: always from courier to destination
          // Use a simple line for real-time updates (no caching to keep it fresh)

          const newRoute = await fetchRoute(courierCoords, destination);
          setCoordinates(newRoute);

          // Send location via SignalR
          try {
            await initConnection();
            await invokeHub(
              "UpdateCourierLocation",
              orderId,
              courierCoords.latitude,
              courierCoords.longitude
            );
            await receiveOrderRealtime();
            console.log(
              `SignalR: Sent location update for Order ${orderId}: ${courierCoords.latitude}, ${courierCoords.longitude}`
            );
          } catch (err) {
            console.error("SignalR: Failed to send location update", err);
          }
        }
      );
    };

    startTracking();

    return () => {
      subscription?.remove();
    };
  }, [orderId, phase]);

  // SignalR: Listen for Order Status Updates (e.g. Cancelled)
  useEffect(() => {
    if (!activeOrder?.orderIdPK) return;

    const { initConnection, addHandler, removeHandler, invokeHub } =
      useOrdersHubStore.getState();

    const setupSignalR = async () => {
      try {
        await initConnection();

        // Join the order group to receive updates
        await invokeHub("JoinOrderGroup", activeOrder.orderIdPK);

        addHandler("OrderStatusUpdated", async (orderUpdate: any) => {
          setActiveOrder(orderUpdate);
          setTempActiveOrder(orderUpdate);
        });

        // Handler for payment confirmed (customer accepted the proposal)
        addHandler("PaymentProposalRejected", (paymentData: any) => {
          console.log(
            "✅ [COURIER] PaymentProposalRejected received:",
            paymentData
          );
          usePaymentStore.getState().setPayment(paymentData);
        });

        // Handler for payment responded (generic payment update)
        addHandler("PaymentProposalAccepted", (paymentData: any) => {
          console.log(
            "💳 [COURIER] PaymentProposalAccepted received:",
            paymentData
          );
          usePaymentStore.getState().setPayment(paymentData);
        });

        console.log(
          `[HUB][COURIER] SignalR setup complete for order: ${activeOrder.orderIdPK}`
        );

        if (activeOrder.status === Status.DELIVERED) setIsDelivered(true);
        if (activeOrder.status === Status.CANCELLED)
          setOrderCancelledModal(true);
      } catch (err) {
        console.error("SignalR Setup Error:", err);
      }
    };

    setupSignalR();

    return () => {
      removeHandler("OrderStatusUpdated");
      removeHandler("PaymentConfirmed");
      removeHandler("PaymentResponded");
    };
  }, [activeOrder]);

  useEffect(() => {
    const init = async () => {
      if (!activeOrder) {
        // setLoading(true);
        return;
      }

      const orderId = activeOrder.orderIdPK;

      console.log(
        `ACTIVE ORDER ID IN TRACKING: ${JSON.stringify(activeOrder)}`
      );
      if (!orderId) return;

      // 1. Determine Start Coordinates (Courier)
      let startCoords: Coordinates;

      if (
        activeOrder.deliveryDetailsDTO?.courierLatitude &&
        activeOrder.deliveryDetailsDTO?.courierLongitude
      ) {
        // Use courier location from order
        startCoords = {
          latitude: activeOrder.deliveryDetailsDTO.courierLatitude,
          longitude: activeOrder.deliveryDetailsDTO.courierLongitude,
        };
      } else {
        // Fallback: Get current GPS location
        try {
          const { status } = await Location.requestForegroundPermissionsAsync();
          if (status === "granted") {
            const current = await Location.getCurrentPositionAsync({});
            startCoords = {
              latitude: current.coords.latitude,
              longitude: current.coords.longitude,
            };
          } else {
            // Fallback if no permission: use pickup location
            startCoords = pinnedLocation;
          }
        } catch (err) {
          console.log("Error getting location fallback:", err);
          startCoords = pinnedLocation;
        }
      }

      // 2. Update State & Refs with valid coordinates
      courierLocation.setValue({
        latitude: startCoords.latitude,
        longitude: startCoords.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      });

      currentCourierPos.current = startCoords;
      setTrackCourierLocation(startCoords);

      // Save my location for the locate button
      setMyLocation(startCoords);

      // 3. Fetch Route using valid coordinates
      // We use 'pinnedLocation' constant which is derived directly from activeOrder

      setDestinationLocation(pinnedLocation);

      // 4. Update map region
      const midLat = (startCoords.latitude + pinnedLocation.latitude) / 2;
      const midLng = (startCoords.longitude + pinnedLocation.longitude) / 2;
      setMapRegion({
        latitude: midLat,
        longitude: midLng,
        latitudeDelta: 0.02,
        longitudeDelta: 0.02,
      });
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

  // Cleanup useEffect (this was added but not finished in the previous input)
  useEffect(() => {
    console.log(`TEMPORARY ACT ORDER: ${JSON.stringify(tempActiveOrder)}}`);
  }, []);

  const triggerConfirmPickup = () => {
    setShowConfirm(true);
  };

  // --- START: CONDITIONAL RENDERING BLOCKS (MUST BE AFTER ALL HOOKS) ---

  // Check if we have valid coordinates (You might want this as a separate check)
  const hasValidCoordinates =
    activeOrder?.deliveryDetailsDTO?.locationLatitude != null &&
    activeOrder?.deliveryDetailsDTO?.locationLongitude != null &&
    activeOrder.deliveryDetailsDTO.locationLatitude !== 0 &&
    activeOrder.deliveryDetailsDTO.locationLongitude !== 0;

  // --- END: CONDITIONAL RENDERING BLOCKS ---

  return (
    <View style={{ flex: 1, backgroundColor: "#545EE1" }}>
      <OrderDelivered
        visible={isDelivered}
        onFinish={() => {
          setIsDelivered(false);
          navigator.reset({
            index: 0,
            routes: [{ name: "CourierNavigationBar" }],
          });
        }}
        onReview={() => {
          // Ensure tempActiveOrder is available before navigating
          if (!tempActiveOrder) return;
          setIsDelivered(false);
          navigator.reset({
            index: 0,
            routes: [
              {
                name: "ReviewOrder",
                params: {
                  orderId: tempActiveOrder.orderIdPK,
                  courierId: tempActiveOrder.courierId,
                },
              },
            ],
          });
        }}
      />
      <OrderCancelledCourier
        visible={orderCancelledModal}
        orderId={activeOrder?.orderIdPK}
        onConfirm={async () => {
          if (activeOrder?.orderIdPK) {
            await useOrdersHubStore
              .getState()
              .invokeHub("LeaveOrderGroup", activeOrder.orderIdPK.toString());

            console.log(`Left order group ${activeOrder.orderIdPK}`);
          }
          const { clearActiveOrder } = useActiveOrderStore.getState();
          setOrderCancelledModal(false); // Cleanup local state and navigate away
          clearActiveOrder(); // Leave the SignalR group (optional, but good practice if not done in clearActiveOrder)

          navigator.reset({
            index: 0,
            routes: [
              { name: "CourierNavigationBar", params: { activeTab: 2 } },
            ],
          });
        }}
      />
      {/* Header Section */}
      <View
        style={{
          height: hp(14),
          backgroundColor: "#545EE1",
          paddingHorizontal: sp(20),
          paddingTop: hp(7),
          zIndex: 2,
        }}
      >
        <CancelDeliver
          visible={showConfirm}
          onCancel={() => setShowConfirm(false)}
          onConfirm={async () => {
            setShowConfirm(false);

            if (!activeOrder) return;

            try {
              await updateOrderById(activeOrder.orderIdPK, Status.CANCELLED);
              navigator.reset({
                index: 0,
                routes: [
                  { name: "CourierNavigationBar", params: { activeTab: 2 } },
                ],
              });
            } catch (err) {
              console.error(err);
            }
          }}
        />

        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <AuthLeftButton onPress={() => navigator.goBack()} color="#fff" />
          <Text
            style={{
              color: "#fff",
              fontSize: fp(20),
              fontWeight: "700",
              marginLeft: sp(16),
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
          marginTop: hp(-3.5),
          borderTopLeftRadius: br(20),
          borderTopRightRadius: br(20),
          overflow: "hidden",
        }}
      >
        <MapView ref={mapRef} style={{ flex: 1 }} region={mapRegion}>
          <MarkerAnimated
            coordinate={courierLocation}
            title="Courier"
            anchor={{ x: 0.5, y: 0.5 }}
            flat={true}
          >
            <View
              style={{
                width: ms(50),
                height: ms(50),
                borderRadius: br(25),
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <View
                style={{
                  width: ms(40),
                  height: ms(40),
                  borderRadius: br(20),
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                <StudentGraphics width={iconSize(28)} height={iconSize(28)} />
              </View>
            </View>
          </MarkerAnimated>

          <Marker
            coordinate={pinnedLocation}
            title="Pickup Location"
            anchor={{ x: 0.5, y: 0.5 }}
          >
            <View
              style={{
                width: ms(32),
                height: ms(32),
                borderRadius: br(16),
                backgroundColor:
                  phase === "pickup"
                    ? "rgba(76, 175, 80, 0.2)"
                    : "rgba(158, 158, 158, 0.2)",
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <View
                style={{
                  width: ms(22),
                  height: ms(22),
                  borderRadius: br(11),
                  backgroundColor: "white",
                  justifyContent: "center",
                  alignItems: "center",
                  borderWidth: 2,
                  borderColor: phase === "pickup" ? "#4CAF50" : "#9E9E9E",
                }}
              >
                <View
                  style={{
                    width: ms(10),
                    height: ms(10),
                    borderRadius: br(5),
                    backgroundColor: phase === "pickup" ? "#4CAF50" : "#9E9E9E",
                  }}
                />
              </View>
            </View>
          </Marker>

          {/* Customer Location Marker - Red (active during delivery phase) */}
          <Marker
            coordinate={customerLocation}
            title="Customer Location"
            anchor={{ x: 0.5, y: 0.5 }}
          >
            <View
              style={{
                width: ms(32),
                height: ms(32),
                borderRadius: br(16),
                backgroundColor:
                  phase === "delivery"
                    ? "rgba(244, 67, 54, 0.2)"
                    : "rgba(158, 158, 158, 0.2)",
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <View
                style={{
                  width: ms(22),
                  height: ms(22),
                  borderRadius: br(11),
                  backgroundColor: "white",
                  justifyContent: "center",
                  alignItems: "center",
                  borderWidth: 2,
                  borderColor: phase === "delivery" ? "#F44336" : "#9E9E9E",
                }}
              >
                <View
                  style={{
                    width: ms(10),
                    height: ms(10),
                    borderRadius: br(5),
                    backgroundColor:
                      phase === "delivery" ? "#F44336" : "#9E9E9E",
                  }}
                />
              </View>
            </View>
          </Marker>

          {/* Route Polyline - Color changes based on phase */}
          <Polyline
            coordinates={coordinates}
            strokeColor={phase === "pickup" ? "#4CAF50" : "#F44336"}
            strokeWidth={6}
            lineCap="round"
            lineJoin="round"
          />
        </MapView>

        {/* My Location Button */}
        <TouchableOpacity
          onPress={() => {
            if (myLocation && mapRef.current) {
              mapRef.current.animateToRegion(
                {
                  latitude: myLocation.latitude,
                  longitude: myLocation.longitude,
                  latitudeDelta: 0.01,
                  longitudeDelta: 0.01,
                },
                500
              );
            }
          }}
          style={{
            position: "absolute",
            top: sp(20),
            right: sp(16),
            backgroundColor: "white",
            width: ms(44),
            height: ms(44),
            borderRadius: br(22),
            justifyContent: "center",
            alignItems: "center",
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.25,
            shadowRadius: 4,
            elevation: 5,
            zIndex: 10,
          }}
        >
          <Ionicons name="locate" size={iconSize(24)} color="#545EE1" />
        </TouchableOpacity>
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
          borderTopLeftRadius: br(20),
          borderTopRightRadius: br(20),
          padding: sp(16),
          shadowColor: "#000",
          shadowOpacity: 0.15,
          shadowRadius: 8,
          elevation: 6,
        }}
        {...panResponder.panHandlers}
      >
        {/* Handle bar */}
        <View style={{ alignItems: "center", marginBottom: sp(10) }}>
          <View
            style={{
              width: wp(12),
              height: hp(0.6),
              backgroundColor: "#ccc",
              borderRadius: br(3),
              marginBottom: sp(6),
            }}
          />
        </View>

        {/* Delivery info */}
        <View>
          {/* Delivery Info Section */}
          <View style={{ flexDirection: "column", gap: sp(10) }}>
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
                  width={iconSize(26)}
                  height={iconSize(24)}
                  style={{ marginRight: sp(10) }}
                />
                <Text
                  style={{ fontWeight: "700", fontSize: fp(16), color: "#111" }}
                >
                  {`${customerInfo?.firstName ?? ""} ${
                    customerInfo?.middleName
                      ? customerInfo.middleName + " "
                      : ""
                  }${customerInfo?.lastName ?? ""}`}
                </Text>
              </View>

              {/* Right section: Message button */}
              <Button
                onPress={() => {
                  navigator.navigate("MessagePage");
                }}
                title="Message"
                width={ms(85)}
                height={ms(30)}
                borderRadius={br(20)}
                fontSize={fp(12)}
                backgroundColor="#545EE1"
                textColor="white"
              />
            </View>

            {/* Row: Icon + Delivery Details */}
            <View style={{ flexDirection: "row", alignItems: "flex-start" }}>
              <LocationVioletIcon
                width={iconSize(26)}
                height={iconSize(24)}
                style={{ marginRight: sp(10), marginTop: sp(2) }}
              />
              <View style={{ flex: 1 }}>
                <Text
                  style={{ color: "#777", fontSize: fp(15), fontWeight: "500" }}
                >
                  Delivery
                </Text>
                <Text
                  style={{
                    color: "#555",
                    fontSize: fp(14),
                    lineHeight: fp(20),
                    marginTop: sp(2),
                  }}
                >
                  {phase === "pickup"
                    ? activeOrder?.deliveryDetailsDTO?.destinationAddress
                    : activeOrder?.deliveryDetailsDTO?.customerAddress}
                </Text>
              </View>
            </View>

            {/* Picked Up Button - Only show during pickup phase */}
          </View>

          {expanded && (
            <>
              {phase === "pickup" && (
                <View style={{ marginTop: sp(10) }}>
                  <TouchableOpacity
                    onPress={handlePickedUp}
                    disabled={!isNearPickup}
                    style={{
                      backgroundColor: isNearPickup ? "#4CAF50" : "#ccc",
                      paddingVertical: sp(14),
                      paddingHorizontal: sp(24),
                      borderRadius: br(12),
                      alignItems: "center",
                      justifyContent: "center",
                      width: "100%",
                    }}
                  >
                    <Text
                      style={{
                        color: "white",
                        fontWeight: "700",
                        fontSize: fp(16),
                      }}
                    >
                      {isNearPickup
                        ? "✓ I've Picked Up the Order"
                        : `Get closer to pickup (${PICKUP_RADIUS}m)`}
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
              <View
                style={{
                  marginTop: sp(15),
                  borderTopWidth: 1,
                  borderColor: "#ddd",
                  paddingTop: sp(15),
                  gap: sp(20),
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
                    <View
                      style={{ flexDirection: "column", marginBottom: sp(10) }}
                    >
                      <View
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                        }}
                      >
                        <View style={{ marginRight: sp(8) }}>
                          <PickIcon
                            width={iconSize(20)}
                            height={iconSize(20)}
                          />
                        </View>

                        <Text
                          style={{
                            fontWeight: "700",
                            fontSize: fp(18),
                            paddingVertical: sp(5),
                          }}
                        >
                          Buy
                        </Text>
                      </View>

                      <Text
                        style={{
                          color: "#555",
                          marginLeft: sp(28),
                          maxWidth: "75%",
                          fontSize: fp(14),
                        }}
                      >
                        {activeOrder?.deliveryDetailsDTO?.destinationAddress}
                      </Text>
                    </View>

                    <View
                      style={{
                        flexDirection: "column",
                        marginBottom: sp(10),
                        marginRight: sp(15),
                      }}
                    >
                      <Text
                        style={{
                          fontWeight: "700",
                          paddingVertical: sp(5),
                          fontSize: fp(14),
                        }}
                      >
                        Order No.
                      </Text>
                      <Text style={{ color: "#555", fontSize: fp(14) }}>
                        #{activeOrder?.orderIdPK}
                      </Text>
                    </View>
                  </View>

                  <View
                    style={{
                      borderWidth: 1,
                      borderColor: "#154D71",
                      borderRadius: br(8),
                      padding: sp(8),
                      marginTop: sp(6),
                      gap: sp(10),
                    }}
                  >
                    <Text style={{ fontSize: fp(14) }}>
                      {activeOrder?.request}
                    </Text>
                  </View>
                </View>

                <View>
                  <Text
                    style={{
                      fontWeight: "700",
                      fontSize: fp(18),
                      paddingVertical: sp(5),
                    }}
                  >
                    Delivery Instructions:
                  </Text>
                  <View
                    style={{
                      borderWidth: 1,
                      borderColor: "#154D71",
                      borderRadius: br(8),
                      padding: sp(8),
                      marginTop: sp(6),
                    }}
                  >
                    <Text style={{ fontSize: fp(14) }}>
                      {activeOrder?.deliveryDetailsDTO?.deliveryNotes}
                    </Text>
                  </View>
                </View>

                <View>
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      marginTop: sp(6),
                      paddingVertical: sp(5),
                    }}
                  >
                    <Text style={{ fontWeight: "600", fontSize: fp(18) }}>
                      Delivery Fee:
                    </Text>
                    <View
                      style={{
                        borderWidth: 1,
                        borderColor: "#aaa",
                        paddingHorizontal: sp(8),
                        marginLeft: sp(5),
                        height: ms(25),
                        justifyContent: "center",
                        marginRight: sp(5),
                      }}
                    >
                      <Text style={{ fontWeight: "600", fontSize: fp(14) }}>
                        {activeOrder?.paymentsResponseDTO?.deliveryFee}
                      </Text>
                    </View>
                  </View>
                  {phase === "pickup" ? (
                    <>
                      <Text
                        style={{
                          color: "#555",
                          marginBottom: sp(30),
                          fontSize: fp(12),
                        }}
                      >
                        {isPaymentConfirmed
                          ? "Cannot cancel after payment is confirmed"
                          : "Note: You only have 10 minutes to cancel the delivery"}
                      </Text>
                      <View
                        style={{
                          justifyContent: "center",
                          alignItems: "center",
                        }}
                      >
                        <Button
                          onPress={() => {
                            if (!isPaymentConfirmed) {
                              setShowConfirm(true);
                            }
                          }}
                          title="Cancel Order"
                          width={wp(70)}
                          height={hp(5)}
                          borderRadius={br(20)}
                          fontSize={fp(14)}
                          backgroundColor={
                            isPaymentConfirmed ? "#A0A0A0" : "#545EE1"
                          }
                          textColor="white"
                          disabled={isPaymentConfirmed}
                        />
                      </View>
                    </>
                  ) : (
                    <View
                      style={{
                        justifyContent: "center",
                        alignItems: "center",
                        marginTop: sp(10),
                      }}
                    >
                      <Button
                        onPress={async () => {
                          if (!activeOrder) return;
                          try {
                            await updateOrderById(
                              activeOrder.orderIdPK,
                              Status.DELIVERED
                            );
                            setIsDelivered(true);
                          } catch (err) {
                            console.error(err);
                          }
                        }}
                        title="Finish Order"
                        width={wp(70)}
                        height={hp(5)}
                        borderRadius={br(20)}
                        fontSize={fp(14)}
                        backgroundColor="#4CAF50"
                        textColor="white"
                      />
                    </View>
                  )}
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

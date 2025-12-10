import AuthLeftButton from "@/components/svg/AuthLeftButton";
import {
  CourierTrackingViewNavProp,
  CourierTrackingViewRouteProp,
  CustomerTrackingViewNavProp,
} from "@/types/types";
import { useRoute, useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
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
import MapView, {
  Marker,
  Polyline,
  AnimatedRegion,
  MarkerAnimated,
} from "react-native-maps";
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
  estimateDeliveryTime,
  getCurrentOrderAsCourier,
  getOrderById,
  postOrder,
  updateOrderById,
} from "../api/orders";
import * as Location from "expo-location";
import { GEOAPIFY_KEY } from "@env";
import { useActiveOrderStore } from "../api/store/order_store";
import { useOtherUser } from "../api/hook/useOtherUser";
import Loading from "@/components/Loading";
import { useRouteStore } from "../api/store/route_store";
import { useMessageRoomState } from "../api/store/message_room_store";
import AnimatedDots from "@/components/AnimatedDots";
import EditOrder from "@/components/svg/EditOrder";
import CancelOrder from "@/components/svg/CancelOrder";
import OrderCancelled from "@/components/modals/OrderCancelled";
import { PostOrderRequestDTO } from "../api/dto/request/order.request.dto";
import OrderAccepted from "@/components/modals/OrderAccepted";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { parse } from "react-native-svg";
import { Status } from "../api/dto/response/order.response.dto";
import { useOrdersHubStore } from "../api/store/orders_hub_store";
import StudentGraphics from "@/components/svg/StudentGraphics";
import Camera from "@/components/svg/Camera";
import OrderDelivered from "@/components/modals/OrderDelivered";
import { navigate } from "expo-router/build/global-state/routing";
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

const CustomerTrackingView = () => {
  const courierInfo = useOtherUser();
  const initialHeight = hp(18); // ~18% of screen height
  const [collapsedHeight, setCollapsedHeight] = useState(initialHeight);
  const [showCancel, setShowCancel] = useState(false);
  const [expandedHeight, setExpandedHeight] = useState(hp(55)); // ~55% of screen height
  const animatedHeight = useRef(new Animated.Value(initialHeight)).current;
  const [disabledButton, setDisabledButton] = useState(false);
  const [deliveryTime, setDeliveryTime] = useState<any>({});
  const {
    activeOrder,
    isCancelled,
    isDelivered,
    showOrderAccepted,
    tempOrderRequest,
    setActiveOrder,
    clearActiveOrder,
    setIsDelivered,
    setIsCancelled,
    setShowOrderAccepted,
    setPendingReview,
    resetModalStates,
    setTrackCourierLocation,
    trackCourierLocation,
  } = useActiveOrderStore();

  useEffect(() => {
    console.log(`DELIVERY TIME UPDATED: ${JSON.stringify(deliveryTime)}`);
  }, [deliveryTime]);
  // Get payment to check if cancellation should be disabled
  const payment = usePaymentStore((state) => state.payment);
  const isPaymentConfirmed = payment?.isItemsFeeConfirmed === true;

  console.log(`ACTIVE ORDER STATUS: ${JSON.stringify(activeOrder)}`);
  const heightRef = useRef(collapsedHeight);

  const pinnedLocation: Coordinates = {
    latitude: activeOrder?.deliveryDetailsDTO?.locationLatitude ?? 0,
    longitude: activeOrder?.deliveryDetailsDTO?.locationLongitude ?? 0,
  };

  // AnimatedRegion for smooth courier marker movement
  const courierAnimatedLocation = useRef(
    new AnimatedRegion({
      latitude: activeOrder?.deliveryDetailsDTO?.locationLatitude,
      longitude: activeOrder?.deliveryDetailsDTO?.locationLongitude,
      latitudeDelta: 0.01,
      longitudeDelta: 0.01,
    })
  ).current;

  const [expanded, setExpanded] = useState(false);

  const [showConfirm, setShowConfirm] = useState(false);

  // Animated Region for smooth courier movement - initialized with default values
  const pinnedLocationRef = useRef(
    new AnimatedRegion({
      latitude: 0,
      longitude: 0,
      latitudeDelta: 0.01,
      longitudeDelta: 0.01,
    })
  ).current;

  // Update pinnedLocationRef when activeOrder location changes
  useEffect(() => {
    if (!activeOrder?.deliveryDetailsDTO) return;

    const latitude = activeOrder.deliveryDetailsDTO.locationLatitude;
    const longitude = activeOrder.deliveryDetailsDTO.locationLongitude;

    console.log(
      `📍 [CUSTOMER] Updating pinned location to: ${latitude}, ${longitude}`
    );

    pinnedLocationRef
      .timing({
        latitude,
        longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
        duration: 500,
        useNativeDriver: false,
      } as any)
      .start();
  }, [
    activeOrder?.orderIdPK,
    activeOrder?.deliveryDetailsDTO?.locationLatitude,
    activeOrder?.deliveryDetailsDTO?.locationLongitude,
  ]);

  const [destinationLocation, setDestinationLocation] = useState<Coordinates>();

  const [polylineCoords, setPolylineCoords] = useState<Coordinates[]>([]);
  const navigator = useNavigation<CustomerTrackingViewNavProp>();
  const mapRef = useRef<MapView>(null);
  const [myLocation, setMyLocation] = useState<Coordinates | null>(null);

  const actionAnim = useRef(new Animated.Value(0)).current;

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
    orderId: number,
    forceUpdate: boolean = false
  ) => {
    // Only check cache if NOT forcing an update
    if (!forceUpdate) {
      const cached = useRouteStore.getState().getRoute(orderId);
      if (cached) {
        console.log("Customer: Using cached route");
        return cached;
      }
    }

    console.log("Customer: Fetching new route…");

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

      useRouteStore.getState().saveRoute(orderId, routeCoords);
      console.log("Customer: Route fetched successfully");
      return routeCoords;
    } catch (error) {
      console.error("Error fetching route:", error);
      return [];
    }
  };

  // Sync messageRoomParticipants from activeOrder when it loads or changes
  useEffect(() => {
    if (!activeOrder) return;

    const chatRoom = activeOrder.chatRoomResponseDTO;
    if (chatRoom?.roomIdPK) {
      console.log(
        `[CUSTOMER] Setting messageRoomParticipants from activeOrder: roomId=${chatRoom.roomIdPK}`
      );
      useMessageRoomState.setState({
        messageRoomParticipants: {
          roomId: chatRoom.roomIdPK,
          senderId: activeOrder.courierId ?? null,
          receiverId: activeOrder.customerId ?? null,
        },
      });
    }
  }, [activeOrder?.orderIdPK, activeOrder?.chatRoomResponseDTO?.roomIdPK]);

  useEffect(() => {
    if (!activeOrder) return;

    if (activeOrder.status === 0) {
      setCollapsedHeight(hp(15));
      setExpandedHeight(hp(36));
    } else {
      setCollapsedHeight(hp(15));
      setExpandedHeight(hp(60));
    }
  }, [activeOrder?.status]);

  useEffect(() => {
    if (!activeOrder) {
      console.log(`ACTIVE ORDER IS NULL (DISABLE BUTTON EFFECT TRIGGER)`);
      return;
    }

    const { payments } = usePaymentStore.getState();
    setDisabledButton(
      activeOrder?.status > 1 ||
        (activeOrder?.status >= 1 &&
          Date.parse(activeOrder.created_at) + 1 * 60 * 1000 < Date.now()) ||
        payment?.isItemsFeeConfirmed === true
    );

    console.log(`DISABLE BUTTON: ${disabledButton}`);
  }, [disabledButton]);

  useEffect(() => {
    heightRef.current = collapsedHeight;
    animatedHeight.setValue(collapsedHeight);
  }, [collapsedHeight]);

  useEffect(() => {
    console.log("UPDATED expandedHeight:", expandedHeight);

    heightRef.current = collapsedHeight;
  }, [expandedHeight]);

  useEffect(() => {
    console.log("REAL expandedHeight:", expandedHeight);
  }, [expandedHeight]);

  // Reset modal states when component mounts (clean slate)
  useEffect(() => {
    resetModalStates();
  }, []);

  useEffect(() => {
    const init = async () => {
      if (!activeOrder || !activeOrder.deliveryDetailsDTO) return;

      const orderId = activeOrder.orderIdPK;
      if (!orderId) return;

      console.log(`ORDER ID: ${orderId}`);

      // Start point: pinned location (where courier picks up)
      const startLocation = {
        latitude: activeOrder.deliveryDetailsDTO.locationLatitude ?? 0,
        longitude: activeOrder.deliveryDetailsDTO.locationLongitude ?? 0,
      };

      console.log(`START LOCATION: ${JSON.stringify(startLocation)}`);
      // End point: customer destination
      const customerDestination = {
        latitude: activeOrder.deliveryDetailsDTO.customerLatitude ?? 0,
        longitude: activeOrder.deliveryDetailsDTO.customerLongitude ?? 0,
      };

      console.log(
        `DESTINATION LOCATION: ${JSON.stringify(customerDestination)}`
      );

      setDestinationLocation(customerDestination);

      const cached = useRouteStore.getState().getRoute(orderId);

      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") return;

        const current = await Location.getCurrentPositionAsync({});

        const courierCoords = {
          latitude: current.coords.latitude,
          longitude: current.coords.longitude,
        };

        setTrackCourierLocation({
          latitude: activeOrder.deliveryDetailsDTO.courierLatitude,
          longitude: activeOrder.deliveryDetailsDTO.courierLongitude,
        });

        // Save my location for the locate button
        setMyLocation({
          latitude: current.coords.latitude,
          longitude: current.coords.longitude,
        });

        const routeCoords = await fetchRoute(
          startLocation,
          customerDestination,
          orderId
        );

        setPolylineCoords(routeCoords);
      } catch (err) {
        console.error("Customer route init error:", err);
      }
    };

    init();
  }, [activeOrder?.orderIdPK]);

  // Animate courier marker when trackCourierLocation changes
  useEffect(() => {
    if (!trackCourierLocation) {
      return;
    }

    // Animate to new position with spring animation
    courierAnimatedLocation
      .timing({
        latitude: trackCourierLocation.latitude,
        longitude: trackCourierLocation.longitude,
        duration: 500,
        useNativeDriver: false,
      } as any)
      .start();
  }, [trackCourierLocation]);

  // SignalR: Listen for Courier Location Updates and Order Status Updates
  useEffect(() => {
    if (!activeOrder?.orderIdPK) return;

    const { initConnection, addHandler, removeHandler, invokeHub } =
      useOrdersHubStore.getState();

    const setupSignalR = async () => {
      try {
        await initConnection();
        console.log(
          "[HUB][CUSTOMER] CustomerTrackingView connected OrdersHub and joining order group"
        );

        // Join the order group to receive updates
        console.log(
          `[HUB][CUSTOMER] JoinOrderGroup from CustomerTrackingView orderId=${activeOrder.orderIdPK}`
        );
        await invokeHub("JoinOrderGroup", activeOrder.orderIdPK);

        // Handler for courier location updates
        addHandler("CourierLocationUpdated", async (locationData: any) => {
          console.log("📍 CourierLocationUpdated received:", locationData);
          setTrackCourierLocation({
            latitude: locationData.courierLatitude,
            longitude: locationData.courierLongitude,
          });
        });

        // Handler for when order is accepted by a courier
        addHandler("OrderAccepted", (updatedOrder: any) => {
          console.log("📬 OrderAccepted received:", updatedOrder);
          setActiveOrder(updatedOrder);

          // Show the OrderAccepted modal for 2 seconds
          setShowOrderAccepted(true);
          setTimeout(() => setShowOrderAccepted(false), 2000);
        });

        // Handler for payment proposal from courier
        addHandler("PaymentProposalAccepted", (paymentData: any) => {
          console.log("💰 PaymentProposal received:", paymentData);
          usePaymentStore.getState().setPayment(paymentData);

          setDisabledButton(true);
        });

        addHandler("PaymentProposalRejected", () => {
          const fiveMinutesInMilliseconds = 5 * 60 * 1000;
          const expiryTimestamp =
            Date.parse(activeOrder.updated_at) + fiveMinutesInMilliseconds;
          const isNotExpired = expiryTimestamp > Date.now();

          if (isNotExpired) {
            setDisabledButton(false);
          } else setDisabledButton(true);
        });

        // Handler for order status updates (DELIVERED, CANCELLED, etc.)
        addHandler("OrderStatusUpdated", (updatedOrder: any) => {
          console.log("♻️ OrderStatusUpdated received:", updatedOrder);

          // Update the active order in store
          setActiveOrder(updatedOrder);

          // Handle DELIVERED status
          if (updatedOrder.status === Status.DELIVERED) {
            console.log("🎉 Order DELIVERED - showing modal");
            setIsDelivered(true);
          }

          // Handle CANCELLED status
          if (updatedOrder.status === Status.CANCELLED) {
            console.log("❌ Order CANCELLED - showing modal");
            setIsCancelled(true);
          }
        });
      } catch (err) {
        console.error("SignalR Setup Error:", err);
      }
    };

    setupSignalR();
  }, [activeOrder?.orderIdPK]);

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

  useEffect(() => {
    if (activeOrder?.status === Status.CANCELLED) {
      setIsCancelled(true);
    }
  }, [activeOrder?.status]);

  const triggerConfirmPickup = () => {
    setShowConfirm(true);
  };

  if (!activeOrder) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: "#FFFFFF",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <View
          style={{
            width: 40,
            height: 40,
            marginBottom: 12,
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <Loading />
        </View>

        <Text style={{ color: "#000000", fontSize: 18, fontWeight: "600" }}>
          Processing order…
        </Text>
      </View>
    );
  }

  // Check if we have valid coordinates
  const hasValidCoordinates =
    activeOrder?.deliveryDetailsDTO?.locationLatitude != null &&
    activeOrder?.deliveryDetailsDTO?.locationLongitude != null &&
    activeOrder.deliveryDetailsDTO.locationLatitude !== 0 &&
    activeOrder.deliveryDetailsDTO.locationLongitude !== 0;

  if (!hasValidCoordinates) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: "#FFFFFF",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <Loading />
        <Text
          style={{
            color: "#000000",
            fontSize: 18,
            fontWeight: "600",
            marginTop: 12,
          }}
        >
          Loading location data…
        </Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: "#545EE1" }}>
      <OrderDelivered
        visible={isDelivered}
        onFinish={() => {
          // User said "No" to review - just go back
          setIsDelivered(false);
          clearActiveOrder();
          navigator.reset({
            index: 0,
            routes: [{ name: "CustomerNavigationBar" }],
          });
        }}
        onReview={() => {
          // User said "Yes" to review - set pending review and navigate
          setIsDelivered(false);
          setPendingReview(true);
          navigator.reset({
            index: 0,
            routes: [
              {
                name: "ReviewOrder",
                params: {
                  orderId: activeOrder.orderIdPK,
                  courierId: activeOrder.courierId,
                },
              },
            ],
          });
        }}
      />
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
          visible={showCancel}
          onCancel={() => setShowCancel(false)}
          onConfirm={async () => {
            setShowConfirm(false);
            if (!activeOrder) return;
            try {
              await updateOrderById(activeOrder.orderIdPK, Status.CANCELLED);
              clearActiveOrder();
              // Reset navigation stack and go to CustomerNavigationBar with Home tab active
              navigator.reset({
                index: 0,
                routes: [
                  { name: "CustomerNavigationBar", params: { navPage: 2 } },
                ],
              });
            } catch (err) {
              console.error(err);
            }
          }}
        />
        <OrderCancelled
          visible={isCancelled}
          onCancel={async () => {
            setIsCancelled(false);
            await updateOrderById(activeOrder.orderIdPK, Status.CANCELLED);
            await clearActiveOrder();

            // Reset navigation stack and go to CustomerNavigationBar with Home tab active
            navigator.reset({
              index: 0,
              routes: [
                { name: "CustomerNavigationBar", params: { navPage: 2 } },
              ],
            });
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

      <View
        style={{
          flex: 1,
          marginTop: -30,
          borderTopLeftRadius: 20,
          borderTopRightRadius: 20,
          overflow: "hidden",
          zIndex: 1,
        }}
      >
        <MapView.Animated
          ref={mapRef}
          style={{ flex: 1 }}
          region={pinnedLocationRef}
        >
          {activeOrder.status !== Status.PENDING &&
            activeOrder.status !== Status.CANCELLED && (
              <MarkerAnimated
                coordinate={courierAnimatedLocation}
                title="Courier"
                anchor={{ x: 0.5, y: 0.5 }}
                flat={true}
              >
                <View
                  style={{
                    width: 60,
                    height: 60,
                    justifyContent: "center",
                    alignItems: "center",
                  }}
                >
                  <StudentGraphics width={40} height={40} />
                </View>
              </MarkerAnimated>
            )}

          {/* Location Marker (First) - Pickup Location with inner circle */}
          <Marker
            coordinate={{
              latitude: activeOrder?.deliveryDetailsDTO?.locationLatitude ?? 0,
              longitude:
                activeOrder?.deliveryDetailsDTO?.locationLongitude ?? 0,
            }}
            title="Pickup Location"
            anchor={{ x: 0.5, y: 0.5 }}
          >
            <View
              style={{
                width: 32,
                height: 32,
                borderRadius: 16,
                backgroundColor: "#4CAF50",
                justifyContent: "center",
                alignItems: "center",
                borderWidth: 3,
                borderColor: "#FFFFFF",
              }}
            >
              <Text
                style={{ color: "#FFFFFF", fontWeight: "700", fontSize: 14 }}
              >
                P
              </Text>
            </View>
          </Marker>

          <Marker
            coordinate={{
              latitude: activeOrder?.deliveryDetailsDTO?.customerLatitude,
              longitude: activeOrder?.deliveryDetailsDTO?.customerLongitude,
            }}
            title="Customer Destination"
            anchor={{ x: 0.5, y: 0.5 }}
          >
            <View
              style={{
                width: 32,
                height: 32,
                borderRadius: 16,
                backgroundColor: "#F44336",
                justifyContent: "center",
                alignItems: "center",
                borderWidth: 3,
                borderColor: "#FFFFFF",
              }}
            >
              <Text
                style={{ color: "#FFFFFF", fontWeight: "700", fontSize: 14 }}
              >
                C
              </Text>
            </View>
          </Marker>

          {polylineCoords.length >= 2 && (
            <Polyline
              coordinates={polylineCoords}
              strokeColor="#4A6CF7"
              strokeWidth={6}
            />
          )}
        </MapView.Animated>

        {/* My Location Button */}
        <TouchableOpacity
          onPress={() => {
            if (myLocation && mapRef.current) {
              (mapRef.current as any).animateToRegion(
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
            top: 40,
            right: 16,
            backgroundColor: "white",
            width: 44,
            height: 44,
            borderRadius: 22,
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
          <Ionicons name="locate" size={24} color="#545EE1" />
        </TouchableOpacity>
      </View>
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
          zIndex: 10,
        }}
        {...panResponder.panHandlers}
      >
        {activeOrder?.status !== 0 && (
          <View style={{ alignItems: "center", marginBottom: sp(12) }}>
            <View
              style={{
                width: wp(12),
                height: hp(0.6),
                backgroundColor: "#ccc",
                borderRadius: br(3),
              }}
            />
          </View>
        )}

        {/* ====================================================== */}
        {/* 1. COLLAPSED + STATUS = 0 (Looking for Courier)        */}
        {/* ====================================================== */}
        {!expanded && activeOrder?.status === 0 && (
          <View style={{ alignItems: "center", width: "100%" }}>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                marginBottom: sp(6),
              }}
            >
              <Text
                style={{
                  fontSize: fp(18),
                  fontWeight: "700",
                  color: "#222",
                }}
              >
                Looking for Courier
              </Text>
              <AnimatedDots />
            </View>

            <View style={{ flexDirection: "row", alignItems: "flex-start" }}>
              <LocationVioletIcon
                width={iconSize(26)}
                height={iconSize(24)}
                style={{ marginRight: sp(10), marginTop: sp(2) }}
              />
              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    color: "#000000ff",
                    fontSize: fp(14),
                    fontWeight: "500",
                  }}
                >
                  Delivery
                </Text>
                <Text
                  style={{
                    color: "#555",
                    fontSize: fp(13),
                    lineHeight: fp(18),
                    marginTop: sp(2),
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
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  marginBottom: sp(6),
                }}
              >
                <Text
                  style={{
                    fontSize: fp(18),
                    fontWeight: "700",
                    color: "#222",
                  }}
                >
                  Looking for Courier
                </Text>
                <AnimatedDots />
              </View>
            </View>

            {/* Actions Row (Animated) */}
            <View
              style={{
                flexDirection: "row",
                justifyContent: "center",
                paddingHorizontal: sp(10),
              }}
            >
              <Animated.View
                style={{
                  overflow: "hidden",
                  opacity: actionAnim,
                  height: actionAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, ms(80)],
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
                  <EditOrder height={iconSize(64)} width={iconSize(64)} />
                  {/* Disable cancel if payment is confirmed */}
                  <TouchableOpacity onPress={() => setShowCancel(true)}>
                    <CancelOrder height={iconSize(64)} width={iconSize(64)} />
                  </TouchableOpacity>
                </View>
              </Animated.View>
            </View>

            {/* DELIVERY SECTION */}
            <View style={{ flexDirection: "row" }}>
              <View style={{ flexDirection: "column" }}>
                <LocationVioletIcon
                  width={iconSize(26)}
                  height={iconSize(24)}
                  style={{ marginRight: sp(10), marginTop: sp(2) }}
                />
                <View
                  style={{
                    width: 1,
                    backgroundColor: "black",
                    marginVertical: sp(10),
                    marginLeft: sp(12),
                    height: ms(40),
                  }}
                />
              </View>

              <View style={{ flex: 1 }}>
                <Text
                  style={{ color: "#777", fontSize: fp(14), fontWeight: "500" }}
                >
                  Delivery
                </Text>

                <Text
                  style={{
                    color: "#555",
                    fontSize: fp(13),
                    lineHeight: fp(18),
                    marginTop: sp(2),
                  }}
                >
                  {activeOrder?.deliveryDetailsDTO?.destinationAddress}
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
                width={iconSize(26)}
                height={iconSize(24)}
                style={{ marginRight: sp(10), marginTop: sp(2) }}
              />

              <View style={{ flex: 1 }}>
                <Text
                  style={{ color: "#777", fontSize: fp(14), fontWeight: "500" }}
                >
                  Buy
                </Text>

                <Text
                  style={{
                    color: "#555",
                    fontSize: fp(13),
                    lineHeight: fp(18),
                    marginTop: sp(2),
                    maxWidth: "75%",
                  }}
                >
                  {activeOrder?.deliveryDetailsDTO?.destinationAddress}
                </Text>
              </View>

              <View style={{ flexDirection: "column", marginRight: sp(15) }}>
                <Text style={{ fontWeight: "700", fontSize: fp(13) }}>
                  Order No.
                </Text>
                <Text style={{ color: "#555", fontSize: fp(12) }}>
                  #{activeOrder?.orderIdPK}
                </Text>
              </View>
            </View>
          </View>
        )}

        {!expanded && activeOrder?.status !== 0 && (
          <View>
            <View style={{ flexDirection: "column", gap: sp(10) }}>
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <DeliverProfileIcon
                    width={iconSize(26)}
                    height={iconSize(24)}
                    style={{ marginRight: sp(10) }}
                  />
                  <Text
                    style={{
                      fontWeight: "700",
                      fontSize: fp(16),
                      color: "#111",
                    }}
                  >
                    {courierInfo?.firstName}
                  </Text>
                </View>

                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: sp(8),
                  }}
                >
                  <Ionicons name="star" size={16} color="#545EE1" />
                  <Text
                    style={{
                      fontSize: fp(12),
                      color: "#545EE1",
                      fontWeight: "600",
                    }}
                  >
                    {courierInfo?.ratingAverage?.toFixed(1) || "N/A"}
                  </Text>
                  <Button
                    onPress={() => navigator.navigate("MessagePage")}
                    title="Message"
                    width={ms(85)}
                    height={ms(30)}
                    borderRadius={br(20)}
                    backgroundColor="#545EE1"
                    textColor="white"
                    fontSize={fp(12)}
                  />
                </View>
              </View>

              <View style={{ flexDirection: "row" }}>
                <LocationVioletIcon
                  width={iconSize(26)}
                  height={iconSize(24)}
                  style={{ marginRight: sp(10), marginTop: sp(2) }}
                />
                <View style={{ flex: 1 }}>
                  <Text
                    style={{
                      color: "#777",
                      fontSize: fp(14),
                      fontWeight: "500",
                    }}
                  >
                    Delivery
                  </Text>
                  <Text style={{ color: "#555", fontSize: fp(13) }}>
                    {activeOrder.deliveryDetailsDTO?.destinationAddress}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        )}

        {expanded && activeOrder?.status !== 0 && (
          <View style={{ marginTop: sp(15), gap: sp(20) }}>
            <View>
              <View style={{ flexDirection: "column", gap: sp(10) }}>
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <View style={{ flexDirection: "row", alignItems: "center" }}>
                    <DeliverProfileIcon
                      width={iconSize(26)}
                      height={iconSize(24)}
                      style={{ marginRight: sp(10) }}
                    />
                    <Text
                      style={{
                        fontWeight: "700",
                        fontSize: fp(16),
                        color: "#111",
                      }}
                    >
                      {courierInfo?.firstName}
                    </Text>
                  </View>

                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: sp(8),
                    }}
                  >
                    <Ionicons name="star" size={16} color="#545EE1" />
                    <Text
                      style={{
                        fontSize: fp(12),
                        color: "#545EE1",
                        fontWeight: "600",
                      }}
                    >
                      {courierInfo?.ratingAverage?.toFixed(1) || "N/A"}
                    </Text>
                    <Button
                      onPress={() => navigator.navigate("MessagePage")}
                      title="Message"
                      width={ms(85)}
                      height={ms(30)}
                      borderRadius={br(20)}
                      backgroundColor="#545EE1"
                      textColor="white"
                      fontSize={fp(12)}
                    />
                  </View>
                </View>

                <View style={{ flexDirection: "row" }}>
                  <LocationVioletIcon
                    width={iconSize(26)}
                    height={iconSize(24)}
                    style={{ marginRight: sp(10), marginTop: sp(2) }}
                  />
                  <View style={{ flex: 1 }}>
                    <Text
                      style={{
                        color: "#777",
                        fontSize: fp(14),
                        fontWeight: "500",
                      }}
                    >
                      Delivery
                    </Text>
                    <Text
                      style={{
                        color: "#555",
                        fontSize: fp(13),
                        maxWidth: "75%",
                      }}
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
                <View style={{ flexDirection: "column", marginBottom: sp(10) }}>
                  <View style={{ flexDirection: "row", alignItems: "center" }}>
                    <PickIcon
                      width={iconSize(20)}
                      height={iconSize(20)}
                      style={{ marginRight: sp(8) }}
                    />
                    <Text style={{ fontWeight: "700", fontSize: fp(16) }}>
                      Buy
                    </Text>
                  </View>

                  <Text
                    style={{
                      marginLeft: sp(28),
                      color: "#555",
                      maxWidth: "75%",
                      fontSize: fp(13),
                    }}
                  >
                    {activeOrder?.deliveryDetailsDTO?.customerAddress}
                  </Text>
                </View>

                <View style={{ flexDirection: "column", marginRight: sp(15) }}>
                  <Text style={{ fontWeight: "700", fontSize: fp(13) }}>
                    Order No.
                  </Text>
                  <Text style={{ color: "#555", fontSize: fp(12) }}>
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
                <Text style={{ fontSize: fp(13) }}>{activeOrder?.request}</Text>
              </View>
            </View>

            <View>
              <Text style={{ fontWeight: "700", fontSize: fp(16) }}>
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
                <Text style={{ fontSize: fp(13) }}>
                  {activeOrder?.deliveryDetailsDTO?.deliveryNotes}
                </Text>
              </View>
            </View>

            <View>
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <Text style={{ fontWeight: "600", fontSize: fp(16) }}>
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
                  }}
                >
                  <Text style={{ fontWeight: "600", fontSize: fp(13) }}>
                    {activeOrder?.paymentsResponseDTO?.deliveryFee}
                  </Text>
                </View>
              </View>
              <Text
                style={{ color: "#555", marginTop: sp(10), fontSize: fp(12) }}
              >
                Note: You only have 10 minutes to cancel the delivery
              </Text>
            </View>
            <View style={{ marginTop: sp(10), alignItems: "center" }}>
              <TouchableOpacity
                onPress={() => setShowCancel(true)}
                style={{
                  backgroundColor: !disabledButton ? "#E53935" : "#154D71",
                  opacity: !disabledButton ? 1 : 0.5,
                  paddingVertical: sp(12),
                  paddingHorizontal: sp(24),
                  borderRadius: br(8),
                  alignItems: "center",
                  justifyContent: "center",
                  width: "100%",
                }}
                disabled={disabledButton}
              >
                <Text
                  style={{
                    color: "white",
                    fontWeight: "700",
                    fontSize: fp(14),
                  }}
                >
                  Cancel Delivery
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </Animated.View>
    </View>
  );
};

export default CustomerTrackingView;

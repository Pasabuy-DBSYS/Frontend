import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  Dimensions,
  Alert,
  FlatList,
  Keyboard,
  KeyboardAvoidingView,
  TouchableWithoutFeedback,
  ActivityIndicator,
  ScrollView,
  Switch,
  Platform,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import * as Location from "expo-location";
import {
  CommissionData,
  Coordinates,
  GeoapifyFeature,
} from "@/types/interfaces";
import MapView, { Marker, Polyline } from "react-native-maps";
import { useNavigation } from "expo-router";
import { OrdersRouteProp } from "@/types/types";
import { useRoute } from "@react-navigation/native";

import { GEOAPIFY_KEY } from "@env";
import { useAuthStore } from "../api/store/auth_store";
import { PostOrderRequestDTO } from "../api/dto/request/order.request.dto";
import { postOrder } from "../api/orders";
import { convertCoordinatesToAddress } from "../api/geoapify";
import { useLocationStore } from "../api/store/location_store";
import ConfirmOrder from "@/components/modals/ConfirmOrder";
import { useActiveOrderStore } from "../api/store/order_store";
import { Button } from "@/components/Button";

const URGENT_FEE = 20; // Additional fee for urgent orders
const BASE_FEE = 10; // Base delivery fee
const PER_KM_RATE = 5; // Fee per kilometer

// Haversine formula to calculate distance between two coordinates in kilometers
const calculateDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number => {
  const R = 6371; // Earth's radius in kilometers
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in kilometers
};

const Orders: React.FC = () => {
  const [deviceLocation, setDeviceLocation] = useState<Coordinates | null>(
    null
  );
  const [showConfirm, setShowConfirm] = useState(false);

  const [deliveryFee, setDeliveryFee] = useState<number>(BASE_FEE);
  const [distanceKm, setDistanceKm] = useState<number>(0);
  const [tipAmount, setTipAmount] = useState<string>("");
  const [isUrgent, setIsUrgent] = useState<boolean>(false);
  const [coordinates, setCoordinates] = useState<Coordinates[]>([]);
  const recentSearched = useRef<GeoapifyFeature[]>([]);
  const mapRef = useRef<MapView>(null);
  const route = useRoute<OrdersRouteProp>();
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [requestDto, setRequestDto] = useState<PostOrderRequestDTO>(
    {} as PostOrderRequestDTO
  );
  const { setActiveOrder } = useActiveOrderStore();

  const navigator = useNavigation();

  const {
    setFullLocation,
    fullLocation,
    commissionData,
    setCommissionData,
    clearLocation,
  } = useLocationStore();

  const { user } = useAuthStore();

  // Calculate delivery fee when destination changes (fullLocation is set when user pins location)
  useEffect(() => {
    if (
      deviceLocation &&
      fullLocation?.returnLocation &&
      fullLocation.returnLocation.latitude !== 0 &&
      fullLocation.returnLocation.longitude !== 0
    ) {
      const distance = calculateDistance(
        deviceLocation.latitude,
        deviceLocation.longitude,
        fullLocation.returnLocation.latitude,
        fullLocation.returnLocation.longitude
      );
      setDistanceKm(distance);

      // Calculate delivery fee: Base fee + (distance * per km rate)
      const calculatedFee = BASE_FEE + Math.ceil(distance) * PER_KM_RATE;
      setDeliveryFee(calculatedFee);
    } else {
      setDistanceKm(0);
      setDeliveryFee(BASE_FEE);
    }
  }, [deviceLocation, fullLocation]);

  // Calculate total price
  const getTotalPrice = (): number => {
    let total = deliveryFee;
    if (tipAmount) total += parseFloat(tipAmount) || 0;
    if (isUrgent) total += URGENT_FEE;
    return total;
  };

  const postOrderFunction = async (): Promise<void> => {
    try {
      if (!user) {
        Alert.alert("Error", "User not found.");
        return;
      }

      if (
        !commissionData.coordinates ||
        !commissionData.coordinates.latitude ||
        !commissionData.coordinates.longitude
      ) {
        Alert.alert("Error", "Please select a valid delivery location.");
        return;
      }

      const convertedAddress = await convertCoordinatesToAddress(
        commissionData.coordinates,
        GEOAPIFY_KEY
      );
      const deviceAddress = await convertCoordinatesToAddress(
        deviceLocation as Coordinates,
        GEOAPIFY_KEY
      );

      console.log("DEVICE ADDRESS YAWA: ", deviceAddress);

      if (!convertedAddress) throw new Error("Address conversion failed.");
      const dto: PostOrderRequestDTO = {
        customerId: user.userIdPK,
        request: commissionData.specification,
        tipFee: tipAmount ? parseFloat(tipAmount) : 0,
        status: 0,
        priority: isUrgent ? 1 : 0,
        locationLatitude: commissionData.coordinates.latitude,
        locationLongitude: commissionData.coordinates.longitude,
        customerLatitude: deviceLocation?.latitude || 0,
        customerLongitude: deviceLocation?.longitude || 0,
        customerAddress: deviceAddress as string,
        destinationAddress: commissionData.address,
        deliveryDistance: coordinates.length || 0,
        deliveryNotes: commissionData.deliveryInstructions,
      };

      console.log(`Order DTO: ${JSON.stringify(dto, null, 2)}`);
      setIsLoading(true);
      const response = await postOrder(dto);
      setIsLoading(false);

      Alert.alert("Success", "Order successfully created!");
      console.log("Order created:", response);

      if (response) {
        setActiveOrder(response);
        navigator.navigate("CustomerTrackingView" as never);
        return;
      }
    } catch (err: any) {
      setIsLoading(false);
      console.error(
        "Order creation failed:",
        err.response?.data || err.message
      );
      Alert.alert(
        "Error",
        "Failed to create order. Check console for details."
      );
    }
  };

  const [searchResults, setSearchResults] = useState<any[]>([]);
  const debounceTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Validation states
  const [addressError, setAddressError] = useState<string>("");
  const [specificationError, setSpecificationError] = useState<string>("");
  const [deliveryInstructionsError, setDeliveryInstructionsError] =
    useState<string>("");

  // Check if form is valid
  const isFormValid = () => {
    const hasAddress = commissionData.address?.trim().length > 0;
    const hasValidCoordinates =
      commissionData.coordinates?.latitude !== 0 &&
      commissionData.coordinates?.longitude !== 0;
    const hasSpecification = commissionData.specification?.trim().length > 0;
    const hasDeliveryInstructions =
      commissionData.deliveryInstructions?.trim().length > 0;

    return (
      hasAddress &&
      hasValidCoordinates &&
      hasSpecification &&
      hasDeliveryInstructions
    );
  };

  // Validate and show confirm modal
  const handleOrderPress = () => {
    let hasError = false;

    // Validate address
    if (!commissionData.address?.trim()) {
      setAddressError("Address is required");
      hasError = true;
    } else if (
      !commissionData.coordinates?.latitude ||
      !commissionData.coordinates?.longitude ||
      commissionData.coordinates.latitude === 0
    ) {
      setAddressError("Please select a valid location from the map or search");
      hasError = true;
    } else {
      setAddressError("");
    }

    // Validate specification
    if (!commissionData.specification?.trim()) {
      setSpecificationError("Specification is required");
      hasError = true;
    } else {
      setSpecificationError("");
    }

    // Validate delivery instructions
    if (!commissionData.deliveryInstructions?.trim()) {
      setDeliveryInstructionsError("Delivery instructions are required");
      hasError = true;
    } else {
      setDeliveryInstructionsError("");
    }

    if (hasError) {
      return;
    }

    setShowConfirm(true);
  };

  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") {
          Alert.alert("Permission Denied", "Location access is required.");
          if (isMounted) setIsLoading(false);
          return;
        }

        const current = await Location.getCurrentPositionAsync({});
        const currentCoords = {
          latitude: current.coords.latitude,
          longitude: current.coords.longitude,
        };
        if (isMounted) {
          setDeviceLocation(currentCoords);

          if (fullLocation) {
            setCommissionData({
              coordinates: fullLocation.returnLocation,
              address: fullLocation.returnAddress,
              specification: "",
              deliveryInstructions: "",
            });
          } else {
            setCommissionData({
              coordinates: currentCoords,
              address: "",
              specification: "",
              deliveryInstructions: "",
            });
          }
        }
      } catch (err) {
        console.error("❌ Failed to get device location:", err);

        const fallback = { latitude: 14.5995, longitude: 120.9842 };
        setDeviceLocation(fallback);
        setCommissionData({
          coordinates: fallback,
          address: "Manila, Philippines (Fallback)",
          specification: "",
          deliveryInstructions: "",
        });

        Alert.alert(
          "Location Unavailable",
          "Using a default Manila location since GPS data could not be retrieved."
        );
      } finally {
        if (isMounted) {
          setIsLoading(false);
          console.log("✅ Location initialization complete");
        }
      }
    })();

    return () => {
      isMounted = false;
    };
  }, []);

  const fetchAutocomplete = useCallback(
    async (text: string) => {
      if (text.length === 0) return setSearchResults(recentSearched.current);

      if (!deviceLocation) return;

      const { latitude, longitude } = deviceLocation as Coordinates;
      const params = new URLSearchParams({
        text,
        apiKey: GEOAPIFY_KEY || "",
        limit: "5",
        filter: "countrycode:ph",
        bias: `proximity:${longitude},${latitude}`,
      });

      const res = await fetch(
        `https://api.geoapify.com/v1/geocode/autocomplete?${params}`
      );

      const data = await res.json();
      setSearchResults(data.features || []);
    },
    [deviceLocation]
  );

  const handleAddressChange = useCallback(
    (text: string) => {
      setCommissionData({ address: text });

      if (debounceTimeout.current) clearTimeout(debounceTimeout.current);

      debounceTimeout.current = setTimeout(() => {
        if (text.trim().length === 0) {
          setSearchResults(recentSearched.current);
        } else {
          fetchAutocomplete(text);
        }
      }, 300);
    },
    [fetchAutocomplete, setCommissionData]
  );

  const navigation = useNavigation<any>();

  return (
    <KeyboardAvoidingView style={{ flex: 1 }}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <LinearGradient
          colors={["#545EE1", "#FFFFFF"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={{ flex: 1 }}
        >
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{ paddingBottom: 120 }}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Header */}
            <View
              style={{
                paddingHorizontal: 20,
                paddingTop: Platform.OS === "android" ? 50 : 60,
              }}
            >
              <Text
                style={{ fontSize: 28, fontWeight: "bold", color: "white" }}
              >
                Commission
              </Text>
            </View>

            {/* Location Cards */}
            <View style={{ paddingHorizontal: 20, marginTop: 20 }}>
              {/* Pick-up Location Card */}
              <TouchableOpacity
                style={{
                  backgroundColor: "rgba(255,255,255,0.95)",
                  borderRadius: 16,
                  padding: 16,
                  marginBottom: 12,
                  flexDirection: "row",
                  alignItems: "center",
                }}
                disabled
              >
                <View
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 16,
                    borderWidth: 3,
                    borderColor: "#545EE1",
                    justifyContent: "center",
                    alignItems: "center",
                    marginRight: 12,
                  }}
                >
                  <View
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: 4,
                      backgroundColor: "#545EE1",
                    }}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text
                    style={{
                      fontSize: 12,
                      color: "#545EE1",
                      fontWeight: "600",
                    }}
                  >
                    Pick-up location
                  </Text>
                  <Text
                    style={{
                      fontSize: 15,
                      color: "#333",
                      fontWeight: "500",
                      marginTop: 2,
                    }}
                    numberOfLines={1}
                  >
                    {deviceLocation
                      ? "Your current location"
                      : "Getting location..."}
                  </Text>
                </View>
              </TouchableOpacity>

              {/* Destination Card */}
              <TouchableOpacity
                style={{
                  backgroundColor: "rgba(255,255,255,0.95)",
                  borderRadius: 16,
                  padding: 16,
                  flexDirection: "row",
                  alignItems: "center",
                }}
                onPress={() =>
                  navigation.navigate("LocationPicker", {
                    returnAddress: commissionData.address,
                    returnLocation: fullLocation ||
                      deviceLocation || { latitude: 0, longitude: 0 },
                  })
                }
              >
                <View
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 16,
                    backgroundColor: "#545EE1",
                    justifyContent: "center",
                    alignItems: "center",
                    marginRight: 12,
                  }}
                >
                  <Ionicons name="location" size={18} color="white" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text
                    style={{
                      fontSize: 12,
                      color: "#545EE1",
                      fontWeight: "600",
                    }}
                  >
                    Destination
                  </Text>
                  <Text
                    style={{
                      fontSize: 15,
                      color: commissionData.address ? "#333" : "#999",
                      fontWeight: "500",
                      marginTop: 2,
                    }}
                    numberOfLines={1}
                  >
                    {commissionData.address || "Where to deliver?"}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#999" />
              </TouchableOpacity>
              {addressError ? (
                <Text style={{ color: "#DC143C", fontSize: 12, marginTop: 5 }}>
                  {addressError}
                </Text>
              ) : null}
            </View>

            {/* Search Results */}
            {searchResults.length > 0 && (
              <View style={{ paddingHorizontal: 20, marginTop: 8 }}>
                <View
                  style={{
                    backgroundColor: "white",
                    borderRadius: 12,
                    maxHeight: 160,
                    overflow: "hidden",
                  }}
                >
                  <FlatList
                    keyboardShouldPersistTaps="handled"
                    data={searchResults}
                    keyExtractor={(item) => item.properties.place_id}
                    renderItem={({ item }) => {
                      const distance = item.properties.distance ?? null;
                      let distanceLabel = "";
                      if (distance !== null) {
                        if (distance >= 1000) {
                          distanceLabel = `${(distance / 1000).toFixed(
                            1
                          )} km away`;
                        } else {
                          distanceLabel = `${Math.round(distance)} m away`;
                        }
                      }
                      return (
                        <TouchableOpacity
                          onPress={() => {
                            setFullLocation({
                              returnAddress: item.properties.formatted,
                              returnLocation: {
                                latitude: item.geometry.coordinates[1],
                                longitude: item.geometry.coordinates[0],
                              },
                            });
                            navigation.navigate("LocationPicker");
                          }}
                          style={{
                            paddingVertical: 12,
                            paddingHorizontal: 14,
                            borderBottomWidth: 0.5,
                            borderColor: "#eee",
                          }}
                        >
                          <Text
                            style={{
                              color: "#333",
                              fontWeight: "600",
                              fontSize: 14,
                            }}
                          >
                            {item.properties.formatted}
                          </Text>
                          {item.properties.distance && (
                            <Text
                              style={{
                                color: "#888",
                                fontSize: 12,
                                marginTop: 2,
                              }}
                            >
                              {distanceLabel}
                            </Text>
                          )}
                        </TouchableOpacity>
                      );
                    }}
                  />
                </View>
              </View>
            )}

            {/* Details Section */}
            <View style={{ paddingHorizontal: 20, marginTop: 20 }}>
              <View
                style={{
                  backgroundColor: "rgba(255,255,255,0.95)",
                  borderRadius: 16,
                  padding: 16,
                }}
              >
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    marginBottom: 16,
                  }}
                >
                  <Ionicons name="options" size={20} color="#545EE1" />
                  <Text
                    style={{
                      fontSize: 16,
                      fontWeight: "600",
                      color: "#333",
                      marginLeft: 10,
                    }}
                  >
                    Details
                  </Text>
                </View>

                {/* Specification Input */}
                <View style={{ marginBottom: 16 }}>
                  <Text
                    style={{ fontSize: 13, color: "#666", marginBottom: 6 }}
                  >
                    Order Specification *
                  </Text>
                  <TextInput
                    placeholder="e.g., 2 pcs Chicken, 1 Rice"
                    placeholderTextColor="#999"
                    value={commissionData.specification}
                    onChangeText={(val) => {
                      setCommissionData({ specification: val });
                      if (val.trim()) setSpecificationError("");
                    }}
                    style={{
                      backgroundColor: "#F5F5F5",
                      borderRadius: 10,
                      padding: 12,
                      fontSize: 14,
                      color: "#333",
                      minHeight: 60,
                      textAlignVertical: "top",
                      borderWidth: specificationError ? 1 : 0,
                      borderColor: "#DC143C",
                    }}
                    multiline
                  />
                  {specificationError ? (
                    <Text
                      style={{ color: "#DC143C", fontSize: 12, marginTop: 4 }}
                    >
                      {specificationError}
                    </Text>
                  ) : null}
                </View>

                {/* Delivery Instructions */}
                <View>
                  <Text
                    style={{ fontSize: 13, color: "#666", marginBottom: 6 }}
                  >
                    Delivery Instructions *
                  </Text>
                  <TextInput
                    placeholder="Room code, Building, landmarks, etc."
                    placeholderTextColor="#999"
                    value={commissionData.deliveryInstructions}
                    onChangeText={(val) => {
                      setCommissionData({ deliveryInstructions: val });
                      if (val.trim()) setDeliveryInstructionsError("");
                    }}
                    style={{
                      backgroundColor: "#F5F5F5",
                      borderRadius: 10,
                      padding: 12,
                      fontSize: 14,
                      color: "#333",
                      borderWidth: deliveryInstructionsError ? 1 : 0,
                      borderColor: "#DC143C",
                    }}
                    multiline
                  />
                  {deliveryInstructionsError ? (
                    <Text
                      style={{ color: "#DC143C", fontSize: 12, marginTop: 4 }}
                    >
                      {deliveryInstructionsError}
                    </Text>
                  ) : null}
                </View>
              </View>
            </View>

            {/* Payment & Options Row */}
            <View style={{ paddingHorizontal: 20, marginTop: 12 }}>
              <View style={{ flexDirection: "row", gap: 12 }}>
                {/* Tip Input */}
                <TouchableOpacity
                  style={{
                    flex: 1,
                    backgroundColor: "rgba(255,255,255,0.95)",
                    borderRadius: 16,
                    padding: 14,
                    flexDirection: "row",
                    alignItems: "center",
                  }}
                  activeOpacity={1}
                >
                  <Ionicons name="heart" size={18} color="#545EE1" />
                  <Text style={{ fontSize: 14, color: "#333", marginLeft: 8 }}>
                    Tip ₱
                  </Text>
                  <TextInput
                    placeholder="0"
                    placeholderTextColor="#999"
                    value={tipAmount}
                    onChangeText={(val) =>
                      setTipAmount(val.replace(/[^0-9.]/g, ""))
                    }
                    keyboardType="numeric"
                    style={{
                      flex: 1,
                      fontSize: 14,
                      color: "#333",
                      marginLeft: 4,
                      padding: 0,
                    }}
                  />
                </TouchableOpacity>

                {/* Urgent Toggle */}
                <TouchableOpacity
                  style={{
                    flex: 1,
                    backgroundColor: isUrgent
                      ? "#545EE1"
                      : "rgba(255,255,255,0.95)",
                    borderRadius: 16,
                    padding: 14,
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                  onPress={() => setIsUrgent(!isUrgent)}
                  activeOpacity={0.8}
                >
                  <View style={{ flexDirection: "row", alignItems: "center" }}>
                    <Ionicons
                      name="flash"
                      size={18}
                      color={isUrgent ? "white" : "#FF9800"}
                    />
                    <Text
                      style={{
                        fontSize: 14,
                        color: isUrgent ? "white" : "#333",
                        marginLeft: 8,
                        fontWeight: "500",
                      }}
                    >
                      Urgent
                    </Text>
                  </View>
                  <View
                    style={{
                      width: 20,
                      height: 20,
                      borderRadius: 10,
                      borderWidth: 2,
                      borderColor: isUrgent ? "white" : "#ccc",
                      backgroundColor: isUrgent ? "white" : "transparent",
                      justifyContent: "center",
                      alignItems: "center",
                    }}
                  >
                    {isUrgent && (
                      <Ionicons name="checkmark" size={14} color="#545EE1" />
                    )}
                  </View>
                </TouchableOpacity>
              </View>
            </View>

            {/* Price Breakdown */}
            <View style={{ paddingHorizontal: 20, marginTop: 16 }}>
              <View
                style={{
                  backgroundColor: "rgba(255,255,255,0.95)",
                  borderRadius: 16,
                  padding: 16,
                }}
              >
                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: "600",
                    color: "#333",
                    marginBottom: 12,
                  }}
                >
                  Price Breakdown
                </Text>
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    marginBottom: 6,
                  }}
                >
                  <Text style={{ color: "#666", fontSize: 13 }}>
                    Delivery Fee ({distanceKm.toFixed(1)} km)
                  </Text>
                  <Text
                    style={{ color: "#333", fontSize: 13, fontWeight: "500" }}
                  >
                    ₱{deliveryFee}
                  </Text>
                </View>
                {tipAmount && parseFloat(tipAmount) > 0 && (
                  <View
                    style={{
                      flexDirection: "row",
                      justifyContent: "space-between",
                      marginBottom: 6,
                    }}
                  >
                    <Text style={{ color: "#666", fontSize: 13 }}>Tip</Text>
                    <Text
                      style={{ color: "#333", fontSize: 13, fontWeight: "500" }}
                    >
                      ₱{parseFloat(tipAmount)}
                    </Text>
                  </View>
                )}
                {isUrgent && (
                  <View
                    style={{
                      flexDirection: "row",
                      justifyContent: "space-between",
                      marginBottom: 6,
                    }}
                  >
                    <Text style={{ color: "#FF9800", fontSize: 13 }}>
                      ⚡ Urgent Fee
                    </Text>
                    <Text
                      style={{
                        color: "#FF9800",
                        fontSize: 13,
                        fontWeight: "500",
                      }}
                    >
                      ₱{URGENT_FEE}
                    </Text>
                  </View>
                )}
                <View
                  style={{
                    height: 1,
                    backgroundColor: "#eee",
                    marginVertical: 8,
                  }}
                />
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                  }}
                >
                  <Text
                    style={{ color: "#333", fontSize: 15, fontWeight: "700" }}
                  >
                    Total
                  </Text>
                  <Text
                    style={{
                      color: "#545EE1",
                      fontSize: 15,
                      fontWeight: "700",
                    }}
                  >
                    ₱{getTotalPrice()}
                  </Text>
                </View>
              </View>
            </View>

            {/* Order Button */}
            <View style={{ paddingHorizontal: 20, marginTop: 16 }}>
              <TouchableOpacity
                style={{
                  backgroundColor: isFormValid() ? "#545EE1" : "#999",
                  paddingVertical: 16,
                  borderRadius: 28,
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                  paddingHorizontal: 24,
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.2,
                  shadowRadius: 8,
                  elevation: 5,
                }}
                onPress={handleOrderPress}
              >
                <Text
                  style={{ color: "white", fontWeight: "700", fontSize: 16 }}
                >
                  ₱{getTotalPrice()}
                </Text>
                <Text
                  style={{ color: "white", fontWeight: "bold", fontSize: 18 }}
                >
                  Order
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>

          <ConfirmOrder
            visible={showConfirm}
            title="Confirm Order"
            message="Do you want to submit this order request?"
            confirmText="Submit Order"
            cancelText="Cancel"
            onConfirm={() => {
              setShowConfirm(false);
              postOrderFunction();
            }}
            onCancel={() => setShowConfirm(false)}
          />
        </LinearGradient>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
};

export default Orders;

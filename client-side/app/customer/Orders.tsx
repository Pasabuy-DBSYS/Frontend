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
  Button,
  ActivityIndicator,
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

const Orders: React.FC = () => {
  const [deviceLocation, setDeviceLocation] = useState<Coordinates | null>(
    null
  );
  const [showConfirm, setShowConfirm] = useState(false);

  const [orderPrice, setOrderPrice] = useState<number>(0);
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
        tipFee: 0,
        status: 0,
        priority: 0,
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

  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") {
          Alert.alert("Permission Denied", "Location access is required.");
          if (isMounted) setIsLoading(false); // ensure loading stops even if denied
          return;
        }

        const current = await Location.getCurrentPositionAsync({});
        const currentCoords = {
          latitude: current.coords.latitude,
          longitude: current.coords.longitude,
        };
        if (isMounted) {
          setDeviceLocation(currentCoords); // save device location no matter what

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

        // 🔸 Provide a fallback (e.g., Manila)
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
          setIsLoading(false); // ✅ always stop loading
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
      // Update the store immediately
      setCommissionData({ address: text });

      // Debounce the autocomplete fetch
      if (debounceTimeout.current) clearTimeout(debounceTimeout.current);

      debounceTimeout.current = setTimeout(() => {
        if (text.trim().length === 0) {
          setSearchResults(recentSearched.current);
        } else {
          fetchAutocomplete(text);
        }
      }, 300);
    },
    [fetchAutocomplete, setCommissionData] // ✅ include the store setter in deps
  );

  const navigation = useNavigation<any>();

  return (
    <KeyboardAvoidingView behavior="padding" style={{ flex: 1 }}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <LinearGradient
          colors={["#545EE1", "#FFFFFF"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={{ flex: 1, paddingHorizontal: 20, paddingTop: "10%" }}
        >
          {/* Header */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              marginTop: "10%",
            }}
          >
            <Text style={{ fontSize: 35, fontWeight: "bold", color: "white" }}>
              Commission
            </Text>
          </View>

          <Text style={{ fontSize: 18, color: "white", marginBottom: 10 }}>
            Enter details for commission
          </Text>
          <Text style={{ color: "#FFD966", fontSize: 12, marginBottom: 5 }}>
            NOTE: Delivery fee may vary depending on location.
          </Text>
          {isLoading ? (
            <ActivityIndicator
              style={{
                width: "100%",
                height: 200,
                borderRadius: 10,
                marginBottom: 15,
              }}
              size="large"
              color="#545EE1"
            />
          ) : (
            deviceLocation && (
              <MapView
                ref={mapRef}
                style={{
                  width: "100%",
                  height: 200,
                  borderRadius: 10,
                  marginBottom: 15,
                }}
                initialRegion={{
                  latitude:
                    fullLocation?.returnLocation.latitude ??
                    deviceLocation.latitude,
                  longitude:
                    fullLocation?.returnLocation.longitude ??
                    deviceLocation.longitude,
                  latitudeDelta: 0.01,
                  longitudeDelta: 0.01,
                }}
                // Allow panning and zooming freely — not a controlled region
                onPress={() =>
                  navigation.navigate("LocationPicker", {
                    returnAddress: commissionData.address,
                    returnLocation: fullLocation ||
                      deviceLocation || { latitude: 0, longitude: 0 },
                  })
                }
              ></MapView>
            )
          )}
          {/* Inputs */}
          <View style={{ marginTop: 10 }}>
            <Text style={{ color: "white", fontSize: 14, marginBottom: 5 }}>
              Address *
            </Text>
            <TextInput
              placeholder="Address"
              placeholderTextColor="#BFC5FF"
              value={commissionData.address}
              onChangeText={handleAddressChange}
              style={{
                backgroundColor: "white",
                borderRadius: 8,
                padding: 10,
                marginBottom: 5,
              }}
            />
            <Button
              title="Clear"
              onPress={() => {
                setCommissionData({
                  address: "",
                  specification: "",
                  deliveryInstructions: "",
                  coordinates: { latitude: 0, longitude: 0 },
                });
                setSearchResults([]);
                recentSearched.current = [];
              }}
            />
            <View
              style={{
                backgroundColor: "white",
                borderRadius: 8,
                maxHeight: 160,
                marginBottom: 10,
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
                      distanceLabel = `${(distance / 1000).toFixed(1)} km away`;
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
                        paddingVertical: 10,
                        paddingHorizontal: 12,
                        borderBottomWidth: 0.5,
                        borderColor: "#ccc",
                      }}
                    >
                      <Text style={{ color: "#333", fontWeight: "600" }}>
                        {item.properties.formatted}
                      </Text>

                      {item.properties.distance && (
                        <Text style={{ color: "#666", fontSize: 12 }}>
                          {distanceLabel}
                        </Text>
                      )}
                    </TouchableOpacity>
                  );
                }}
              />
            </View>
            {/* Autocomplete Dropdown */}
            {/* Specification */}
            <Text style={{ color: "white", fontSize: 14, marginBottom: 5 }}>
              Specification *
            </Text>
            <TextInput
              placeholder="Order Specification"
              placeholderTextColor="#BFC5FF"
              value={commissionData.specification}
              onChangeText={(val) => setCommissionData({ specification: val })}
              style={{
                backgroundColor: "white",
                borderRadius: 8,
                padding: 10,
                marginBottom: 10,
              }}
            />

            <Text style={{ color: "white", fontSize: 14, marginBottom: 5 }}>
              Delivery Instructions:
            </Text>
            <TextInput
              placeholder="Example: Room code, Building, etc."
              placeholderTextColor="#BFC5FF"
              value={commissionData.deliveryInstructions}
              onChangeText={(val) =>
                setCommissionData({ deliveryInstructions: val })
              }
              style={{
                backgroundColor: "white",
                borderRadius: 8,
                padding: 10,
                marginBottom: 15,
              }}
              multiline
            />
          </View>

          {/* Order Button */}
          <TouchableOpacity
            style={{
              backgroundColor: "#3C49B8",
              paddingVertical: 15,
              borderRadius: 20,
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              paddingHorizontal: 25,
              marginTop: 10,
            }}
            onPress={() => setShowConfirm(true)}
          >
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
            <Text style={{ color: "white", fontWeight: "600", fontSize: 16 }}>
              ₱ {orderPrice} Delivery Fee
            </Text>
            <Text style={{ color: "white", fontWeight: "bold", fontSize: 18 }}>
              Order
            </Text>
          </TouchableOpacity>
        </LinearGradient>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
};

export default Orders;

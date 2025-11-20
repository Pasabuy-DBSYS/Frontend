import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
  Alert,
  TextInput,
  FlatList,
  KeyboardAvoidingView,
  Keyboard,
  Platform,
} from "react-native";
import MapView, { Marker, Region, Polyline, LatLng } from "react-native-maps";
import * as Location from "expo-location";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import { Coordinates, LocationPickerParams } from "@/types/interfaces";
import { LocationPickerRouteProp } from "@/types/types";
import BackButton from "./svg/BackButton";
import { GEOAPIFY_KEY } from "@env";
import { useLocationStore } from "@/app/api/store/location_store";

const screen = Dimensions.get("window");

export default function LocationPicker() {
  const navigation = useNavigation<any>();
  const mapRef = useRef<MapView>(null);
  const route = useRoute<LocationPickerRouteProp>();
  const params = route.params;
  const { setFullLocation, fullLocation, setCommissionData, commissionData } =
    useLocationStore();

  const [searchAddress, setSearchAddress] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [region, setRegion] = useState<Region | null>(null);
  const [loading, setLoading] = useState(true);

  // --- Reverse Geocode ---
  const fetchAddress = useCallback(async (lat: number, lon: number) => {
    try {
      const url = `https://api.geoapify.com/v1/geocode/reverse?lat=${lat}&lon=${lon}&apiKey=${GEOAPIFY_KEY}`;
      const res = await fetch(url);
      const data = await res.json();
      return data.features?.[0]?.properties?.formatted || "Unknown location";
    } catch (err) {
      console.error("Reverse geocoding failed:", err);
      return "Unknown location";
    }
  }, []);

  const fetchAutocomplete = useCallback(
    async (text: string) => {
      if (!text.trim()) {
        setSearchResults([]);
        return;
      }

      if (!fullLocation?.returnLocation) return;

      const { latitude, longitude } = fullLocation.returnLocation;

      const params = new URLSearchParams({
        text,
        apiKey: GEOAPIFY_KEY,
        limit: "10",
        filter: "countrycode:ph",
        bias: `proximity:${longitude},${latitude}`,
      });

      const res = await fetch(
        `https://api.geoapify.com/v1/geocode/autocomplete?${params}`
      );
      const data = await res.json();
      setSearchResults(data.features || []);
    },
    [fullLocation]
  );

  // --- Init map with location ---
  useEffect(() => {
    let isMounted = true;

    const init = async () => {
      try {
        // Only ask for permission if we actually need current GPS
        if (!params?.returnLocation) {
          const { status } = await Location.requestForegroundPermissionsAsync();
          if (status !== "granted") {
            Alert.alert("Permission Denied", "Location access is required.");
            return; // we'll handle loading in finally
          }
        }

        let latitude: number;
        let longitude: number;

        if (fullLocation?.returnLocation) {
          ({ latitude, longitude } = fullLocation.returnLocation);
          console.log(
            "📍 Opening map at last pinned:",
            fullLocation.returnLocation
          );
        } else {
          const current = await Location.getCurrentPositionAsync({});
          ({ latitude, longitude } = current.coords);
          console.log(
            "📍 Opening map at current device location:",
            current.coords
          );
        }

        const address = await fetchAddress(latitude, longitude);

        const newRegion: Region = {
          latitude,
          longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        };
        if (isMounted) setRegion(newRegion);

        if (isMounted) {
          setFullLocation({
            returnAddress: address,
            returnLocation: { latitude, longitude },
          });
        }
      } catch (err) {
        console.error("Init location failed:", err);
        Alert.alert("Error", "Unable to get your location right now.");
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    init();
    return () => {
      isMounted = false;
    };
  }, [params?.returnLocation, fetchAddress, setFullLocation]);

  const handleRegionChangeComplete = (newRegion: Region) => {
    setRegion(newRegion);
  };

  const handleSearchChange = (text: string) => {
    setSearchAddress(text);
    fetchAutocomplete(text);
  };

  const handleSelectPlace = (item: any) => {
    const latitude = item.geometry.coordinates[1];
    const longitude = item.geometry.coordinates[0];
    const formatted = item.properties.formatted;

    setRegion({
      latitude,
      longitude,
      latitudeDelta: 0.01,
      longitudeDelta: 0.01,
    });

    setFullLocation({
      returnAddress: formatted,
      returnLocation: { latitude, longitude },
    });

    setSearchAddress(formatted);
    setSearchResults([]);
    Keyboard.dismiss();
  };

  if (loading)
    return (
      <ActivityIndicator style={{ flex: 1 }} size="large" color="#545EE1" />
    );

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{ flex: 1 }}
    >
      <View style={{ flex: 1, backgroundColor: "#fff" }}>
        {/* Search Bar */}
        <View
          style={{
            position: "absolute",
            top: 50,
            left: "2%",
            right: "2%",
            zIndex: 5,
            elevation: 5,
          }}
        >
          <TextInput
            placeholder="Search address"
            placeholderTextColor="#BFC5FF"
            value={searchAddress}
            onChangeText={handleSearchChange}
            style={{
              backgroundColor: "black",
              borderRadius: 8,
              paddingHorizontal: 15,
              paddingVertical: 10,
              height: 50,
              fontSize: 16,
              color: "white",
              position: "relative",
              paddingLeft: 40,
            }}
          />
          <View
            style={{
              position: "absolute",
              left: 12,
              top: searchAddress.length >= 0 ? 12 : 22,
              height: 50,
            }}
          >
            <BackButton onPress={() => navigation.goBack()} />
          </View>

          {/* Autocomplete Dropdown */}
          {searchResults.length > 0 && (
            <View
              style={{
                backgroundColor: "white",
                borderRadius: 8,
                maxHeight: 200,
                marginTop: 4,
                overflow: "hidden",
                zIndex: 6,
                elevation: 6,
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
                      onPress={() => handleSelectPlace(item)}
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
          )}
        </View>

        {/* Map */}
        {region && (
          <MapView
            ref={mapRef}
            style={{ flex: 1 }}
            region={region}
            onRegionChangeComplete={handleRegionChangeComplete}
            showsUserLocation
          >
            <Marker
              coordinate={fullLocation?.returnLocation as LatLng}
              title="Selected Location"
              description={fullLocation?.returnAddress}
            />
          </MapView>
        )}

        {/* Center Pin */}
        <View
          style={{
            position: "absolute",
            top: screen.height / 2 - 25,
            left: screen.width / 2 - 12,
            zIndex: 2,
          }}
        >
          <Ionicons name="location-sharp" size={40} color="#545EE1" />
        </View>

        {/* Continue Button */}
        <TouchableOpacity
          onPress={async () => {
            const address = await fetchAddress(
              region?.latitude as number,
              region?.longitude as number
            );

            const newCoordinates: Coordinates = {
              latitude: region?.latitude as number,
              longitude: region?.longitude as number,
            };
            setFullLocation({
              returnLocation: newCoordinates,
              returnAddress: address,
            });
            navigation.navigate("CustomerNavigationBar", {
              navPage: 0,
            });
          }}
          style={{
            position: "absolute",
            bottom: 40,
            left: 20,
            right: 20,
            backgroundColor: "#545EE1",
            borderRadius: 25,
            paddingVertical: 15,
            alignItems: "center",
            zIndex: 10,
            elevation: 10,
          }}
        >
          <Text style={{ color: "white", fontWeight: "600", fontSize: 16 }}>
            Set location where to buy / pickup
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

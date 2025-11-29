import React, { useEffect, useRef, useState } from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  Animated,
  Easing,
  Platform,
  TouchableWithoutFeedback,
  Image,
  TextInput,
} from "react-native";
import { BlurView } from "expo-blur";
import { Feather } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";

type ReceiptUploadProps = {
  visible: boolean;
  offeredAmount: number;
  onConfirm: (
    image: { uri: string; name: string; type: string },
    amount: number
  ) => void;
  onCancel: () => void;
};

const ReceiptUploadModal: React.FC<ReceiptUploadProps> = ({
  visible,
  offeredAmount,
  onConfirm,
  onCancel,
}) => {
  const [selectedImage, setSelectedImage] = useState<{
    uri: string;
    name: string;
    type: string;
  } | null>(null);
  const [amount, setAmount] = useState(offeredAmount.toString());

  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.9)).current;
  const overlayOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 250,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.spring(scale, {
          toValue: 1,
          friction: 6,
          tension: 60,
          useNativeDriver: true,
        }),
        Animated.timing(overlayOpacity, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 0,
          duration: 200,
          easing: Easing.in(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(scale, {
          toValue: 0.9,
          duration: 200,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(overlayOpacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  // Reset image when modal closes
  useEffect(() => {
    if (!visible) {
      setSelectedImage(null);
    }
  }, [visible]);

  const handleUploadPhoto = async () => {
    // Request camera permission
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      alert("Permission to access camera is required!");
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: false,
      quality: 0.5,
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
    });

    if (result.canceled) return;

    const asset = result.assets[0];
    const fileName = asset.fileName ?? `receipt_${Date.now()}.jpg`;

    setSelectedImage({
      uri: asset.uri,
      name: fileName,
      type: "image/jpeg",
    });
  };

  const handleConfirm = () => {
    if (selectedImage) {
      onConfirm(selectedImage, parseInt(amount) || 0);
      setSelectedImage(null);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      statusBarTranslucent
      animationType="none"
      onRequestClose={onCancel}
    >
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        {/* Static Blur Layer */}
        <BlurView
          intensity={28}
          tint={Platform.OS === "ios" ? "systemThinMaterialDark" : "dark"}
          style={{ position: "absolute", width: "100%", height: "100%" }}
        />

        {/* Animated dark overlay */}
        <Animated.View
          style={{
            position: "absolute",
            width: "100%",
            height: "100%",
            backgroundColor: "rgba(0,0,0,0.5)",
            opacity: overlayOpacity,
          }}
        />

        {/* Dismiss on backdrop tap */}
        <TouchableWithoutFeedback onPress={onCancel}>
          <View
            style={{ position: "absolute", width: "100%", height: "100%" }}
          />
        </TouchableWithoutFeedback>

        {/* Animated Card */}
        <Animated.View
          style={{
            width: "85%",
            backgroundColor: "#fff",
            borderRadius: 16,
            padding: 24,
            shadowColor: "#000",
            shadowOpacity: 0.15,
            shadowRadius: 12,
            shadowOffset: { width: 0, height: 8 },
            elevation: 8,
            opacity,
            transform: [{ scale }],
            alignItems: "center",
          }}
        >
          {/* Close Button */}
          <TouchableOpacity
            onPress={onCancel}
            style={{
              position: "absolute",
              top: 12,
              right: 12,
              padding: 4,
            }}
          >
            <Feather name="x" size={24} color="#999" />
          </TouchableOpacity>

          {/* Title */}
          <Text
            style={{
              fontSize: 18,
              fontWeight: "700",
              color: "#111",
              textAlign: "center",
              marginTop: 10,
            }}
          >
            Receipt of the{"\n"}products
          </Text>

          {/* Upload Photo Button or Preview */}
          {selectedImage ? (
            <TouchableOpacity
              onPress={handleUploadPhoto}
              style={{ marginTop: 20 }}
            >
              <Image
                source={{ uri: selectedImage.uri }}
                style={{
                  width: 150,
                  height: 150,
                  borderRadius: 12,
                  borderWidth: 2,
                  borderColor: "#545EE1",
                }}
              />
              <Text
                style={{
                  textAlign: "center",
                  marginTop: 8,
                  color: "#545EE1",
                  fontSize: 12,
                }}
              >
                Tap to change
              </Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              onPress={handleUploadPhoto}
              style={{
                flexDirection: "row",
                alignItems: "center",
                paddingVertical: 10,
                paddingHorizontal: 20,
                borderWidth: 1.5,
                borderColor: "#545EE1",
                borderRadius: 20,
                marginTop: 20,
              }}
            >
              <Feather name="camera" size={18} color="#545EE1" />
              <Text
                style={{
                  marginLeft: 8,
                  fontSize: 14,
                  color: "#545EE1",
                  fontWeight: "500",
                }}
              >
                Upload Photo
              </Text>
            </TouchableOpacity>
          )}

          {/* Amount Input */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              marginTop: 24,
            }}
          >
            <Text
              style={{
                fontSize: 28,
                fontWeight: "700",
                color: "#545EE1",
              }}
            >
              ₱
            </Text>
            <TextInput
              value={amount}
              onChangeText={(text) => setAmount(text.replace(/[^0-9.]/g, ""))}
              keyboardType="numeric"
              style={{
                fontSize: 28,
                fontWeight: "700",
                color: "#545EE1",
                marginLeft: 4,
                minWidth: 80,
                textAlign: "center",
                borderBottomWidth: 2,
                borderBottomColor: "#545EE1",
                paddingVertical: 4,
              }}
            />
          </View>
          <Text
            style={{
              fontSize: 12,
              color: "#888",
              marginTop: 8,
            }}
          >
            Total items amount
          </Text>

          {/* Confirm Button */}
          <TouchableOpacity
            onPress={handleConfirm}
            disabled={!selectedImage}
            style={{
              marginTop: 24,
              backgroundColor: selectedImage ? "#545EE1" : "#B9BCEF",
              paddingVertical: 14,
              paddingHorizontal: 60,
              borderRadius: 25,
              width: "100%",
              alignItems: "center",
            }}
          >
            <Text
              style={{
                color: "#fff",
                fontSize: 16,
                fontWeight: "600",
              }}
            >
              Confirm
            </Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
  );
};

export default ReceiptUploadModal;

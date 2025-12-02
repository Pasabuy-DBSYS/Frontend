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
  Keyboard,
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
  const [amount, setAmount] = useState("");
  const inputRef = useRef<TextInput>(null);

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

  // Reset image and amount when modal closes
  useEffect(() => {
    if (!visible) {
      setSelectedImage(null);
      setAmount("");
    }
  }, [visible]);

  // Handle amount input - override 0 behavior
  const handleAmountChange = (text: string) => {
    // Remove non-numeric characters except decimal
    const cleaned = text.replace(/[^0-9.]/g, "");

    // If current amount is "0" and user types a number, replace the 0
    if (
      amount === "0" &&
      cleaned.length > 1 &&
      cleaned.startsWith("0") &&
      cleaned[1] !== "."
    ) {
      setAmount(cleaned.slice(1));
    } else {
      setAmount(cleaned);
    }
  };

  // Dismiss keyboard on tap outside input
  const dismissKeyboard = () => {
    Keyboard.dismiss();
  };

  // Check if can submit (has image and amount > 0)
  const parsedAmount = parseFloat(amount) || 0;
  const canSubmit = selectedImage !== null && parsedAmount > 0;

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
    if (selectedImage && parsedAmount > 0) {
      Keyboard.dismiss();
      onConfirm(selectedImage, parsedAmount);
      setSelectedImage(null);
      setAmount("");
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

        {/* Dismiss keyboard and modal on backdrop tap */}
        <TouchableWithoutFeedback
          onPress={() => {
            Keyboard.dismiss();
            onCancel();
          }}
        >
          <View
            style={{ position: "absolute", width: "100%", height: "100%" }}
          />
        </TouchableWithoutFeedback>

        {/* Animated Card - tap to dismiss keyboard only */}
        <TouchableWithoutFeedback onPress={dismissKeyboard}>
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
              onPress={() => {
                Keyboard.dismiss();
                onCancel();
              }}
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
                ref={inputRef}
                value={amount}
                onChangeText={handleAmountChange}
                keyboardType="numeric"
                placeholder="0"
                placeholderTextColor="#B9BCEF"
                selectTextOnFocus={true}
                onFocus={() => {
                  // Clear if the value is 0 when focusing
                  if (amount === "0") {
                    setAmount("");
                  }
                }}
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
            {parsedAmount === 0 && amount !== "" && (
              <Text
                style={{
                  fontSize: 11,
                  color: "#F44336",
                  marginTop: 4,
                }}
              >
                Amount must be greater than 0
              </Text>
            )}

            {/* Confirm Button */}
            <TouchableOpacity
              onPress={handleConfirm}
              disabled={!canSubmit}
              style={{
                marginTop: 16,
                backgroundColor: canSubmit ? "#545EE1" : "#B9BCEF",
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
        </TouchableWithoutFeedback>
      </View>
    </Modal>
  );
};

export default ReceiptUploadModal;

import React, { useEffect, useRef } from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  Animated,
  Easing,
  Platform,
  TouchableWithoutFeedback,
} from "react-native";
import { BlurView } from "expo-blur";
import { ConfirmDeliverProps } from "@/types/types";

const CancelDeliver: React.FC<ConfirmDeliverProps> = ({
  visible,
  title = "Cancel Delivery",
  message = "Are you sure you want to cancel this delivery?",
  confirmText = "Yes, cancel it",
  cancelText = "Keep Delivery",
  onConfirm,
  onCancel,
}) => {
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

  return (
    <Modal
      visible={visible}
      transparent
      statusBarTranslucent
      animationType="none"
      onRequestClose={onCancel}
    >
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        {/* Static blur background */}
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
            backgroundColor: "rgba(0,0,0,0.55)",
            opacity: overlayOpacity,
          }}
        />

        {/* Tap outside to dismiss */}
        <TouchableWithoutFeedback onPress={onCancel}>
          <View
            style={{ position: "absolute", width: "100%", height: "100%" }}
          />
        </TouchableWithoutFeedback>

        {/* Modal Card */}
        <Animated.View
          style={{
            width: "85%",
            backgroundColor: "#fff",
            borderRadius: 16,
            padding: 20,
            shadowColor: "#000",
            shadowOpacity: 0.15,
            shadowRadius: 12,
            shadowOffset: { width: 0, height: 8 },
            elevation: 8,
            opacity,
            transform: [{ scale }],
          }}
        >
          <Text style={{ fontSize: 18, fontWeight: "700", color: "#111" }}>
            {title}
          </Text>

          <Text
            style={{
              marginTop: 10,
              fontSize: 15,
              color: "#444",
              lineHeight: 22,
            }}
          >
            {message}
          </Text>

          {/* Action Buttons */}
          <View
            style={{
              flexDirection: "row",
              justifyContent: "flex-end",
              marginTop: 20,
            }}
          >
            <TouchableOpacity
              onPress={onCancel}
              style={{
                paddingVertical: 10,
                paddingHorizontal: 16,
                borderRadius: 10,
                backgroundColor: "#F0F1F5",
                marginRight: 10,
              }}
            >
              <Text style={{ color: "#333", fontSize: 15 }}>{cancelText}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={onConfirm}
              style={{
                paddingVertical: 10,
                paddingHorizontal: 16,
                borderRadius: 10,
                backgroundColor: "#E53935", // Red tone for cancel
              }}
            >
              <Text
                style={{
                  color: "#fff",
                  fontSize: 15,
                  fontWeight: "600",
                }}
              >
                {confirmText}
              </Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

export default CancelDeliver;

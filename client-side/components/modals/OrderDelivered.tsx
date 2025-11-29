import React, { useEffect, useRef, useState } from "react";
import { View, Text, Animated, Easing, TouchableOpacity } from "react-native";
import { BlurView } from "expo-blur";
import BigCheck from "../svg/BigCheck";

interface Props {
  visible: boolean;
  onFinish?: () => void;
  onReview?: () => void;
}

const OrderDelivered: React.FC<Props> = ({ visible, onFinish, onReview }) => {
  const scale = useRef(new Animated.Value(0.3)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const textOpacity = useRef(new Animated.Value(0)).current;
  const blurOpacity = useRef(new Animated.Value(0)).current;
  const checkScale = useRef(new Animated.Value(0)).current;
  const buttonsOpacity = useRef(new Animated.Value(0)).current;
  const [showButtons, setShowButtons] = useState(false);

  useEffect(() => {
    if (!visible) {
      setShowButtons(false);
      return;
    }

    // Reset animation values
    scale.setValue(0.3);
    opacity.setValue(0);
    textOpacity.setValue(0);
    blurOpacity.setValue(0);
    checkScale.setValue(0);
    buttonsOpacity.setValue(0);
    setShowButtons(false);

    Animated.sequence([
      // Fade in blur background
      Animated.timing(blurOpacity, {
        toValue: 1,
        duration: 180,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),

      // Container enters with bounce + opacity
      Animated.parallel([
        Animated.timing(scale, {
          toValue: 1,
          duration: 500,
          easing: Easing.out(Easing.elastic(1.2)),
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 280,
          useNativeDriver: true,
        }),
      ]),

      // Check icon bounces in
      Animated.spring(checkScale, {
        toValue: 1,
        friction: 4,
        tension: 100,
        useNativeDriver: true,
      }),

      // Fade-in text
      Animated.timing(textOpacity, {
        toValue: 1,
        duration: 260,
        easing: Easing.in(Easing.ease),
        useNativeDriver: true,
      }),
    ]).start(() => {
      // Show buttons after animation
      setShowButtons(true);
      Animated.timing(buttonsOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    });
  }, [visible]);

  if (!visible) return null;

  return (
    <View
      style={{
        position: "absolute",
        top: 0,
        bottom: 0,
        left: 0,
        right: 0,
        justifyContent: "center",
        alignItems: "center",
        zIndex: 9999,
      }}
    >
      {/* Blurred background */}
      <Animated.View
        style={{
          position: "absolute",
          width: "100%",
          height: "100%",
          opacity: blurOpacity,
        }}
      >
        <BlurView style={{ flex: 1 }} intensity={50} tint="dark" />
      </Animated.View>

      {/* Content Animation */}
      <Animated.View
        style={{
          opacity,
          transform: [{ scale }],
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {/* Green circle with checkmark */}
        <Animated.View
          style={{
            width: 140,
            height: 140,
            borderRadius: 70,
            backgroundColor: "#4CAF50",
            justifyContent: "center",
            alignItems: "center",
            transform: [{ scale: checkScale }],
            shadowColor: "#4CAF50",
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.4,
            shadowRadius: 12,
            elevation: 8,
          }}
        >
          <BigCheck width={80} height={80} />
        </Animated.View>

        <Animated.Text
          style={{
            marginTop: 24,
            fontSize: 28,
            fontWeight: "700",
            color: "#fff",
            opacity: textOpacity,
          }}
        >
          Order Delivered!
        </Animated.Text>

        <Animated.Text
          style={{
            marginTop: 8,
            fontSize: 16,
            fontWeight: "500",
            color: "rgba(255, 255, 255, 0.8)",
            opacity: textOpacity,
          }}
        >
          Thank you for using Pasabuy
        </Animated.Text>

        {/* Submit Review Prompt */}
        {showButtons && (
          <Animated.View
            style={{
              opacity: buttonsOpacity,
              alignItems: "center",
              marginTop: 30,
            }}
          >
            <Text
              style={{
                fontSize: 18,
                fontWeight: "600",
                color: "#fff",
                marginBottom: 16,
              }}
            >
              Submit a Review?
            </Text>

            <View style={{ flexDirection: "row", gap: 16 }}>
              <TouchableOpacity
                onPress={() => {
                  if (onReview) onReview();
                }}
                style={{
                  backgroundColor: "#4CAF50",
                  paddingVertical: 12,
                  paddingHorizontal: 32,
                  borderRadius: 25,
                }}
              >
                <Text
                  style={{ color: "#fff", fontWeight: "700", fontSize: 16 }}
                >
                  Yes
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => {
                  if (onFinish) onFinish();
                }}
                style={{
                  backgroundColor: "rgba(255,255,255,0.2)",
                  paddingVertical: 12,
                  paddingHorizontal: 32,
                  borderRadius: 25,
                  borderWidth: 1,
                  borderColor: "rgba(255,255,255,0.5)",
                }}
              >
                <Text
                  style={{ color: "#fff", fontWeight: "700", fontSize: 16 }}
                >
                  Later
                </Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        )}
      </Animated.View>
    </View>
  );
};

export default OrderDelivered;

import React, { useEffect, useRef } from "react";
import { View, Text, Animated, Easing } from "react-native";
import { BlurView } from "expo-blur";
import PasabuyLogo from "../svg/PasabuyLogo";

interface Props {
  visible: boolean;
  onFinish?: () => void;
}

const OrderAccepted: React.FC<Props> = ({ visible, onFinish }) => {
  const scale = useRef(new Animated.Value(0.3)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const textOpacity = useRef(new Animated.Value(0)).current;
  const blurOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!visible) return;

    // Reset animation values
    scale.setValue(0.3);
    opacity.setValue(0);
    textOpacity.setValue(0);
    blurOpacity.setValue(0);

    Animated.sequence([
      // Fade in blur background
      Animated.timing(blurOpacity, {
        toValue: 1,
        duration: 180,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),

      // Logo enters with bounce + opacity
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

      // Fade-in text
      Animated.timing(textOpacity, {
        toValue: 1,
        duration: 260,
        easing: Easing.in(Easing.ease),
        useNativeDriver: true,
      }),
    ]).start(() => {
      // Auto hide after 1 sec
      if (onFinish) {
        setTimeout(() => onFinish(), 1000);
      }
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

      {/* Logo + Text Animation */}
      <Animated.View
        style={{
          opacity,
          transform: [{ scale }],
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <PasabuyLogo width={202} height={162} />

        <Animated.Text
          style={{
            marginTop: 20,
            fontSize: 28,
            fontWeight: "700",
            color: "#fff",
            opacity: textOpacity,
          }}
        >
          Order Accepted
        </Animated.Text>
      </Animated.View>
    </View>
  );
};

export default OrderAccepted;

import React, { useEffect, useRef } from "react";
import { Animated, Easing, ViewStyle } from "react-native";

interface SpinnerProps {
  size?: number;
  color?: string;
  style?: ViewStyle;
}

const Loading: React.FC<SpinnerProps> = ({
  size = 22,
  color = "#545EE1",
  style,
}) => {
  const spinAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(spinAnim, {
        toValue: 1,
        duration: 900,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();
  }, []);

  const spin = spinAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  return (
    <Animated.View
      style={[
        {
          width: size,
          height: size,
          borderWidth: size * 0.13,
          borderColor: color,
          borderTopColor: "transparent",
          borderRadius: size / 2,
          transform: [{ rotate: spin }],
        },
        style,
      ]}
    />
  );
};

export default Loading;

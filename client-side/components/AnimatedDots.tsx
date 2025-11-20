import React, { useEffect, useRef, useState } from "react";
import { Animated, Text } from "react-native";

const AnimatedDots = () => {
  const progress = useRef(new Animated.Value(0)).current;
  const [dots, setDots] = useState("");

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(progress, {
          toValue: 1,
          duration: 400,
          useNativeDriver: false,
        }),
        Animated.timing(progress, {
          toValue: 2,
          duration: 400,
          useNativeDriver: false,
        }),
        Animated.timing(progress, {
          toValue: 3,
          duration: 400,
          useNativeDriver: false,
        }),
        Animated.timing(progress, {
          toValue: 4,
          duration: 600,
          useNativeDriver: false,
        }),
      ])
    );
    loop.start();

    const id = progress.addListener(({ value }) => {
      const count = Math.floor(value);
      setDots(".".repeat(count));
    });

    return () => progress.removeListener(id);
  }, []);

  return (
    <Text style={{ fontSize: 20, fontWeight: "700", color: "#222" }}>
      {dots}
    </Text>
  );
};

export default AnimatedDots;

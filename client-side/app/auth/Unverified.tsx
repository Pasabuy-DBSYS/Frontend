import React from "react";
import { View, Text, Dimensions } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Button } from "../../components/Button";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";

const { width, height } = Dimensions.get("window");

const Unverified = () => {
  const navigation = useNavigation();

  const handleExit = () => {
    navigation.goBack();
  };

  return (
    <LinearGradient
      colors={["#545EE1", "#FFFFFF"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      style={{
        flex: 1,
        paddingHorizontal: 20,
      }}
      locations={[0, 0.6]}
    >
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          gap: 40,
        }}
      >
        {/* Icon */}
        <View
          style={{
            width: 100,
            height: 100,
            borderRadius: 50,
            backgroundColor: "rgba(255, 255, 255, 0.2)",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <Ionicons name="hourglass" size={60} color="white" />
        </View>

        {/* Message */}
        <View
          style={{
            alignItems: "center",
            gap: 15,
          }}
        >
          <Text
            style={{
              color: "white",
              fontSize: 28,
              fontWeight: "700",
              textAlign: "center",
            }}
          >
            We're still verifying
          </Text>
          <Text
            style={{
              color: "white",
              fontSize: 28,
              fontWeight: "700",
              textAlign: "center",
            }}
          >
            your account
          </Text>

          <Text
            style={{
              color: "rgba(255, 255, 255, 0.8)",
              fontSize: 16,
              textAlign: "center",
              marginTop: 10,
              lineHeight: 24,
            }}
          >
            Please wait while we verify your information. This usually takes a
            few minutes.
          </Text>
        </View>

        {/* Exit Button */}
        <Button
          onPress={handleExit}
          title="Exit"
          width={width * 0.7}
          height={55}
          borderRadius={20}
          fontSize={16}
          backgroundColor="white"
          textColor="#545EE1"
        />
      </View>
    </LinearGradient>
  );
};

export default Unverified;

import React from "react";
import { Modal, View, Text, TouchableOpacity, Dimensions } from "react-native";
import { BlurView } from "expo-blur";

const { width } = Dimensions.get("window");

interface UpdatePhoneNumberProps {
  visible: boolean;
  phoneNumber: string;
  onClose: () => void;
  onChangePress: () => void;
}

const UpdatePhoneNumber: React.FC<UpdatePhoneNumberProps> = ({
  visible,
  phoneNumber,
  onClose,
  onChangePress,
}) => {
  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={onClose}
    >
      {/* Blurred Background */}
      <BlurView intensity={60} tint="dark" style={{ flex: 1 }}>
        <View
          style={{
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
            backgroundColor: "rgba(0,0,0,0.3)",
          }}
        >
          {/* Modal Card */}
          <View
            style={{
              width: width * 0.85,
              backgroundColor: "#FFFFFF",
              borderRadius: 20,
              paddingVertical: 28,
              paddingHorizontal: 22,
              alignItems: "center",
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.15,
              shadowRadius: 8,
              elevation: 8,
            }}
          >
            {/* Close Button */}
            <TouchableOpacity
              onPress={onClose}
              style={{
                position: "absolute",
                top: 16,
                right: 16,
                width: 28,
                height: 28,
                borderRadius: 14,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Text style={{ fontSize: 22, color: "#545EE1" }}>×</Text>
            </TouchableOpacity>

            {/* Title */}
            <Text
              style={{
                fontSize: 16,
                fontWeight: "600",
                color: "#111827",
                textAlign: "center",
                marginTop: 10,
                marginBottom: 10,
              }}
            >
              Your phone number:
            </Text>

            {/* Phone Number */}
            <Text
              style={{
                fontSize: 18,
                fontWeight: "700",
                color: "#000000",
                textAlign: "center",
                marginBottom: 16,
              }}
            >
              {phoneNumber}
            </Text>

            {/* Description */}
            <Text
              style={{
                fontSize: 13,
                color: "#6B7280",
                textAlign: "center",
                marginBottom: 28,
              }}
            >
              This phone number is linked to your account{"\n"}and is only
              visible to you.
            </Text>

            {/* Action Button */}
            <TouchableOpacity
              onPress={onChangePress}
              activeOpacity={0.8}
              style={{
                backgroundColor: "#545EE1",
                borderRadius: 30,
                paddingVertical: 14,
                width: "100%",
                alignItems: "center",
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.25,
                shadowRadius: 4,
                elevation: 5,
              }}
            >
              <Text
                style={{
                  color: "#FFFFFF",
                  fontWeight: "700",
                  fontSize: 15,
                }}
              >
                Change phone number
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </BlurView>
    </Modal>
  );
};

export default UpdatePhoneNumber;

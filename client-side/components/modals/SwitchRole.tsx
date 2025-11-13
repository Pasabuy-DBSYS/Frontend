import React from "react";
import { View, Text, Modal, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons"; // or 'react-native-vector-icons/Ionicons'
import { BlurView } from "expo-blur";

interface SwitchRoleProps {
  isVisible: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

const SwitchRole: React.FC<SwitchRoleProps> = ({
  isVisible,
  onClose,
  onConfirm,
}) => {
  return (
    <Modal
      visible={isVisible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        {/* Blurred background (must fill entire screen) */}
        <BlurView
          intensity={60}
          tint="dark"
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
          }}
        />

        {/* Semi-transparent overlay */}
        <View
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0,0,0,0.4)",
          }}
        />

        {/* Modal content */}
        <View
          style={{
            backgroundColor: "white",
            borderRadius: 12,
            padding: 24,
            width: "80%",
            alignItems: "center",
            position: "relative",
          }}
        >
          {/* Exit Button */}

          {/* Message */}
          <Text
            style={{
              fontSize: 18,
              fontWeight: "600",
              textAlign: "center",
              marginVertical: 20,
            }}
          >
            Are you sure you want to change roles?
          </Text>

          {/* Action Buttons */}
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              width: "100%",
            }}
          >
            <TouchableOpacity
              onPress={onConfirm}
              style={{
                flex: 1,
                backgroundColor: "#545EE1",
                paddingVertical: 10,
                borderRadius: 8,
                alignItems: "center",
                marginRight: 8,
              }}
            >
              <Text style={{ color: "white", fontWeight: "bold" }}>Switch</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={onClose}
              style={{
                flex: 1,
                backgroundColor: "#E5E5E5",
                paddingVertical: 10,
                borderRadius: 8,
                alignItems: "center",
                marginLeft: 8,
              }}
            >
              <Text style={{ color: "#333", fontWeight: "500" }}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default SwitchRole;

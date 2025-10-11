import React from "react";
import { Modal, View, Text, TouchableOpacity, Dimensions } from "react-native";
import { BlurView } from "expo-blur";

const { width } = Dimensions.get("window");

interface ConfirmLogoutProps {
  visible: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

const ConfirmLogout: React.FC<ConfirmLogoutProps> = ({
  visible,
  onCancel,
  onConfirm,
}) => {
  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={onCancel}
    >
      {/* Background Blur */}
      <BlurView intensity={60} tint="dark" style={{ flex: 1 }}>
        <View
          style={{
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
            backgroundColor: "rgba(0,0,0,0.3)", // dark overlay for dim effect
          }}
        >
          {/* Modal Card */}
          <View
            style={{
              width: width * 0.85,
              backgroundColor: "#FFFFFF",
              borderRadius: 20,
              paddingVertical: 24,
              paddingHorizontal: 20,
              alignItems: "center",
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.2,
              shadowRadius: 6,
              elevation: 10,
            }}
          >
            {/* Title */}
            <Text
              style={{
                fontSize: 16,
                fontWeight: "600",
                color: "#111827",
                textAlign: "center",
                marginBottom: 24,
              }}
            >
              Are you sure you want to sign out?
            </Text>

            {/* Buttons */}
            <View
              style={{
                flexDirection: "row",
                width: "100%",
                justifyContent: "space-between",
                gap: 10,
              }}
            >
              <TouchableOpacity
                style={{
                  flex: 1,
                  backgroundColor: "#545EE1",
                  borderRadius: 25,
                  paddingVertical: 12,
                  alignItems: "center",
                }}
                activeOpacity={0.8}
                onPress={onConfirm}
              >
                <Text
                  style={{
                    color: "#FFFFFF",
                    fontWeight: "600",
                    fontSize: 15,
                  }}
                >
                  Sign out
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={{
                  flex: 1,
                  backgroundColor: "#E5E7EB",
                  borderRadius: 25,
                  paddingVertical: 12,
                  alignItems: "center",
                }}
                activeOpacity={0.8}
                onPress={onCancel}
              >
                <Text
                  style={{
                    color: "#111827",
                    fontWeight: "600",
                    fontSize: 15,
                  }}
                >
                  Cancel
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </BlurView>
    </Modal>
  );
};

export default ConfirmLogout;

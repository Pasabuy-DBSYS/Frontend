import React, { useState } from "react";
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Dimensions,
} from "react-native";
import { BlurView } from "expo-blur";

const { width } = Dimensions.get("window");

interface UpdateEmailProps {
  visible: boolean;
  currentEmail?: string;
  onClose: () => void;
  onSave: (newEmail: string) => void;
}

const UpdateEmail: React.FC<UpdateEmailProps> = ({
  visible,
  currentEmail = "",
  onClose,
  onSave,
}) => {
  const [email, setEmail] = useState(currentEmail);

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={onClose}
    >
      {/* Background Blur */}
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
                fontSize: 18,
                fontWeight: "700",
                color: "#111827",
                marginBottom: 8,
                textAlign: "center",
              }}
            >
              Update your email
            </Text>

            {/* Subtitle */}
            <Text
              style={{
                fontSize: 13,
                color: "#6B7280",
                marginBottom: 20,
                textAlign: "center",
              }}
            >
              Your email is linked to your account and will be used for
              verification.
            </Text>

            {/* Input Field */}
            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder="Enter new email"
              keyboardType="email-address"
              autoCapitalize="none"
              style={{
                borderWidth: 1,
                borderColor: "#D1D5DB",
                borderRadius: 10,
                paddingVertical: 12,
                paddingHorizontal: 14,
                fontSize: 15,
                color: "#111827",
                width: "100%",
                marginBottom: 35,
              }}
            />

            {/* Save Button */}
            <TouchableOpacity
              onPress={() => onSave(email)}
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
                Save
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </BlurView>
    </Modal>
  );
};

export default UpdateEmail;

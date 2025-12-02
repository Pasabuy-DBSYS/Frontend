import React, { useState, useEffect } from "react";
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
  Alert,
} from "react-native";
import { BlurView } from "expo-blur";
import { changePhone } from "@/app/api/user";
import { useAuthStore } from "@/app/api/store/auth_store";

const { width } = Dimensions.get("window");

interface UpdatePhoneNumberProps {
  visible: boolean;
  onClose: () => void;
  onSave: () => void;
}

const UpdatePhoneNumber: React.FC<UpdatePhoneNumberProps> = ({
  visible,
  onClose,
  onSave,
}) => {
  const { user } = useAuthStore();
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (visible && user) {
      setPhone(user.phone || "");
      setIsEditing(false);
    }
  }, [visible, user]);

  const handleSave = async () => {
    if (!phone.trim()) {
      Alert.alert("Error", "Phone number is required");
      return;
    }

    if (phone.trim().length < 10) {
      Alert.alert("Error", "Please enter a valid phone number");
      return;
    }

    setLoading(true);
    try {
      await changePhone(phone.trim());
      Alert.alert("Success", "Phone number updated successfully");
      onSave();
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to update phone number");
    } finally {
      setLoading(false);
    }
  };

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
              {isEditing ? "Update phone number" : "Your phone number:"}
            </Text>

            {isEditing ? (
              <>
                {/* Phone Input */}
                <TextInput
                  value={phone}
                  onChangeText={setPhone}
                  placeholder="Enter phone number"
                  keyboardType="phone-pad"
                  style={{
                    borderWidth: 1,
                    borderColor: "#D1D5DB",
                    borderRadius: 10,
                    paddingVertical: 12,
                    paddingHorizontal: 14,
                    fontSize: 15,
                    color: "#111827",
                    width: "100%",
                    marginBottom: 16,
                  }}
                />

                {/* Description */}
                <Text
                  style={{
                    fontSize: 13,
                    color: "#6B7280",
                    textAlign: "center",
                    marginBottom: 28,
                  }}
                >
                  This phone number will be linked to your account{"\n"}and is
                  only visible to you.
                </Text>

                {/* Save Button */}
                <TouchableOpacity
                  onPress={handleSave}
                  disabled={loading}
                  activeOpacity={0.8}
                  style={{
                    backgroundColor: loading ? "#9CA3AF" : "#545EE1",
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
                  {loading ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <Text
                      style={{
                        color: "#FFFFFF",
                        fontWeight: "700",
                        fontSize: 15,
                      }}
                    >
                      Save
                    </Text>
                  )}
                </TouchableOpacity>
              </>
            ) : (
              <>
                {/* Phone Number Display */}
                <Text
                  style={{
                    fontSize: 18,
                    fontWeight: "700",
                    color: "#000000",
                    textAlign: "center",
                    marginBottom: 16,
                  }}
                >
                  {user?.phone || "Not set"}
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
                  onPress={() => setIsEditing(true)}
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
              </>
            )}
          </View>
        </View>
      </BlurView>
    </Modal>
  );
};

export default UpdatePhoneNumber;

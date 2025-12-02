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
import { changeName } from "@/app/api/user";
import { useAuthStore } from "@/app/api/store/auth_store";

const { width } = Dimensions.get("window");

interface EditNameModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: () => void;
}

const UpdateDisplayName: React.FC<EditNameModalProps> = ({
  visible,
  onClose,
  onSave,
}) => {
  const { user } = useAuthStore();
  const [firstName, setFirstName] = useState("");
  const [middleName, setMiddleName] = useState("");
  const [lastName, setLastName] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (visible && user) {
      setFirstName(user.firstName || "");
      setMiddleName(user.middleName || "");
      setLastName(user.lastName || "");
    }
  }, [visible, user]);

  const handleSave = async () => {
    if (!firstName.trim() || !lastName.trim()) {
      Alert.alert("Error", "First name and last name are required");
      return;
    }

    setLoading(true);
    try {
      await changeName(firstName.trim(), middleName.trim(), lastName.trim());
      Alert.alert("Success", "Name updated successfully");
      onSave();
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to update name");
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
      {/* Blurred background */}
      <BlurView intensity={60} tint="dark" style={{ flex: 1 }}>
        <View
          style={{
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
            backgroundColor: "rgba(0,0,0,0.3)",
          }}
        >
          {/* Modal card */}
          <View
            style={{
              width: width * 0.85,
              backgroundColor: "#FFFFFF",
              borderRadius: 20,
              paddingVertical: 28,
              paddingHorizontal: 22,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.15,
              shadowRadius: 8,
              elevation: 8,
            }}
          >
            {/* Header */}
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 12,
              }}
            >
              <Text
                style={{
                  fontSize: 18,
                  fontWeight: "700",
                  color: "#111827",
                }}
              >
                Update Name
              </Text>

              <TouchableOpacity
                onPress={onClose}
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 14,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Text style={{ fontSize: 20, color: "#545EE1" }}>×</Text>
              </TouchableOpacity>
            </View>

            {/* Subtitle */}
            <Text
              style={{
                fontSize: 13,
                color: "#6B7280",
                marginBottom: 20,
              }}
            >
              Your name can only be changed once every 7 days
            </Text>

            {/* First Name Input */}
            <Text style={{ fontSize: 13, color: "#6B7280", marginBottom: 6 }}>
              First Name *
            </Text>
            <TextInput
              value={firstName}
              onChangeText={setFirstName}
              placeholder="Enter first name"
              style={{
                borderWidth: 1,
                borderColor: "#D1D5DB",
                borderRadius: 10,
                paddingVertical: 12,
                paddingHorizontal: 14,
                fontSize: 15,
                color: "#111827",
                marginBottom: 12,
              }}
            />

            {/* Middle Name Input */}
            <Text style={{ fontSize: 13, color: "#6B7280", marginBottom: 6 }}>
              Middle Name
            </Text>
            <TextInput
              value={middleName}
              onChangeText={setMiddleName}
              placeholder="Enter middle name (optional)"
              style={{
                borderWidth: 1,
                borderColor: "#D1D5DB",
                borderRadius: 10,
                paddingVertical: 12,
                paddingHorizontal: 14,
                fontSize: 15,
                color: "#111827",
                marginBottom: 12,
              }}
            />

            {/* Last Name Input */}
            <Text style={{ fontSize: 13, color: "#6B7280", marginBottom: 6 }}>
              Last Name *
            </Text>
            <TextInput
              value={lastName}
              onChangeText={setLastName}
              placeholder="Enter last name"
              style={{
                borderWidth: 1,
                borderColor: "#D1D5DB",
                borderRadius: 10,
                paddingVertical: 12,
                paddingHorizontal: 14,
                fontSize: 15,
                color: "#111827",
                marginBottom: 25,
              }}
            />

            <TouchableOpacity
              onPress={handleSave}
              disabled={loading}
              activeOpacity={0.8}
              style={{
                backgroundColor: loading ? "#9CA3AF" : "#545EE1",
                borderRadius: 30,
                paddingVertical: 14,
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
                    fontSize: 16,
                  }}
                >
                  Save
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </BlurView>
    </Modal>
  );
};

export default UpdateDisplayName;

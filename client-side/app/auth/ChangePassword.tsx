import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Dimensions,
  ScrollView,
} from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";

const ChangePassword = () => {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleChangePassword = () => {
    if (newPassword.length < 8) {
      alert("Password must be at least 8 characters long.");
      return;
    }
    if (newPassword !== confirmPassword) {
      alert("Passwords do not match.");
      return;
    }

    // Handle password update here (API call, etc.)
    alert("Password changed successfully!");
  };

  return (
    <ScrollView
      contentContainerStyle={{
        flexGrow: 1,
        backgroundColor: "#FFFFFF",
        paddingHorizontal: 30,
        paddingTop: "16%",
        paddingBottom: 100,
        gap: "50%",
      }}
      keyboardShouldPersistTaps="handled"
    >
      {/* Header */}
      <View>
        <Text
          style={{
            fontSize: 22,
            fontWeight: "700",
            color: "#111827",
            marginBottom: 8,
          }}
        >
          Change password
        </Text>
        <Text style={{ fontSize: 14, color: "#6B7280", marginBottom: 30 }}>
          Make sure the new password is correct and strong
        </Text>

        {/* New Password */}
        <View style={{ marginBottom: 24 }}>
          <Text
            style={{
              fontSize: 14,
              color: "#111827",
              fontWeight: "500",
              marginBottom: 8,
            }}
          >
            New password
          </Text>
          <View style={{ position: "relative" }}>
            <TextInput
              value={newPassword}
              onChangeText={setNewPassword}
              placeholder="Min. 8 characters"
              secureTextEntry={!showNew}
              style={{
                borderWidth: 1,
                borderColor: "#D1D5DB",
                borderRadius: 10,
                paddingVertical: 12,
                paddingHorizontal: 14,
                fontSize: 15,
                color: "#111827",
                backgroundColor: "#FFFFFF",
              }}
            />
            <TouchableOpacity
              onPress={() => setShowNew(!showNew)}
              style={{
                position: "absolute",
                right: 15,
                top: 0,
                bottom: 0,
                justifyContent: "center",
              }}
            >
              <MaterialIcons
                name={showNew ? "visibility" : "visibility-off"}
                size={22}
                color="#9CA3AF"
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Confirm Password */}
        <View>
          <Text
            style={{
              fontSize: 14,
              color: "#111827",
              fontWeight: "500",
              marginBottom: 8,
            }}
          >
            Confirm new password
          </Text>
          <View style={{ position: "relative" }}>
            <TextInput
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder="Repeat your password"
              secureTextEntry={!showConfirm}
              style={{
                borderWidth: 1,
                borderColor: "#D1D5DB",
                borderRadius: 10,
                paddingVertical: 12,
                paddingHorizontal: 14,
                fontSize: 15,
                color: "#111827",
                backgroundColor: "#FFFFFF",
              }}
            />
            <TouchableOpacity
              onPress={() => setShowConfirm(!showConfirm)}
              style={{
                position: "absolute",
                right: 15,
                top: 0,
                bottom: 0,
                justifyContent: "center",
              }}
            >
              <MaterialIcons
                name={showConfirm ? "visibility" : "visibility-off"}
                size={22}
                color="#9CA3AF"
              />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <TouchableOpacity
        onPress={handleChangePassword}
        activeOpacity={0.85}
        style={{
          backgroundColor: "#545EE1",
          borderRadius: 30,
          paddingVertical: 16,
          alignItems: "center",
          shadowColor: "#1e1a1aff",
          shadowOffset: { width: 0, height: 3 },
          shadowOpacity: 0.25,
          shadowRadius: 4,
          elevation: 5,
        }}
      >
        <Text
          style={{
            color: "#FFFFFF",
            fontWeight: "700",
            fontSize: 16,
          }}
        >
          Change password
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

export default ChangePassword;

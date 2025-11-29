import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import UpdateDisplayName from "./modals/UpdateDisplayName";
import UpdatePhoneNumber from "./modals/UpdatePhoneNumber";
import UpdateEmail from "./modals/UpdateEmail";
import { useAuthStore } from "@/app/api/store/auth_store";

interface SettingRowProps {
  label: string;
  value?: string;
  onPress: () => void;
}

const SettingRow: React.FC<SettingRowProps> = ({ label, value, onPress }) => (
  <TouchableOpacity
    onPress={onPress}
    activeOpacity={0.7}
    style={{
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      backgroundColor: "#FFFFFF",
      paddingVertical: 18,
      paddingHorizontal: 20,
      borderRadius: 16,
      marginBottom: 12,
      shadowColor: "#000",
      shadowOpacity: 0.06,
      shadowRadius: 6,
      shadowOffset: { width: 0, height: 2 },
      elevation: 2,
    }}
  >
    <Text style={{ fontSize: 16, color: "#333", fontWeight: "400" }}>
      {label}
    </Text>
    <View style={{ flexDirection: "row", alignItems: "center" }}>
      {value && (
        <Text style={{ fontSize: 14, color: "#888", marginRight: 8 }}>
          {value}
        </Text>
      )}
      <Ionicons name="chevron-forward" size={20} color="#545EE1" />
    </View>
  </TouchableOpacity>
);

const Settings = () => {
  const navigation = useNavigation();
  const { user } = useAuthStore();

  const [updateDisplayName, setUpdateDisplayName] = useState<boolean>(false);
  const [updatePhoneNumber, setUpdatePhoneNumber] = useState<boolean>(false);
  const [updateEmail, setUpdateEmail] = useState<boolean>(false);

  // Format phone number for display
  const formatPhone = (phone: string | undefined) => {
    if (!phone) return "Not set";
    if (phone.length > 6) {
      return "+63*****" + phone.slice(-2);
    }
    return phone;
  };

  // Mask email for privacy
  const maskEmail = (email: string | undefined) => {
    if (!email) return "Not set";
    const [name, domain] = email.split("@");
    if (name.length > 2) {
      return name.slice(0, 2) + "***o@" + domain;
    }
    return email;
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#F8F8F8" }}>
      {/* Modals */}
      <UpdatePhoneNumber
        visible={updatePhoneNumber}
        onClose={() => setUpdatePhoneNumber(false)}
        onChangePress={() => setUpdatePhoneNumber(false)}
        phoneNumber={user?.phone ?? ""}
      />
      <UpdateDisplayName
        visible={updateDisplayName}
        onClose={() => setUpdateDisplayName(false)}
        onSave={() => setUpdateDisplayName(false)}
      />
      <UpdateEmail
        visible={updateEmail}
        onClose={() => setUpdateEmail(false)}
        onSave={() => setUpdateEmail(false)}
      />

      {/* Header */}
      <View
        style={{
          paddingHorizontal: 20,
          paddingTop: Platform.OS === "android" ? 50 : 60,
          paddingBottom: 20,
          backgroundColor: "#F8F8F8",
        }}
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
          }}
        >
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={{
              width: 36,
              height: 36,
              borderRadius: 18,
              backgroundColor: "#EFEFEF",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <Ionicons name="chevron-back" size={22} color="#333" />
          </TouchableOpacity>
          <Text
            style={{
              flex: 1,
              textAlign: "center",
              fontSize: 20,
              fontWeight: "600",
              color: "#333",
              marginRight: 36,
            }}
          >
            Settings
          </Text>
        </View>
      </View>

      {/* Settings Content */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Name */}
        <SettingRow
          label="Name"
          value={user?.firstName || "Not set"}
          onPress={() => setUpdateDisplayName(true)}
        />

        {/* Phone Number */}
        <SettingRow
          label="Phone number"
          value={formatPhone(user?.phone)}
          onPress={() => setUpdatePhoneNumber(true)}
        />

        {/* Email */}
        <SettingRow
          label="Email"
          value={maskEmail(user?.email)}
          onPress={() => setUpdateEmail(true)}
        />

        {/* Date of Birth */}
        <SettingRow
          label="Date of birthh"
          value={user?.birthday || "Not set"}
          onPress={() => {}}
        />

        {/* Password */}
        <SettingRow
          label="Password"
          onPress={() => navigation.navigate("ChangePassword" as never)}
        />
      </ScrollView>
    </View>
  );
};

export default Settings;

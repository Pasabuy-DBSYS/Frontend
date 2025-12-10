import { UserResponseDTO } from "@/app/api/dto/response/auth.response.dto";
import { useAuthStore } from "@/app/api/store/auth_store";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import React, { useState } from "react";
import { View, Text, TouchableOpacity } from "react-native";
import ConfirmLogout from "./modals/ConfirmLogout";

type ProfileProp = {
  users: UserResponseDTO;
};

interface ProfileButtonItemProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  isLogout?: boolean;
}

const ProfileButtonItem: React.FC<ProfileButtonItemProps> = ({
  icon,
  label,
  onPress,
  isLogout = false,
}) => (
  <TouchableOpacity
    onPress={onPress}
    activeOpacity={0.7}
    style={{
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: "#FFFFFF",
      paddingVertical: 16,
      paddingHorizontal: 20,
      borderRadius: 16,
      marginBottom: 12,
      shadowColor: "#000",
      shadowOpacity: 0.08,
      shadowRadius: 8,
      shadowOffset: { width: 0, height: 2 },
      elevation: 3,
    }}
  >
    <View
      style={{
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: isLogout ? "#FEE2E2" : "#E8EBFF",
        justifyContent: "center",
        alignItems: "center",
        marginRight: 14,
      }}
    >
      <Ionicons
        name={icon}
        size={20}
        color={isLogout ? "#DC2626" : "#545EE1"}
      />
    </View>
    <Text
      style={{
        flex: 1,
        fontSize: 16,
        fontWeight: "500",
        color: isLogout ? "#DC2626" : "#333",
      }}
    >
      {label}
    </Text>
    <Ionicons
      name="chevron-forward"
      size={20}
      color={isLogout ? "#DC2626" : "#545EE1"}
    />
  </TouchableOpacity>
);

const ProfileButtons = ({ users }: ProfileProp) => {
  const navigation = useNavigation<any>();
  const [logoutModal, setLogoutModal] = useState<boolean>(false);

  const { logout, user } = useAuthStore();

  const handleLogout = async () => {
    try {
      await logout();
      navigation.reset({
        index: 0,
        routes: [{ name: "Welcome" as never }],
      });
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <ConfirmLogout
        visible={logoutModal}
        onCancel={() => setLogoutModal(false)}
        onConfirm={() => {
          setLogoutModal(false);
          handleLogout();
        }}
      />

      {/* Settings */}
      <ProfileButtonItem
        icon="settings-outline"
        label="Settings"
        onPress={() =>
          navigation.navigate("Settings" as never, {
            user: user,
          })
        }
      />

      {/* Logout */}
      <ProfileButtonItem
        icon="log-out-outline"
        label="Logout"
        onPress={() => setLogoutModal(true)}
        isLogout={true}
      />
    </View>
  );
};

export default ProfileButtons;

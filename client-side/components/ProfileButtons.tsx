import { UserResponseDTO } from "@/app/api/dto/response/auth.response.dto";
import { useAuthStore } from "@/app/api/store/auth_store";
import { Button } from "@/components/Button"; // adjust import path
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import React, { useState } from "react";
import { View } from "react-native";
import ConfirmLogout from "./modals/ConfirmLogout";
import NextArrowIcon from "./svg/NextArrowIcon";
import UpdateInsuranceIcon from "./svg/UpdateInsuranceIcon";

type ProfileProp = {
  users: UserResponseDTO;
};

const ProfileButtons = ({ users }: ProfileProp) => {
  const navigation = useNavigation<any>();
  const [logoutModal, setLogoutModal] = useState<boolean>(false);

  const { logout, user } = useAuthStore();

  return (
    <View style={{ marginTop: 40, gap: 30 }}>
      {/* 1. Update Insurance */}
      <View
        style={{
          position: "relative",
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.25,
          shadowRadius: 4.65,
          elevation: 8,
        }}
      >
        <UpdateInsuranceIcon
          style={{
            position: "absolute",
            left: 25,
            top: "50%",
            transform: [{ translateY: -11 }],
            zIndex: 2,
          }}
        />
        <NextArrowIcon
          style={{
            position: "absolute",
            right: "3%",
            top: "55%",
            transform: [{ translateY: -11 }],
            zIndex: 2,
          }}
        />
        <Button
          title="Update Insurance"
          onPress={() =>
            navigation.navigate("InsuranceVerification" as never, {
              title: "Update Insurance",
            })
          }
          backgroundColor="#FFFFFF"
          textColor="#000"
          borderColor="#fff"
          borderWidth={1}
          borderRadius={20}
          fontSize={16}
          fontWeight="500"
          padding={15}
          showArrow={true}
          width="100%"
        />
      </View>

      {/* 2. Term and Conditions */}
      <View
        style={{
          position: "relative",
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.25,
          shadowRadius: 4.65,
          elevation: 8,
        }}
      >
        <Ionicons
          name="document-text-outline"
          size={22}
          color="#545EE1"
          style={{
            position: "absolute",
            left: 25,
            top: "50%",
            transform: [{ translateY: -11 }],
            zIndex: 2,
          }}
        />
        <Button
          title="Term and Conditions"
          onPress={() => console.log("Term and Conditions pressed")}
          backgroundColor="#FFFFFF"
          textColor="#000"
          borderColor="#fff"
          borderWidth={1}
          borderRadius={20}
          fontSize={16}
          fontWeight="500"
          padding={15}
          showArrow={true}
          width="100%"
        />
        <NextArrowIcon
          style={{
            position: "absolute",
            right: "3%",
            top: "55%",
            transform: [{ translateY: -11 }],
            zIndex: 2,
          }}
        />
      </View>

      {/* 3. Settings */}
      <View
        style={{
          position: "relative",
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.25,
          shadowRadius: 4.65,
          elevation: 8,
        }}
      >
        <Ionicons
          name="settings-outline"
          size={22}
          color="#545EE1"
          style={{
            position: "absolute",
            left: 25,
            top: "50%",
            transform: [{ translateY: -11 }],
            zIndex: 2,
          }}
        />
        <Button
          title="Settings"
          onPress={() =>
            navigation.navigate("Settings" as never, {
              user: user,
            })
          }
          backgroundColor="#FFFFFF"
          textColor="#000"
          borderColor="#fff"
          borderWidth={1}
          borderRadius={20}
          fontSize={16}
          fontWeight="500"
          padding={15}
          showArrow={true}
          width="100%"
        />
        <NextArrowIcon
          style={{
            position: "absolute",
            right: "3%",
            top: "55%",
            transform: [{ translateY: -11 }],
            zIndex: 2,
          }}
        />
      </View>

      {/* 4. Logout */}
      <View
        style={{
          position: "relative",
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.25,
          shadowRadius: 4.65,
          elevation: 8,
        }}
      >
        <ConfirmLogout
          visible={logoutModal}
          onCancel={() => {
            setLogoutModal(false);
          }}
          onConfirm={async () => {
            setLogoutModal(false);
            await logout();
            navigation.reset({
              index: 0,
              routes: [{ name: "Welcome" as never }],
            });
          }}
        />
        <Ionicons
          name="arrow-undo-outline"
          size={22}
          color="#545EE1"
          style={{
            position: "absolute",
            left: 25,
            top: "50%",
            transform: [{ translateY: -11 }],
            zIndex: 2,
          }}
        />
        <Button
          title="Logout"
          onPress={() => setLogoutModal(true)}
          backgroundColor="#FFFFFF"
          textColor="#000"
          borderColor="#fff"
          borderWidth={1}
          borderRadius={20}
          fontSize={16}
          fontWeight="500"
          padding={15}
          showArrow={true}
          width="100%"
        />
        <NextArrowIcon
          style={{
            position: "absolute",
            right: "3%",
            top: "55%",
            transform: [{ translateY: -11 }],
            zIndex: 2,
          }}
        />
      </View>
    </View>
  );
};

export default ProfileButtons;

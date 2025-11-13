import React, { useState } from "react";
import { View, Text, TouchableOpacity, ScrollView, Modal } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import UpdateDisplayName from "./modals/UpdateDisplayName";
import UpdatePhoneNumber from "./modals/UpdatePhoneNumber";
import UpdateEmail from "./modals/UpdateEmail";
import AuthLeftButton from "./svg/AuthLeftButton";
import { useAuthStore } from "@/app/api/store/auth_store";
import { UserResponseDTO } from "@/app/api/dto/response/auth.response.dto";

const Settings = () => {
  const navigation = useNavigation();
  const route = useRoute<any>();
  const { user } = useAuthStore();

  const settings = [
    { label: "Name", value: user?.firstName },
    { label: "Phone number", value: user?.phone },
    { label: "Email", value: "ch***o@gmail.com" },
    { label: "Date of birth", value: user?.birthday },
    { label: "Password", value: "" },
  ];
  const [updateDisplayName, setUpdateDisplayName] = useState<boolean>(false);
  const [updatePhoneNumber, setUpdatePhoneNumber] = useState<boolean>(false);
  const [updateEmail, setUpdateEmail] = useState<boolean>(false);

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: "#fff",
        paddingHorizontal: 20,
        paddingTop: 50,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
      }}
    >
      <UpdatePhoneNumber
        visible={updatePhoneNumber}
        onClose={() => setUpdatePhoneNumber(false)}
        onChangePress={() => setUpdatePhoneNumber(false)}
        phoneNumber={user?.phone ?? ""}
      ></UpdatePhoneNumber>
      <UpdateDisplayName
        visible={updateDisplayName}
        onClose={() => setUpdateDisplayName(false)}
        onSave={() => setUpdateDisplayName(false)}
      ></UpdateDisplayName>
      <UpdateEmail
        visible={updateEmail}
        onClose={() => setUpdateEmail(false)}
        onSave={() => setUpdateEmail(false)}
      ></UpdateEmail>
      {/* Header */}
      <AuthLeftButton onPress={() => navigation.goBack()} />
      <View
        style={{
          alignItems: "center",
          marginBottom: 40,
        }}
      >
        <Text style={{ fontSize: 22, fontWeight: "bold", color: "#000" }}>
          Settings
        </Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40, gap: 25 }}
      >
        {settings.map((item, index) => (
          <View
            key={index}
            style={{
              position: "relative",
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.25,
              shadowRadius: 4.65,
              elevation: 8,
            }}
          >
            <TouchableOpacity
              style={{
                backgroundColor: "#FFFFFF",
                borderRadius: 15,
                paddingVertical: 18,
                paddingHorizontal: 20,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
              }}
              onPress={() => {
                switch (index) {
                  case 0:
                    setUpdateDisplayName(true);
                    break;
                  case 1:
                    setUpdatePhoneNumber(true);
                    break;
                  case 2:
                    setUpdateEmail(true);
                    break;
                  case 4:
                    navigation.navigate("ChangePassword" as never);
                }
              }}
            >
              {/* Left Label */}
              <Text
                style={{
                  fontSize: 15,
                  color: "#000",
                  fontWeight: "500",
                }}
              >
                {item.label}
              </Text>
              {/* Right Value + Arrow */}
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 5,
                }}
              >
                {item.value ? (
                  <Text
                    style={{
                      fontSize: 15,
                      color: "rgba(0,0,0,0.5)",
                    }}
                  >
                    {item.value}
                  </Text>
                ) : null}
                <Ionicons
                  name="chevron-forward-outline"
                  size={18}
                  color="#545EE1"
                />
              </View>
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>
    </View>
  );
};

export default Settings;

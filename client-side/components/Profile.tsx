import React, { useState } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import ProfileButtons from "@/components/ProfileButtons";
import { useAuthStore } from "@/app/api/store/auth_store";
import { UserResponseDTO } from "@/app/api/dto/response/auth.response.dto";
import ProfilePhotoModal from "./modals/ChangeProfile";

const Profile = () => {
  const { user } = useAuthStore();

  const [isChangeProfile, setIsChangeProfile] = useState(false);
  const [globalLoading, setGlobalLoading] = useState(false);

  return (
    <LinearGradient
      colors={["#545EE1", "#FFFFFF"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      style={{
        flex: 1,
        paddingHorizontal: 20,
        paddingTop: "10%",
      }}
    >
      <ProfilePhotoModal
        visible={isChangeProfile}
        onClose={() => setIsChangeProfile(false)}
        setGlobalLoading={setGlobalLoading}
      />

      <TouchableOpacity
        style={{
          position: "absolute",
          top: 55,
          left: 20,
          zIndex: 10,
        }}
      >
        <Ionicons name="chevron-back" size={28} color="#fff" />
      </TouchableOpacity>

      <View style={{ alignItems: "center", marginTop: 60 }}>
        <Text style={{ color: "#FFFFFF", fontWeight: "bold", fontSize: 20 }}>
          PROFILE
        </Text>
      </View>

      <View style={{ alignItems: "center", marginTop: 30 }}>
        <TouchableOpacity onPress={() => setIsChangeProfile(true)}>
          <Image
            source={{
              uri: `https://pasabuyres.s3.ap-southeast-2.amazonaws.com/${user?.profilePictureKey}`,
            }}
            style={{
              width: 100,
              height: 100,
              borderRadius: 50,
              marginBottom: 15,
              backgroundColor: "#eee",
            }}
          />
        </TouchableOpacity>

        <Text style={{ fontSize: 20, fontWeight: "bold", color: "#000" }}>
          {user?.firstName} {user?.lastName}
        </Text>

        <Text style={{ fontSize: 14, color: "#444", marginTop: 3 }}>
          {user?.email}
        </Text>

        <Text style={{ fontSize: 14, color: "#444", marginTop: 2 }}>
          +63{user?.phone.substring(1, user.phone.length - 1)}
        </Text>
      </View>

      <ProfileButtons users={user as UserResponseDTO} />

      {/* Global Loading Overlay */}
      {globalLoading && (
        <View
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0,0,0,0.45)",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 9999,
          }}
        >
          <View
            style={{
              width: 220,
              paddingVertical: 25,
              paddingHorizontal: 15,
              borderRadius: 14,
              backgroundColor: "#fff",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <Text
              style={{
                fontSize: 16,
                fontWeight: "600",
                color: "#333",
                marginBottom: 12,
              }}
            >
              Updating your profile...
            </Text>
            <ActivityIndicator size="large" color="#545EE1" />
          </View>
        </View>
      )}
    </LinearGradient>
  );
};

export default Profile;

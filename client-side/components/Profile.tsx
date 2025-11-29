import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import ProfileButtons from "@/components/ProfileButtons";
import { useAuthStore } from "@/app/api/store/auth_store";
import { UserResponseDTO } from "@/app/api/dto/response/auth.response.dto";
import ProfilePhotoModal from "./modals/ChangeProfile";
import CachedImage from "./CachedImage";
import { useNavigation } from "@react-navigation/native";

const Profile = () => {
  const navigation = useNavigation();
  const { user } = useAuthStore();

  const [isChangeProfile, setIsChangeProfile] = useState(false);
  const [globalLoading, setGlobalLoading] = useState(false);

  return (
    <LinearGradient
      colors={["#545EE1", "#A8B0FF"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      style={{
        flex: 1,
      }}
    >
      <ProfilePhotoModal
        visible={isChangeProfile}
        onClose={() => setIsChangeProfile(false)}
        setGlobalLoading={setGlobalLoading}
      />

      {/* Header with Back Button */}
      <View
        style={{
          paddingHorizontal: 20,
          paddingTop: Platform.OS === "android" ? 50 : 60,
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
            backgroundColor: "rgba(255,255,255,0.2)",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <Ionicons name="chevron-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text
          style={{
            flex: 1,
            textAlign: "center",
            color: "#FFFFFF",
            fontWeight: "bold",
            fontSize: 20,
            marginRight: 36,
          }}
        >
          PROFILE
        </Text>
      </View>

      {/* Profile Picture and Info */}
      <View style={{ alignItems: "center", marginTop: 30 }}>
        <TouchableOpacity
          onPress={() => setIsChangeProfile(true)}
          style={{
            position: "relative",
          }}
        >
          <View
            style={{
              width: 120,
              height: 120,
              borderRadius: 60,
              backgroundColor: "#E8D4F0",
              justifyContent: "center",
              alignItems: "center",
              borderWidth: 4,
              borderColor: "rgba(255,255,255,0.5)",
            }}
          >
            <CachedImage
              s3Key={user?.profilePictureKey ?? ""}
              style={{
                width: 112,
                height: 112,
                borderRadius: 56,
                backgroundColor: "#E8D4F0",
              }}
              disableModal={true}
            />
          </View>
          {/* Camera Icon */}
          <View
            style={{
              position: "absolute",
              bottom: 0,
              right: 0,
              width: 32,
              height: 32,
              borderRadius: 16,
              backgroundColor: "#545EE1",
              justifyContent: "center",
              alignItems: "center",
              borderWidth: 2,
              borderColor: "#fff",
            }}
          >
            <Ionicons name="camera" size={16} color="#fff" />
          </View>
        </TouchableOpacity>

        <Text
          style={{
            fontSize: 22,
            fontWeight: "bold",
            color: "#FFFFFF",
            marginTop: 16,
          }}
        >
          {user?.firstName} {user?.lastName}
        </Text>

        <Text
          style={{
            fontSize: 14,
            color: "rgba(255,255,255,0.9)",
            marginTop: 4,
          }}
        >
          {user?.email}
        </Text>

        <Text
          style={{
            fontSize: 14,
            color: "rgba(255,255,255,0.9)",
            marginTop: 2,
          }}
        >
          +63 {user?.phone?.substring(1)}
        </Text>
      </View>

      {/* Profile Buttons Container */}
      <View
        style={{
          flex: 1,
          backgroundColor: "#F5F5F5",
          marginTop: 30,
          borderTopLeftRadius: 30,
          borderTopRightRadius: 30,
          paddingTop: 30,
          paddingHorizontal: 20,
        }}
      >
        <ProfileButtons users={user as UserResponseDTO} />
      </View>

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

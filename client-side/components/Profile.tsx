import React from "react";
import { View, Text, Image, TouchableOpacity } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { Button } from "@/components/Button"; // adjust path as needed
import ProfileButtons from "@/components/ProfileButtons";
import { useAuthStore } from "@/app/api/store/auth_store";
import { UserResponseDTO } from "@/app/api/dto/response/auth.response.dto";

const Profile = () => {
  const { user } = useAuthStore();

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
      {/* Back Button */}
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

      {/* Header */}
      <View style={{ alignItems: "center", marginTop: 60 }}>
        <Text style={{ color: "#FFFFFF", fontWeight: "bold", fontSize: 20 }}>
          PROFILE
        </Text>
      </View>

      {/* Profile Info */}
      <View style={{ alignItems: "center", marginTop: 30 }}>
        <Image
          source={{
            uri: `https://static0.gamerantimages.com/wordpress/wp-content/uploads/2025/08/naruto-new-anime-2025-announcement.jpg?w=1600&h=1200&fit=crop`,
          }}
          style={{
            width: 100,
            height: 100,
            borderRadius: 50,
            marginBottom: 15,
            backgroundColor: "#eee",
          }}
        />
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
      <ProfileButtons user={user as UserResponseDTO} />
    </LinearGradient>
  );
};

export default Profile;

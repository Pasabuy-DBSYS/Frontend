import React from "react";
import { View, Text, Image, TouchableOpacity } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { Button } from "@/components/Button"; // adjust path as needed
import ProfileButtons from "@/components/ProfileButtons";
import { user } from "@/constants/user";

const Profile = () => {
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
            uri: `${user.imageUrl}`,
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
          {user.firstName} {user.lastName}
        </Text>
        <Text style={{ fontSize: 14, color: "#444", marginTop: 3 }}>
          {user.emailAddress}
        </Text>
        <Text style={{ fontSize: 14, color: "#444", marginTop: 2 }}>
          +61 999 9999 9999
        </Text>
      </View>
      <ProfileButtons user={user} />
    </LinearGradient>
  );
};

export default Profile;

import React from "react";
import { View, Text, Image, TouchableOpacity } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons, Feather } from "@expo/vector-icons";

export type Participant = {
  id: number;
  name: string;
  avatarUrl?: string;
};

type Props = {
  participant?: Participant | null;
  onBack?: () => void;
  onCall?: (participantId: string) => void;
  onMore?: (participantId: string) => void;
};

export default function ParticipantHeader({
  participant,
  onBack,
  onCall,
  onMore,
}: Props) {
  if (!participant) return null;

  const initials = participant.name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <View
      style={{
        height: 82,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingTop: "9%",
      }}
    >
      <TouchableOpacity
        onPress={onBack}
        hitSlop={12}
        style={{
          marginRight: 20,
        }}
      >
        <Ionicons name="chevron-back" size={26} color="#FFFFFF" />
      </TouchableOpacity>

      <View
        style={{
          flex: 1,
          flexDirection: "row",
          alignItems: "center",
          columnGap: 10,
          marginLeft: 6,
        }}
      >
        {participant.avatarUrl ? (
          <Image
            source={{
              uri: `https://pasabuyres.s3.ap-southeast-2.amazonaws.com/${participant.avatarUrl}`,
            }}
            style={{ width: 44, height: 44, borderRadius: 22 }}
          />
        ) : (
          <View
            style={{
              width: 44,
              height: 44,
              borderRadius: 22,
              backgroundColor: "#C6D4FF",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Text style={{ color: "#3C43B0", fontWeight: "700", fontSize: 16 }}>
              {initials}
            </Text>
          </View>
        )}
        <Text style={{ color: "#FFFFFF", fontSize: 20, fontWeight: "700" }}>
          {participant.name}
        </Text>
      </View>

      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          columnGap: 8,
        }}
      >
        <TouchableOpacity hitSlop={12} style={{ padding: 6 }}>
          <Feather name="phone-call" size={22} color="#FFFFFF" />
        </TouchableOpacity>

        <TouchableOpacity hitSlop={12} style={{ padding: 6 }}>
          <Feather name="more-vertical" size={22} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

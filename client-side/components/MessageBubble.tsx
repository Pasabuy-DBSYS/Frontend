import React from "react";
import { Image, Text, View } from "react-native";

type MessageBubbleProps = {
  text: string;
  avatarUrl?: string;
  initials?: string;
  isMe: boolean;
};

export default function MessageBubble({
  text,
  avatarUrl,
  initials = "TP",
  isMe,
}: MessageBubbleProps) {
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "flex-start",
        justifyContent: isMe ? "flex-end" : "flex-start",
        paddingHorizontal: 8,
        marginBottom: 12,
      }}
    >
      {!isMe && avatarUrl && (
        <Image
          source={{ uri: avatarUrl }}
          style={{ width: 40, height: 40, borderRadius: 20, marginRight: 10 }}
        />
      )}

      <View
        style={{
          maxWidth: "75%",
          borderWidth: 1,
          borderColor: "#1F1F1F",
          borderRadius: 18,
          paddingVertical: 10,
          paddingHorizontal: 14,
          backgroundColor: "#FFFFFF",
          flexShrink: 1,
          marginLeft: isMe ? 40 : 0,
        }}
      >
        <Text style={{ color: "#111111", fontSize: 14, lineHeight: 20 }}>
          {text}
        </Text>
      </View>
    </View>
  );
}

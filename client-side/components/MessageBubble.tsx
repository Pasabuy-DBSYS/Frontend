import { MessageTypes } from "@/app/api/dto/response/chat.response.dto";
import React from "react";
import { Image, Text, View } from "react-native";
import CachedImage from "./CachedImage";

type MessageBubbleProps = {
  text?: string; // for TEXT messages
  imageUrl?: string; // for IMAGE messages (signed URL)
  isMe: boolean;
  avatarUrl?: string;
  initials?: string;
  messageType: MessageTypes;
};

export default function MessageBubble({
  text,
  avatarUrl,
  initials = "TP",
  imageUrl,
  isMe,
  messageType,
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
        <CachedImage
          s3Key={avatarUrl}
          style={{ width: 40, height: 40, borderRadius: 20, marginRight: 10 }}
        />
      )}

      {messageType === MessageTypes.IMAGE ? (
        <View
          style={{
            maxWidth: "75%",
            paddingVertical: 10,
            paddingHorizontal: 5,
            marginLeft: isMe ? 40 : 0,
          }}
        >
          <CachedImage
            s3Key={text ?? ""}
            style={{
              width: 240,
              height: 240,
              borderRadius: 12,
            }}
          />
        </View>
      ) : (
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
          <Text style={{ color: "#111", fontSize: 14, lineHeight: 20 }}>
            {text}
          </Text>
        </View>
      )}
    </View>
  );
}

import React from "react";
import { View, TextInput, TouchableOpacity } from "react-native";
import { Feather, Ionicons } from "@expo/vector-icons";

type ComposerProps = {
  value: string;
  onChangeText: (text: string) => void;
  onSend: () => void;
  onPickMedia?: () => void;
};

export default function Composer({
  value,
  onChangeText,
  onSend,
  onPickMedia,
}: ComposerProps) {
  const disabled = value.trim().length === 0;

  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        columnGap: 10,
        paddingHorizontal: 16,
        paddingVertical: 12,
      }}
    >
      <TouchableOpacity
        onPress={onPickMedia}
        style={{
          width: 48,
          height: 48,
          borderRadius: 24,
          backgroundColor: "#FFFFFF",
          justifyContent: "center",
          alignItems: "center",
          borderWidth: 1,
          borderColor: "#E2E2E2",
        }}
      >
        <Feather name="camera" size={22} color="#5C5CE6" />
      </TouchableOpacity>

      <View
        style={{
          flex: 1,
          flexDirection: "row",
          alignItems: "center",
          backgroundColor: "#FFFFFF",
          borderRadius: 26,
          borderWidth: 1,
          borderColor: "#E2E2E2",
          paddingHorizontal: 16,
          paddingVertical: 6,
        }}
      >
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder="Type message here..."
          placeholderTextColor="#7A7A7A"
          style={{ flex: 1, fontSize: 16, color: "#1C1C1C" }}
          multiline
        />
        <TouchableOpacity
          onPress={onSend}
          disabled={disabled}
          style={{
            width: 44,
            height: 44,
            borderRadius: 22,
            backgroundColor: disabled ? "#B9BCEF" : "#545EE1",
            justifyContent: "center",
            alignItems: "center",
            marginLeft: 8,
          }}
        >
          <Ionicons name="paper-plane" size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

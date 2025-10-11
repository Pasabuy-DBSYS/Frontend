import React, { useState } from "react";
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Dimensions,
} from "react-native";
import { BlurView } from "expo-blur";

const { width } = Dimensions.get("window");

interface EditNameModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (name: string) => void;
  currentName?: string;
}

const UpdateDisplayName: React.FC<EditNameModalProps> = ({
  visible,
  onClose,
  onSave,
  currentName = "",
}) => {
  const [name, setName] = useState(currentName);

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={onClose}
    >
      {/* Blurred background */}
      <BlurView intensity={60} tint="dark" style={{ flex: 1 }}>
        <View
          style={{
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
            backgroundColor: "rgba(0,0,0,0.3)",
          }}
        >
          {/* Modal card */}
          <View
            style={{
              width: width * 0.85,
              backgroundColor: "#FFFFFF",
              borderRadius: 20,
              paddingVertical: 28,
              paddingHorizontal: 22,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.15,
              shadowRadius: 8,
              elevation: 8,
            }}
          >
            {/* Header */}
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 12,
              }}
            >
              <Text
                style={{
                  fontSize: 18,
                  fontWeight: "700",
                  color: "#111827",
                }}
              >
                Name
              </Text>

              <TouchableOpacity
                onPress={onClose}
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 14,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Text style={{ fontSize: 20, color: "#545EE1" }}>×</Text>
              </TouchableOpacity>
            </View>

            {/* Subtitle */}
            <Text
              style={{
                fontSize: 13,
                color: "#6B7280",
                marginBottom: 20,
              }}
            >
              Your name can only be changed once every 7 days
            </Text>

            {/* Input */}
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="Enter your name"
              style={{
                borderWidth: 1,
                borderColor: "#D1D5DB",
                borderRadius: 10,
                paddingVertical: 12,
                paddingHorizontal: 14,
                fontSize: 15,
                color: "#111827",
                marginBottom: 35,
              }}
            />

            <TouchableOpacity
              onPress={() => {
                setName("");
                onSave(name);
              }}
              activeOpacity={0.8}
              style={{
                backgroundColor: "#545EE1",
                borderRadius: 30,
                paddingVertical: 14,
                alignItems: "center",
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.25,
                shadowRadius: 4,
                elevation: 5,
              }}
            >
              <Text
                style={{
                  color: "#FFFFFF",
                  fontWeight: "700",
                  fontSize: 16,
                }}
              >
                Save
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </BlurView>
    </Modal>
  );
};

export default UpdateDisplayName;

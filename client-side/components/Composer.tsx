import React, { useState } from "react";
import {
  View,
  TextInput,
  TouchableOpacity,
  Modal,
  Text,
  Pressable,
} from "react-native";
import { Feather, Ionicons } from "@expo/vector-icons";
import ReceiptUploadModal from "./modals/ReceiptUpload";

type ComposerProps = {
  value: string;
  onChangeText: (text: string) => void;
  onSend: () => void;
  onPickCamera?: () => void;
  onUploadReceipt?: (
    image: { uri: string; name: string; type: string },
    amount: number
  ) => void;
  offeredAmount?: number;
};

export default function Composer({
  value,
  onChangeText,
  onSend,
  onPickCamera,
  onUploadReceipt,
  offeredAmount = 0,
}: ComposerProps) {
  const [showMediaMenu, setShowMediaMenu] = useState(false);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const disabled = value.trim().length === 0;

  const handleCamera = () => {
    setShowMediaMenu(false);
    setTimeout(() => {
      onPickCamera?.();
    }, 100);
  };

  const handleAttachReceipt = () => {
    setShowMediaMenu(false);
    setTimeout(() => {
      setShowReceiptModal(true);
    }, 100);
  };

  const handleReceiptConfirm = (
    image: { uri: string; name: string; type: string },
    amount: number
  ) => {
    setShowReceiptModal(false);
    onUploadReceipt?.(image, amount);
  };

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
      {/* Receipt Upload Modal */}
      <ReceiptUploadModal
        visible={showReceiptModal}
        offeredAmount={offeredAmount}
        onConfirm={handleReceiptConfirm}
        onCancel={() => setShowReceiptModal(false)}
      />

      {/* Plus Button */}
      <TouchableOpacity
        onPress={() => setShowMediaMenu(true)}
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
        <Ionicons name="add" size={26} color="#5C5CE6" />
      </TouchableOpacity>

      {/* Media Menu Modal */}
      <Modal
        visible={showMediaMenu}
        transparent={true}
        animationType="none"
        onRequestClose={() => setShowMediaMenu(false)}
      >
        <Pressable
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.3)",
            justifyContent: "flex-end",
          }}
          onPress={() => setShowMediaMenu(false)}
        >
          <Pressable
            style={{
              backgroundColor: "#fff",
              borderTopLeftRadius: 20,
              borderTopRightRadius: 20,
              paddingVertical: 20,
              paddingHorizontal: 24,
              paddingBottom: 40,
            }}
            onPress={(e) => e.stopPropagation()}
          >
            {/* Camera Option */}
            <TouchableOpacity
              onPress={handleCamera}
              style={{
                flexDirection: "row",
                alignItems: "center",
                paddingVertical: 16,
                borderBottomWidth: 1,
                borderBottomColor: "#f0f0f0",
              }}
            >
              <View
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 22,
                  backgroundColor: "#545EE1",
                  justifyContent: "center",
                  alignItems: "center",
                  marginRight: 16,
                }}
              >
                <Feather name="camera" size={22} color="#fff" />
              </View>
              <Text style={{ fontSize: 16, color: "#1C1C1C" }}>Camera</Text>
            </TouchableOpacity>

            {/* Attach/Upload Photo Option */}
            <TouchableOpacity
              onPress={handleAttachReceipt}
              style={{
                flexDirection: "row",
                alignItems: "center",
                paddingVertical: 16,
              }}
            >
              <View
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 22,
                  backgroundColor: "#545EE1",
                  justifyContent: "center",
                  alignItems: "center",
                  marginRight: 16,
                }}
              >
                <Ionicons name="receipt-outline" size={22} color="#fff" />
              </View>
              <Text style={{ fontSize: 16, color: "#1C1C1C" }}>
                Attach Receipt
              </Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>

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

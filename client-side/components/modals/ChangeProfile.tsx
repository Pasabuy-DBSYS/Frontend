// ProfilePhotoModal.tsx

import React, { useState } from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from "react-native";
import { BlurView } from "expo-blur";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useAuthStore } from "@/app/api/store/auth_store";
import { RNFile } from "@/app/api/dto/request/auth.request.dto";
import { changeProfile } from "@/app/api/user";

type Props = {
  visible: boolean;
  onClose: () => void;
  setGlobalLoading: (value: boolean) => void; // note: new prop
};

export default function ProfilePhotoModal({
  visible,
  onClose,
  setGlobalLoading,
}: Props) {
  const { user, refreshUser } = useAuthStore();
  const [previewUri, setPreviewUri] = useState<string | null>(null);
  const [photoRequest, setPhotoRequest] = useState<RNFile | null>(null);

  // Pick from library
  const openLibrary = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.9,
    });

    if (result.canceled) return;

    const asset = result.assets[0];
    setPreviewUri(asset.uri);
    setPhotoRequest({
      uri: asset.uri,
      name: asset.fileName ?? "picked-image.jpg",
      type: "image/jpeg",
    });
  };

  // Capture with camera
  const openCamera = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") return;

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: false,
      quality: 0.9,
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
    });

    if (result.canceled) return;

    const asset = result.assets[0];
    setPreviewUri(asset.uri);
    setPhotoRequest({
      uri: asset.uri,
      name: asset.fileName ?? "captured.jpg",
      type: "image/jpeg",
    });
  };

  const handleSaveProfile = async () => {
    if (!photoRequest) return;

    // Step 1: close modal immediately
    onClose();

    // Step 2: show global loading overlay
    setGlobalLoading(true);

    try {
      await changeProfile(photoRequest);
      await refreshUser();
    } finally {
      // Step 3: hide loading after 1s
      setTimeout(() => {
        setGlobalLoading(false);
      }, 1000);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <BlurView
        intensity={25}
        tint="dark"
        style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
      >
        <View
          style={{
            width: "80%",
            backgroundColor: "#FFFFFF",
            borderRadius: 20,
            paddingVertical: 30,
            paddingHorizontal: 20,
            alignItems: "center",
          }}
        >
          <TouchableOpacity
            onPress={onClose}
            style={{ position: "absolute", top: 15, right: 15 }}
          >
            <Ionicons name="close" size={22} color="#666" />
          </TouchableOpacity>

          <View
            style={{
              width: 100,
              height: 100,
              borderRadius: 50,
              backgroundColor: "#EEE",
              justifyContent: "center",
              alignItems: "center",
              marginBottom: 25,
            }}
          >
            <Image
              source={{
                uri:
                  previewUri ??
                  `https://pasabuyres.s3.ap-southeast-2.amazonaws.com/${user?.profilePictureKey}`,
              }}
              style={{ width: 70, height: 70, borderRadius: 35 }}
            />
          </View>

          <TouchableOpacity
            onPress={openLibrary}
            style={{
              flexDirection: "row",
              alignItems: "center",
              width: "100%",
              paddingVertical: 12,
            }}
          >
            <Ionicons name="image-outline" size={22} color="#444" />
            <Text style={{ marginLeft: 12, fontSize: 16, color: "#444" }}>
              Choose from library
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={openCamera}
            style={{
              flexDirection: "row",
              alignItems: "center",
              width: "100%",
              paddingVertical: 12,
            }}
          >
            <Ionicons name="camera-outline" size={22} color="#444" />
            <Text style={{ marginLeft: 12, fontSize: 16, color: "#444" }}>
              Take photo
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleSaveProfile}
            style={{
              marginTop: 25,
              width: "100%",
              paddingVertical: 14,
              backgroundColor: "#545EE1",
              borderRadius: 12,
              alignItems: "center",
            }}
          >
            <Text style={{ color: "#FFF", fontSize: 16, fontWeight: "600" }}>
              Save
            </Text>
          </TouchableOpacity>
        </View>
      </BlurView>
    </Modal>
  );
}

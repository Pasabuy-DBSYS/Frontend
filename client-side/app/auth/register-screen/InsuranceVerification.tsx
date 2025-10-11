import AuthLeftButton from "@/components/svg/AuthLeftButton";
import { View, Text, TouchableOpacity, Alert, Dimensions } from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import Camera from "@/components/svg/Camera";
import { Button } from "@/components/Button";
import * as ImagePicker from "expo-image-picker";
import { useState } from "react";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

const InsuranceVerification = () => {
  const navigation = useNavigation();
  const [insurancePhoto, setInsurancePhoto] = useState<string | null>(null);
  const route = useRoute<any>();
  const { title } = route.params;

  const getFileName = (uri: string) => uri.split("/").pop() || "image.jpg";

  const openCamera = async (type: "insurance") => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission Denied", "Camera access is required.");
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      allowsEditing: true,
      quality: 1,
    });

    if (!result.canceled && type === "insurance")
      setInsurancePhoto(result.assets[0].uri);
  };

  const pickFromGallery = async (type: "insurance") => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission Denied", "Gallery access is required.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled && type === "insurance")
      setInsurancePhoto(result.assets[0].uri);
  };

  const showImageOptions = (type: "insurance") => {
    Alert.alert("Upload Photo", "Choose an option", [
      { text: "Take Photo", onPress: () => openCamera(type) },
      { text: "Choose from Gallery", onPress: () => pickFromGallery(type) },
      { text: "Cancel", style: "cancel" },
    ]);
  };

  const renderUploadBox = (
    photo: string | null,
    type: "insurance",
    title: string,
    description: string
  ) => (
    <View
      style={{
        borderWidth: 2,
        borderStyle: "dashed",
        borderColor: photo ? "#545EE1" : "#D1D5DB",
        borderRadius: 12,
        padding: SCREEN_WIDTH * 0.08,
        marginBottom: SCREEN_HEIGHT * 0.025,
        alignItems: "center",
        backgroundColor: photo ? "#F5F7FF" : "#FFFFFF",
        minHeight: SCREEN_HEIGHT * 0.18,
        justifyContent: "center",
      }}
    >
      {photo ? (
        <TouchableOpacity
          onPress={() => showImageOptions(type)}
          style={{ width: "100%", alignItems: "center" }}
        >
          <View
            style={{
              padding: 16,
              borderRadius: 8,
              width: "100%",
              alignItems: "flex-start",
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.1,
              shadowRadius: 2,
              elevation: 2,
            }}
          >
            <Text
              style={{
                fontSize: 12,
                color: "#9CA3AF",
                fontWeight: "500",
                marginBottom: 4,
              }}
            >
              File name:
            </Text>
            <Text
              style={{ fontSize: 14, color: "#1F2937", fontWeight: "600" }}
              numberOfLines={1}
              ellipsizeMode="middle"
            >
              {getFileName(photo)}
            </Text>
          </View>
          <Text
            style={{
              marginTop: 12,
              fontSize: 13,
              color: "#545EE1",
              fontWeight: "600",
            }}
          >
            Tap to change photo
          </Text>
        </TouchableOpacity>
      ) : (
        <>
          <Text
            style={{
              textAlign: "center",
              fontSize: SCREEN_WIDTH * 0.038,
              color: "#1F2937",
              marginBottom: SCREEN_HEIGHT * 0.025,
              lineHeight: SCREEN_WIDTH * 0.05,
              paddingHorizontal: SCREEN_WIDTH * 0.02,
            }}
          >
            {title}
            {"\n"}
            {description}
          </Text>

          <TouchableOpacity
            onPress={() => showImageOptions(type)}
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 8,
              backgroundColor: "#FFFFFF",
              borderWidth: 1.5,
              borderColor: "#545EE1",
              borderRadius: 25,
              paddingVertical: SCREEN_HEIGHT * 0.012,
              paddingHorizontal: SCREEN_WIDTH * 0.05,
            }}
          >
            <View
              style={{
                width: 20,
                height: 20,
                borderRadius: 10,
                justifyContent: "center",
                alignItems: "center",
                position: "relative",
              }}
            >
              <Camera style={{ position: "absolute", top: 0, left: 0 }} />
            </View>
            <Text
              style={{
                color: "#545EE1",
                fontSize: SCREEN_WIDTH * 0.038,
                fontWeight: "600",
              }}
            >
              Upload Photo
            </Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  );

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: "#FFFFFF",
        paddingHorizontal: SCREEN_WIDTH * 0.06,
        paddingTop: SCREEN_HEIGHT * 0.06,
      }}
    >
      <AuthLeftButton onPress={() => navigation.goBack()} />

      <View
        style={{
          flexDirection: "column",
          gap: 8,
          marginTop: SCREEN_HEIGHT * 0.035,
          marginBottom: SCREEN_HEIGHT * 0.045,
        }}
      >
        <Text
          style={{
            fontSize: SCREEN_WIDTH * 0.07,
            fontWeight: "700",
            color: "#000000",
          }}
        >
          {title}
        </Text>
        <Text
          style={{
            fontSize: SCREEN_WIDTH * 0.035,
            fontWeight: "400",
            color: "#6B7280",
          }}
        >
          Put your insurance receipt for safety and confirmation details
        </Text>
      </View>

      {renderUploadBox(
        insurancePhoto,
        "insurance",
        "Front side photo of your insurance receipt",
        "with your clear name and photo"
      )}

      <View
        style={{
          flex: 1,
          justifyContent: "flex-end",
          paddingBottom: SCREEN_HEIGHT * 0.04,
        }}
      >
        <Button
          title="Sign up"
          fontSize={SCREEN_WIDTH * 0.045}
          fontWeight="bold"
          padding={SCREEN_HEIGHT * 0.018}
          width="100%"
          height={SCREEN_HEIGHT * 0.065}
          borderRadius={30}
          onPress={() => {
            if (!insurancePhoto) {
              Alert.alert(
                "Missing Photos",
                "Please upload a photo of your insurance receipt."
              );
              return;
            }
            navigation.navigate("ApplicationSuccessful" as never);
          }}
          backgroundColor="#545EE1"
          textColor="#fff"
          disabled={!insurancePhoto}
        />
      </View>
    </View>
  );
};

export default InsuranceVerification;

import AuthLeftButton from "@/components/svg/AuthLeftButton";
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  Dimensions,
  ActivityIndicator,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import Camera from "@/components/svg/Camera";
import { Button } from "@/components/Button";
import * as ImagePicker from "expo-image-picker";
import { useState } from "react";
import { useRegister } from "@/app/context/RegisterContext";
import { createUser } from "@/app/api/user";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

const InsuranceVerification = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { title } = route.params || { title: "Insurance Verification" };

  const { userData, updateUserData, resetUserData } = useRegister();
  const [insurancePhoto, setInsurancePhoto] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const getFileName = (uri: string) => uri.split("/").pop() || "image.jpg";

  /** --- Image selection helpers --- **/
  const openCamera = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission Denied", "Camera access is required.");
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 1,
    });

    if (!result.canceled) {
      const image = result.assets[0];
      const fileObj = {
        uri: image.uri,
        name: image.fileName ?? "",
        type: "image/png",
      };

      setInsurancePhoto(image.uri);
      updateUserData({ insurance: fileObj });
      console.log(`Insurance: ${userData.insurance}`);
    }
  };

  const pickFromGallery = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission Denied", "Gallery access is required.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 1,
    });

    if (!result.canceled) {
      const image = result.assets[0];
      const fileObj = {
        uri: image.uri,
        name: image.fileName ?? "",
        type: "image/png",
      };

      setInsurancePhoto(image.uri);
      updateUserData({ insurance: fileObj });
      console.log(`Insurance: ${userData.insurance}`);
    }
  };

  const showImageOptions = () => {
    Alert.alert("Upload Photo", "Choose an option", [
      { text: "Take Photo", onPress: openCamera },
      { text: "Choose from Gallery", onPress: pickFromGallery },
      { text: "Cancel", style: "cancel" },
    ]);
  };

  const handleSubmit = async () => {
    if (!insurancePhoto) {
      Alert.alert("Missing Photo", "Please upload your insurance image first.");
      return;
    }

    console.log("📦 Sending user data:", userData);

    setLoading(true);

    try {
      const response = await createUser(userData as any);
      console.log("✅ Registration success:", response);

      Alert.alert("✅ Registered!", "Account created successfully.");
      resetUserData();
      navigation.navigate("ApplicationSuccessful");
    } catch (error: any) {
      // --- Begin Detailed Error Handling ---
      console.error("❌ Registration failed:", error);

      if (error.response) {
        console.error("🔻 Server responded with error:");
        console.error("Status:", error.response.status);
        console.error("Headers:", error.response.headers);
        console.error("Data:", error.response.data);

        if (error.response.status === 400) {
          Alert.alert(
            "❌ Validation Error",
            JSON.stringify(error.response.data, null, 2)
          );
        } else if (error.response.status === 500) {
          Alert.alert(
            "💥 Server Error",
            "Something went wrong on the server. Please try again later."
          );
        } else {
          Alert.alert(
            `⚠️ Error ${error.response.status}`,
            error.response.data?.error || "An unknown error occurred."
          );
        }
      } else if (error.request) {
        // The request was sent but no response received
        console.error("⚠️ No response received from server:", error.request);
        Alert.alert(
          "⚠️ Network Error",
          "Unable to connect to the server. Check your connection or API URL."
        );
      } else {
        console.error("🚨 Request setup error:", error.message);
        Alert.alert("🚨 Unexpected Error", error.message);
      }
      // --- End Detailed Error Handling ---
    } finally {
      setLoading(false);
    }
  };

  /** --- UI Rendering --- **/
  if (loading) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: "#FFFFFF",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <ActivityIndicator size="large" color="#545EE1" />
        <Text style={{ marginTop: 10, color: "#545EE1", fontSize: 16 }}>
          Submitting your registration...
        </Text>
      </View>
    );
  }

  const renderUploadBox = (
    photo: string | null,
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
          onPress={showImageOptions}
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
              style={{
                fontSize: 14,
                color: "#1F2937",
                fontWeight: "600",
              }}
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
            onPress={showImageOptions}
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 8,
              borderWidth: 1.5,
              borderColor: "#545EE1",
              borderRadius: 25,
              paddingVertical: SCREEN_HEIGHT * 0.012,
              paddingHorizontal: SCREEN_WIDTH * 0.05,
            }}
          >
            <Camera />
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
          Upload your insurance receipt for verification.
        </Text>
      </View>

      {renderUploadBox(
        insurancePhoto,
        "Front side photo of your insurance receipt",
        "Ensure your name and details are visible"
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
          onPress={handleSubmit}
          backgroundColor="#545EE1"
          textColor="#fff"
          disabled={!insurancePhoto}
        />
      </View>
    </View>
  );
};

export default InsuranceVerification;

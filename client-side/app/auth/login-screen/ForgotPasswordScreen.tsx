import AuthLeftButton from "@/components/svg/AuthLeftButton";
import { useNavigation } from "@react-navigation/native";
import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  TouchableWithoutFeedback,
  Keyboard,
} from "react-native";
import { Button } from "@/components/Button";

const ForgotPasswordScreen = () => {
  const navigation = useNavigation<any>();
  const [email, setEmail] = useState<string>("");

  const handleSendCode = () => {
    navigation.navigate("VerifyEmail" as never, { email });
  };

  const handleLogIn = () => {
    navigation.navigate("LoginScreen" as never);
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View style={{ flex: 1, backgroundColor: "#FFFFFF" }}>
        {/* Left Button */}
        <View style={{ marginTop: 50, marginLeft: 20 }}>
          <AuthLeftButton onPress={() => navigation.goBack()} />
        </View>

        {/* Content */}
        <View style={{ flex: 1, paddingHorizontal: 30, marginTop: 30 }}>
          {/* Title */}
          <Text style={{ fontSize: 24, fontWeight: "600", color: "#000" }}>
            Forgot password?
          </Text>
          <Text style={{ fontSize: 14, color: "#666", marginTop: 8 }}>
            Don't worry! It happens. Please enter the email associated with you
            account.
          </Text>

          {/* Email Input */}
          <View style={{ marginTop: 40 }}>
            <Text style={{ fontSize: 14, color: "#000", marginBottom: 8 }}>
              Email
            </Text>
            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder=""
              keyboardType="email-address"
              autoCapitalize="none"
              style={{
                borderWidth: 1,
                borderColor: "#545EE1",
                borderRadius: 8,
                padding: 15,
                fontSize: 16,
              }}
            />
          </View>

          {/* Send Code Button */}
          <View style={{ marginTop: "40%" }}>
            <Button
              title="Send Code"
              onPress={handleSendCode}
              backgroundColor="#5B5FED"
              textColor="#FFFFFF"
              padding={18}
              borderRadius={30}
              fontSize={16}
              fontWeight="600"
            />
          </View>
        </View>
        <View
          style={{
            paddingHorizontal: 30,
            paddingBottom: "20%",
            flexDirection: "row",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <Text style={{ fontSize: 16, color: "#666", fontWeight: "600" }}>
            Remember password?
          </Text>
          <Pressable onPress={handleLogIn}>
            <Text style={{ fontSize: 16, color: "#5B5FED", fontWeight: "600" }}>
              Log in
            </Text>
          </Pressable>
        </View>
      </View>
    </TouchableWithoutFeedback>
  );
};

export default ForgotPasswordScreen;

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
import MaterialIcons from "@expo/vector-icons/MaterialIcons";

const LoginScreen = () => {
  const navigation = useNavigation();
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [showPassword, setShowPassword] = useState<boolean>(false);

  const handleLogin = () => {
    navigation.navigate("CourierNavigationBar" as never);
  };

  const handleForgotPassword = () => {
    navigation.navigate("ForgotPasswordScreen" as never);
  };

  const handleRegister = () => {
    navigation.navigate("PhoneNumber" as never);
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View style={{ flex: 1, backgroundColor: "#FFFFFF" }}>
        {/* Left Button */}
        <View style={{ marginTop: 50, marginLeft: 20 }}>
          <AuthLeftButton
            onPress={() => navigation.navigate("Welcome" as never)}
          />
        </View>

        {/* Content */}
        <View style={{ flex: 1, paddingHorizontal: 30, marginTop: 30 }}>
          {/* Title */}
          <Text style={{ fontSize: 24, fontWeight: "600", color: "#000" }}>
            Enter you details to login
          </Text>
          <Text style={{ fontSize: 14, color: "#666", marginTop: 8 }}>
            Fill the information below.
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

          {/* Password Input */}
          <View style={{ marginTop: 20 }}>
            <Text style={{ fontSize: 14, color: "#000", marginBottom: 8 }}>
              Password
            </Text>
            <View style={{ position: "relative" }}>
              <TextInput
                value={password}
                onChangeText={setPassword}
                placeholder=""
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                style={{
                  borderWidth: 1,
                  borderColor: "#545EE1",
                  borderRadius: 8,
                  padding: 15,
                  fontSize: 16,
                  backgroundColor: "#FFFFFF",
                  paddingRight: 50,
                }}
              />
              <Pressable
                onPress={() => setShowPassword(!showPassword)}
                style={{
                  position: "absolute",
                  right: 15,
                  top: 0,
                  bottom: 0,
                  justifyContent: "center",
                }}
              >
                <MaterialIcons
                  name={showPassword ? "visibility" : "visibility-off"}
                  size={20}
                  color="#999"
                />
              </Pressable>
            </View>
          </View>

          {/* Login Button */}
          <View style={{ marginTop: 70 }}>
            <Button
              title="Log in"
              onPress={handleLogin}
              backgroundColor="#5B5FED"
              textColor="#FFFFFF"
              padding={18}
              borderRadius={30}
              fontSize={16}
              fontWeight="600"
            />
          </View>

          {/* Forgot Password */}
          <Pressable onPress={handleForgotPassword} style={{ marginTop: 20 }}>
            <Text
              style={{
                textAlign: "center",
                color: "#5B5FED",
                fontSize: 14,
                fontWeight: "700",
              }}
            >
              Forgot password
            </Text>
          </Pressable>
        </View>

        {/* Register Link Footer */}
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
            Don't have an account?{" "}
          </Text>
          <Pressable onPress={handleRegister}>
            <Text style={{ fontSize: 16, color: "#5B5FED", fontWeight: "600" }}>
              Register
            </Text>
          </Pressable>
        </View>
      </View>
    </TouchableWithoutFeedback>
  );
};

export default LoginScreen;

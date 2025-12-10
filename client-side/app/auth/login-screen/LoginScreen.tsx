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
  Alert,
} from "react-native";
import { Button } from "@/components/Button";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Role, RootNav, VerificationInfoStatus } from "@/types/types";
import { Login } from "@/app/api/auth";
import { useAuthStore } from "@/app/api/store/auth_store";

const LoginScreen = () => {
  const navigation = useNavigation<RootNav>();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const { login, logout } = useAuthStore();

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert("Missing Fields", "Please enter your email and password.");
      return;
    }

    setLoading(true);
    try {
      // 🔹 Call API to get token
      const token = await Login({ username: email, password });

      // 🔹 Save token & user profile
      await login(token);

      const { user } = useAuthStore.getState();
      if (user?.verifiactionInfoDTO.verificationInfoStatus !== 2) {
        navigation.navigate("Unverified" as never);
        return;
      }

      const role = useAuthStore.getState().user?.currentRole;
      const routeName =
        role === Role.COURIER
          ? "CourierNavigationBar"
          : "CustomerNavigationBar";

      navigation.navigate(routeName as never);
    } catch (error: any) {
      console.error("❌ Login failed:", error);
      Alert.alert("Login Failed", error.message || "Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = () => {
    navigation.navigate("ForgotPasswordScreen" as never);
  };

  const handleRegister = () => {
    navigation.navigate("RegisterFlow", { screen: "PhoneNumber" } as never);
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
          <Text style={{ fontSize: 24, fontWeight: "600", color: "#000" }}>
            Enter your details to login
          </Text>
          <Text style={{ fontSize: 14, color: "#666", marginTop: 8 }}>
            Fill in the information below.
          </Text>

          {/* Email Input */}
          <View style={{ marginTop: 40 }}>
            <Text style={{ fontSize: 14, color: "#000", marginBottom: 8 }}>
              Email
            </Text>
            <TextInput
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              placeholder="your@email.com"
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
                placeholder="••••••••"
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
              title={loading ? "Logging in..." : "Log in"}
              onPress={handleLogin}
              backgroundColor="#5B5FED"
              textColor="#FFFFFF"
              padding={18}
              borderRadius={30}
              fontSize={16}
              fontWeight="600"
              disabled={loading}
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

        {/* Register Footer */}
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

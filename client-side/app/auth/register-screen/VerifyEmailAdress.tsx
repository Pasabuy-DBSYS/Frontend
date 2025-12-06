import { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Keyboard,
  TouchableWithoutFeedback,
  ActivityIndicator,
  Alert,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { Button } from "@/components/Button";
import AuthLeftButton from "@/components/svg/AuthLeftButton";
import { useRegister } from "@/app/context/RegisterContext";
import { RootNav } from "@/types/types";
import {
  sendRegistrationEmailCode,
  verifyRegistrationEmailCode,
} from "@/app/api/user";

const VerifyEmailAdress: React.FC = () => {
  const navigation = useNavigation<RootNav>();
  const [email, setEmail] = useState<string>("");
  const [username, setUsername] = useState<string>("");
  const [step, setStep] = useState<"input" | "verify">("input");
  const [code, setCode] = useState<string[]>(["", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const inputRefs = useRef<(TextInput | null)[]>([]);
  const { updateUserData } = useRegister();

  // Countdown timer for resend
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  // Auto-verify when all 5 digits are entered
  useEffect(() => {
    const fullCode = code.join("");
    if (fullCode.length === 5 && step === "verify") {
      handleVerifyCode(fullCode);
    }
  }, [code, step]);

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validateUsername = (username: string) => {
    return username.trim().length >= 3;
  };

  const handleSendCode = async () => {
    if (!validateEmail(email)) {
      Alert.alert("Invalid Email", "Please enter a valid email address");
      return;
    }

    if (!validateUsername(username)) {
      Alert.alert("Invalid Username", "Username must be at least 3 characters");
      return;
    }

    setLoading(true);
    try {
      await sendRegistrationEmailCode(email.trim());
      updateUserData({ username: username.trim() });
      setStep("verify");
      setCode(["", "", "", "", ""]);
      setCountdown(60);
      setTimeout(() => inputRefs.current[0]?.focus(), 100);
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to send verification code");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async (fullCode: string) => {
    setVerifying(true);
    try {
      const isValid = await verifyRegistrationEmailCode(email.trim(), fullCode);
      if (isValid) {
        updateUserData({ email: email.trim() });
        navigation.navigate("PersonalInformation");
      } else {
        Alert.alert("Error", "Invalid verification code");
        setCode(["", "", "", "", ""]);
        inputRefs.current[0]?.focus();
      }
    } catch (error: any) {
      Alert.alert("Error", error.message || "Invalid verification code");
      setCode(["", "", "", "", ""]);
      inputRefs.current[0]?.focus();
    } finally {
      setVerifying(false);
    }
  };

  const handleResendCode = async () => {
    if (countdown > 0) return;
    setLoading(true);
    try {
      await sendRegistrationEmailCode(email.trim());
      setCode(["", "", "", "", ""]);
      setCountdown(60);
      Alert.alert("Success", "A new verification code has been sent");
      setTimeout(() => inputRefs.current[0]?.focus(), 100);
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to resend code");
    } finally {
      setLoading(false);
    }
  };

  const handleCodeChange = (value: string, index: number) => {
    if (value.length > 1) {
      // Handle paste
      const pastedCode = value
        .replace(/[^0-9]/g, "")
        .slice(0, 5)
        .split("");
      const newCode = [...code];
      pastedCode.forEach((char, i) => {
        if (index + i < 5) {
          newCode[index + i] = char;
        }
      });
      setCode(newCode);
      const nextIndex = Math.min(index + pastedCode.length, 4);
      inputRefs.current[nextIndex]?.focus();
    } else {
      const newCode = [...code];
      newCode[index] = value.replace(/[^0-9]/g, "");
      setCode(newCode);

      if (value && index < 4) {
        inputRefs.current[index + 1]?.focus();
      }
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === "Backspace" && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const canSendCode =
    validateEmail(email) && validateUsername(username) && !loading;

  const maskedEmail = email.replace(
    /^(.{2}).*(@.*)$/,
    (_, start, end) => `${start}*****${end}`
  );

  // Render input step (username + email)
  if (step === "input") {
    return (
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={{ flex: 1, backgroundColor: "#FFFFFF" }}>
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{
              paddingHorizontal: 24,
              paddingTop: 50,
              paddingBottom: 40,
            }}
            keyboardShouldPersistTaps="handled"
          >
            <AuthLeftButton onPress={() => navigation.goBack()} />

            {/* Header */}
            <View style={{ marginTop: 24, marginBottom: 32 }}>
              <Text
                style={{
                  fontSize: 28,
                  fontWeight: "bold",
                  color: "#1a1a1a",
                  marginBottom: 8,
                }}
              >
                Create your account
              </Text>
              <Text style={{ fontSize: 15, color: "#666", lineHeight: 22 }}>
                Enter your details below. We'll send a verification code to your
                email.
              </Text>
            </View>

            {/* Username Input */}
            <View style={{ marginBottom: 20 }}>
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: "600",
                  color: "#333",
                  marginBottom: 8,
                }}
              >
                Username
              </Text>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  borderWidth: 1.5,
                  borderColor: validateUsername(username)
                    ? "#22C55E"
                    : username
                    ? "#E5E7EB"
                    : "#E5E7EB",
                  borderRadius: 12,
                  backgroundColor: "#FAFAFA",
                  paddingHorizontal: 16,
                }}
              >
                <Ionicons
                  name="person-outline"
                  size={20}
                  color="#999"
                  style={{ marginRight: 12 }}
                />
                <TextInput
                  style={{
                    flex: 1,
                    fontSize: 16,
                    color: "#1a1a1a",
                    paddingVertical: 14,
                  }}
                  value={username}
                  onChangeText={setUsername}
                  placeholder="Enter your username"
                  placeholderTextColor="#999"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                {validateUsername(username) && (
                  <Ionicons name="checkmark-circle" size={20} color="#22C55E" />
                )}
              </View>
              <Text style={{ fontSize: 12, color: "#999", marginTop: 6 }}>
                At least 3 characters. This will be your login credential.
              </Text>
            </View>

            {/* Email Input */}
            <View style={{ marginBottom: 32 }}>
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: "600",
                  color: "#333",
                  marginBottom: 8,
                }}
              >
                Email Address
              </Text>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  borderWidth: 1.5,
                  borderColor: validateEmail(email)
                    ? "#22C55E"
                    : email
                    ? "#E5E7EB"
                    : "#E5E7EB",
                  borderRadius: 12,
                  backgroundColor: "#FAFAFA",
                  paddingHorizontal: 16,
                }}
              >
                <Ionicons
                  name="mail-outline"
                  size={20}
                  color="#999"
                  style={{ marginRight: 12 }}
                />
                <TextInput
                  style={{
                    flex: 1,
                    fontSize: 16,
                    color: "#1a1a1a",
                    paddingVertical: 14,
                  }}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  placeholder="Enter your email address"
                  placeholderTextColor="#999"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                {validateEmail(email) && (
                  <Ionicons name="checkmark-circle" size={20} color="#22C55E" />
                )}
              </View>
              <Text style={{ fontSize: 12, color: "#999", marginTop: 6 }}>
                We'll send a verification code to this email.
              </Text>
            </View>

            {/* Send Code Button */}
            <TouchableOpacity
              onPress={handleSendCode}
              disabled={!canSendCode}
              style={{
                backgroundColor: canSendCode ? "#545EE1" : "#E5E7EB",
                borderRadius: 30,
                paddingVertical: 16,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text
                  style={{
                    color: canSendCode ? "#fff" : "#999",
                    fontSize: 16,
                    fontWeight: "600",
                  }}
                >
                  Send Verification Code
                </Text>
              )}
            </TouchableOpacity>
          </ScrollView>
        </View>
      </TouchableWithoutFeedback>
    );
  }

  // Render verification step (OTP input)
  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View style={{ flex: 1, backgroundColor: "#FFFFFF" }}>
        <View
          style={{
            flex: 1,
            paddingHorizontal: 24,
            paddingTop: 50,
          }}
        >
          <AuthLeftButton onPress={() => setStep("input")} />

          {/* Header */}
          <View style={{ marginTop: 24, marginBottom: 32 }}>
            <Text
              style={{
                fontSize: 28,
                fontWeight: "bold",
                color: "#1a1a1a",
                marginBottom: 8,
              }}
            >
              Verify your email
            </Text>
            <Text style={{ fontSize: 15, color: "#666", lineHeight: 22 }}>
              We've sent a 5-digit verification code to{" "}
              <Text style={{ fontWeight: "600", color: "#545EE1" }}>
                {maskedEmail}
              </Text>
            </Text>
          </View>

          {/* OTP Input */}
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              marginBottom: 24,
            }}
          >
            {code.map((digit, index) => (
              <TextInput
                key={index}
                ref={(ref) => {
                  inputRefs.current[index] = ref;
                }}
                style={{
                  width: 56,
                  height: 60,
                  borderWidth: 2,
                  borderColor: digit ? "#545EE1" : "#E5E7EB",
                  borderRadius: 12,
                  fontSize: 24,
                  fontWeight: "600",
                  textAlign: "center",
                  color: "#1a1a1a",
                  backgroundColor: digit ? "#F5F6FF" : "#FAFAFA",
                }}
                value={digit}
                onChangeText={(value) => handleCodeChange(value, index)}
                onKeyPress={(e) => handleKeyPress(e, index)}
                keyboardType="number-pad"
                maxLength={5}
                selectTextOnFocus
              />
            ))}
          </View>

          {/* Verifying indicator */}
          {verifying && (
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 24,
              }}
            >
              <ActivityIndicator size="small" color="#545EE1" />
              <Text style={{ marginLeft: 8, color: "#545EE1" }}>
                Verifying...
              </Text>
            </View>
          )}

          {/* Resend Code */}
          <View
            style={{
              flexDirection: "row",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <Text style={{ fontSize: 14, color: "#666" }}>
              Didn't receive the code?{" "}
            </Text>
            {countdown > 0 ? (
              <Text style={{ fontSize: 14, color: "#999" }}>
                Resend in {countdown}s
              </Text>
            ) : (
              <TouchableOpacity onPress={handleResendCode} disabled={loading}>
                {loading ? (
                  <ActivityIndicator size="small" color="#545EE1" />
                ) : (
                  <Text
                    style={{
                      fontSize: 14,
                      color: "#545EE1",
                      fontWeight: "600",
                    }}
                  >
                    Resend
                  </Text>
                )}
              </TouchableOpacity>
            )}
          </View>

          {/* Change email link */}
          <TouchableOpacity
            onPress={() => setStep("input")}
            style={{ marginTop: 16, alignItems: "center" }}
          >
            <Text style={{ fontSize: 14, color: "#545EE1" }}>
              Change email address
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableWithoutFeedback>
  );
};

export default VerifyEmailAdress;

import React, { useState, useEffect, useRef } from "react";
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
  Alert,
} from "react-native";
import { BlurView } from "expo-blur";
import {
  changeEmail,
  sendEmailVerificationCode,
  verifyEmailCode,
} from "@/app/api/user";
import { useAuthStore } from "@/app/api/store/auth_store";

const { width } = Dimensions.get("window");

interface UpdateEmailProps {
  visible: boolean;
  onClose: () => void;
  onSave: () => void;
}

const UpdateEmail: React.FC<UpdateEmailProps> = ({
  visible,
  onClose,
  onSave,
}) => {
  const { user } = useAuthStore();
  const [newEmail, setNewEmail] = useState("");
  const [step, setStep] = useState<"verify" | "email">("verify");
  const [code, setCode] = useState<string[]>(["", "", "", "", ""]);
  const [focusedIndex, setFocusedIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [isCodeVerified, setIsCodeVerified] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [codeSent, setCodeSent] = useState(false);
  const inputRefs = useRef<(TextInput | null)[]>([]);

  const currentEmail = user?.email || "";

  const maskedCurrentEmail = currentEmail.replace(
    /^(.{2}).*(@.*)$/,
    (_, start, end) => `${start}*****${end}`
  );

  useEffect(() => {
    if (visible && user) {
      setNewEmail("");
      setStep("verify");
      setCode(["", "", "", "", ""]);
      setIsCodeVerified(false);
      setFocusedIndex(0);
      setCodeSent(false);
    }
  }, [visible, user]);

  // Auto-verify when all 5 digits are entered
  useEffect(() => {
    const fullCode = code.join("");
    if (fullCode.length === 5 && step === "verify" && codeSent) {
      handleVerifyCode(fullCode);
    }
  }, [code, codeSent]);

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Send code to current email for verification
  const handleSendCode = async () => {
    if (!currentEmail) {
      Alert.alert("Error", "No email found on your account");
      return;
    }

    setLoading(true);
    try {
      await sendEmailVerificationCode(currentEmail);
      setCodeSent(true);
      setCode(["", "", "", "", ""]);
      setIsCodeVerified(false);
      setFocusedIndex(0);
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
      const isValid = await verifyEmailCode(currentEmail, fullCode);
      if (isValid) {
        setIsCodeVerified(true);
        // Move to email entry step after successful verification
        setTimeout(() => {
          setStep("email");
        }, 500);
      } else {
        Alert.alert("Error", "Invalid verification code");
        setCode(["", "", "", "", ""]);
        setFocusedIndex(0);
        inputRefs.current[0]?.focus();
      }
    } catch (error: any) {
      Alert.alert("Error", error.message || "Invalid verification code");
      setCode(["", "", "", "", ""]);
      setFocusedIndex(0);
      inputRefs.current[0]?.focus();
    } finally {
      setVerifying(false);
    }
  };

  const handleSave = async () => {
    if (!newEmail.trim()) {
      Alert.alert("Error", "Email is required");
      return;
    }

    if (!validateEmail(newEmail.trim())) {
      Alert.alert("Error", "Please enter a valid email address");
      return;
    }

    if (newEmail.trim().toLowerCase() === currentEmail.toLowerCase()) {
      Alert.alert("Error", "Please enter a different email address");
      return;
    }

    setLoading(true);
    try {
      const fullCode = code.join("");
      await changeEmail(newEmail.trim(), fullCode);
      Alert.alert("Success", "Email updated successfully");
      onSave();
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to update email");
    } finally {
      setLoading(false);
    }
  };

  const handleCodeInput = (index: number, value: string) => {
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
      setFocusedIndex(nextIndex);
      inputRefs.current[nextIndex]?.focus();
      return;
    }

    const newCode = [...code];
    newCode[index] = value.replace(/[^0-9]/g, "");
    setCode(newCode);

    if (value && index < 4) {
      setFocusedIndex(index + 1);
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (index: number, key: string) => {
    if (key === "Backspace" && !code[index] && index > 0) {
      setFocusedIndex(index - 1);
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleResendCode = async () => {
    setLoading(true);
    try {
      await sendEmailVerificationCode(currentEmail);
      setCode(["", "", "", "", ""]);
      setIsCodeVerified(false);
      setFocusedIndex(0);
      inputRefs.current[0]?.focus();
      Alert.alert("Success", "Verification code resent");
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to resend code");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={onClose}
    >
      {/* Background Blur */}
      <BlurView intensity={60} tint="dark" style={{ flex: 1 }}>
        <View
          style={{
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
            backgroundColor: "rgba(0,0,0,0.3)",
          }}
        >
          {/* Modal Card */}
          <View
            style={{
              width: width * 0.85,
              backgroundColor: "#FFFFFF",
              borderRadius: 20,
              paddingVertical: 28,
              paddingHorizontal: 22,
              alignItems: "center",
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.15,
              shadowRadius: 8,
              elevation: 8,
            }}
          >
            {/* Close Button */}
            <TouchableOpacity
              onPress={onClose}
              style={{
                position: "absolute",
                top: 16,
                right: 16,
                width: 28,
                height: 28,
                borderRadius: 14,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Text style={{ fontSize: 22, color: "#545EE1" }}>×</Text>
            </TouchableOpacity>

            {step === "verify" ? (
              <>
                {/* Step 1: Verify current email */}
                <Text
                  style={{
                    fontSize: 18,
                    fontWeight: "700",
                    color: "#111827",
                    marginBottom: 8,
                    textAlign: "center",
                  }}
                >
                  Verify your identity
                </Text>

                <Text
                  style={{
                    fontSize: 13,
                    color: "#6B7280",
                    marginBottom: 20,
                    textAlign: "center",
                  }}
                >
                  {codeSent ? (
                    <>
                      We've sent a code to{" "}
                      <Text style={{ fontWeight: "600" }}>
                        {maskedCurrentEmail}
                      </Text>
                    </>
                  ) : (
                    "To change your email, we need to verify your current email first."
                  )}
                </Text>

                {!codeSent ? (
                  <>
                    {/* Current Email Display */}
                    <View
                      style={{
                        backgroundColor: "#F3F4F6",
                        borderRadius: 10,
                        paddingVertical: 12,
                        paddingHorizontal: 14,
                        width: "100%",
                        marginBottom: 20,
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 13,
                          color: "#6B7280",
                          marginBottom: 4,
                        }}
                      >
                        Current Email
                      </Text>
                      <Text
                        style={{
                          fontSize: 15,
                          color: "#111827",
                          fontWeight: "500",
                        }}
                      >
                        {maskedCurrentEmail}
                      </Text>
                    </View>

                    {/* Send Code Button */}
                    <TouchableOpacity
                      onPress={handleSendCode}
                      disabled={loading}
                      activeOpacity={0.8}
                      style={{
                        backgroundColor: loading ? "#9CA3AF" : "#545EE1",
                        borderRadius: 30,
                        paddingVertical: 14,
                        width: "100%",
                        alignItems: "center",
                        shadowColor: "#000",
                        shadowOffset: { width: 0, height: 4 },
                        shadowOpacity: 0.25,
                        shadowRadius: 4,
                        elevation: 5,
                      }}
                    >
                      {loading ? (
                        <ActivityIndicator color="#FFFFFF" />
                      ) : (
                        <Text
                          style={{
                            color: "#FFFFFF",
                            fontWeight: "700",
                            fontSize: 15,
                          }}
                        >
                          Send Verification Code
                        </Text>
                      )}
                    </TouchableOpacity>
                  </>
                ) : (
                  <>
                    {/* Code Input */}
                    <View
                      style={{
                        flexDirection: "row",
                        justifyContent: "center",
                        marginBottom: 16,
                        gap: 8,
                      }}
                    >
                      {code.map((digit, index) => (
                        <TextInput
                          key={index}
                          ref={(ref) => {
                            inputRefs.current[index] = ref;
                          }}
                          value={digit}
                          onChangeText={(value) =>
                            handleCodeInput(index, value)
                          }
                          onKeyPress={({ nativeEvent }) =>
                            handleKeyPress(index, nativeEvent.key)
                          }
                          onFocus={() => setFocusedIndex(index)}
                          keyboardType="number-pad"
                          maxLength={1}
                          style={{
                            width: 42,
                            height: 50,
                            borderWidth: 2,
                            borderColor: isCodeVerified
                              ? "#22C55E"
                              : focusedIndex === index
                              ? "#545EE1"
                              : "#D1D5DB",
                            borderRadius: 10,
                            textAlign: "center",
                            fontSize: 20,
                            fontWeight: "600",
                            color: "#111827",
                            backgroundColor: isCodeVerified
                              ? "#F0FDF4"
                              : "#FFFFFF",
                          }}
                        />
                      ))}
                    </View>

                    {/* Verification Status */}
                    {verifying && (
                      <View
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          marginBottom: 12,
                        }}
                      >
                        <ActivityIndicator size="small" color="#545EE1" />
                        <Text
                          style={{
                            color: "#6B7280",
                            marginLeft: 8,
                            fontSize: 13,
                          }}
                        >
                          Verifying...
                        </Text>
                      </View>
                    )}

                    {isCodeVerified && (
                      <Text
                        style={{
                          color: "#22C55E",
                          fontSize: 13,
                          fontWeight: "600",
                          marginBottom: 12,
                        }}
                      >
                        ✓ Code verified successfully
                      </Text>
                    )}

                    {/* Resend Code */}
                    <TouchableOpacity
                      onPress={handleResendCode}
                      disabled={loading}
                    >
                      <Text
                        style={{
                          color: loading ? "#9CA3AF" : "#545EE1",
                          fontSize: 13,
                          marginBottom: 12,
                        }}
                      >
                        Didn't receive the code?{" "}
                        <Text style={{ fontWeight: "600" }}>Send again</Text>
                      </Text>
                    </TouchableOpacity>
                  </>
                )}
              </>
            ) : (
              <>
                {/* Step 2: Enter new email */}
                <Text
                  style={{
                    fontSize: 18,
                    fontWeight: "700",
                    color: "#111827",
                    marginBottom: 8,
                    textAlign: "center",
                  }}
                >
                  Enter new email
                </Text>

                <Text
                  style={{
                    fontSize: 13,
                    color: "#6B7280",
                    marginBottom: 20,
                    textAlign: "center",
                  }}
                >
                  Your identity has been verified. Enter your new email address
                  below.
                </Text>

                {/* New Email Input */}
                <TextInput
                  value={newEmail}
                  onChangeText={setNewEmail}
                  placeholder="Enter new email"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoFocus
                  style={{
                    borderWidth: 1,
                    borderColor: "#D1D5DB",
                    borderRadius: 10,
                    paddingVertical: 12,
                    paddingHorizontal: 14,
                    fontSize: 15,
                    color: "#111827",
                    width: "100%",
                    marginBottom: 24,
                  }}
                />

                {/* Save Button */}
                <TouchableOpacity
                  onPress={handleSave}
                  disabled={loading}
                  activeOpacity={0.8}
                  style={{
                    backgroundColor: loading ? "#9CA3AF" : "#545EE1",
                    borderRadius: 30,
                    paddingVertical: 14,
                    width: "100%",
                    alignItems: "center",
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.25,
                    shadowRadius: 4,
                    elevation: 5,
                  }}
                >
                  {loading ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <Text
                      style={{
                        color: "#FFFFFF",
                        fontWeight: "700",
                        fontSize: 15,
                      }}
                    >
                      Save
                    </Text>
                  )}
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </BlurView>
    </Modal>
  );
};

export default UpdateEmail;

import { useState, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Keyboard,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { Button } from "@/components/Button";
import AuthLeftButton from "@/components/svg/AuthLeftButton";

const PhoneVerificationPage: React.FC = () => {
  const navigation = useNavigation();
  const [code, setCode] = useState<string[]>(["", "", "", "", "", ""]);
  const [focusedIndex, setFocusedIndex] = useState<number>(0);
  const inputRefs = useRef<(TextInput | null)[]>([]);

  const handleInput = (index: number, value: string): void => {
    // Handle paste
    if (value.length > 1) {
      const pastedCode = value.slice(0, 6).split("");
      const newCode = [...code];
      pastedCode.forEach((char, i) => {
        if (index + i < 6) {
          newCode[index + i] = char;
        }
      });
      setCode(newCode);

      const nextIndex = Math.min(index + pastedCode.length, 5);
      setFocusedIndex(nextIndex);
      inputRefs.current[nextIndex]?.focus();
      return;
    }

    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);

    if (value && index < 5) {
      setFocusedIndex(index + 1);
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (index: number, key: string): void => {
    if (key === "Backspace" && !code[index] && index > 0) {
      setFocusedIndex(index - 1);
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = (): void => {
    const verificationCode = code.join("");
    if (verificationCode.length === 6) {
      Keyboard.dismiss();
      // Handle verification logic here
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#FFFFFF" }}>
      <View style={{ flex: 1, paddingHorizontal: 20, paddingTop: 50, gap: 20 }}>
        <AuthLeftButton onPress={() => navigation.goBack()} />

        <View style={{ marginBottom: 30 }}>
          <Text
            style={{
              fontSize: 24,
              fontWeight: "bold",
              color: "#000",
              marginBottom: 12,
            }}
          >
            Verify your phone number
          </Text>
          <Text style={{ fontSize: 14, color: "#666", marginBottom: 16 }}>
            Please check your phone for the confirmation code we sent
          </Text>
          <TouchableOpacity>
            <Text style={{ fontSize: 14, color: "#545EE1", fontWeight: "600" }}>
              Send again
            </Text>
          </TouchableOpacity>
        </View>

        {/* Code Input Boxes */}
        <View
          style={{
            flexDirection: "row",
            justifyContent: "center",
            gap: 12,
            marginBottom: 30,
          }}
        >
          {code.map((digit, index) => (
            <TextInput
              key={index}
              ref={(el) => {
                inputRefs.current[index] = el;
              }}
              style={{
                width: 48,
                height: 56,
                borderWidth: 2,
                borderColor:
                  digit || focusedIndex === index ? "#545EE1" : "#E5E7EB",
                borderRadius: 8,
                textAlign: "center",
                fontSize: 20,
                fontWeight: "600",
                backgroundColor: "#FFFFFF",
              }}
              value={digit}
              onChangeText={(value) => handleInput(index, value)}
              onKeyPress={({ nativeEvent: { key } }) =>
                handleKeyPress(index, key)
              }
              onFocus={() => setFocusedIndex(index)}
              keyboardType="number-pad"
              maxLength={1}
              selectTextOnFocus
              autoFocus={index === 0}
            />
          ))}
        </View>

        {/* Verify Button */}
        <Button
          title="Verify"
          onPress={() => navigation.navigate("VerifyEmailAddress" as never)}
          backgroundColor="#545EE1"
          textColor="#fff"
          borderColor="#545EE1"
          borderRadius={30}
          padding={15}
          width="100%"
          height={56}
          margin={0}
          fontWeight="bold"
          fontSize={18}
          disabled={code.some((digit) => !digit)}
        />
      </View>
    </View>
  );
};

export default PhoneVerificationPage;

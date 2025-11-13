import { Button } from "@/components/Button";
import PhoneInput from "@/components/PhoneInput";
import AuthLeftButton from "@/components/svg/AuthLeftButton";
import { useNavigation } from "@react-navigation/native";
import { View, Text, Keyboard, TouchableWithoutFeedback } from "react-native";
import { useState } from "react";
import { useRegister } from "@/app/context/RegisterContext";

const PhoneNumberPage = () => {
  const navigation = useNavigation();
  const [phoneNumber, setPhoneNumber] = useState("");
  const { updateUserData } = useRegister();

  const handleContinue = () => {
    updateUserData({ phone: phoneNumber.trim() });
    navigation.navigate("VerifyPhoneNumber" as never);
  };
  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View
        style={{
          flex: 1,
          backgroundColor: "#FFFFFF",
          paddingTop: 50,
          paddingHorizontal: 20,
        }}
      >
        <AuthLeftButton onPress={() => navigation.goBack()} />

        <View
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 12,
            marginTop: 30,
          }}
        >
          <Text style={{ fontSize: 28, fontWeight: "bold", color: "#000" }}>
            Enter your phone number
          </Text>
          <Text style={{ fontSize: 16, fontWeight: "400", color: "#666" }}>
            You will receive a code to confirm your identity
          </Text>
        </View>

        <View style={{ marginTop: 40 }}>
          <PhoneInput onPhoneChange={setPhoneNumber} />
        </View>

        <View style={{ marginTop: 55 }}>
          <Button
            title="Continue"
            onPress={() => handleContinue()}
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
            disabled={!phoneNumber.trim()}
          />
        </View>
      </View>
    </TouchableWithoutFeedback>
  );
};

export default PhoneNumberPage;

import { View, Text, Dimensions, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Image } from "react-native";
import { Button } from "../../components/Button";
import LoginMan from "@/components/svg/LoginMan";
import CreateAccountArrow from "@/components/svg/CreateAccountArrow";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useNavigation } from "@react-navigation/native";
import { RootNav } from "@/types/types";

const { width, height } = Dimensions.get("window");

const Welcome = () => {
  const navigation = useNavigation<RootNav>();
  return (
    <LinearGradient
      colors={["#545EE1", "#FFFFFF"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      style={{
        flex: 1,
        paddingHorizontal: 20,
      }}
      locations={[0, 0.5]}
    >
      <View
        style={{
          gap: 50,
        }}
      >
        {/* Text header */}
        <View
          style={{
            marginTop: height * 0.1,
            marginLeft: width * 0.06,
            gap: 10,
          }}
        >
          <Text
            style={{
              color: "white",
              fontSize: 50,
              fontWeight: "bold",
            }}
          >
            Welcome to
          </Text>
          <Text
            style={{
              color: "white",
              fontSize: 50,
              fontWeight: "bold",
            }}
          >
            PasaBuy
          </Text>
        </View>
        <LoginMan />
        <View style={{ width: "100%", alignItems: "center" }}>
          <Button
            title="Create new account"
            onPress={() => {
              navigation.navigate("RegisterFlow", { screen: "PhoneNumber" });
            }}
            backgroundColor="#545EE1"
            textColor="#fff"
            borderColor="#545EE1"
            borderRadius={30}
            padding={10}
            width={300}
            height={50}
            margin={0}
            fontWeight="bold"
            fontSize={20}
            showArrow={true}
          />
          <TouchableOpacity
            onPress={() => navigation.navigate("LoginScreen" as never)}
          >
            <Text
              style={{
                marginTop: 16,
                color: "#544ED1",
                fontSize: 18,
                textAlign: "center",
                fontWeight: "bold",
              }}
            >
              I already have an account
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </LinearGradient>
  );
};

export default Welcome;

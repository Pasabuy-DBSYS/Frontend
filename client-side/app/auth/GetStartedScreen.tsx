import StandingMan from "@/components/svg/StandingMan";
import { useNavigation } from "@react-navigation/native";
import { Dimensions, Text, View } from "react-native";
import { Button } from "../../components/Button";
import { getOrders } from "../api/orders";

const GetStartedScreen = () => {
  const { width, height } = Dimensions.get("window");
  const navigation = useNavigation();

  const fetchOrders = async () => {
    try {
      const orders = await getOrders();
      console.log("Fetched Orders:", orders);
    } catch (error) {
      console.error("Error fetching orders:", error);
      throw error;
    }
  };

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: "#545EE1",
        paddingHorizontal: 20,
      }}
    >
      <View
        style={{
          alignItems: "center",
          marginTop: 30,
        }}
      >
        <StandingMan />
        <View
          style={{
            alignItems: "center",
            justifyContent: "center",
            marginTop: 30,
            gap: 10,
          }}
        >
          <Text
            style={{
              color: "white",
              fontSize: 32,
              fontWeight: "900",
              textAlign: "center",
              marginBottom: 10,
            }}
          >
            Deliver and Earn{"\n"}with Ease
          </Text>

          <Text
            style={{
              color: "white",
              fontSize: 16,
              fontWeight: "400",
              textAlign: "center",
              marginBottom: 60,
              marginLeft: 20,
              marginRight: 20,
            }}
          >
            As a student you can send parcels quickly and safely. With your
            account, you can also be a courier or a commissioner — all at the
            same time.
          </Text>

          <Button
            title="Get Started"
            onPress={() => {
              fetchOrders();
              navigation.navigate("Welcome" as never);
            }}
            backgroundColor="#fff"
            textColor="#545EE1"
            borderColor="#fff"
            borderWidth={1}
            borderRadius={30}
            fontSize={20}
            fontWeight="bold"
            padding={10}
            margin={10}
            width={180}
            height={50}
          />
        </View>
      </View>
    </View>
  );
};

export default GetStartedScreen;

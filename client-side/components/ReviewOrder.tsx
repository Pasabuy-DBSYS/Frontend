import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Dimensions,
} from "react-native";
import AuthLeftButton from "./svg/AuthLeftButton";
import { useNavigation } from "@react-navigation/native";
import { useActiveOrderStore } from "@/app/api/store/order_store";
import { useOtherUser } from "@/app/api/hook/useOtherUser";
import { Image } from "expo-image";
const { width } = Dimensions.get("window");

const RATING_LABELS = [
  "",
  "Poor Delivery",
  "Could be better",
  "Average Delivery",
  "Good Delivery, but can be better!",
  "Excellent Delivery!",
];

const ReviewOrder = () => {
  const navigation = useNavigation<any>();
  const [rating, setRating] = useState(4);
  const [feedback, setFeedback] = useState("");
  const otherUser = useOtherUser();
  const { clearActiveOrder, setPendingReview } = useActiveOrderStore();

  // Default courier data
  const courierName = otherUser?.firstName
    ? `${otherUser.firstName} ${otherUser.lastName || ""}`.trim()
    : "Your Courier";

  const handleSubmit = () => {
    // TODO: Submit review to API
    console.log("Review submitted:", { rating, feedback });

    // Clear the active order and pending review flag
    clearActiveOrder();
    setPendingReview(false);

    // Navigate to home (CustomerNavigationBar)
    navigation.reset({
      index: 0,
      routes: [{ name: "CustomerNavigationBar" }],
    });
  };

  const handleBack = () => {
    // Clear the active order and pending review flag when going back
    clearActiveOrder();
    setPendingReview(false);

    // Navigate to home
    navigation.reset({
      index: 0,
      routes: [{ name: "CustomerNavigationBar" }],
    });
  };

  const renderStars = () => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <TouchableOpacity key={i} onPress={() => setRating(i)}>
          <Text
            style={{
              fontSize: 40,
              color: i <= rating ? "#FFD700" : "#D3D3D3",
              marginHorizontal: 4,
            }}
          >
            ★
          </Text>
        </TouchableOpacity>
      );
    }
    return stars;
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#fff" }}>
      {/* Header */}
      <View
        style={{
          height: 110,
          backgroundColor: "#545EE1",
          paddingHorizontal: 20,
          paddingTop: 60,
          flexDirection: "row",
          alignItems: "center",
        }}
      >
        <AuthLeftButton onPress={handleBack} color="#fff" />
        <Text
          style={{
            color: "#fff",
            fontSize: 20,
            fontWeight: "700",
            marginLeft: 16,
          }}
        >
          Submit Review
        </Text>
      </View>

      <ScrollView style={{ flex: 1 }}>
        {/* Success Banner */}
        <View
          style={{
            backgroundColor: "#545EE1",
            marginHorizontal: 20,
            marginTop: 20,
            borderRadius: 12,
            padding: 16,
          }}
        >
          <Text style={{ color: "#fff", fontSize: 16, fontWeight: "700" }}>
            Thank you for ordering!
          </Text>
          <Text
            style={{
              color: "rgba(255,255,255,0.8)",
              fontSize: 13,
              marginTop: 4,
            }}
          >
            Order fulfilled per your instructions
          </Text>
        </View>

        {/* Courier Avatar */}
        <View style={{ alignItems: "center", marginTop: 30 }}>
          <View
            style={{
              width: 80,
              height: 80,
              justifyContent: "center",
              alignItems: "center",
              overflow: "hidden",
            }}
          >
            <Image
              source={{
                uri: `https://pasabuyres.s3.ap-southeast-2.amazonaws.com/${otherUser?.profilePictureKey}`,
              }}
              cachePolicy={"memory-disk"}
              style={{ width: 80, height: 80 }}
            />
          </View>

          <Text
            style={{
              marginTop: 16,
              fontSize: 14,
              color: "#777",
            }}
          >
            Rate your delivery by {courierName}
          </Text>

          <Text
            style={{
              marginTop: 8,
              fontSize: 18,
              fontWeight: "700",
              color: "#333",
              textAlign: "center",
              paddingHorizontal: 20,
            }}
          >
            {RATING_LABELS[rating]}
          </Text>
        </View>

        {/* Star Rating */}
        <View
          style={{
            flexDirection: "row",
            justifyContent: "center",
            marginTop: 20,
          }}
        >
          {renderStars()}
        </View>

        {/* Feedback Input */}
        <View style={{ paddingHorizontal: 20, marginTop: 30 }}>
          <Text
            style={{
              fontSize: 14,
              fontWeight: "600",
              color: "#333",
              marginBottom: 8,
            }}
          >
            Share your feedback
          </Text>
          <TextInput
            style={{
              borderWidth: 1,
              borderColor: "#ddd",
              borderRadius: 12,
              padding: 16,
              height: 120,
              textAlignVertical: "top",
              fontSize: 14,
            }}
            placeholder="Tell us about your experience..."
            placeholderTextColor="#aaa"
            multiline
            value={feedback}
            onChangeText={setFeedback}
          />
        </View>

        {/* Submit Button */}
        <View
          style={{ paddingHorizontal: 20, marginTop: 30, marginBottom: 40 }}
        >
          <TouchableOpacity
            onPress={handleSubmit}
            style={{
              backgroundColor: "#545EE1",
              paddingVertical: 16,
              borderRadius: 30,
              alignItems: "center",
            }}
          >
            <Text style={{ color: "#fff", fontSize: 16, fontWeight: "700" }}>
              Submit
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

export default ReviewOrder;

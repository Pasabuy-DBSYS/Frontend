import React, { useState } from "react";
import { View, Text, FlatList, TouchableOpacity, Platform } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";

interface Notification {
  id: string;
  type: "order" | "delivery" | "promo" | "system";
  title: string;
  message: string;
  time: string;
  isRead: boolean;
}

// Dummy notification data
const DUMMY_NOTIFICATIONS: Notification[] = [
  {
    id: "1",
    type: "order",
    title: "Order Accepted",
    message:
      "Your order #11250 has been accepted by a courier. They're on their way to pick up your items.",
    time: "2 mins ago",
    isRead: false,
  },
  {
    id: "2",
    type: "delivery",
    title: "Delivery Complete",
    message:
      "Order #11231 has been delivered successfully. Don't forget to rate your courier!",
    time: "1 hour ago",
    isRead: false,
  },
  {
    id: "3",
    type: "promo",
    title: "🎉 Special Offer!",
    message: "Get 20% off on your next order! Use code PASABUY20 at checkout.",
    time: "3 hours ago",
    isRead: true,
  },
  {
    id: "4",
    type: "system",
    title: "Welcome to Pasabuy!",
    message:
      "Thank you for joining Pasabuy. Start ordering or become a courier today!",
    time: "1 day ago",
    isRead: true,
  },
  {
    id: "5",
    type: "order",
    title: "Order Cancelled",
    message:
      "Your order #11200 has been cancelled. The refund will be processed within 3-5 business days.",
    time: "2 days ago",
    isRead: true,
  },
  {
    id: "6",
    type: "delivery",
    title: "Courier Nearby",
    message:
      "Your courier is less than 1km away. Please prepare to receive your order.",
    time: "3 days ago",
    isRead: true,
  },
];

const getNotificationIcon = (
  type: Notification["type"]
): { name: keyof typeof Ionicons.glyphMap; color: string; bgColor: string } => {
  switch (type) {
    case "order":
      return { name: "cart", color: "#545EE1", bgColor: "#E8EBFF" };
    case "delivery":
      return { name: "bicycle", color: "#4CAF50", bgColor: "#E8F5E9" };
    case "promo":
      return { name: "pricetag", color: "#FF9800", bgColor: "#FFF3E0" };
    case "system":
      return {
        name: "information-circle",
        color: "#2196F3",
        bgColor: "#E3F2FD",
      };
    default:
      return { name: "notifications", color: "#666", bgColor: "#F5F5F5" };
  }
};

interface NotificationsProps {
  isCourier?: boolean;
}

const Notifications: React.FC<NotificationsProps> = ({ isCourier = false }) => {
  const [notifications, setNotifications] =
    useState<Notification[]>(DUMMY_NOTIFICATIONS);

  const markAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((notif) =>
        notif.id === id ? { ...notif, isRead: true } : notif
      )
    );
  };

  const markAllAsRead = () => {
    setNotifications((prev) =>
      prev.map((notif) => ({ ...notif, isRead: true }))
    );
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const renderNotification = ({ item }: { item: Notification }) => {
    const icon = getNotificationIcon(item.type);

    return (
      <TouchableOpacity
        onPress={() => markAsRead(item.id)}
        activeOpacity={0.8}
        style={{
          backgroundColor: item.isRead ? "white" : "#F0F4FF",
          borderRadius: 12,
          padding: 14,
          marginBottom: 10,
          flexDirection: "row",
          alignItems: "flex-start",
          borderLeftWidth: item.isRead ? 0 : 3,
          borderLeftColor: "#545EE1",
          shadowColor: "#000",
          shadowOpacity: 0.05,
          shadowRadius: 4,
          shadowOffset: { width: 0, height: 2 },
          elevation: 2,
        }}
      >
        <View
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: icon.bgColor,
            justifyContent: "center",
            alignItems: "center",
            marginRight: 12,
          }}
        >
          <Ionicons name={icon.name} size={20} color={icon.color} />
        </View>

        <View style={{ flex: 1 }}>
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Text
              style={{
                fontSize: 15,
                fontWeight: item.isRead ? "500" : "700",
                color: "#333",
                flex: 1,
              }}
              numberOfLines={1}
            >
              {item.title}
            </Text>
            {!item.isRead && (
              <View
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: "#545EE1",
                  marginLeft: 8,
                }}
              />
            )}
          </View>

          <Text
            style={{
              fontSize: 13,
              color: "#666",
              marginTop: 4,
              lineHeight: 18,
            }}
            numberOfLines={2}
          >
            {item.message}
          </Text>

          <Text
            style={{
              fontSize: 11,
              color: "#999",
              marginTop: 6,
            }}
          >
            {item.time}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <LinearGradient
      colors={isCourier ? ["#FFFFFF", "#545EE1"] : ["#545EE1", "#FFFFFF"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      style={{ flex: 1 }}
    >
      <View
        style={{
          flex: 1,
          paddingHorizontal: 20,
          paddingTop: Platform.OS === "android" ? 50 : 60,
        }}
      >
        {/* Header */}
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 20,
          }}
        >
          <View>
            <Text
              style={{
                fontSize: 28,
                fontWeight: "bold",
                color: isCourier ? "#333" : "white",
              }}
            >
              Notifications
            </Text>
            {unreadCount > 0 && (
              <Text
                style={{
                  fontSize: 14,
                  color: isCourier ? "#666" : "rgba(255,255,255,0.8)",
                  marginTop: 4,
                }}
              >
                {unreadCount} unread notification{unreadCount > 1 ? "s" : ""}
              </Text>
            )}
          </View>

          {unreadCount > 0 && (
            <TouchableOpacity
              onPress={markAllAsRead}
              style={{
                backgroundColor: isCourier
                  ? "#E8EBFF"
                  : "rgba(255,255,255,0.2)",
                paddingHorizontal: 12,
                paddingVertical: 6,
                borderRadius: 16,
              }}
            >
              <Text
                style={{
                  fontSize: 12,
                  fontWeight: "600",
                  color: isCourier ? "#545EE1" : "white",
                }}
              >
                Mark all read
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Notifications List */}
        {notifications.length === 0 ? (
          <View
            style={{
              flex: 1,
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <Ionicons
              name="notifications-off-outline"
              size={64}
              color={isCourier ? "#ccc" : "rgba(255,255,255,0.5)"}
            />
            <Text
              style={{
                fontSize: 16,
                color: isCourier ? "#666" : "rgba(255,255,255,0.7)",
                marginTop: 16,
              }}
            >
              No notifications yet
            </Text>
          </View>
        ) : (
          <FlatList
            data={notifications}
            keyExtractor={(item) => item.id}
            renderItem={renderNotification}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 100 }}
          />
        )}
      </View>
    </LinearGradient>
  );
};

export default Notifications;

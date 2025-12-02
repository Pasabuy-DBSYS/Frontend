import React, { useEffect, useRef } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Platform,
  ActivityIndicator,
  PanResponder,
  Animated,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useNotificationStore } from "@/app/api/store/notification_store";
import { useNotificationHubStore } from "@/app/api/store/notification_hub_store";
import { NotificationResponseDTO } from "@/app/api/dto/response/notification.response.dto";
import { useAuthStore } from "@/app/api/store/auth_store";
import { Role } from "@/types/types";
import { deleteNotification } from "@/app/api/notifications";

// Get icon based on notification title
const getNotificationIcon = (
  title: string
): { name: keyof typeof Ionicons.glyphMap; color: string; bgColor: string } => {
  const lowerTitle = title.toLowerCase();

  if (lowerTitle.includes("accepted")) {
    return { name: "checkmark-circle", color: "#4CAF50", bgColor: "#E8F5E9" };
  }
  if (lowerTitle.includes("picked up")) {
    return { name: "bag-check", color: "#2196F3", bgColor: "#E3F2FD" };
  }
  if (lowerTitle.includes("transit") || lowerTitle.includes("on the way")) {
    return { name: "bicycle", color: "#FF9800", bgColor: "#FFF3E0" };
  }
  if (lowerTitle.includes("delivered")) {
    return { name: "gift", color: "#4CAF50", bgColor: "#E8F5E9" };
  }
  if (lowerTitle.includes("cancelled")) {
    return { name: "close-circle", color: "#F44336", bgColor: "#FFEBEE" };
  }
  if (lowerTitle.includes("review")) {
    return { name: "star", color: "#FFC107", bgColor: "#FFF8E1" };
  }
  if (lowerTitle.includes("order")) {
    return { name: "cart", color: "#545EE1", bgColor: "#E8EBFF" };
  }

  return { name: "notifications", color: "#666", bgColor: "#F5F5F5" };
};

// Format time for display
const formatNotificationTime = (dateString: string): string => {
  if (!dateString) return "";

  try {
    const isoString = dateString.replace(" ", "T");
    const date = new Date(isoString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? "s" : ""} ago`;
    if (diffHours < 24)
      return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;

    return new Intl.DateTimeFormat("en-PH", {
      month: "short",
      day: "numeric",
      timeZone: "Asia/Manila",
    }).format(date);
  } catch (error) {
    return "";
  }
};


interface NotificationItemProps {
  item: NotificationResponseDTO;
  onMarkAsRead: (id: number) => void;
  onDelete: (id: number) => void;
}

interface NotificationItemProps {
  item: NotificationResponseDTO;
  onMarkAsRead: (id: number) => void;
  onDelete: (id: number) => void;
}

const NotificationItem: React.FC<NotificationItemProps> = ({
  item,
  onMarkAsRead,
  onDelete,
}) => {
  const translateX = useRef(new Animated.Value(0)).current;
  const icon = getNotificationIcon(item.title);
  const isRead = item.pressed;

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gesture) => {
        // Activate if horizontal move is significant
        return Math.abs(gesture.dx) > 10 && Math.abs(gesture.dy) < 10;
      },
      onPanResponderMove: (_, gesture) => {
        // Track if swiping RIGHT (positive dx)
        if (gesture.dx > 0) {
          translateX.setValue(gesture.dx);
        }
      },
      onPanResponderRelease: (_, gesture) => {
        // Check if swiped far enough to the RIGHT (over 100)
        if (gesture.dx > 100) {
          Animated.timing(translateX, {
            // Animate off-screen to the RIGHT
            toValue: 500,
            duration: 200,
            useNativeDriver: true,
          }).start(() => {
            onDelete(item.notificationPkId);
          });
        } else {
          // Snap back to original position
          Animated.spring(translateX, {
            toValue: 0,
            useNativeDriver: true,
            bounciness: 10,
          }).start();
        }
      },
    })
  ).current;

  return (
    <View style={{ marginBottom: 10 }}>
      {/* Delete button positioned on the LEFT, visible when swiping right */}
      <View
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          bottom: 0,
          width: "100%",
          backgroundColor: "#FFEBEE",
          borderRadius: 12,
          justifyContent: "center",
          alignItems: "flex-start", // Align icon to the start (left)
          paddingLeft: 20,
        }}
      >
        <Ionicons name="trash-outline" size={24} color="#F44336" />
      </View>

      <Animated.View
        style={{
          transform: [{ translateX }],
          backgroundColor: isRead ? "white" : "#F0F4FF",
          borderRadius: 12,
          // Removed original borderLeft logic entirely
          shadowColor: "#000",
          shadowOpacity: 0.05,
          shadowRadius: 4,
          shadowOffset: { width: 0, height: 2 },
          elevation: 2,
        }}
        {...panResponder.panHandlers}
      >
        <TouchableOpacity
          onPress={() => onMarkAsRead(item.notificationPkId)}
          activeOpacity={0.9}
          style={{
            padding: 14,
            flexDirection: "row",
            alignItems: "flex-start",
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
                  fontWeight: isRead ? "500" : "700",
                  color: "#333",
                  flex: 1,
                }}
                numberOfLines={1}
              >
                {item.title}
              </Text>
              {!isRead && (
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
          </View>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
};

interface NotificationsProps {
  isCourier?: boolean;
}

const Notifications: React.FC<NotificationsProps> = ({}) => {
  const { user } = useAuthStore();
  const isCourier = user?.currentRole === Role.COURIER;

  const {
    notifications,
    unreadCount,
    isLoading,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    addNotification,
    deleteNotification,
  } = useNotificationStore();

  const { addHandler, removeHandler } = useNotificationHubStore();

  // Fetch notifications on mount and setup real-time listener
  useEffect(() => {
    fetchNotifications();

    console.log(`NOTIFCATIONS: ${JSON.stringify(notifications)}`);
    // Listen for real-time notifications
    const handleReceiveNotification = (
      notification: NotificationResponseDTO
    ) => {
      console.log("📬 Received notification:", notification);
      addNotification(notification);
    };

    addHandler("ReceiveNotification", handleReceiveNotification);

    return () => {
      removeHandler("ReceiveNotification");
    };
  }, []);

  const handleMarkAsRead = async (notificationId: number) => {
    await markAsRead(notificationId);
  };

  const handleMarkAllAsRead = async () => {
    await markAllAsRead();
  };

  const renderNotification = ({ item }: { item: NotificationResponseDTO }) => {
    return (
      <NotificationItem
        item={item}
        onMarkAsRead={handleMarkAsRead}
        onDelete={deleteNotification}
      />
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
              onPress={handleMarkAllAsRead}
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
        {isLoading ? (
          <View
            style={{
              flex: 1,
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <ActivityIndicator size="large" color="#545EE1" />
            <Text style={{ marginTop: 10, color: "#666" }}>
              Loading notifications...
            </Text>
          </View>
        ) : notifications.length === 0 ? (
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
            keyExtractor={(item) => item.notificationPkId.toString()}
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

import ParticipantHeader from "@/components/ParticipantHeader";
import { LinearGradient } from "expo-linear-gradient";
import { ActivityIndicator, FlatList, Text, View } from "react-native";
import MessageBubble from "./MessageBubble";
import Composer from "./Composer";
import { useEffect, useState } from "react";
import { getMessagesByRoomId } from "@/app/api/chat";
import { ChatMessagesResponseDTO } from "@/app/api/dto/response/chat.response.dto";
import {
  RoomInfo,
  useMessageRoomInfo,
  useMessageRoomState,
} from "@/app/api/store/message_room_store";
import { useAuthStore } from "@/app/api/store/auth_store";
import { subscribeToMessages } from "@/app/api/chat";
import { postMessage } from "@/app/api/chat";
import {
  MessageRequestDTO,
  MessageType,
} from "@/app/api/dto/request/message.request.dto";

const fallbackParticipant = {
  id: "courier-001",
  name: "Theo Pondar",
  avatarUrl: "https://i.pravatar.cc/120?img=12",
};

export default function MessagePage() {
  const [draft, setDraft] = useState("");
  const [messages, setMessages] = useState<ChatMessagesResponseDTO[]>([]);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [messagesError, setMessagesError] = useState<string | null>(null);
  const info: RoomInfo = useMessageRoomInfo()!;
  const { roomId } = info;

  const messageRoomParticipants = useMessageRoomState(
    (state) => state.messageRoomParticipants
  );
  const currentUserId = useAuthStore((state) => state.user?.userIdPK ?? null);

  useEffect(() => {
    if (!roomId) return;

    let unsubscribe: (() => void) | undefined;
    let isMounted = true;

    const initMessages = async () => {
      setIsLoadingMessages(true);
      setMessagesError(null);

      try {
        const data = await getMessagesByRoomId(roomId);

        if (isMounted) {
          const orderedMessages = [...data].sort(
            (a, b) => a.messageIdPK - b.messageIdPK
          );
          setMessages(orderedMessages);
        }

        unsubscribe = await subscribeToMessages(roomId, (newMsg) => {
          setMessages((prev) => [...prev, newMsg]);
        });
      } catch (err: any) {
        console.error("❌ Error in initMessages:", err);

        // Optionally be more specific:
        if (err?.response) {
          console.error("📩 Server response:", err.response);
        } else if (err?.message) {
          console.error("💬 Error message:", err.message);
        }

        if (isMounted) {
          setMessagesError("Unable to load messages right now.");
        }
      } finally {
        if (isMounted) {
          setIsLoadingMessages(false);
        }
      }
    };

    initMessages();

    // Clean up SignalR listener when room changes or unmounts
    return () => {
      isMounted = false;
      unsubscribe?.();
    };
  }, [roomId]);

  const handleSend = async () => {
    if (!draft.trim() || !roomId) return;

    if (!info || !info.roomId || !info.myId || !info.otherId) {
      console.warn("Missing sender or receiver ID — cannot send message.");
      return;
    }
    const messageRequest: MessageRequestDTO = {
      roomIdFK: info.roomId,
      senderIdFK: info.myId,
      receiverIdFK: info.otherId,
      message: draft.trim(),
      messageType: MessageType.TEXT,
      sentAt: new Date().toISOString(),
    };

    console.log(`MESSAGE REQUEST: ${JSON.stringify(messageRequest)}`);
    try {
      await postMessage(messageRequest);
    } catch (err) {
      console.error("Failed to send message:", err);
    } finally {
      setDraft("");
    }
  };
  const inferredUserId =
    currentUserId ?? messageRoomParticipants?.senderId ?? null;

  return (
    <LinearGradient
      colors={["#545EE1", "#FFFFFF"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      style={{ flex: 1, paddingHorizontal: 20 }}
    >
      <ParticipantHeader
        participant={fallbackParticipant}
        onBack={() => console.log("go back")}
        onCall={() => console.log("call courier")}
        onMore={() => console.log("more actions")}
      />

      <View style={{ flex: 1, marginTop: 20 }}>
        {!roomId ? (
          <View
            style={{ flex: 1, alignItems: "center", justifyContent: "center" }}
          >
            <Text style={{ color: "#555", textAlign: "center" }}>
              Select or accept an order to start messaging.
            </Text>
          </View>
        ) : (
          <>
            <FlatList<ChatMessagesResponseDTO>
              data={messages}
              keyExtractor={(item) => item.messageIdPK.toString()}
              renderItem={({ item }) => {
                const isMine =
                  inferredUserId !== null && item.senderIdFK === inferredUserId;
                return (
                  <View
                    style={{
                      flexDirection: "row",
                      justifyContent: isMine ? "flex-end" : "flex-start",
                    }}
                  >
                    <MessageBubble
                      text={item.message}
                      avatarUrl={
                        isMine ? undefined : fallbackParticipant.avatarUrl
                      }
                      initials={isMine ? "ME" : "TP"}
                      isMe={isMine}
                    />
                  </View>
                );
              }}
              ListEmptyComponent={
                !isLoadingMessages ? (
                  <Text
                    style={{
                      textAlign: "center",
                      color: "#777",
                      marginTop: 16,
                    }}
                  >
                    No messages yet. Start the conversation!
                  </Text>
                ) : null
              }
            />
            {isLoadingMessages && (
              <ActivityIndicator
                style={{ marginVertical: 12 }}
                color="#545EE1"
              />
            )}
            {messagesError && (
              <Text
                style={{ color: "red", textAlign: "center", marginVertical: 8 }}
              >
                {messagesError}
              </Text>
            )}
          </>
        )}
        <Composer
          value={draft}
          onChangeText={setDraft}
          onSend={handleSend}
          onPickMedia={() => console.log("camera")}
        />
      </View>
    </LinearGradient>
  );
}

import ParticipantHeader, { Participant } from "@/components/ParticipantHeader";
import { LinearGradient } from "expo-linear-gradient";
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Text,
  View,
} from "react-native";
import MessageBubble from "./MessageBubble";
import Composer from "./Composer";
import { useEffect, useRef, useState } from "react";
import * as ImagePicker from "expo-image-picker";

import {
  getMessagesByRoomId,
  loadImageByKey,
  postImageMessage,
} from "@/app/api/chat";
import { ChatMessagesResponseDTO } from "@/app/api/dto/response/chat.response.dto";
import {
  RoomInfo,
  useMessageRoomInfo,
  useMessageRoomState,
} from "@/app/api/store/message_room_store";
import { useAuthStore } from "@/app/api/store/auth_store";
import { subscribeToMessages } from "@/app/api/chat";
import { postTextMessage } from "@/app/api/chat";
import {
  MessageImageRequestDTO,
  MessageRequestDTO,
  MessageType,
} from "@/app/api/dto/request/message.request.dto";
import { useOtherUser } from "@/app/api/hook/useOtherUser";
import { UserResponseDTO } from "@/app/api/dto/response/auth.response.dto";

export default function MessagePage() {
  const otherUser = useOtherUser();
  const [draft, setDraft] = useState("");
  const [messages, setMessages] = useState<ChatMessagesResponseDTO[]>([]);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [messagesError, setMessagesError] = useState<string | null>(null);
  const info: RoomInfo = useMessageRoomInfo()!;
  const { roomId } = info;
  const formatFullName = (u: UserResponseDTO) => {
    return [u?.firstName, u?.middleName, u?.lastName].filter(Boolean).join(" ");
  };

  const flatListRef = useRef<FlatList<ChatMessagesResponseDTO>>(null);

  const scrollToBottom = () => {
    if (flatListRef.current) {
      flatListRef.current.scrollToEnd({ animated: true });
    }
  };

  useEffect(() => {
    if (messages.length > 0) {
      scrollToBottom();
    }
  }, [messages]);

  const otherParticipant: Participant = {
    id: otherUser?.userIdPK ?? 0,
    name: formatFullName(otherUser as UserResponseDTO) as string,
    avatarUrl: otherUser?.profilePictureKey,
  };
  const openCamera = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") return null;

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: false,
      quality: 0.85,
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
    });

    if (result.canceled) return null;

    const asset = result.assets[0];

    return {
      uri: asset.uri,
      name: asset.fileName ?? "captured.jpg",
      type: "image/jpeg",
    };
  };

  const handlePickCamera = async () => {
    const image = await openCamera();
    if (!image) return;

    if (!info || !info.roomId || !info.myId || !info.otherId) {
      console.warn("Missing IDs — cannot send.");
      return;
    }

    const messageRequest: MessageImageRequestDTO = {
      roomIdFK: info.roomId,
      senderIdFK: info.myId,
      receiverIdFK: info.otherId,
      message: "",
      image: image,
      messageType: MessageType.IMAGE,
      sentAt: new Date().toISOString(),
    };

    const form = new FormData();
    form.append("RoomIdFK", String(info.roomId));
    form.append("SenderIdFK", String(info.myId));
    form.append("ReceiverIdFK", String(info.otherId));
    form.append("Image", image as any); // IMPORTANT
    form.append("Message", "image");
    form.append("MessageType", MessageType.IMAGE.toString());
    form.append("SentAt", new Date().toISOString());
    console.log(`SEND IMAGE REQUEST ${JSON.stringify(form)}`);
    await postImageMessage(form);
  };

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
          const ordered = [...data].sort(
            (a, b) => a.messageIdPK - b.messageIdPK
          );
          setMessages(ordered);
        }

        unsubscribe = await subscribeToMessages(roomId, async (newMsg) => {
          setMessages((prev) => [...prev, newMsg]);
        });
      } catch (err: any) {
        console.error("Error in initMessages:", err);

        if (err?.response) {
          console.error("Server response:", err.response);
        } else if (err?.message) {
          console.error("Error message:", err.message);
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
      await postTextMessage(messageRequest);
      scrollToBottom();
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
        participant={otherParticipant}
        onBack={() => console.log("go back")}
        onCall={() => console.log("call courier")}
        onMore={() => console.log("more actions")}
      />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? -30 : 0}
      >
        <View
          style={{ flex: 1, marginTop: 20 }}
          onStartShouldSetResponder={() => {
            scrollToBottom();
            return false;
          }}
        >
          {!roomId ? (
            <View
              style={{
                flex: 1,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Text style={{ color: "#555", textAlign: "center" }}>
                Select or accept an order to start messaging.
              </Text>
            </View>
          ) : (
            <>
              <FlatList<ChatMessagesResponseDTO>
                ref={flatListRef}
                data={messages}
                onLayout={scrollToBottom}
                onContentSizeChange={scrollToBottom}
                // Improve performance
                initialNumToRender={20}
                windowSize={10}
                keyExtractor={(item) => item.messageIdPK.toString()}
                renderItem={({ item }) => {
                  const isMine =
                    inferredUserId !== null &&
                    item.senderIdFK === inferredUserId;
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
                          isMine ? undefined : otherParticipant.avatarUrl
                        }
                        initials={isMine ? "ME" : "TP"}
                        isMe={isMine}
                        messageType={item.messageType}
                      />
                    </View>
                  );
                }}
                ListEmptyComponent={
                  !isLoadingMessages ? (
                    <Text
                      style={{
                        textAlign: "center",
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
                  style={{
                    color: "red",
                    textAlign: "center",
                    marginVertical: 8,
                  }}
                >
                  {messagesError}
                </Text>
              )}
            </>
          )}
          <View
            style={{
              marginBottom: "10%",
            }}
          >
            <Composer
              value={draft}
              onChangeText={setDraft}
              onSend={handleSend}
              onPickMedia={handlePickCamera} // <— update this!
            />
          </View>
        </View>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

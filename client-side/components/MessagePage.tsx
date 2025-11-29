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
import CachedImage from "./CachedImage";
import Composer from "./Composer";
import { useEffect, useMemo, useRef, useState } from "react";
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
import { useMessageCacheStore } from "@/app/api/store/message_cache_store";
import { subscribeToMessages } from "@/app/api/chat";
import { postTextMessage } from "@/app/api/chat";
import {
  MessageImageRequestDTO,
  MessageRequestDTO,
  MessageType,
} from "@/app/api/dto/request/message.request.dto";
import { useOtherUser } from "@/app/api/hook/useOtherUser";
import { UserResponseDTO } from "@/app/api/dto/response/auth.response.dto";
import { useIsFocused } from "@react-navigation/native";
import { useActiveOrderStore } from "@/app/api/store/order_store";

export default function MessagePage() {
  const otherUser = useOtherUser();
  const activeOrder = useActiveOrderStore((state) => state.activeOrder);
  const [draft, setDraft] = useState("");
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [messagesError, setMessagesError] = useState<string | null>(null);

  // Get the offered amount from the active order
  const offeredAmount = activeOrder?.paymentsResponseDTO?.proposedItemsFee ?? 0;

  // Pending image uploads: { tempId, localUri, progress }
  const [pendingUploads, setPendingUploads] = useState<
    { tempId: string; localUri: string; progress: number }[]
  >([]);

  const info = useMessageRoomInfo();
  const roomId = info?.roomId ?? null;

  // Read the entire messagesByRoom object and memoize the specific room's messages
  const messagesByRoom = useMessageCacheStore((state) => state.messagesByRoom);
  const messages = useMemo(() => {
    if (!roomId) return [];
    return messagesByRoom[roomId] ?? [];
  }, [messagesByRoom, roomId]);

  const isFocused = useIsFocused();
  const setIsFocused = useMessageRoomState((s) => s.setIsFocused);

  const formatFullName = (u: UserResponseDTO) => {
    return [u?.firstName, u?.middleName, u?.lastName].filter(Boolean).join(" ");
  };

  const flatListRef = useRef<FlatList<ChatMessagesResponseDTO>>(null);
  const hasScrolledInitially = useRef(false);

  useEffect(() => {
    setIsFocused(isFocused);
  }, [isFocused]);

  const scrollToBottom = (animated = true) => {
    if (flatListRef.current) {
      flatListRef.current.scrollToEnd({ animated });
    }
  };

  // Scroll to bottom on initial load (without animation)
  useEffect(() => {
    if (messages.length > 0 && !hasScrolledInitially.current) {
      // Small delay to ensure FlatList has rendered
      setTimeout(() => {
        scrollToBottom(false);
        hasScrolledInitially.current = true;
      }, 100);
    }
  }, [messages]);

  // Reset scroll flag when leaving the page
  useEffect(() => {
    if (!isFocused) {
      hasScrolledInitially.current = false;
    }
  }, [isFocused]);

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
      quality: 0.5,
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

  const uploadImage = async (image: {
    uri: string;
    name: string;
    type: string;
  }) => {
    if (!info || !info.roomId || !info.myId || !info.otherId) {
      console.warn("Missing IDs — cannot send.");
      return;
    }

    // Create a temp ID for this upload
    const tempId = `pending_${Date.now()}`;

    // Add to pending uploads immediately (shows placeholder)
    setPendingUploads((prev) => [
      ...prev,
      { tempId, localUri: image.uri, progress: 0 },
    ]);

    // Simulate progress updates
    const progressInterval = setInterval(() => {
      setPendingUploads((prev) =>
        prev.map((p) =>
          p.tempId === tempId
            ? { ...p, progress: Math.min(p.progress + 15, 90) }
            : p
        )
      );
    }, 200);

    try {
      const form = new FormData();
      form.append("RoomIdFK", String(info.roomId));
      form.append("SenderIdFK", String(info.myId));
      form.append("ReceiverIdFK", String(info.otherId));
      form.append("Image", image as any);
      form.append("Message", "image");
      form.append("MessageType", MessageType.IMAGE.toString());
      form.append("SentAt", new Date().toISOString());

      console.log(`[UPLOAD] 📤 Starting upload: ${tempId}`);
      await postImageMessage(form);

      // Set progress to 100%
      setPendingUploads((prev) =>
        prev.map((p) => (p.tempId === tempId ? { ...p, progress: 100 } : p))
      );

      console.log(`[UPLOAD] ✅ Complete: ${tempId}`);
    } catch (err) {
      console.error(`[UPLOAD] ❌ Failed: ${tempId}`, err);
    } finally {
      clearInterval(progressInterval);
      // Remove from pending after a short delay (real message will appear via SignalR)
      setTimeout(() => {
        setPendingUploads((prev) => prev.filter((p) => p.tempId !== tempId));
      }, 500);
    }
  };

  const handlePickCamera = async () => {
    const image = await openCamera();
    if (!image) return;
    await uploadImage(image);
  };

  const handleUploadReceipt = async (
    image: { uri: string; name: string; type: string },
    amount: number
  ) => {
    // TODO: You can use the amount here if needed (e.g., send to backend)
    console.log(`[RECEIPT] Amount: ₱${amount}`);
    await uploadImage(image);
  };

  const messageRoomParticipants = useMessageRoomState(
    (state) => state.messageRoomParticipants
  );
  const currentUserId = useAuthStore((state) => state.user?.userIdPK ?? null);

  // Message cache store actions
  const setCachedMessages = useMessageCacheStore((s) => s.setMessages);
  const addCachedMessage = useMessageCacheStore((s) => s.addMessage);

  useEffect(() => {
    if (!roomId) return;

    let unsubscribe: (() => void) | undefined;
    let isMounted = true;

    const initMessages = async () => {
      setMessagesError(null);

      // Get cached data for comparison
      const cachedMessages = messages;
      const cachedLatestId =
        cachedMessages.length > 0
          ? Math.max(...cachedMessages.map((m) => m.messageIdPK))
          : 0;

      console.log(
        `[CACHE] Room ${roomId} - Cached messages: ${cachedMessages.length}, Latest cached ID: ${cachedLatestId}`
      );

      // If no cache, show loading
      if (cachedMessages.length === 0) {
        setIsLoadingMessages(true);
      }

      try {
        // Always fetch from server to check for new messages
        console.log(
          `[FETCH] Fetching messages from server for room ${roomId}...`
        );
        const serverData = await getMessagesByRoomId(roomId);

        if (isMounted) {
          const ordered = [...serverData].sort(
            (a, b) => a.messageIdPK - b.messageIdPK
          );

          const serverLatestId =
            ordered.length > 0
              ? Math.max(...ordered.map((m) => m.messageIdPK))
              : 0;

          // Compare: Did we get new messages?
          const hasNewMessages = serverLatestId > cachedLatestId;
          const messageCountDiff = ordered.length - cachedMessages.length;

          if (hasNewMessages || messageCountDiff !== 0) {
            console.log(
              `[FETCH] ✅ NEW DATA - Server latest ID: ${serverLatestId} > Cached: ${cachedLatestId}`
            );
            console.log(
              `[FETCH] Message count: Server=${ordered.length}, Cached=${cachedMessages.length}, Diff=${messageCountDiff}`
            );
            setCachedMessages(roomId, ordered);
          } else {
            console.log(
              `[CACHE] ✅ USING CACHE - No new messages (Server ID: ${serverLatestId} = Cached: ${cachedLatestId})`
            );
          }
        }
      } catch (err: any) {
        console.error("[FETCH] ❌ Error fetching messages:", err);
        if (isMounted && cachedMessages.length === 0) {
          setMessagesError("Unable to load messages right now.");
        }
        // If we have cache, silently use it even on error
        if (cachedMessages.length > 0) {
          console.log(
            `[CACHE] Using ${cachedMessages.length} cached messages (fetch failed)`
          );
        }
      } finally {
        if (isMounted) {
          setIsLoadingMessages(false);
        }
      }

      // Subscribe to real-time messages (always do this)
      unsubscribe = await subscribeToMessages(roomId, async (newMsg) => {
        console.log(
          `[REALTIME] 📩 New message received: ID=${newMsg.messageIdPK}`
        );
        addCachedMessage(roomId, newMsg);
      });
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
                extraData={messages.length}
                onContentSizeChange={() => {
                  if (hasScrolledInitially.current) {
                    scrollToBottom(true);
                  }
                }}
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
                ListFooterComponent={
                  pendingUploads.length > 0 ? (
                    <View>
                      {pendingUploads.map((pending) => (
                        <View
                          key={pending.tempId}
                          style={{
                            flexDirection: "row",
                            justifyContent: "flex-end",
                            paddingHorizontal: 8,
                            marginBottom: 12,
                          }}
                        >
                          <View
                            style={{
                              maxWidth: "75%",
                              paddingVertical: 10,
                              paddingHorizontal: 5,
                              marginLeft: 40,
                            }}
                          >
                            <CachedImage
                              s3Key=""
                              isPending={true}
                              localUri={pending.localUri}
                              progress={pending.progress}
                              style={{
                                width: 240,
                                height: 240,
                                borderRadius: 12,
                              }}
                            />
                          </View>
                        </View>
                      ))}
                    </View>
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
              onPickCamera={handlePickCamera}
              onUploadReceipt={handleUploadReceipt}
              offeredAmount={offeredAmount}
            />
          </View>
        </View>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

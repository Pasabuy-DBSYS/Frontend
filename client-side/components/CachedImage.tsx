import React, { useEffect, useRef, useState } from "react";
import { Image, ImageStyle } from "expo-image";
import {
  Animated,
  View,
  StyleProp,
  ViewStyle,
  TouchableOpacity,
  Modal,
  Dimensions,
  Text,
  StatusBar,
} from "react-native";
import {
  GestureHandlerRootView,
  PinchGestureHandler,
  PinchGestureHandlerGestureEvent,
  PinchGestureHandlerStateChangeEvent,
  State,
} from "react-native-gesture-handler";

interface CachedImageProps {
  s3Key: string;
  style?: StyleProp<ImageStyle>;
  /** If true, shows the image as a pending upload with blur + progress */
  isPending?: boolean;
  /** Upload progress 0-100 (only used when isPending=true) */
  progress?: number;
  /** Local URI for pending uploads (shows preview before upload completes) */
  localUri?: string;
  /** If true, disables the fullscreen modal on tap */
  disableModal?: boolean;
}

const S3_BASE_URL = "https://pasabuyres.s3.ap-southeast-2.amazonaws.com";
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

export default function CachedImage({
  s3Key,
  style,
  isPending = false,
  progress = 0,
  localUri,
  disableModal = false,
}: CachedImageProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);

  // Zoom state
  const scale = useRef(new Animated.Value(1)).current;
  const baseScale = useRef(1);

  const onPinchEvent = Animated.event<PinchGestureHandlerGestureEvent>(
    [{ nativeEvent: { scale: scale } }],
    { useNativeDriver: true }
  );

  const onPinchStateChange = (event: PinchGestureHandlerStateChangeEvent) => {
    if (event.nativeEvent.oldState === State.ACTIVE) {
      // Clamp scale between 1 and 4
      const newScale = Math.min(
        Math.max(baseScale.current * event.nativeEvent.scale, 1),
        4
      );
      baseScale.current = newScale;
      scale.setValue(newScale);
    }
  };

  const resetZoom = () => {
    baseScale.current = 1;
    scale.setValue(1);
  };

  const openModal = () => {
    if (!disableModal && !isPending) {
      setIsModalVisible(true);
    }
  };

  const closeModal = () => {
    resetZoom();
    setIsModalVisible(false);
  };

  // Skeleton shimmer animation
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isLoading || isPending) {
      const animation = Animated.loop(
        Animated.sequence([
          Animated.timing(shimmerAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(shimmerAnim, {
            toValue: 0,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      );
      animation.start();
      return () => animation.stop();
    }
  }, [isLoading, isPending]);

  // Interpolate shimmer opacity
  const shimmerOpacity = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  // For pending uploads, show local preview
  if (isPending && localUri) {
    return (
      <View>
        {/* Skeleton overlay with shimmer */}
        <Animated.View
          style={[
            style as ViewStyle,
            {
              position: "absolute",
              justifyContent: "center",
              alignItems: "center",
              backgroundColor: "#e0e0e0",
              zIndex: 2,
              opacity: shimmerOpacity,
            },
          ]}
        />

        {/* Blurred preview image */}
        <Image
          source={{ uri: localUri }}
          style={style}
          contentFit="cover"
          blurRadius={8}
        />

        {/* Progress bar */}
        <View
          style={{
            position: "absolute",
            bottom: 10,
            left: 10,
            right: 10,
            height: 4,
            backgroundColor: "rgba(0,0,0,0.3)",
            borderRadius: 2,
            zIndex: 3,
          }}
        >
          <View
            style={{
              width: `${progress}%`,
              height: "100%",
              backgroundColor: "#545EE1",
              borderRadius: 2,
            }}
          />
        </View>

        {/* Sending text */}
        <Animated.Text
          style={{
            position: "absolute",
            bottom: 20,
            alignSelf: "center",
            color: "#fff",
            fontSize: 12,
            fontWeight: "600",
            textShadowColor: "rgba(0,0,0,0.5)",
            textShadowOffset: { width: 1, height: 1 },
            textShadowRadius: 2,
            zIndex: 3,
          }}
        >
          Sending... {progress}%
        </Animated.Text>
      </View>
    );
  }

  if (!s3Key) {
    return null;
  }

  const uri = `${S3_BASE_URL}/${s3Key}`;

  return (
    <>
      {/* Thumbnail - Clickable */}
      <TouchableOpacity onPress={openModal} activeOpacity={0.9}>
        <View>
          {/* Skeleton loading with shimmer */}
          {isLoading && !hasError && (
            <Animated.View
              style={[
                style as ViewStyle,
                {
                  position: "absolute",
                  justifyContent: "center",
                  alignItems: "center",
                  backgroundColor: "#e0e0e0",
                  zIndex: 1,
                  opacity: shimmerOpacity,
                },
              ]}
            />
          )}
          {/* Error state */}
          {hasError && (
            <View
              style={[
                style as ViewStyle,
                {
                  justifyContent: "center",
                  alignItems: "center",
                  backgroundColor: "#f0f0f0",
                },
              ]}
            >
              <Text style={{ color: "#999", fontSize: 12 }}>
                Failed to load
              </Text>
            </View>
          )}
          <Image
            source={{ uri }}
            style={[style, hasError && { display: "none" }]}
            contentFit="cover"
            cachePolicy="memory-disk"
            priority="high"
            recyclingKey={s3Key}
            onLoad={() => {
              setIsLoading(false);
              setHasError(false);
            }}
            onError={(error) => {
              setIsLoading(false);
              setHasError(true);
              console.error(`[IMAGE CACHE] ❌ Error loading ${s3Key}:`, error);
            }}
          />
        </View>
      </TouchableOpacity>

      {/* Fullscreen Modal with Zoom */}
      <Modal
        visible={isModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={closeModal}
        statusBarTranslucent
      >
        <StatusBar
          backgroundColor="rgba(0,0,0,0.95)"
          barStyle="light-content"
        />
        <View
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.95)",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          {/* Exit Button - Upper Left */}
          <TouchableOpacity
            onPress={closeModal}
            style={{
              position: "absolute",
              top: 50,
              left: 20,
              zIndex: 10,
              backgroundColor: "rgba(255,255,255,0.2)",
              borderRadius: 20,
              width: 40,
              height: 40,
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <Text style={{ color: "#fff", fontSize: 24, fontWeight: "300" }}>
              ✕
            </Text>
          </TouchableOpacity>

          {/* Zoom hint */}
          <Text
            style={{
              position: "absolute",
              bottom: 40,
              color: "rgba(255,255,255,0.6)",
              fontSize: 12,
            }}
          >
            Pinch to zoom
          </Text>

          {/* Zoomable Image */}
          <GestureHandlerRootView style={{ flex: 1, justifyContent: "center" }}>
            <PinchGestureHandler
              onGestureEvent={onPinchEvent}
              onHandlerStateChange={onPinchStateChange}
            >
              <Animated.View
                style={{
                  transform: [{ scale }],
                }}
              >
                <Image
                  source={{ uri }}
                  style={{
                    width: SCREEN_WIDTH,
                    height: SCREEN_HEIGHT * 0.7,
                  }}
                  contentFit="contain"
                  cachePolicy="memory-disk"
                />
              </Animated.View>
            </PinchGestureHandler>
          </GestureHandlerRootView>
        </View>
      </Modal>
    </>
  );
}

export const buildS3Url = (key: string): string => {
  return `${S3_BASE_URL}/${key}`;
};

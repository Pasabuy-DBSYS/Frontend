import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Animated,
  ActivityIndicator,
  Image,
  Modal,
  Pressable,
  Dimensions,
} from "react-native";
import { Ionicons, Feather } from "@expo/vector-icons";
import {
  PaymentsResponseDTO,
  PaymentStatuses,
} from "@/app/api/dto/response/payment.response.dto";

const S3_BASE_URL = "https://pasabuyres.s3.ap-southeast-2.amazonaws.com";

type PaymentBannerProps = {
  payment: PaymentsResponseDTO | null;
  onAccept: () => Promise<void>;
  onReject: () => Promise<void>;
  isCustomer: boolean; // true = customer can accept/reject, false = courier waiting
  isSubmitting?: boolean; // loading state when submitting proposal
};

export default function PaymentBanner({
  payment,
  onAccept,
  onReject,
  isCustomer,
  isSubmitting = false,
}: PaymentBannerProps) {
  const [isAccepting, setIsAccepting] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [status, setStatus] = useState<"pending" | "accepted" | "rejected">(
    "pending"
  );

  const slideAnim = useRef(new Animated.Value(-100)).current;
  const fadeAnim = useRef(new Animated.Value(1)).current; // Start at 1 (visible)

  useEffect(() => {
    if (payment && !payment.isItemsFeeConfirmed) {
      // Reset and animate in
      slideAnim.setValue(-100);
      fadeAnim.setValue(0);

      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: 0,
          friction: 8,
          tension: 40,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
      setStatus("pending");
    } else if (payment?.isItemsFeeConfirmed) {
      // Ensure visible for confirmed state
      fadeAnim.setValue(1);
      slideAnim.setValue(0);
      setStatus("accepted");
    }
  }, [payment]);

  const handleAccept = async () => {
    setIsAccepting(true);
    try {
      await onAccept();
      setStatus("accepted");
      // Slide out after a delay
      setTimeout(() => {
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }).start();
      }, 2000);
    } catch (err) {
      console.error("Failed to accept payment:", err);
    } finally {
      setIsAccepting(false);
    }
  };

  const handleReject = async () => {
    setIsRejecting(true);
    try {
      await onReject();
      setStatus("rejected");
      // Slide out after a delay
      setTimeout(() => {
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }).start();
      }, 2000);
    } catch (err) {
      console.error("Failed to reject payment:", err);
    } finally {
      setIsRejecting(false);
    }
  };

  // Show submitting state (courier is uploading receipt)
  if (isSubmitting && !payment) {
    return (
      <View
        style={{
          backgroundColor: "#F5F5FF",
          borderRadius: 12,
          padding: 16,
          marginTop: 12,
          borderWidth: 1,
          borderColor: "#C7D2FE",
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <ActivityIndicator size="small" color="#545EE1" />
        <Text
          style={{
            marginLeft: 12,
            fontSize: 14,
            fontWeight: "500",
            color: "#545EE1",
          }}
        >
          Sending payment proposal...
        </Text>
      </View>
    );
  }

  // Don't show banner if no payment or no proposed items fee yet (courier hasn't proposed)
  if (
    !payment ||
    payment.proposedItemsFee === undefined ||
    payment.proposedItemsFee === null ||
    payment.proposedItemsFee === 0
  ) {
    return null;
  }

  const proposedAmount = payment.proposedItemsFee ?? 0;
  // Calculate total correctly: items cost + delivery fee + base fee
  const deliveryFee = payment.deliveryFee ?? 0;
  const baseFee = payment.baseFee ?? 0;
  const totalAmount = proposedAmount + deliveryFee + baseFee;
  const receiptImageUrl = payment.imageKey
    ? `${S3_BASE_URL}/${payment.imageKey}`
    : null;

  // Image preview modal (full screen)
  const ImagePreviewModal = () => (
    <Modal
      visible={showImageModal}
      transparent
      animationType="fade"
      onRequestClose={() => setShowImageModal(false)}
    >
      <Pressable
        style={{
          flex: 1,
          backgroundColor: "rgba(0,0,0,0.9)",
          justifyContent: "center",
          alignItems: "center",
        }}
        onPress={() => setShowImageModal(false)}
      >
        <TouchableOpacity
          style={{
            position: "absolute",
            top: 50,
            right: 20,
            zIndex: 10,
            padding: 8,
          }}
          onPress={() => setShowImageModal(false)}
        >
          <Ionicons name="close" size={30} color="#fff" />
        </TouchableOpacity>
        {receiptImageUrl && (
          <Image
            source={{ uri: receiptImageUrl }}
            style={{
              width: Dimensions.get("window").width - 40,
              height: Dimensions.get("window").height * 0.7,
              borderRadius: 12,
            }}
            resizeMode="contain"
          />
        )}
      </Pressable>
    </Modal>
  );

  // Details modal (Facebook Marketplace style)
  const DetailsModal = () => (
    <Modal
      visible={showDetailsModal}
      transparent
      animationType="slide"
      onRequestClose={() => setShowDetailsModal(false)}
    >
      <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)" }}>
        <Pressable
          style={{ flex: 1 }}
          onPress={() => setShowDetailsModal(false)}
        />
        <View
          style={{
            backgroundColor: "#fff",
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            paddingBottom: 40,
            maxHeight: Dimensions.get("window").height * 0.85,
          }}
        >
          {/* Handle bar */}
          <View style={{ alignItems: "center", paddingVertical: 12 }}>
            <View
              style={{
                width: 40,
                height: 4,
                backgroundColor: "#DDD",
                borderRadius: 2,
              }}
            />
          </View>

          {/* Receipt Image */}
          {receiptImageUrl && (
            <TouchableOpacity
              onPress={() => {
                setShowDetailsModal(false);
                setTimeout(() => setShowImageModal(true), 300);
              }}
              style={{ paddingHorizontal: 20 }}
            >
              <Image
                source={{ uri: receiptImageUrl }}
                style={{
                  width: "100%",
                  height: 250,
                  borderRadius: 12,
                  backgroundColor: "#F5F5F5",
                }}
                resizeMode="cover"
              />
              <View
                style={{
                  position: "absolute",
                  bottom: 12,
                  right: 32,
                  backgroundColor: "rgba(0,0,0,0.6)",
                  borderRadius: 20,
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  flexDirection: "row",
                  alignItems: "center",
                }}
              >
                <Ionicons name="expand" size={14} color="#fff" />
                <Text style={{ color: "#fff", fontSize: 12, marginLeft: 4 }}>
                  View Full
                </Text>
              </View>
            </TouchableOpacity>
          )}

          {/* Payment Details */}
          <View style={{ padding: 20 }}>
            <Text
              style={{
                fontSize: 20,
                fontWeight: "700",
                color: "#333",
                marginBottom: 16,
              }}
            >
              Payment Proposal
            </Text>

            {/* Amount */}
            <View
              style={{
                backgroundColor: "#F5F5FF",
                borderRadius: 12,
                padding: 20,
                alignItems: "center",
                marginBottom: 20,
              }}
            >
              <Text style={{ fontSize: 14, color: "#666", marginBottom: 4 }}>
                Proposed Items Cost
              </Text>
              <Text
                style={{ fontSize: 36, fontWeight: "700", color: "#545EE1" }}
              >
                ₱{proposedAmount.toFixed(2)}
              </Text>
            </View>

            {/* Fee breakdown */}
            <View style={{ marginBottom: 20 }}>
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: "600",
                  color: "#666",
                  marginBottom: 12,
                }}
              >
                Fee Breakdown
              </Text>
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  marginBottom: 8,
                }}
              >
                <Text style={{ fontSize: 15, color: "#333" }}>Items Cost</Text>
                <Text
                  style={{ fontSize: 15, fontWeight: "500", color: "#333" }}
                >
                  ₱{proposedAmount.toFixed(2)}
                </Text>
              </View>
              {payment.deliveryFee !== undefined && payment.deliveryFee > 0 && (
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    marginBottom: 8,
                  }}
                >
                  <Text style={{ fontSize: 15, color: "#333" }}>
                    Delivery Fee
                  </Text>
                  <Text
                    style={{ fontSize: 15, fontWeight: "500", color: "#333" }}
                  >
                    ₱{payment.deliveryFee.toFixed(2)}
                  </Text>
                </View>
              )}
              {payment.baseFee !== undefined && payment.baseFee > 0 && (
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    marginBottom: 8,
                  }}
                >
                  <Text style={{ fontSize: 15, color: "#333" }}>Base Fee</Text>
                  <Text
                    style={{ fontSize: 15, fontWeight: "500", color: "#333" }}
                  >
                    ₱{payment.baseFee.toFixed(2)}
                  </Text>
                </View>
              )}
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  marginTop: 12,
                  paddingTop: 12,
                  borderTopWidth: 1,
                  borderTopColor: "#EEE",
                }}
              >
                <Text
                  style={{ fontSize: 17, fontWeight: "700", color: "#333" }}
                >
                  Total
                </Text>
                <Text
                  style={{ fontSize: 17, fontWeight: "700", color: "#545EE1" }}
                >
                  ₱{totalAmount.toFixed(2)}
                </Text>
              </View>
            </View>

            {/* Action Buttons */}
            {isCustomer && (
              <View style={{ flexDirection: "row", gap: 12 }}>
                <TouchableOpacity
                  onPress={() => {
                    setShowDetailsModal(false);
                    handleReject();
                  }}
                  disabled={isRejecting || isAccepting}
                  style={{
                    flex: 1,
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: "#FFF",
                    borderWidth: 2,
                    borderColor: "#F44336",
                    borderRadius: 25,
                    paddingVertical: 14,
                  }}
                >
                  {isRejecting ? (
                    <ActivityIndicator size="small" color="#F44336" />
                  ) : (
                    <>
                      <Feather name="x" size={20} color="#F44336" />
                      <Text
                        style={{
                          marginLeft: 8,
                          fontSize: 16,
                          fontWeight: "600",
                          color: "#F44336",
                        }}
                      >
                        Reject
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => {
                    setShowDetailsModal(false);
                    handleAccept();
                  }}
                  disabled={isAccepting || isRejecting}
                  style={{
                    flex: 1,
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: "#4CAF50",
                    borderRadius: 25,
                    paddingVertical: 14,
                  }}
                >
                  {isAccepting ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <>
                      <Feather name="check" size={20} color="#fff" />
                      <Text
                        style={{
                          marginLeft: 8,
                          fontSize: 16,
                          fontWeight: "600",
                          color: "#fff",
                        }}
                      >
                        Accept
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            )}

            {!isCustomer && (
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                  paddingVertical: 12,
                }}
              >
                <ActivityIndicator size="small" color="#545EE1" />
                <Text style={{ marginLeft: 10, fontSize: 14, color: "#666" }}>
                  Waiting for customer to confirm...
                </Text>
              </View>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );

  // Show confirmed payment banner (persistent, like Facebook)
  if (payment.isItemsFeeConfirmed) {
    return (
      <View
        style={{
          backgroundColor: "#F0FDF4",
          borderRadius: 12,
          padding: 14,
          marginTop: 12,
          borderWidth: 1,
          borderColor: "#86EFAC",
        }}
      >
        <ImagePreviewModal />
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
          }}
        >
          {/* Receipt thumbnail */}
          {receiptImageUrl && (
            <TouchableOpacity onPress={() => setShowImageModal(true)}>
              <Image
                source={{ uri: receiptImageUrl }}
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 8,
                  marginRight: 12,
                }}
              />
            </TouchableOpacity>
          )}
          <View
            style={{
              width: 32,
              height: 32,
              borderRadius: 16,
              backgroundColor: "#22C55E",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <Ionicons name="checkmark" size={18} color="#fff" />
          </View>
          <View style={{ marginLeft: 12, flex: 1 }}>
            <Text style={{ fontSize: 14, fontWeight: "600", color: "#166534" }}>
              Payment Confirmed
            </Text>
            <Text style={{ fontSize: 12, color: "#15803D", marginTop: 2 }}>
              Items cost has been approved
            </Text>
          </View>
        </View>

        {/* Payment breakdown */}
        <View
          style={{
            marginTop: 12,
            paddingTop: 12,
            borderTopWidth: 1,
            borderTopColor: "#BBF7D0",
          }}
        >
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              marginBottom: 4,
            }}
          >
            <Text style={{ fontSize: 13, color: "#166534" }}>Items Cost</Text>
            <Text style={{ fontSize: 13, fontWeight: "500", color: "#166534" }}>
              ₱{proposedAmount.toFixed(2)}
            </Text>
          </View>
          {payment.deliveryFee !== undefined && payment.deliveryFee > 0 && (
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                marginBottom: 4,
              }}
            >
              <Text style={{ fontSize: 13, color: "#166534" }}>
                Delivery Fee
              </Text>
              <Text
                style={{ fontSize: 13, fontWeight: "500", color: "#166534" }}
              >
                ₱{payment.deliveryFee.toFixed(2)}
              </Text>
            </View>
          )}
          {payment.baseFee !== undefined && payment.baseFee > 0 && (
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                marginBottom: 4,
              }}
            >
              <Text style={{ fontSize: 13, color: "#166534" }}>Base Fee</Text>
              <Text
                style={{ fontSize: 13, fontWeight: "500", color: "#166534" }}
              >
                ₱{payment.baseFee.toFixed(2)}
              </Text>
            </View>
          )}
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              marginTop: 8,
              paddingTop: 8,
              borderTopWidth: 1,
              borderTopColor: "#BBF7D0",
            }}
          >
            <Text style={{ fontSize: 15, fontWeight: "700", color: "#166534" }}>
              Total
            </Text>
            <Text style={{ fontSize: 15, fontWeight: "700", color: "#166534" }}>
              ₱{totalAmount.toFixed(2)}
            </Text>
          </View>
        </View>
      </View>
    );
  }

  // Status-based UI for just-accepted (transitional state)
  if (status === "accepted" && !payment.isItemsFeeConfirmed) {
    return (
      <View
        style={{
          backgroundColor: "#E8F5E9",
          borderRadius: 12,
          padding: 16,
          marginTop: 12,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          borderWidth: 1,
          borderColor: "#4CAF50",
        }}
      >
        <Ionicons name="checkmark-circle" size={24} color="#4CAF50" />
        <Text
          style={{
            marginLeft: 10,
            fontSize: 15,
            fontWeight: "600",
            color: "#2E7D32",
          }}
        >
          Payment accepted! ₱{proposedAmount.toFixed(2)}
        </Text>
      </View>
    );
  }

  if (status === "rejected") {
    return (
      <View
        style={{
          backgroundColor: "#FFEBEE",
          borderRadius: 12,
          padding: 16,
          marginTop: 12,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          borderWidth: 1,
          borderColor: "#F44336",
        }}
      >
        <Ionicons name="close-circle" size={24} color="#F44336" />
        <Text
          style={{
            marginLeft: 10,
            fontSize: 15,
            fontWeight: "600",
            color: "#C62828",
          }}
        >
          Payment rejected. Waiting for new proposal...
        </Text>
      </View>
    );
  }

  // Pending state - Facebook Marketplace style with large image
  return (
    <Animated.View
      style={{
        opacity: fadeAnim,
        transform: [{ translateY: slideAnim }],
        backgroundColor: "#FFFFFF",
        borderRadius: 16,
        marginTop: 12,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 5,
        overflow: "hidden",
      }}
    >
      <ImagePreviewModal />
      <DetailsModal />

      {/* Large Receipt Image - Facebook Marketplace Style */}
      {receiptImageUrl ? (
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={() => setShowDetailsModal(true)}
        >
          <Image
            source={{ uri: receiptImageUrl }}
            style={{
              width: "100%",
              height: 180,
              backgroundColor: "#F0F0F0",
            }}
            resizeMode="cover"
          />
          {/* Overlay gradient for text visibility */}
          <View
            style={{
              position: "absolute",
              bottom: 0,
              left: 0,
              right: 0,
              height: 60,
              backgroundColor: "rgba(0,0,0,0.4)",
              justifyContent: "flex-end",
              paddingHorizontal: 12,
              paddingBottom: 8,
            }}
          >
            <Text style={{ fontSize: 12, color: "rgba(255,255,255,0.8)" }}>
              Receipt Image
            </Text>
            <Text style={{ fontSize: 16, fontWeight: "700", color: "#fff" }}>
              ₱{proposedAmount.toFixed(2)}
            </Text>
          </View>
          {/* Expand icon */}
          <View
            style={{
              position: "absolute",
              top: 10,
              right: 10,
              backgroundColor: "rgba(0,0,0,0.5)",
              borderRadius: 20,
              padding: 8,
            }}
          >
            <Ionicons name="expand-outline" size={18} color="#fff" />
          </View>
        </TouchableOpacity>
      ) : (
        // No image placeholder
        <View
          style={{
            height: 100,
            backgroundColor: "#F5F5FF",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <Ionicons name="receipt-outline" size={32} color="#545EE1" />
          <Text style={{ fontSize: 12, color: "#666", marginTop: 4 }}>
            No receipt image
          </Text>
        </View>
      )}

      {/* Content Section */}
      <View style={{ padding: 16 }}>
        {/* Header */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            marginBottom: 12,
          }}
        >
          <View
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: "#545EE1",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <Ionicons name="receipt" size={20} color="#fff" />
          </View>
          <View style={{ marginLeft: 12, flex: 1 }}>
            <Text style={{ fontSize: 16, fontWeight: "600", color: "#333" }}>
              {isCustomer ? "Payment Proposal" : "Waiting for confirmation"}
            </Text>
            <Text style={{ fontSize: 13, color: "#888", marginTop: 2 }}>
              {isCustomer
                ? "Tap to view details"
                : "Customer is reviewing the amount"}
            </Text>
          </View>
          {receiptImageUrl && (
            <TouchableOpacity
              onPress={() => setShowDetailsModal(true)}
              style={{
                backgroundColor: "#F5F5FF",
                paddingHorizontal: 12,
                paddingVertical: 6,
                borderRadius: 16,
              }}
            >
              <Text
                style={{ fontSize: 12, fontWeight: "600", color: "#545EE1" }}
              >
                Details
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Quick Amount Display */}
        <View
          style={{
            backgroundColor: "#F5F5FF",
            borderRadius: 12,
            padding: 12,
            marginBottom: 16,
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <View>
            <Text style={{ fontSize: 12, color: "#666" }}>Total Amount</Text>
            <Text style={{ fontSize: 24, fontWeight: "700", color: "#545EE1" }}>
              ₱{totalAmount.toFixed(2)}
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => setShowDetailsModal(true)}
            style={{ padding: 8 }}
          >
            <Ionicons name="chevron-forward" size={24} color="#545EE1" />
          </TouchableOpacity>
        </View>

        {/* Action Buttons - Only for Customer */}
        {isCustomer ? (
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              gap: 12,
            }}
          >
            {/* Reject Button */}
            <TouchableOpacity
              onPress={handleReject}
              disabled={isRejecting || isAccepting}
              style={{
                flex: 1,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: isRejecting ? "#FFCDD2" : "#FFF",
                borderWidth: 1.5,
                borderColor: "#F44336",
                borderRadius: 25,
                paddingVertical: 14,
              }}
            >
              {isRejecting ? (
                <ActivityIndicator size="small" color="#F44336" />
              ) : (
                <>
                  <Feather name="x" size={18} color="#F44336" />
                  <Text
                    style={{
                      marginLeft: 6,
                      fontSize: 15,
                      fontWeight: "600",
                      color: "#F44336",
                    }}
                  >
                    Reject
                  </Text>
                </>
              )}
            </TouchableOpacity>

            {/* Accept Button */}
            <TouchableOpacity
              onPress={handleAccept}
              disabled={isAccepting || isRejecting}
              style={{
                flex: 1,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: isAccepting ? "#A5D6A7" : "#4CAF50",
                borderRadius: 25,
                paddingVertical: 14,
              }}
            >
              {isAccepting ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <Feather name="check" size={18} color="#fff" />
                  <Text
                    style={{
                      marginLeft: 6,
                      fontSize: 15,
                      fontWeight: "600",
                      color: "#fff",
                    }}
                  >
                    Accept
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        ) : (
          /* Courier waiting state */
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: "#F5F5FF",
              paddingVertical: 12,
              borderRadius: 25,
            }}
          >
            <ActivityIndicator size="small" color="#545EE1" />
            <Text
              style={{
                marginLeft: 10,
                fontSize: 14,
                fontWeight: "500",
                color: "#545EE1",
              }}
            >
              Waiting for customer to confirm...
            </Text>
          </View>
        )}
      </View>
    </Animated.View>
  );
}

// components/modals/OrderCancelledCourier.tsx

import React from "react";
import { View, Text, Modal, TouchableOpacity, StyleSheet } from "react-native";
import CancelOrder from "@/components/svg/CancelOrder";

interface OrderCancelledCourierProps {
  visible: boolean;
  onConfirm: () => void;
  orderId: number | undefined;
}

const OrderCancelledCourier: React.FC<OrderCancelledCourierProps> = ({
  visible,
  onConfirm,
  orderId,
}) => {
  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onConfirm}
    >
      <View style={styles.container}>
        <View style={styles.modalContent}>
          <CancelOrder width={80} height={80} color="#E53935" />
          <Text style={styles.title}>Order Cancelled</Text>
          <Text style={styles.message}>
            Order #{orderId} has been cancelled by the customer.
          </Text>
          <Text style={styles.message}>
            You will be redirected to the orders list.
          </Text>
          <TouchableOpacity onPress={onConfirm} style={styles.button}>
            <Text style={styles.buttonText}>Acknowledge</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContent: {
    width: "80%",
    backgroundColor: "white",
    borderRadius: 10,
    padding: 25,
    alignItems: "center",
    elevation: 5,
    gap: 10,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: "#E53935",
    marginTop: 10,
    textAlign: "center",
  },
  message: {
    fontSize: 16,
    color: "#555",
    textAlign: "center",
  },
  button: {
    backgroundColor: "#545EE1",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginTop: 15,
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  buttonText: {
    color: "white",
    fontWeight: "600",
    fontSize: 16,
  },
});

export default OrderCancelledCourier;

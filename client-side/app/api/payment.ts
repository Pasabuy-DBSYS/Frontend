import axios from "axios";
import { API_BASE_URL } from "./config";
import { PaymentRequestDTO } from "./dto/request/payment.request";
import { PaymentsResponseDTO } from "./dto/response/payment.response.dto";
import { useAuthStore } from "./store/auth_store";
import { usePaymentStore } from "./store/payment_store";
import { useOrdersHubStore } from "./store/orders_hub_store";

const URL = `${API_BASE_URL}/Payments`;

export const postPayment = async (
  request: PaymentRequestDTO
): Promise<PaymentsResponseDTO | undefined> => {
  try {
    const form = new FormData();
    const orderStore = useAuthStore.getState();
    const { setPayment } = usePaymentStore.getState();
    const { addHandler } = useOrdersHubStore.getState();

    form.append("OrderIdFK", request.orderIdFK.toString());
    form.append("ItemsFee", request.itemsFee.toString());

    if (request.image) {
      form.append("Image", {
        uri: request.image.uri,
        name: request.image.name,
        type: request.image.type,
      } as any);
    }

    console.log(`TOKEN USED FOR PROPOSE: ${JSON.stringify(orderStore.token)}`);

    console.log(`FORM DATA: ${JSON.stringify(form)}`);
    const response = await axios.post<PaymentsResponseDTO>(
      `${URL}/propose`,
      form,
      {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${orderStore.token}`,
        },
      }
    );

    console.log(`PAYMENT RESPONSE: ${JSON.stringify(response.data)}`);

    if (response?.data) {
      // Persist to store
      setPayment(response.data);
      return response.data;
    }
  } catch (err: any) {
    console.error("❌ [postPayment] Error:", err.response?.data || err.message);
    throw err;
  }
};

export const getPaymentByOrderId = async (
  orderId: number
): Promise<PaymentsResponseDTO | undefined> => {
  try {
    const { token } = useAuthStore.getState();
    const { setPayment } = usePaymentStore.getState();

    const response = await axios.get<PaymentsResponseDTO>(
      `${URL}/order/${orderId}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (response?.data) {
      console.log(
        `GET RESPONSE BY ${orderId}: ${JSON.stringify(response.data)}`
      );
      // Persist to store
      setPayment(response.data);
      return response.data;
    }

    return undefined;
  } catch (error: any) {
    console.error(
      "❌ [getPaymentByOrderId] Error:",
      error.response?.data || error.message
    );
    throw error;
  }
};

/**
 * Customer confirms the proposed items fee
 */
export const confirmPayment = async (
  orderId: number
): Promise<PaymentsResponseDTO | undefined> => {
  try {
    const { token } = useAuthStore.getState();
    const { setPayment } = usePaymentStore.getState();

    const response = await axios.patch<PaymentsResponseDTO>(
      `${URL}/propose/accept/${orderId}`,
      {},
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    console.log(`✅ Payment confirmed for order ${orderId}`);

    if (response?.data) {
      // Persist to store
      setPayment(response.data);
      return response.data;
    }
  } catch (error: any) {
    console.error(
      "❌ [confirmPayment] Error:",
      error.response?.data || error.message
    );
    throw error;
  }
};

/**
 * Customer rejects the proposed items fee
 */
export const rejectPayment = async (
  orderId: number
): Promise<PaymentsResponseDTO | undefined> => {
  try {
    const { token } = useAuthStore.getState();
    const { clearPayment } = usePaymentStore.getState();

    const response = await axios.patch<PaymentsResponseDTO>(
      `${URL}/propose/reject/${orderId}`,
      {},
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    console.log(`❌ Payment rejected for order ${orderId}`);

    // Clear payment from store on rejection so courier can send new proposal
    await clearPayment();

    return response?.data;
  } catch (error: any) {
    console.error(
      "❌ [rejectPayment] Error:",
      error.response?.data || error.message
    );
    throw error;
  }
};

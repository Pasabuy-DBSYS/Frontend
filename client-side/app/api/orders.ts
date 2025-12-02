import axios from "axios";
import { API_BASE_URL, RAW_URL } from "./config";
import {
  AcceptOrderRequestDTO,
  PostOrderRequestDTO,
} from "./dto/request/order.request.dto";
import { OrderResponseDTO } from "./dto/response/order.response.dto";
import { Status } from "./dto/response/order.response.dto";
import { useAuthStore } from "./store/auth_store";
import { GEOAPIFY_KEY } from "@env";
import { Coordinates, Order } from "@/types/interfaces";
import { convertCoordinatesToAddress } from "./geoapify";
import * as SignalR from "@microsoft/signalr";
import { useMessageRoomState } from "./store/message_room_store";
import { useActiveOrderStore } from "./store/order_store";
import { usePaymentStore } from "./store/payment_store";
import { useOrdersHubStore } from "./store/orders_hub_store";
import { useChatsHubStore } from "./store/chat_hub_store";
import { getUserById } from "./user";
import { useOtherUser } from "./hook/useOtherUser";
import { useRouteStore } from "./store/route_store";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Image } from "expo-image";
import { useOtherUserStore } from "./store/user_store";

const BASE_URL = `${API_BASE_URL}/Orders`;

const { clearActiveOrder } = useActiveOrderStore.getState();
const { setTempOrderRequest } = useActiveOrderStore.getState();

let connection: SignalR.HubConnection | null = null;

export const getOrders = async (): Promise<any> => {
  try {
    const response = await axios.get(`${BASE_URL}`, {
      headers: { Accept: "application/json" },
    });

    return response.data;
  } catch (error: any) {
    console.log("URL:", API_BASE_URL);
    if (error.response) {
      console.error("❌ Server responded with:", error.response.status);
      console.error("Response data:", error.response.data);
    } else if (error.request) {
      console.error("❌ No response received:", error.request);
    } else {
      console.error("❌ Axios error:", error.message);
    }
    throw error;
  }
};

export const getCustomerOrderHistory = async (): Promise<
  OrderResponseDTO[]
> => {
  try {
    const token = useAuthStore.getState().token;
    const response = await axios.get<OrderResponseDTO[]>(
      `${BASE_URL}/history/customer`,
      {
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
      }
    );

    console.log(`ORDER HISTORY RESPONSE: ${JSON.stringify(response.data)}`);
    return response.data;
  } catch (error: any) {
    console.error(
      "❌ [getCustomerOrderHistory] Error:",
      error.response?.data || error.message
    );
    throw error;
  }
};

export const getCourierOrderHistory = async (): Promise<OrderResponseDTO[]> => {
  try {
    const token = useAuthStore.getState().token;
    const response = await axios.get<OrderResponseDTO[]>(
      `${BASE_URL}/history/courier`,
      {
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return response.data;
  } catch (error: any) {
    console.error(
      "❌ [getCourierOrderHistory] Error:",
      error.response?.data || error.message
    );
    throw error;
  }
};

export const getOrderByStatus = async (
  orderStatus: Status
): Promise<OrderResponseDTO[]> => {
  try {
    const token = useAuthStore.getState().token;

    console.log(`Token used: ${token}`);
    const url = `${BASE_URL}/status/${orderStatus}`;
    const response = await axios.get<OrderResponseDTO[]>(url, {
      headers: { Accept: "application/json", Authorization: `Bearer ${token}` },
    });

    return response.data;
  } catch (err: any) {
    const status = err?.response?.status;
    const data = err?.response?.data;
    const msg =
      data?.message || `Failed to fetch orders with status: ${orderStatus}.`;

    console.error("❌ [getOrderByStatus] Request Failed", {
      url: err?.config?.url,
      method: err?.config?.method?.toUpperCase(),
      status,
      message: msg,
      data,
      timestamp: new Date().toISOString(),
    });

    throw new Error(
      `${msg} (HTTP ${status ?? "Unknown"}) — see console for full details.`
    );
  }
};

export const getOrderById = async (
  orderId: number
): Promise<OrderResponseDTO> => {
  try {
    const token = useAuthStore.getState().token;
    const response = await axios.get<OrderResponseDTO>(
      `${BASE_URL}/${orderId}`,
      {
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return response.data;
  } catch (err: any) {
    const status = err?.response?.status;
    const data = err?.response?.data;
    const msg = data?.message || `Failed to fetch orders with ID: ${orderId}.`;

    console.error("❌ [getOrderById] Request Failed", {
      url: err?.config?.url,
      method: err?.config?.method?.toUpperCase(),
      status,
      message: msg,
      data,
      timestamp: new Date().toISOString(),
    });

    throw new Error(
      `${msg} (HTTP ${status ?? "Unknown"}) — see console for full details.`
    );
  }
};

export const postOrder = async (
  orderRequestDTO: PostOrderRequestDTO
): Promise<any> => {
  const token = useAuthStore.getState().token;
  const { invokeHub } = useOrdersHubStore.getState();

  try {
    const payload: PostOrderRequestDTO = {
      customerId: orderRequestDTO.customerId,
      request: orderRequestDTO.request,
      tipFee: orderRequestDTO.tipFee ?? 0,
      status: orderRequestDTO.status,
      priority: orderRequestDTO.priority ?? 0,
      locationLatitude: orderRequestDTO.locationLatitude,
      locationLongitude: orderRequestDTO.locationLongitude,
      customerLatitude: orderRequestDTO.customerLatitude,
      customerLongitude: orderRequestDTO.customerLongitude,
      deliveryDistance: orderRequestDTO.deliveryDistance ?? 0,
      customerAddress: orderRequestDTO.customerAddress,
      destinationAddress: orderRequestDTO.destinationAddress,
      deliveryNotes: orderRequestDTO.deliveryNotes ?? "",
    };

    console.log(`PAYLOAD: ${JSON.stringify(payload)}`);

    Object.entries(payload).forEach(([key, value]) => {
      console.log(`${key}: ${value}`);
    });

    const response = await axios.post(`${BASE_URL}`, payload, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    if (response) {
      console.log(
        `[HUB][CUSTOMER] JoinOrderGroup for new orderId=${response.data.orderIdPK}`
      );
      await invokeHub("JoinOrderGroup", response.data.orderIdPK);
      setTempOrderRequest(payload);
    }
    return response.data;
  } catch (err: any) {
    const apiError = err.response?.data;

    console.error(
      "Error posting order:",
      apiError || err.message || "Unknown error"
    );

    // More descriptive error for UI
    const message =
      apiError?.title ||
      apiError?.error ||
      err.response?.statusText ||
      "An unexpected error occurred while creating the order.";

    throw new Error(message);
  }
};

export const acceptOrderById = async (
  orderId: number,
  request: AcceptOrderRequestDTO
): Promise<OrderResponseDTO> => {
  try {
    const { invokeHub } = useOrdersHubStore.getState();
    const token = useAuthStore.getState().token;
    const response = await axios.post<OrderResponseDTO>(
      `${BASE_URL}/accept/${orderId}`,
      request,
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      }
    );
    const { customerId, courierId, chatRoomResponseDTO, deliveryDetailsDTO } =
      response.data;
    const chatRoomId = chatRoomResponseDTO?.roomIdPK;

    console.log(`CHAT ROOM RESPONSE ${JSON.stringify(chatRoomResponseDTO)}`);
    useMessageRoomState.setState({
      messageRoomParticipants: {
        roomId: chatRoomId ?? null,
        senderId: courierId ?? null,
        receiverId: customerId ?? null,
      },
    });
    useActiveOrderStore.setState({ activeOrder: { ...response.data } });

    console.log(
      `[HUB][COURIER] JoinOrderGroup after accept orderId=${orderId}`
    );
    await invokeHub("JoinOrderGroup", orderId);
    console.log(`
      COURIER SIDE ACTIVE ORDER: ${JSON.stringify(
        useActiveOrderStore.getState().activeOrder
      )})}`);
    return response.data;
  } catch (err: any) {
    const status = err?.response?.status;
    const data = err?.response?.data;
    const msg = data?.message || `Failed to accept order with ID: ${orderId}.`;

    console.error("❌ [acceptOrder] Request Failed", {
      url: err?.config?.url,
      method: err?.config?.method?.toUpperCase(),
      status,
      message: msg,
      data,
      timestamp: new Date().toISOString(),
    });
    throw err;
  }
};

export const fetchOrderRealtime = async (
  onCreated: (order: OrderResponseDTO) => void
): Promise<void> => {
  const { initConnection, addHandler } = useOrdersHubStore.getState();
  const conn = await initConnection();

  console.log("[HUB][COURIER] Connected OrdersHub for realtime OrderCreated");

  addHandler("OrderCreated", (order: OrderResponseDTO) => {
    console.log(
      `[HUB][COURIER] OrderCreated received for orderId=${order.orderIdPK}`
    );
    onCreated(order);
  });
};

export const stopOrderRealtime = async () => {
  const { removeHandler } = useOrdersHubStore.getState();

  try {
    removeHandler("OrderCreated");
    console.log(
      "OrdersHub: Removed OrderCreated handler (connection kept alive)"
    );
  } catch (err) {
    console.error("Failed to remove OrderCreated handler:", err);
  }
};

export const getCurrentOrderAsCourier = async (): Promise<OrderResponseDTO> => {
  try {
    const token = useAuthStore.getState().token;

    const response = await axios.get<OrderResponseDTO>(
      `${BASE_URL}/courier/activeorder`,
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      }
    );

    console.log(`RESPONSE: ${JSON.stringify(response)}`);

    return response.data;
  } catch (err) {
    console.log(err);
    throw err;
  }
};

export const getCurrentOrderAsCustomer =
  async (): Promise<OrderResponseDTO> => {
    try {
      const token = useAuthStore.getState().token;

      const response = await axios.get<OrderResponseDTO>(
        `${BASE_URL}/customer/activeorder`,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      console.log(`RESPONSE: ${JSON.stringify(response)}`);

      return response.data;
    } catch (err) {
      console.log(err);
      throw err;
    }
  };

// orders.service.ts or similar utility file
const initializeOrdersHubConnection = async () => {
  const { initConnection } = useOrdersHubStore.getState();
  const conn = await initConnection();
  console.log(
    "[HUB][CUSTOMER] Connected OrdersHub for realtime accepts/updates"
  );
  return conn;
};

const handleOrderAccepted = (updatedOrder: OrderResponseDTO) => {
  console.log("📬 OrderAccepted:", updatedOrder);
  const { setShowOrderAccepted } = useActiveOrderStore.getState();

  useActiveOrderStore.setState({ activeOrder: updatedOrder });

  // Show OrderAccepted modal for 2 seconds
  setShowOrderAccepted(true);
  setTimeout(() => setShowOrderAccepted(false), 2000);

  // ... (Chat setup logic)
  useMessageRoomState.setState({
    messageRoomParticipants: {
      roomId: updatedOrder.chatRoomResponseDTO?.roomIdPK ?? null,
      senderId: updatedOrder.courierId ?? null,
      receiverId: updatedOrder.customerId ?? null,
    },
  });
};

const handleOrderStatusUpdated = (updatedOrder: OrderResponseDTO) => {
  console.log("♻️ OrderStatusUpdated:", updatedOrder);
  const { setIsCancelled, setIsDelivered, clearActiveOrder } =
    useActiveOrderStore.getState();

  if (updatedOrder.courierId === useAuthStore.getState().user?.userIdPK) {
    console.log(`ROGINANDCOURIER: ${JSON.stringify(updatedOrder)}`);
  }

  if (updatedOrder.status === Status.CANCELLED) {
    setIsCancelled(true);
  }
  if (updatedOrder.status === Status.DELIVERED) {
    setIsDelivered(true);
  }

  // ... (Cleanup logic)
  if (
    updatedOrder.status === Status.CANCELLED ||
    updatedOrder.status === Status.DELIVERED
  ) {
    clearActiveOrder();
    AsyncStorage.removeItem("message-cache-storage");
    useOtherUserStore.getState().clearOtherUser();
    Image.clearDiskCache();
    Image.clearMemoryCache();
    console.log("🗑️ Cleared message & image cache");
  }
  useActiveOrderStore.setState({ activeOrder: updatedOrder });
};

export const receiveOrderRealtime = async (): Promise<void> => {
  const { addHandler, invokeHub } = useOrdersHubStore.getState();

  await initializeOrdersHubConnection();

  // If there's an active order, join the order group to receive updates
  const { activeOrder } = useActiveOrderStore.getState();
  if (activeOrder?.orderIdPK) {
    console.log(
      `[HUB] Joining order group for active order: ${activeOrder.orderIdPK}`
    );
    await invokeHub("JoinOrderGroup", activeOrder.orderIdPK);
  }

  // Subscribes to handlers
  addHandler("OrderAccepted", handleOrderAccepted);
  addHandler("OrderStatusUpdated", handleOrderStatusUpdated);

  // Handler for payment proposal from courier
  addHandler("PaymentProposal", (payment: any) => {
    console.log(
      `📥 Received PaymentProposal via real-time: ${JSON.stringify(payment)}`
    );
    usePaymentStore.getState().setPayment(payment);
  });
};

export const receiveOrderStatusRealtime = async (): Promise<void> => {
  const { addHandler } = useOrdersHubStore.getState();
  // Initializes connection or uses existing one
  await initializeOrdersHubConnection();

  addHandler("OrderStatusUpdated", handleOrderStatusUpdated);
};

export const updateOrderById = async (orderId: number, orderStatus: Status) => {
  try {
    const token = useAuthStore.getState().token;
    const { invokeHub } = useOrdersHubStore.getState();

    const response = await axios.patch(
      `${BASE_URL}/update/${orderId}/${orderStatus}`,
      {}, // empty request body
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (orderStatus === Status.CANCELLED || orderStatus === Status.DELIVERED) {
      clearActiveOrder();
      useRouteStore.getState().clearRoute(orderId);

      await invokeHub("LeaveOrderGroup", orderId.toString());
    }

    return response.data;
  } catch (err: any) {
    console.error("❌ [updateOrderById] Error:", {
      orderId,
      orderStatus,
      status: err?.response?.status,
      message: err?.response?.data?.message || err.message,
      data: err?.response?.data,
    });
    throw err;
  }
};

export const updateCourierLocation = async (
  orderId: number,
  latitude: number,
  longitude: number
): Promise<void> => {
  try {
    const { token } = useAuthStore.getState();

    await axios.patch(
      `${BASE_URL}/update/courier-location/${orderId}?courierLatitude=${latitude}&courierLongitude=${longitude}`,
      {},
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      }
    );

    console.log(
      `📍 [updateCourierLocation] Sent: Order ${orderId}, Lat: ${latitude}, Lng: ${longitude}`
    );
  } catch (err: any) {
    // Don't throw - location updates are non-critical
    console.warn("⚠️ [updateCourierLocation] Failed:", err?.message);
  }
};

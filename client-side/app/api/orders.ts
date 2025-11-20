import axios from "axios";
import { API_BASE_URL, RAW_URL } from "./config";
import {
  AcceptOrderRequestDTO,
  PostOrderRequestDTO,
} from "./dto/request/order.request.dto";
import { OrderResponseDTO } from "./dto/response/auth.response.dto";
import { Status } from "./dto/response/order.response.dto";
import { useAuthStore } from "./store/auth_store";
import { GEOAPIFY_KEY } from "@env";
import { Coordinates, Order } from "@/types/interfaces";
import { convertCoordinatesToAddress } from "./geoapify";
import * as SignalR from "@microsoft/signalr";
import { useMessageRoomState } from "./store/message_room_store";
import { useActiveOrderStore } from "./store/order_store";
import { useOrdersHubStore } from "./store/orders_hub_store";
import { useChatsHubStore } from "./store/chat_hub_store";
import { getUserById } from "./user";
import { useOtherUser } from "./hook/useOtherUser";

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

    if (response) setTempOrderRequest(payload);
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
  const { connection, initConnection } = useOrdersHubStore.getState();

  // Ensure connection is active
  let activeConnection = connection;
  if (
    !activeConnection ||
    activeConnection.state !== SignalR.HubConnectionState.Connected
  ) {
    await initConnection();
    activeConnection = useOrdersHubStore.getState().connection;
  }

  if (!activeConnection) {
    console.error("❌ OrdersHub connection not available.");
    return;
  }

  activeConnection.off("OrderCreated");

  // Listen for real-time order creation
  activeConnection.on("OrderCreated", (newOrder: OrderResponseDTO) => {
    onCreated(newOrder);
  });
};
export const stopOrderRealtime = async () => {
  const { disconnect } = useChatsHubStore.getState();

  if (connection) {
    await disconnect();
    console.log("🛑 SignalR connection stopped");
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

export const receiveOrderRealtime = async (): Promise<void> => {
  const { connection, initConnection } = useOrdersHubStore.getState();

  let activeConnection = connection;
  if (
    !activeConnection ||
    activeConnection.state !== SignalR.HubConnectionState.Connected
  ) {
    await initConnection();
    activeConnection = useOrdersHubStore.getState().connection;
  }

  if (!activeConnection) {
    console.error(" OrdersHub connection not available for receiving orders.");
    return;
  }

  // Clean up existing listeners before re-binding
  activeConnection.off("OrderAccepted");
  activeConnection.off("OrderUpdated");

  // When a courier accepts an order (notify customer)
  activeConnection.on(
    "OrderAccepted",
    async (updatedOrder: OrderResponseDTO) => {
      console.log("📬 Order accepted:", updatedOrder);

      useActiveOrderStore.setState({ activeOrder: updatedOrder });
      const { activeOrder } = useActiveOrderStore.getState();

      console.log(`CUSTOMER ACTIVE ORDER SIDE: ${JSON.stringify(activeOrder)}`);
      if (updatedOrder.courierId) {
        try {
          console.log(`RECEIVED COURIER ID: ${updatedOrder.courierId}`);
          const courier = await getUserById(updatedOrder.courierId);
          console.log("Courier info:", courier);
        } catch (err) {
          console.error("Failed to fetch courier info:", err);
        }
      }
    }
  );

  activeConnection.on(
    "OrderStatusUpdated",
    async (updatedOrder: OrderResponseDTO) => {
      const { setIsCancelled } = useActiveOrderStore.getState();
      console.log("♻️ Order updated:", updatedOrder);

      setIsCancelled(true);

    }
  );

  console.log("✅ Listening for OrderAccepted and OrderUpdated events...");
};

export const updateOrderById = async (orderId: number, orderStatus: Status) => {
  try {
    const token = useAuthStore.getState().token;

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

    if (response) {
      clearActiveOrder();
      return response.data;
    }
  } catch (err) {
    console.error(err);
    throw err;
  }
};

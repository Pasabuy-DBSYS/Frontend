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

const BASE_URL = `${API_BASE_URL}/Orders`;
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

    response.data;
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
  onCreated: (order: OrderResponseDTO) => void,
  onUpdated?: (order: OrderResponseDTO) => void
): Promise<void> => {
  try {
    const token = useAuthStore.getState().token;

    // Prevent multiple connections
    if (
      connection &&
      connection.state === SignalR.HubConnectionState.Connected
    ) {
      console.log("🟢 SignalR already connected");
      return;
    }

    connection = new SignalR.HubConnectionBuilder()
      .withUrl(`${API_BASE_URL}/hubs/ordersHub`, {
        accessTokenFactory: () => token ?? "",
      })
      .withAutomaticReconnect()
      .configureLogging(SignalR.LogLevel.Information)
      .build();

    connection.on("OrderCreated", (newOrder: OrderResponseDTO) => {
      console.log("📦 Real-time order created:", newOrder);
      onCreated(newOrder);
    });

    if (onUpdated) {
      connection.on("OrderUpdated", (updatedOrder: OrderResponseDTO) => {
        console.log("♻️ Real-time order updated:", updatedOrder);
        onUpdated(updatedOrder);
      });
    }

    connection.onreconnecting(() =>
      console.log("🔄 Reconnecting to SignalR...")
    );
    connection.onreconnected(() => console.log("✅ Reconnected to SignalR"));

    await connection.start();
    console.log("✅ SignalR connection established");
  } catch (err) {
    console.error("❌ SignalR connection failed:", err);
  }
};

export const stopOrderRealtime = async () => {
  if (connection) {
    await connection.stop();
    console.log("🛑 SignalR connection stopped");
  }
};

export const getCurrentOrderAsCourier = async (): Promise<OrderResponseDTO> => {
  try {
    const token = useAuthStore.getState().token;

    const response = await axios.get<OrderResponseDTO>(`${BASE_URL}/courier`, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    console.log(`RESPONSE: ${JSON.stringify(response)}`);

    return response.data;
  } catch (err) {
    console.log(err); 
    throw err;
  }
};

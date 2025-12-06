import { ChatRoomResponseDTO } from "./chat.response.dto";
import { DeliveryDetailsResponseDTO } from "./delivery.response.dto";
import { PaymentsResponseDTO } from "./payment.response.dto";

export enum Status {
  PENDING = 0,
  ACCEPTED = 1,
  PICKED_UP = 2,
  IN_TRANSIT = 3,
  DELIVERED = 4,
  CANCELLED = 5,
}

export enum Priority {
  NORMAL = "NORMAL",
  URGENT = "URGENT",
}
export interface OrderResponseDTO {
  orderIdPK: number;
  customerId: number;
  courierId: number;
  request: string;
  status: Status;
  priority: Priority;
  created_at: string;
  updated_at: string;
  isCourierReviewed: boolean;
  isCustomerReviewed: boolean;
  deliveryDetailsDTO: DeliveryDetailsResponseDTO;
  paymentsResponseDTO: PaymentsResponseDTO;
  chatRoomResponseDTO: ChatRoomResponseDTO;
}

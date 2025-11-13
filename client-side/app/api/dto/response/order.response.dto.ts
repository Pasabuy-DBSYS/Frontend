import { ChatRoomResponseDTO } from "./chat.response.dto";
import { DeliveryDetailsResponseDTO } from "./delivery.response.dto";
import { PaymentsResponseDTO } from "./payment.response.dto";

export enum Status {
  PENDING = 0,
  ACCEPTED = 1,
  IN_TRANSIT = 2,
  DELIVERED = 3,
  WATING_FOR_REVIEW = 4,
  REVIEWED = 5,
  CANCELLED = 6,
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
  createdAt: string;
  updatedAt: string;
  deliveryDetailsDTO: DeliveryDetailsResponseDTO;
  paymentsResponseDTO: PaymentsResponseDTO;
  chatRoomResponseDTO: ChatRoomResponseDTO;
}

import { MessageType } from "@/app/api/dto/request/message.request.dto";

export interface ChatMessagesResponseDTO {
  messageId: number;
  roomId: number;
  senderId: number;
  receiverId: number;
  message: string;
  messageType: MessageType;
  sentAt: string; // ISO 8601 timestamp
  readAt?: string | null;
}



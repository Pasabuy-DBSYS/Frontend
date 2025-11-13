export enum MessageTypes {
  TEXT = "TEXT",
  IMAGE = "IMAGE",
}

export interface ChatMessagesResponseDTO {
  messageIdPK: number;
  roomIdFK: number;
  senderIdFK: number;
  receiverIdFK: number;
  message: string;
  messageType: MessageTypes;
  sentAt: string; // ISO date string (from DateTime)
  readAt?: string; // Nullable in C#
}

export interface ChatRoomResponseDTO {
  roomIdPK: number;
  orderIdFK: number;
  createdAt: string;
  closedAt?: string;
  isActive: boolean;
  chatMessages: ChatMessagesResponseDTO[];
}

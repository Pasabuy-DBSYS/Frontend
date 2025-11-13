export enum MessageType {
  TEXT,
  IMAGE,
}

export interface MessageRequestDTO {
  roomIdFK: number;
  senderIdFK: number;
  receiverIdFK: number;
  message: string;
  messageType: MessageType;
  sentAt: string;
}

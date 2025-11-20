import { MessageTypes } from "../response/chat.response.dto";

export enum MessageType {
  TEXT,
  IMAGE,
}

export interface MessageRequestDTO {
  roomIdFK: number;
  senderIdFK: number;
  receiverIdFK: number;
  message: string;
  messageType: MessageType.TEXT;
  sentAt: string;
}

export interface MessageImageRequestDTO {
  roomIdFK: number;
  senderIdFK: number;
  receiverIdFK: number;

  // RN image file
  image: {
    uri: string;
    type: string;
    name: string;
  };

  message: string;
  messageType: MessageType.IMAGE;
  sentAt: string; // ISO string, same as DateTime.UtcNow
}

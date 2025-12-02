// Notification DTOs

export interface NotificationResponseDTO {
  notificationPkId: number;
  title: string;
  message: string;
  pressed: boolean;
  userIdFk: number;
}

export interface NotificationRequestDTO {
  title: string;
  message: string;
  pressed: boolean;
  userIdFk: number;
}

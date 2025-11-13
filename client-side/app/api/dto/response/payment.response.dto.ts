export enum PaymentMethods {
  CASH = "CASH",
}
export enum PaymentStatuses {
  PENDING = "PENDING",
  COMPLETED = "COMPLETED",
}

export interface PaymentsResponseDTO {
  paymentIdPK: number;
  orderIdFK: number;
  transactionId: string; // Guid → string
  baseFee: number;
  urgencyFee: number;
  deliveryFee: number;
  tipAmount?: number;
  itemsFee?: number;
  proposedItemsFee?: number;
  totalAmount?: number;
  isItemsFeeConfirmed: boolean;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  paidAt: string;
  createdAt: string;
}

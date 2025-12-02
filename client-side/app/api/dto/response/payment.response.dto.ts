export enum PaymentMethods {
  CASH = "CASH",
}
export enum PaymentStatuses {
  PENDING = "PENDING",
  COMPLETED = "COMPLETED",
  CANCELLED = "CANCELLED",
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
  paymentMethod: PaymentMethods;
  paymentStatus: PaymentStatuses;
  paidAt: string;
  createdAt: string;
  imageKey?: string; // S3 key for receipt image
}

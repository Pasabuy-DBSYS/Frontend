export interface PostOrderRequestDTO {
  customerId: number;
  request: string;
  tipFee: number;
  status: 0;
  priority: number;
  locationLatitude: number;
  locationLongitude: number;
  customerLatitude: number;
  customerLongitude: number;
  destinationAddress: string;
  customerAddress: string;
  deliveryDistance: number;
  deliveryNotes: string;
}

export interface AcceptOrderRequestDTO {
  courierId: number;
  courierLatitude: number;
  courierLongitude: number;
}

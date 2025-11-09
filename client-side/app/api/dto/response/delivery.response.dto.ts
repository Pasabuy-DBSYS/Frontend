export interface DeliveryDetailsResponseDTO {
  deliveryIdPk: number;
  orderIdFK: number;
  actualDistance: number;
  locationLongitude: number;
  locationLatitude: number;
  courierLatitude: number;
  courierLongitude: number;
  customerLatitude: number;
  customerLongitude: number;
  estimatedDeliveryTime: string; // DateTime → ISO string
  destinationAddress: string;
  customerAddress: string;
  actualDeliveryTime: string; // DateTime → ISO string
  actualPickupTime: string; // DateTime → ISO string
  deliveryNotes: string;
}

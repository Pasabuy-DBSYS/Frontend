export interface StatisticsResponseCustomerDTO {
  userId: number;
  totalOrders: number;
  totalSpent: number;
  totalRating: number;
}

export interface StatisticsResponseCourierDTO {
  userId: number;
  totalDeliveries: number;
  totalEarnings: number;
  rating: number;
}

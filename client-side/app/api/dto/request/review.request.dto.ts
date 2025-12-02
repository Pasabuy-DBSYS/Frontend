export interface PostReviewRequestDTO {
  orderIDFK: number;
  reviewedUserID: number;
  rating: number;
  comment: string;
}

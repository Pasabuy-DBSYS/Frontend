import axios from "axios";
import { api, API_BASE_URL } from "./config";
import { PostReviewRequestDTO } from "./dto/request/review.request.dto";
import { useAuthStore } from "./store/auth_store";

export const postReview = async (
  review: PostReviewRequestDTO
): Promise<void> => {
  try {
    const { token } = useAuthStore.getState();

    const response = await axios.post(`${API_BASE_URL}/Reviews`, review, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    console.log(`POST REVIEW RESPONSE: ${JSON.stringify(response.data)}`);
    return response.data;
  } catch (error) {
    console.error(
      "Error posting review:",
      error.response.data || error.message
    );
    throw error;
  }
};

import {
  StatisticsResponseCourierDTO,
  StatisticsResponseCustomerDTO,
} from "./dto/response/statistics.response.dto";
import { API_BASE_URL } from "./config";
import axios from "axios";
import { DecodedToken, useAuthStore } from "./store/auth_store";
import { jwtDecode } from "jwt-decode";

const BASE_URL = `${API_BASE_URL}/Statistics`;
export const getStatisticsAsCustomer =
  async (): Promise<StatisticsResponseCustomerDTO | null> => {
    try {
      // Await refreshUser to ensure token is updated before proceeding
      await useAuthStore.getState().refreshUser();

      const { token } = useAuthStore.getState();
      if (!token) {
        console.warn("No token available for statistics request");
        return null;
      }

      const decoded: DecodedToken = jwtDecode(token);
      console.log(`JWT TOKEN: `, token);
      console.log("Decoded Token in Statistics:", JSON.stringify(decoded));

      const response = await axios.get<StatisticsResponseCustomerDTO>(
        `${BASE_URL}/Customer`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      console.log(
        `Fetched customer statistics: ${JSON.stringify(response.data)}`
      );

      return response.data;
    } catch (error) {
      console.error("Failed to fetch customer statistics:", error);
      return null;
    }
  };

export const getStatisticsAsCourier =
  async (): Promise<StatisticsResponseCourierDTO | null> => {
    try {
      // Await refreshUser to ensure token is updated before proceeding
      await useAuthStore.getState().refreshUser();

      const { token } = useAuthStore.getState();
      if (!token) {
        console.warn("No token available for statistics request");
        return null;
      }

      const decoded: DecodedToken = jwtDecode(token);
      console.log(`JWT TOKEN: `, token);
      console.log("Decoded Token in Statistics:", JSON.stringify(decoded));

      const response = await axios.get<StatisticsResponseCourierDTO>(
        `${BASE_URL}/Courier`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      console.log(
        `Fetched courier statistics: ${JSON.stringify(response.data)}`
      );

      return response.data;
    } catch (error) {
      console.error("Failed to fetch courier statistics:", error);
      return null;
    }
  };

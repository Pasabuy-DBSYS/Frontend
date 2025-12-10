import axios from "axios";

export const RAW_URL = "http://100.0.117.37:5126";
export const API_BASE_URL = "http://172.20.10.2:5126/api"; // For IOS Device (will vary to your ipv4 address)

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error("API Error:", error.message);
    return Promise.reject(error);
  }
);

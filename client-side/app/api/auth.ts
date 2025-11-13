import axios from "axios";
import { API_BASE_URL } from "./config";
import { SignInRequestDTO } from "./dto/request/auth.request.dto";
import { TokenResponseDTO } from "./dto/response/auth.response.dto";

/** Get Orders */
const BASE_URL = `${API_BASE_URL}/Authentication`;
export const Login = async (userRequest: SignInRequestDTO): Promise<string> => {
  try {
    const { username, password } = userRequest;

    // ✅ Basic validation
    if (!username?.trim() || !password?.trim()) {
      throw new Error("Username and password are required.");
    }

    // ✅ Send login request
    const response = await axios.post<TokenResponseDTO>(`${BASE_URL}/login`, {
      username,
      password,
    });

    const token =
      typeof response.data === "string" ? response.data : response.data.token;

    console.log("✅ Login success, received token:", token);

    return token;
  } catch (err: any) {
    console.error("❌ Login failed:", err);

    // --- Handle all Axios error variants ---
    if (err.response) {
      const { status, data } = err.response;

      if (status === 400 || status === 401) {
        throw new Error(data?.error || data || "Invalid username or password.");
      }

      if (status >= 500) {
        throw new Error("Server error. Please try again later.");
      }

      throw new Error(`Unexpected error (${status}): ${JSON.stringify(data)}`);
    } else if (err.request) {
      throw new Error("Network error. Check your connection or API URL.");
    } else {
      throw new Error(err.message || "Unexpected login error.");
    }
  }
};

import axios from "axios";
import { API_BASE_URL } from "./config";
import { RNFile, UserRequestDTO } from "./dto/request/auth.request.dto";
import { UserResponseDTO } from "./dto/response/auth.response.dto";
import { useAuthStore } from "./store/auth_store";
import { Role } from "@/types/types";

export const getMimeType = (path: string): string => {
  if (!path) return "application/octet-stream";

  const extension = path.split(".").pop()?.toLowerCase();
  switch (extension) {
    case "jpg":
    case "jpeg":
      return "image/jpeg";
    case "png":
      return "image/png";
    case "heic":
      return "image/heic";
    default:
      return "application/octet-stream";
  }
};

const BASE_URL = `${API_BASE_URL}/Users`;
/** Create User */
export const createUser = async (
  userRequest: UserRequestDTO
): Promise<UserResponseDTO> => {
  const formData = new FormData();
  formData.append("Email", userRequest.email);
  formData.append("Username", userRequest.firstName);
  formData.append("Password", userRequest.password);
  formData.append("FirstName", userRequest.firstName);
  formData.append("MiddleName", userRequest.middleName ?? "");
  formData.append("LastName", userRequest.lastName);
  formData.append("Phone", userRequest.phone);
  formData.append("Birthday", userRequest.birthday);

  if (userRequest.frontId) {
    formData.append("FrontId", {
      uri: userRequest.frontId.uri,
      name: userRequest.frontId.name,
      type: getMimeType(userRequest.frontId.name),
    } as any);
  }
  if (userRequest.backId) {
    formData.append("BackId", {
      uri: userRequest.backId.uri,
      name: userRequest.backId.name,
      type: getMimeType(userRequest.backId.name),
    } as any);
  }
  if (userRequest.insurance) {
    formData.append("Insurance", {
      uri: userRequest.insurance.uri,
      name: userRequest.insurance.name,
      type: getMimeType(userRequest.insurance.name),
    } as any);
  }

  console.log(`Form Data Contents: ${JSON.stringify(formData)}`);
  console.log(`URL: ${BASE_URL}`);
  try {
    const response = await axios.post<UserResponseDTO>(
      `${API_BASE_URL}/Authentication/register`, // ✅ Correct endpoint for user creation
      formData,
      {
        headers: {
          Accept: "text/plain",
          "Content-Type": "multipart/form-data",
        },
      }
    );
    console.log("✅ User created successfully:", response.data);
    return response.data;
  } catch (error: any) {
    console.error(error.message);
    throw error;
  }
};

export const getCurrentProfile = async (): Promise<UserResponseDTO> => {
  try {
    const authToken = useAuthStore.getState().token;

    if (!authToken) {
      throw new Error("No authentication token found. Please log in again.");
    }

    const response = await axios.get<UserResponseDTO>(`${BASE_URL}/profile`, {
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${authToken}`,
      },
    });

    console.log("✅ Profile retrieved:", response.data);
    return response.data;
  } catch (err: any) {
    const status = err?.response?.status;
    const data = err?.response?.data;
    const msg = data?.message;

    console.error("[acceptOrder] Request Failed", {
      url: err?.config?.url,
      method: err?.config?.method?.toUpperCase(),
      status,
      message: msg,
      data,
      timestamp: new Date().toISOString(),
    });
    throw err;
  }
};

type ChangeRoleResponse = {
  newToken: string;
  user: UserResponseDTO;
};

export const changeRole = async (): Promise<ChangeRoleResponse> => {
  try {
    const { token, user } = useAuthStore.getState();
    if (!user) throw new Error("User not found in store.");

    let targetRole: Role;

    console.log(`CURRENT ROLE: ${user.currentRole}`);

    switch (user.currentRole) {
      case Role.COURIER:
        targetRole = Role.CUSTOMER;
        break;
      case Role.CUSTOMER:
        targetRole = Role.COURIER;
        break;
      default:
        throw new Error("Invalid current role");
    }

    console.log("Changing role to:", targetRole);

    const changeRoleUrl = `${BASE_URL}/change/role/${targetRole}`;
    console.log(changeRoleUrl);
    const response = await axios.patch(
      changeRoleUrl,
      {}, // no body
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      }
    );

    console.log("Role changed on server:", response.data);

    const updatedUser = await getCurrentProfile();
    useAuthStore.setState({ user: updatedUser });

    console.log("Refreshed user profile:", updatedUser);

    return {
      newToken: response.data,
      user: updatedUser,
    };
  } catch (err: any) {
    const status = err?.response?.status;
    const data = err?.response?.data;
    const msg = data?.message || `Failed to change user role.`;
    console.error("❌ [changeRole] Request Failed", {
      url: err?.config?.url,
      method: err?.config?.method?.toUpperCase(),
      status,
      message: msg,
      data,
    });
    throw new Error(`${msg} (HTTP ${status ?? "Unknown"})`);
  }
};

export const getUserById = async (userId: number): Promise<UserResponseDTO> => {
  try {
    const { token } = useAuthStore.getState();

    const response = await axios.get<UserResponseDTO>(`${BASE_URL}/${userId}`, {
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    return response.data;
  } catch (err) {
    console.error("❌ Error fetching user by ID:", err);
    throw err;
  }
};

export const changeProfile = async (imageFile: RNFile) => {
  const { token } = useAuthStore.getState();

  const formData = new FormData();
  formData.append("ProfilePicture", {
    uri: imageFile.uri,
    name: imageFile.name,
    type: imageFile.type,
  } as any);

  try {
    const { data } = await axios.patch(`${BASE_URL}/change/profile`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
        Authorization: `Bearer ${token}`,
      },
    });

    console.log(`RESPONSE ${JSON.stringify(data)}`);

    return data;
  } catch (err) {
    console.log(err);
    throw err;
  }
};

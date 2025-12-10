import axios from "axios";
import { API_BASE_URL } from "./config";
import { RNFile, UserRequestDTO } from "./dto/request/auth.request.dto";
import { UserResponseDTO } from "./dto/response/auth.response.dto";
import { useAuthStore } from "./store/auth_store";
import { Role } from "@/types/types";
import { useOrdersHubStore } from "./store/orders_hub_store";
import { user } from "@/constants/user";

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
  formData.append("Phone", `09104146278${userRequest.firstName}`);
  formData.append("Birthday", userRequest.birthday);

  if (userRequest.frontId) {
    formData.append("FrontId", {
      uri: userRequest.frontId.uri,
      name: userRequest.frontId.name,
      type: "image/jpeg",
    } as any);
  }
  if (userRequest.backId) {
    formData.append("BackId", {
      uri: userRequest.backId.uri,
      name: userRequest.backId.name,
      type: "image/jpeg",
    } as any);
  }
  if (userRequest.insurance) {
    formData.append("Insurance", {
      uri: userRequest.insurance.uri,
      name: userRequest.insurance.name || "insurance.jpg",
      type: "image/jpeg",
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

    console.error("[getCurrentProfile] Request Failed", {
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
    let currentRoleName: string;
    let targetRoleName: string;

    console.log(`CURRENT ROLE: ${user.currentRole}`);

    switch (user.currentRole) {
      case Role.COURIER:
        targetRole = Role.CUSTOMER;
        currentRoleName = "Courier";
        targetRoleName = "Customer";
        break;
      case Role.CUSTOMER:
        targetRole = Role.COURIER;
        currentRoleName = "Customer";
        targetRoleName = "Courier";
        break;
      default:
        throw new Error("Invalid current role");
    }

    // Leave current role group BEFORE changing role (while token is still valid for current role)
    try {
      const { invokeHub, connection } = useOrdersHubStore.getState();
      if (connection) {
        console.log(`[HUB] Leaving ${currentRoleName}Group...`);
        await invokeHub(`Leave${currentRoleName}Group`);
      }
    } catch (hubErr) {
      console.warn("SignalR leave group failed (non-critical):", hubErr);
    }

    console.log("Changing role to:", targetRole);

    const changeRoleUrl = `${BASE_URL}/change/role/${targetRole}`;
    console.log(`CHANGE ${changeRoleUrl}`);
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

    // Extract token - handle both string and object response formats
    const newToken =
      typeof response.data === "string"
        ? response.data
        : response.data?.token ?? response.data;

    console.log("[SWITCH] New token received:", newToken ? "✅" : "❌");

    // Update auth store with new token FIRST
    if (newToken && typeof newToken === "string") {
      useAuthStore.setState({ token: newToken });
      console.log("[SWITCH] Token updated in auth store");
    }

    // Disconnect SignalR so it reconnects with the new token on navigation
    try {
      console.log(`[HUB] Joined ${targetRoleName}Group before disconnecting`);
      console.log(
        "[HUB] Disconnected - will reconnect with new role on navigation"
      );
    } catch (hubErr) {
      console.warn("SignalR disconnect failed (non-critical):", hubErr);
    }

    const { initConnection, joinRoleGroup } = useOrdersHubStore.getState();
    const updatedUser = await getCurrentProfile();
    useAuthStore.setState({ user: updatedUser });
    await joinRoleGroup(
      user.currentRole === Role.COURIER ? "courier" : "customer"
    );

    console.log("Refreshed user profile:", updatedUser);

    return {
      newToken: newToken,
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

/** Change user name */
export const changeName = async (
  firstName: string,
  middleName: string,
  lastName: string
): Promise<UserResponseDTO> => {
  try {
    const { token } = useAuthStore.getState();

    const response = await axios.patch<UserResponseDTO>(
      `${BASE_URL}/change/name`,
      { firstName, middleName, lastName },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      }
    );

    console.log("✅ Name changed successfully:", response.data);

    // Update user in store
    const updatedUser = await getCurrentProfile();
    useAuthStore.setState({ user: updatedUser });

    return response.data;
  } catch (err: any) {
    console.error(
      "❌ [changeName] Request Failed:",
      err?.response?.data || err.message
    );
    throw new Error(err?.response?.data?.message || "Failed to change name");
  }
};

/** Send email verification code */
export const sendEmailVerificationCode = async (
  newEmail: string
): Promise<void> => {
  try {
    const { token } = useAuthStore.getState();

    await axios.get(
      `${API_BASE_URL}/VerificationCode/email/${encodeURIComponent(newEmail)}`,
      {
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
      }
    );

    console.log("✅ Verification code sent to:", newEmail);
  } catch (err: any) {
    console.error(
      "❌ [sendEmailVerificationCode] Request Failed:",
      err?.response?.data || err.message
    );
    throw new Error(
      err?.response?.data?.message || "Failed to send verification code"
    );
  }
};

/** Send email verification code for registration (no auth required) */
export const sendRegistrationEmailCode = async (
  email: string
): Promise<void> => {
  try {
    await axios.get(
      `${API_BASE_URL}/VerificationCode/email/${encodeURIComponent(email)}`,
      {
        headers: {
          Accept: "application/json",
        },
      }
    );

    console.log("✅ Registration verification code sent to:", email);
  } catch (err: any) {
    console.error(
      "❌ [sendRegistrationEmailCode] Request Failed:",
      err?.response?.data || err.message
    );
    throw new Error(
      err?.response?.data?.message || "Failed to send verification code"
    );
  }
};

/** Verify email code for registration (no auth required) */
export const verifyRegistrationEmailCode = async (
  email: string,
  verificationCode: string
): Promise<boolean> => {
  try {
    const response = await axios.post(
      `${API_BASE_URL}/VerificationCode/email/verify`,
      { email, verificationCode },
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    console.log("✅ Registration email code verified successfully");
    return response.data;
  } catch (err: any) {
    console.error(
      "❌ [verifyRegistrationEmailCode] Request Failed:",
      err?.response?.data || err.message
    );
    throw new Error(
      err?.response?.data?.message || "Invalid verification code"
    );
  }
};

/** Verify email code */
export const verifyEmailCode = async (
  email: string,
  verificationCode: string
): Promise<boolean> => {
  try {
    const { token } = useAuthStore.getState();

    const response = await axios.post(
      `${API_BASE_URL}/VerificationCode/email/verify`,
      { email, verificationCode },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      }
    );

    console.log(`VERIFY RESPONSE: ${JSON.stringify(response.data)}`);

    console.log("✅ Email code verified successfully");
    return response.data;
  } catch (err: any) {
    console.error(
      "❌ [verifyEmailCode] Request Failed:",
      err?.response?.data || err.message
    );
    throw new Error(
      err?.response?.data?.message || "Invalid verification code"
    );
  }
};

/** Change user email */
export const changeEmail = async (
  newEmail: string,
  code: string
): Promise<UserResponseDTO> => {
  try {
    const { token } = useAuthStore.getState();

    const response = await axios.patch<UserResponseDTO>(
      `${BASE_URL}/change/email`,
      { email: newEmail, code },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      }
    );

    console.log("✅ Email changed successfully:", response.data);

    // Update user in store
    const updatedUser = await getCurrentProfile();
    useAuthStore.setState({ user: updatedUser });

    return response.data;
  } catch (err: any) {
    console.error(
      "❌ [changeEmail] Request Failed:",
      err?.response?.data || err.message
    );
    throw new Error(err?.response?.data?.message || "Failed to change email");
  }
};

/** Change user phone number */
export const changePhone = async (
  newPhone: string
): Promise<UserResponseDTO> => {
  try {
    const { token } = useAuthStore.getState();

    const response = await axios.patch<UserResponseDTO>(
      `${BASE_URL}/change/phone`,
      { phone: newPhone },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      }
    );

    console.log("✅ Phone changed successfully:", response.data);

    // Update user in store
    const updatedUser = await getCurrentProfile();
    useAuthStore.setState({ user: updatedUser });

    return response.data;
  } catch (err: any) {
    console.error(
      "❌ [changePhone] Request Failed:",
      err?.response?.data || err.message
    );
    throw new Error(
      err?.response?.data?.message || "Failed to change phone number"
    );
  }
};

/** Change user password */
export const changePassword = async (
  currentPassword: string,
  newPassword: string
): Promise<void> => {
  try {
    const { token } = useAuthStore.getState();

    await axios.patch(
      `${BASE_URL}/change/password`,
      { currentPassword, newPassword },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      }
    );

    console.log("✅ Password changed successfully");
  } catch (err: any) {
    console.error(
      "❌ [changePassword] Request Failed:",
      err?.response?.data || err.message
    );
    throw new Error(
      err?.response?.data?.message || "Failed to change password"
    );
  }
};

export const checkUsernameExist = async (username: String) => {
  try {
    const { token } = useAuthStore.getState();
    if (username.length === 0) return;
    console.log(`URL: ${BASE_URL}/check/username/${username}`);
    const response = await axios.get(`${BASE_URL}/check/username/${username}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    console.log("✅ Username check response:", response.data);
    return response.data;
  } catch (err: any) {
    console.error(err);
    throw err;
  }
};

export const checkEmailExist = async (email: String) => {
  try {
    const { token } = useAuthStore.getState();

    const response = await axios.get(`${BASE_URL}/check/email/${email}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    console.log("✅ Username check response:", response.data);
    return response.data;
  } catch (err: any) {
    console.error(err);
    throw err;
  }
};

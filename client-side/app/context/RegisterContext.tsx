import React, { createContext, useContext, useEffect, useState } from "react";
import { UserRequestDTO } from "../api/dto/request/auth.request.dto";

// The context data contract
interface RegisterContextProps {
  userData: Partial<UserRequestDTO>; // holds current form data
  updateUserData: (data: Partial<UserRequestDTO>) => void; // merge/update new fields
  resetUserData: () => void; // clear all data after submit
}

// Create the context
const RegisterContext = createContext<RegisterContextProps | undefined>(
  undefined
);

// Context Provider
export const RegisterProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [userData, setUserData] = useState<Partial<UserRequestDTO>>({});

  // Merge incremental updates (for each screen)
  const updateUserData = (data: Partial<UserRequestDTO>) => {
    setUserData((prev) => ({ ...prev, ...data }));
  };

  // Reset data after registration is completed
  const resetUserData = () => setUserData({});

  useEffect(() => {
    console.log("User Data Updated:", userData);
  }, [userData]);

  return (
    <RegisterContext.Provider
      value={{ userData, updateUserData, resetUserData }}
    >
      {children}
    </RegisterContext.Provider>
  );
};

// Custom hook for convenient usage
export const useRegister = (): RegisterContextProps => {
  const context = useContext(RegisterContext);
  if (!context) {
    throw new Error("useRegister must be used within a RegisterProvider");
  }
  return context;
};

import { useEffect } from "react";

import { getUserById } from "../user";
import { Role } from "@/types/types";
import { UserResponseDTO } from "../dto/response/auth.response.dto";
import { useAuthStore } from "../store/auth_store";
import { useActiveOrderStore } from "../store/order_store";
import { useOtherUserStore } from "../store/user_store";

export const useOtherUser = (): UserResponseDTO | null => {
  const { user } = useAuthStore();
  const { activeOrder } = useActiveOrderStore();
  const { otherUser, setOtherUser, clearOtherUser } = useOtherUserStore();

  useEffect(() => {
    const load = async () => {
      if (!user || !activeOrder) {
        // Clear otherUser if no active order
        if (otherUser) clearOtherUser();
        return;
      }

      const targetId =
        user.currentRole === Role.COURIER
          ? activeOrder.customerId
          : activeOrder.courierId;

      if (targetId === 0) return;

      // Check if we already have the correct otherUser loaded
      if (otherUser && otherUser.userIdPK === targetId) {
        return; // Already loaded the correct user
      }

      // Fetch the correct user (new order or different user)
      const targetUser = await getUserById(targetId);
      if (targetUser) setOtherUser(targetUser);
    };

    load();
  }, [user, activeOrder?.orderIdPK]); // Only re-run when order changes

  return otherUser;
};

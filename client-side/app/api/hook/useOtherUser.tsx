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
  const { otherUser, setOtherUser } = useOtherUserStore();

  useEffect(() => {
    const load = async () => {
      if (!user || !activeOrder) return;
      if (otherUser) return; // already loaded

      const targetId =
        user.currentRole === Role.COURIER
          ? activeOrder.customerId
          : activeOrder.courierId;

      if (targetId === 0) return;

      const targetUser = await getUserById(targetId);
      if (targetUser) setOtherUser(targetUser);
    };

    load();
  }, [user, activeOrder, otherUser, setOtherUser]);

  return otherUser;
};

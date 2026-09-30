import { useQuery } from "@tanstack/react-query";
import { getUsers } from "../api/userApi";

export const useUsers = (params?: { role?: string; status?: string }) => {
  return useQuery({
    queryKey: ["users", params],
    queryFn: () => getUsers(params || {}),
  });
};
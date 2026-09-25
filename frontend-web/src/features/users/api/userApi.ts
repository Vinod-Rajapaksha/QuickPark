import { axiosClient } from "../../../services/api/axiosClient";
import type {
  CreateUserRequest,
  UpdateUserRequest,
  UpdateUserStatusRequest,
} from "../../../types/user.ts";

export const getUsers = async (params: {
  search?: string;
  role?: string;
  status?: string;
  page?: number;
  limit?: number;
}) => {
  const response = await axiosClient.get("/Users", { params });
  return response.data;
};

export const createUser = async (data: CreateUserRequest) => {
  const response = await axiosClient.post("/Users", data);
  return response.data;
};

export const updateUser = async (id: string, data: UpdateUserRequest) => {
  const response = await axiosClient.put(`/Users/${id}`, data);
  return response.data;
};

export const updateUserStatus = async (
  id: string,
  data: UpdateUserStatusRequest,
) => {
  const response = await axiosClient.patch(`/Users/${id}/status`, data);
  return response.data;
};

export const deleteUser = async (id: string) => {
  const response = await axiosClient.delete(`/Users/${id}`);
  return response.data;
};

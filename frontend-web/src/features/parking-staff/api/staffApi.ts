import { axiosClient as api } from "../../../services/api/axiosClient";
import type {
  StaffResponse,
  CreateStaffRequest,
  UpdateStaffStatusRequest,
  UpdateStaffAssignmentRequest,
  UpdateStaffRequest,
} from "../types/staffTypes";

export const staffApi = {
  getAllStaff: async (): Promise<StaffResponse[]> => {
    const response = await api.get("/provider/staff");
    return response.data;
  },

  createStaff: async (data: CreateStaffRequest): Promise<StaffResponse> => {
    const response = await api.post("/provider/staff", data);
    return response.data;
  },

  updateStaff: async (
    staffId: string,
    data: UpdateStaffRequest,
  ): Promise<StaffResponse> => {
    const response = await api.put(`/provider/staff/${staffId}`, data);
    return response.data;
  },

  updateStaffStatus: async (
    staffId: string,
    data: UpdateStaffStatusRequest,
  ): Promise<void> => {
    const response = await api.patch(`/provider/staff/${staffId}/status`, data);
    return response.data;
  },

  updateStaffAssignment: async (
    staffId: string,
    data: UpdateStaffAssignmentRequest,
  ): Promise<void> => {
    const response = await api.patch(
      `/provider/staff/${staffId}/assignment`,
      data,
    );
    return response.data;
  },
};

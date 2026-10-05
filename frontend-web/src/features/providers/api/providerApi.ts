import { axiosClient } from "../../../services/api/axiosClient";
import type { ProviderProfile } from "../types/providerTypes";

export const providerApi = {
  getMyProfile: async (): Promise<ProviderProfile> => {
    const response = await axiosClient.get("/providers/me");
    return response.data;
  },

  uploadNicDocument: async (file: File): Promise<ProviderProfile> => {
    const form = new FormData();
    form.append("file", file);
    const response = await axiosClient.post("/providers/me/nic", form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
  },

  getMyNicDocumentUrl: async (): Promise<string> => {
    const response = await axiosClient.get<{ url: string }>(
      "/providers/me/nic-document",
    );
    return response.data.url;
  },

  getPendingVerifications: async (): Promise<ProviderProfile[]> => {
    const response = await axiosClient.get("/providers/pending");
    return response.data;
  },

  getProviderProfile: async (userId: string): Promise<ProviderProfile> => {
    const response = await axiosClient.get(`/providers/${userId}`);
    return response.data;
  },

  getNicDocumentUrlFor: async (userId: string): Promise<string> => {
    const response = await axiosClient.get<{ url: string }>(
      `/providers/${userId}/nic-document`,
    );
    return response.data.url;
  },

  updateVerificationStatus: async (
    userId: string,
    status: "APPROVED" | "REJECTED",
    remarks?: string,
  ): Promise<ProviderProfile> => {
    const response = await axiosClient.put(
      `/providers/${userId}/verification-status`,
      { status, remarks },
    );
    return response.data;
  },
};

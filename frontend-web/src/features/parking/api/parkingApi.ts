import { axiosClient } from "../../../services/api/axiosClient";
import type {
  AllocationInput,
  FacilityQueueRow,
  FacilityDocumentType,
  FacilityReview,
  FacilitySectionName,
  ParkingFacility,
  ParkingFacilityDocument,
  ParkingInput,
  ParkingLocationFilter,
  RegistrationOptions,
} from "../types/parkingTypes";

// The facilities controller is route-templated as api/ParkingFacilities.
const BASE = "/parkingFacilities";

export const parkingApi = {
  getMyFacilities: async (): Promise<ParkingFacility[]> => {
    const response = await axiosClient.get(`${BASE}/me`);
    return response.data;
  },

  createFacility: async (input: ParkingInput): Promise<ParkingFacility> => {
    const response = await axiosClient.post(BASE, input);
    return response.data;
  },

  updateFacility: async (
    facilityId: string,
    input: ParkingInput,
  ): Promise<ParkingFacility> => {
    const response = await axiosClient.put(`${BASE}/${facilityId}`, input);
    return response.data;
  },

  searchApproved: async (
    filter: ParkingLocationFilter = {},
  ): Promise<ParkingFacility[]> => {
    const params: Record<string, string | number> = {};
    if (filter.province) params.province = filter.province;
    if (filter.district) params.district = filter.district;
    // One number on its own is refused by the server, so send the pair or nothing.
    if (filter.latitude !== null && filter.latitude !== undefined &&
        filter.longitude !== null && filter.longitude !== undefined) {
      params.latitude = filter.latitude;
      params.longitude = filter.longitude;
      if (filter.radiusKm) params.radiusKm = filter.radiusKm;
    }

    const response = await axiosClient.get(BASE, { params });
    return response.data;
  },

  getApprovedFacility: async (facilityId: string): Promise<ParkingFacility> => {
    const response = await axiosClient.get(`${BASE}/${facilityId}`);
    return response.data;
  },

  getDocuments: async (facilityId: string): Promise<ParkingFacilityDocument[]> => {
    const response = await axiosClient.get(`${BASE}/${facilityId}/documents`);
    return response.data;
  },

  uploadDocument: async (
    facilityId: string,
    documentType: FacilityDocumentType,
    file: File,
  ): Promise<ParkingFacilityDocument> => {
    const form = new FormData();
    form.append("documentType", documentType);
    form.append("file", file);
    const response = await axiosClient.post(
      `${BASE}/${facilityId}/documents`,
      form,
      { headers: { "Content-Type": "multipart/form-data" } },
    );
    return response.data;
  },

  deleteDocument: async (documentId: string): Promise<void> => {
    await axiosClient.delete(`${BASE}/documents/${documentId}`);
  },

  getRegistrationOptions: async (): Promise<RegistrationOptions> => {
    const response = await axiosClient.get(`${BASE}/registration-options`);
    return response.data;
  },

  saveAllocations: async (
    facilityId: string,
    allocations: AllocationInput[],
  ): Promise<ParkingFacility> => {
    const response = await axiosClient.put(
      `${BASE}/${facilityId}/allocations`,
      { allocations },
    );
    return response.data;
  },

  submitForReview: async (facilityId: string): Promise<ParkingFacility> => {
    const response = await axiosClient.post(`${BASE}/${facilityId}/submit`);
    return response.data;
  },


  getFacilitiesForReview: async (
    status?: string,
    provider?: string,
  ): Promise<FacilityQueueRow[]> => {
    const params: Record<string, string> = {};
    if (status) params.status = status;
    if (provider) params.provider = provider;
    const response = await axiosClient.get(`${BASE}/admin`, { params });
    return response.data;
  },

  getFacilityForReview: async (facilityId: string): Promise<FacilityReview> => {
    const response = await axiosClient.get(`${BASE}/admin/${facilityId}`);
    return response.data;
  },

  // One decision over the whole property: the same answer for all four sections.
  reviewFacility: async (
    facilityId: string,
    decision: "APPROVED" | "REJECTED",
    rejectionReason?: string,
  ): Promise<ParkingFacility> => {
    const response = await axiosClient.put(`${BASE}/admin/${facilityId}`, {
      decision,
      rejectionReason: rejectionReason || null,
    });
    return response.data;
  },

  reviewFacilitySection: async (
    facilityId: string,
    section: FacilitySectionName,
    decision: "APPROVED" | "REJECTED",
    remarks?: string,
  ): Promise<ParkingFacility> => {
    const response = await axiosClient.put(
      `${BASE}/admin/${facilityId}/sections/${section}`,
      { decision, remarks: remarks || null },
    );
    return response.data;
  },
};

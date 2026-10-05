import { axiosClient } from "../../../services/api/axiosClient";
import type {
  CreateReservationInput,
  DriverSlot,
  Reservation,
} from "../types/reservationTypes";

const RESERVATION_ENDPOINT = "/Reservations";

export interface DriverReservationFilter {
  status?: string;
  from?: string;
  to?: string;
}

export const reservationApi = {
  create: async (input: CreateReservationInput): Promise<Reservation> => {
    const response = await axiosClient.post(RESERVATION_ENDPOINT, input);
    return response.data;
  },

  getMyReservations: async (
    filter: DriverReservationFilter = {},
  ): Promise<Reservation[]> => {
    const params: Record<string, string> = {};
    if (filter.status) params.status = filter.status;
    if (filter.from) params.from = filter.from;
    if (filter.to) params.to = filter.to;
    const response = await axiosClient.get(`${RESERVATION_ENDPOINT}/me`, {
      params,
    });
    return response.data;
  },

  getById: async (reservationId: string): Promise<Reservation> => {
    const response = await axiosClient.get(
      `${RESERVATION_ENDPOINT}/${reservationId}`,
    );
    return response.data;
  },

  cancel: async (
    reservationId: string,
    reason?: string,
  ): Promise<Reservation> => {
    const response = await axiosClient.post(
      `${RESERVATION_ENDPOINT}/${reservationId}/cancel`,
      {
        reason: reason?.trim() || null,
      },
    );
    return response.data;
  },

  getAvailableSlots: async (
    facilityId: string,
    vehicleTypeId: string,
    from: string,
    to: string,
  ): Promise<DriverSlot[]> => {
    const response = await axiosClient.get(
      `/parkingFacilities/${facilityId}/slots`,
      {
        params: { vehicleTypeId, from, to },
      },
    );
    return response.data;
  },

  getMine: async (status?: string): Promise<Reservation[]> => {
    const response = await axiosClient.get<Reservation[]>(
      `${RESERVATION_ENDPOINT}/me`,
      {
        params: status ? { status } : undefined,
      },
    );

    return response.data;
  },

  getProvider: async (status?: string): Promise<Reservation[]> => {
    const response = await axiosClient.get<Reservation[]>(
      `${RESERVATION_ENDPOINT}/provider`,
      {
        params: status ? { status } : undefined,
      },
    );
    return response.data;
  },

  approve: async (id: string): Promise<Reservation> => {
    const response = await axiosClient.post<Reservation>(
      `${RESERVATION_ENDPOINT}/${id}/approve`,
    );
    return response.data;
  },

  reject: async (id: string, reason?: string): Promise<Reservation> => {
    const response = await axiosClient.post<Reservation>(
      `${RESERVATION_ENDPOINT}/${id}/reject`,
      { reason },
    );
    return response.data;
  },

  sendMessage: async (id: string, message: string): Promise<void> => {
    await axiosClient.post(`${RESERVATION_ENDPOINT}/${id}/message`, {
      message,
    });
  },
};

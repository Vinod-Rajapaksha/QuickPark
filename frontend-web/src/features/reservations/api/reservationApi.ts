import { axiosClient } from "../../../services/api/axiosClient";
import type {
  CreateReservationInput,
  DriverSlot,
  Reservation,
} from "../types/reservationTypes";

const BASE = "/reservations";

export interface DriverReservationFilter {
  status?: string;
  from?: string;
  to?: string;
}

export const reservationApi = {
  create: async (input: CreateReservationInput): Promise<Reservation> => {
    const response = await axiosClient.post(BASE, input);
    return response.data;
  },

  getMyReservations: async (filter: DriverReservationFilter = {}): Promise<Reservation[]> => {
    const params: Record<string, string> = {};
    if (filter.status) params.status = filter.status;
    if (filter.from) params.from = filter.from;
    if (filter.to) params.to = filter.to;
    const response = await axiosClient.get(`${BASE}/me`, { params });
    return response.data;
  },

  getById: async (reservationId: string): Promise<Reservation> => {
    const response = await axiosClient.get(`${BASE}/${reservationId}`);
    return response.data;
  },

  cancel: async (reservationId: string, reason?: string): Promise<Reservation> => {
    const response = await axiosClient.post(`${BASE}/${reservationId}/cancel`, {
      reason: reason?.trim() || null,
    });
    return response.data;
  },

  // Bays of an approved property judged against the period the driver picked. The server re-checks
  // this when the booking is created, so a bay listed as free is only ever a promise to try.
  getAvailableSlots: async (
    facilityId: string,
    vehicleTypeId: string,
    from: string,
    to: string,
  ): Promise<DriverSlot[]> => {
    const response = await axiosClient.get(`/parkingFacilities/${facilityId}/slots`, {
      params: { vehicleTypeId, from, to },
    });
    return response.data;
  },
};

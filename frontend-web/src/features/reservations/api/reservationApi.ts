import { axiosClient } from "../../../services/api/axiosClient";
import type { Reservation } from "../types/reservationTypes";

const RESERVATION_ENDPOINT = "/Reservations";

export const reservationApi = {
  getMine: async (status?: string): Promise<Reservation[]> => {
    const response = await axiosClient.get<Reservation[]>(
      `${RESERVATION_ENDPOINT}/me`,
      {
        params: status ? { status } : undefined,
      },
    );

    return response.data;
  },

  getById: async (id: string): Promise<Reservation> => {
    const response = await axiosClient.get<Reservation>(`${RESERVATION_ENDPOINT}/${id}`);
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
    const response = await axiosClient.post<Reservation>(`${RESERVATION_ENDPOINT}/${id}/approve`);
    return response.data;
  },

  reject: async (id: string, reason?: string): Promise<Reservation> => {
    const response = await axiosClient.post<Reservation>(`${RESERVATION_ENDPOINT}/${id}/reject`, { reason });
    return response.data;
  },

  sendMessage: async (id: string, message: string): Promise<void> => {
    await axiosClient.post(`${RESERVATION_ENDPOINT}/${id}/message`, { message });
  },
};

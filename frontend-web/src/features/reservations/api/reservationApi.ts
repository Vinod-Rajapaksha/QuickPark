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
};

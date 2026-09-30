import { axiosClient } from "../../../services/api/axiosClient";

export interface QrTokenResponse {
  token: string;
  reservationId: string;
  expiresAt: string;
}

export const qrTokenApi = {
  getReservationToken: async (reservationId: string): Promise<QrTokenResponse> => {
    const response = await axiosClient.get(`/Tokens/reservation/${reservationId}`);
    return response.data;
  },
};

import { axiosClient } from "../../../services/api/axiosClient";

export const paymentApi = {
  confirmExternal: async (reservationId: string, transactionId: string) => {
    const response = await axiosClient.post("/Payments/external/confirm", {
      reservationId,
      transactionId,
    });
    return response.data;
  },
};
import { axiosClient } from "../../../services/api/axiosClient";
import type {
  ParkingSlotDetails,
  SlotBoard,
  SlotBoardFilter,
  SlotStatusInput,
} from "../types/parkingSlotTypes";

// Route-templated as api/ParkingSlots; every route is owner-only.
const BASE = "/parkingSlots";

export const parkingSlotApi = {
  // One property's board — header, totals, and the bays the filters leave standing.
  getBoard: async (facilityId: string, filter: SlotBoardFilter = {}): Promise<SlotBoard> => {
    const params: Record<string, string> = {};
    if (filter.vehicleTypeId) params.vehicleTypeId = filter.vehicleTypeId;
    if (filter.status) params.status = filter.status;
    if (filter.from) params.from = filter.from;
    if (filter.to) params.to = filter.to;

    const response = await axiosClient.get(`${BASE}/provider/facilities/${facilityId}`, {
      params,
    });
    return response.data;
  },

  // One bay with what holds it, what waits for it, and what it carried.
  getSlot: async (slotId: string): Promise<ParkingSlotDetails> => {
    const response = await axiosClient.get(`${BASE}/provider/slots/${slotId}`);
    return response.data;
  },

  // AVAILABLE, MAINTENANCE or DISABLED; refused while a booking holds the bay.
  updateSlotStatus: async (
    slotId: string,
    input: SlotStatusInput,
  ): Promise<ParkingSlotDetails["slot"]> => {
    const response = await axiosClient.patch(`${BASE}/provider/slots/${slotId}/status`, {
      status: input.status,
      reason: input.reason?.trim() || null,
    });
    return response.data;
  },
};

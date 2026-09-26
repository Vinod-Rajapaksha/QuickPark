import { axiosClient } from "../../../services/api/axiosClient";
import type {
  SaveVehiclePricingInput,
  SaveVehicleTypeInput,
  VehiclePricingConfig,
  VehicleTypeConfig,
} from "../types/commissionTypes";

const BASE = "/admin/parking-configuration";

export const commissionApi = {
  getVehicleTypes: async (): Promise<VehicleTypeConfig[]> => {
    const response = await axiosClient.get(`${BASE}/vehicle-types`);
    return response.data;
  },

  createVehicleType: async (
    input: SaveVehicleTypeInput,
  ): Promise<VehicleTypeConfig> => {
    const response = await axiosClient.post(`${BASE}/vehicle-types`, input);
    return response.data;
  },

  updateVehicleType: async (
    vehicleTypeId: string,
    input: SaveVehicleTypeInput,
  ): Promise<VehicleTypeConfig> => {
    const response = await axiosClient.put(
      `${BASE}/vehicle-types/${vehicleTypeId}`,
      input,
    );
    return response.data;
  },

  getPricing: async (): Promise<VehiclePricingConfig[]> => {
    const response = await axiosClient.get(`${BASE}/pricing`);
    return response.data;
  },

  // One configuration per vehicle type: this upserts, so it both creates and edits.
  savePricing: async (
    vehicleTypeId: string,
    input: SaveVehiclePricingInput,
  ): Promise<VehiclePricingConfig> => {
    const response = await axiosClient.put(
      `${BASE}/pricing/${vehicleTypeId}`,
      input,
    );
    return response.data;
  },

  deletePricing: async (vehicleTypeId: string): Promise<void> => {
    await axiosClient.delete(`${BASE}/pricing/${vehicleTypeId}`);
  },
};

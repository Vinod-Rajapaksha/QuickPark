import { useState, useCallback } from "react";
import { staffApi } from "../api/staffApi";
import type {
  StaffResponse,
  CreateStaffRequest,
  UpdateStaffRequest,
} from "../types/staffTypes";
import { useToast } from "../../../hooks/useToast";

export const useStaff = () => {
  const [staffList, setStaffList] = useState<StaffResponse[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { showToast } = useToast();

  const fetchStaff = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await staffApi.getAllStaff();
      setStaffList(data);
    } catch (err) {
      const error = err as { response?: { data?: { message?: string } } };
      const msg = error.response?.data?.message || "Failed to fetch staff";
      setError(msg);
      showToast(msg, "error");
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  const createStaff = async (data: CreateStaffRequest) => {
    setIsLoading(true);
    setError(null);
    try {
      await staffApi.createStaff(data);
      showToast("Staff member created successfully", "success");
      await fetchStaff();
      return true;
    } catch (err) {
      const error = err as { response?: { data?: { message?: string } } };
      const msg =
        error.response?.data?.message || "Failed to create staff member";
      setError(msg);
      showToast(msg, "error");
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const updateStaff = async (staffId: string, data: UpdateStaffRequest) => {
    setIsLoading(true);
    setError(null);
    try {
      await staffApi.updateStaff(staffId, data);
      showToast("Staff member updated successfully", "success");
      await fetchStaff();
      return true;
    } catch (err) {
      const error = err as { response?: { data?: { message?: string } } };
      const msg =
        error.response?.data?.message || "Failed to update staff member";
      setError(msg);
      showToast(msg, "error");
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const updateStaffStatus = async (staffId: string, isActive: boolean) => {
    if (
      !window.confirm(
        `Are you sure you want to ${isActive ? "activate" : "deactivate"} this staff member?`,
      )
    )
      return false;
    setIsLoading(true);
    try {
      await staffApi.updateStaffStatus(staffId, { isActive });
      showToast(
        `Staff member ${isActive ? "activated" : "deactivated"} successfully`,
        "success",
      );
      await fetchStaff();
      return true;
    } catch (err) {
      const error = err as { response?: { data?: { message?: string } } };
      const msg = error.response?.data?.message || "Failed to update status";
      showToast(msg, "error");
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const updateStaffAssignment = async (staffId: string, facilityId: string) => {
    setIsLoading(true);
    try {
      await staffApi.updateStaffAssignment(staffId, { facilityId });
      showToast("Facility assignment updated successfully", "success");
      await fetchStaff();
      return true;
    } catch (err) {
      const error = err as { response?: { data?: { message?: string } } };
      const msg =
        error.response?.data?.message || "Failed to update assignment";
      showToast(msg, "error");
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    staffList,
    isLoading,
    error,
    fetchStaff,
    createStaff,
    updateStaff,
    updateStaffStatus,
    updateStaffAssignment,
  };
};

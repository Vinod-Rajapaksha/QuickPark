export const StaffType = {
  STANDARD: "STANDARD",
  ADMINISTRATIVE: "ADMINISTRATIVE",
} as const;

export type StaffType = (typeof StaffType)[keyof typeof StaffType];

export interface StaffResponse {
  id: string;
  userId: string;
  fullName: string;
  email: string;
  phone: string;
  nic: string;
  facilityId: string;
  facilityName: string;
  type: StaffType;
  position: string;
  canManageReservations: boolean;
  canCheckInVehicle: boolean;
  canCheckOutVehicle: boolean;
  canViewReports: boolean;
  canManageStaff: boolean;
  isActive: boolean;
  createdAt: string;
}

export interface CreateStaffRequest {
  facilityId: string;
  fullName: string;
  email: string;
  password?: string;
  phone: string;
  nic: string;
  type: StaffType;
  position: string;
  canManageReservations?: boolean;
  canCheckInVehicle?: boolean;
  canCheckOutVehicle?: boolean;
  canViewReports?: boolean;
  canManageStaff?: boolean;
}

export interface UpdateStaffStatusRequest {
  isActive: boolean;
}

export interface UpdateStaffAssignmentRequest {
  facilityId: string;
}

export interface UpdateStaffRequest {
  fullName: string;
  phone: string;
  nic: string;
  password?: string;
  type: StaffType;
  position: string;
}

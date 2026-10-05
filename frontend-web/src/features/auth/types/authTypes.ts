export const Role = {
  DRIVER: 'DRIVER',
  PARKING_OWNER: 'PARKING_OWNER',
  PARKING_STAFF: 'PARKING_STAFF',
  PLATFORM_ADMIN: 'PLATFORM_ADMIN',
} as const;

export type Role = typeof Role[keyof typeof Role];

export interface User {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  nic: string;
  role: Role;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

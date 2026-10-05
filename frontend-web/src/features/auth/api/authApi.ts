import { axiosClient } from "../../../services/api/axiosClient";
import { Role, type User } from "../types/authTypes";

export interface LoginCredentials {
  email: string;
  password?: string;
}

export interface RegisterData {
  fullName: string;
  email: string;
  password?: string;
  phone: string;
  nic: string;
  role: Role | string;
}

export const authApi = {
  login: async (credentials: LoginCredentials) => {
    const response = await axiosClient.post("/auth/login", credentials);
    return response.data;
  },

  register: async (data: RegisterData) => {
    const roles: string[] = [
      Role.DRIVER,
      Role.PARKING_OWNER,
      Role.PARKING_STAFF,
      Role.PLATFORM_ADMIN,
    ];
    const roleIndex = roles.indexOf(data.role);
    const payload = {
      ...data,
      role: roleIndex !== -1 ? roleIndex : 0,
    };
    const response = await axiosClient.post("/auth/register", payload);
    return response.data;
  },

  logout: async () => {
    const response = await axiosClient.post("/auth/logout");
    return response.data;
  },

  getCurrentUser: async (): Promise<User> => {
    const response = await axiosClient.get("/auth/me");
    const user = response.data;

    if (typeof user.role === "number") {
      const roles = [
        Role.DRIVER,
        Role.PARKING_OWNER,
        Role.PARKING_STAFF,
        Role.PLATFORM_ADMIN,
      ];
      user.role = roles[user.role] || Role.DRIVER;
    }

    return user as User;
  },
};

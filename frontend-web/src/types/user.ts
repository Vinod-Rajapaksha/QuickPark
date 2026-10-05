export interface User {
    id: string;
    fullName: string;
    email: string;
    phone: string;
    nic: string;
    role: string;
    isActive: boolean;
    createdAt: string;
}

export interface CreateUserRequest {
    fullName: string;
    email: string;
    phone: string;
    nic: string;
    password?: string;
    role: string;
}

export interface UpdateUserRequest {
    fullName: string;
    email: string;
    phone: string;
    nic: string;
}

export interface UpdateUserStatusRequest {
    isActive: boolean;
}

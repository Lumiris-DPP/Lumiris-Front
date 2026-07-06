import type { User, UserRole } from '@lumiris/types';

export interface LoginRequest {
    email: string;
    password: string;
}

export interface RegisterRequest {
    email: string;
    password: string;
    name: string;
    role: UserRole;
}

export interface RefreshRequest {
    refreshToken: string;
}

export interface AuthResponse {
    token: string;
    refreshToken: string;
    user: User;
}

// deprecated: use AuthResponse
export type LoginResponse = AuthResponse;
export type RegisterResponse = AuthResponse;

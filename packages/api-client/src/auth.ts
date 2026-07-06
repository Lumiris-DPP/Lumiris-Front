import type { User, UserRole } from '@lumiris/types';
import type { Http } from './http';

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

/** @deprecated use AuthResponse */
export type LoginResponse = AuthResponse;
export type RegisterResponse = AuthResponse;

export function authApi(http: Http) {
    return {
        login(req: LoginRequest): Promise<AuthResponse> {
            return http.request<AuthResponse>('/api/auth/sign-in', { method: 'POST', body: req });
        },
        register(req: RegisterRequest): Promise<AuthResponse> {
            return http.request<AuthResponse>('/api/auth/sign-up', { method: 'POST', body: req });
        },
        me(): Promise<User> {
            return http.request<User>('/api/auth/me');
        },
        refresh(req: RefreshRequest): Promise<AuthResponse> {
            return http.request<AuthResponse>('/api/auth/refresh', { method: 'POST', body: req });
        },
    };
}

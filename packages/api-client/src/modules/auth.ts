import type { User } from '@lumiris/types';
import type { Http } from '../core/http';
import type { AuthResponse, LoginRequest, RegisterRequest } from '../types/auth';

export function authApi(http: Http) {
    return {
        login(req: LoginRequest): Promise<AuthResponse> {
            return http.request<AuthResponse>('/api/auth/login', { method: 'POST', body: req });
        },
        register(req: RegisterRequest): Promise<AuthResponse> {
            return http.request<AuthResponse>('/api/auth/register', { method: 'POST', body: req });
        },
        me(): Promise<User> {
            return http.request<User>('/api/auth/me');
        },
    };
}

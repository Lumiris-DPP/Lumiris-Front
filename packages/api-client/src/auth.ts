import type { Http } from './http';

export interface LoginRequest {
    email: string;
    password: string;
}

export interface LoginResponse {
    token: string;
}

export function authApi(http: Http) {
    return {
        login(req: LoginRequest): Promise<LoginResponse> {
            return http.request<LoginResponse>('/api/auth/login', { method: 'POST', body: req });
        },
    };
}

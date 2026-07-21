import type { User } from '@lumiris/types';
import type { Http } from '../core/http';
import type { AuthResponse, LoginRequest, RefreshRequest, RegisterRequest } from '../types/auth';

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
        // RGPD : anonymisation du compte côté serveur (204). Le caller doit ensuite purger
        // l'état local et déconnecter l'utilisateur.
        deleteAccount(): Promise<void> {
            return http.request<void>('/api/auth/me', { method: 'DELETE', skipJson: true });
        },
    };
}

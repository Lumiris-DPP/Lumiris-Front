export interface AuthUser {
    id: string;
    email: string;
    displayName: string;
    token: string;
    refreshToken: string;
    city?: string;
    stylePrefs?: string[];
    createdAt: string;
}

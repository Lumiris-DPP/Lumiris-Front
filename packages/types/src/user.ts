export type UserRole = 'consumer' | 'artisan' | 'admin' | 'repairer';

export interface User {
    id: string;
    email?: string;
    role: UserRole;
    name?: string;
    avatar?: string;
    anon?: boolean;
    createdAt: string;
    lastSeenAt?: string;
}

export interface ConsumerProfile extends User {
    role: 'consumer';
    wardrobePassportIds: readonly string[];
    scansCount: number;
    consentNewsletter?: boolean;
    consentAffiliation?: boolean;
}

export interface ArtisanProfile extends User {
    role: 'artisan';
    artisanId: string;
}

export interface AdminProfile extends User {
    role: 'admin';
}

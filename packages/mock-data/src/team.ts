import type { AdminProfile, ArtisanTier } from '@lumiris/types';
import { mockArtisanById } from './artisans';

export type TeamMemberRole = 'owner' | 'editor' | 'viewer';
export type TeamMemberStatus = 'active' | 'pending';

export interface TeamMember {
    id: string;
    name: string;
    email: string;
    role: TeamMemberRole;
    joinedAt: string;
    status: TeamMemberStatus;
}

export const TIER_SEATS: Record<ArtisanTier, number> = {
    Solo: 1,
    Studio: 5,
    Maison: 20,
};

function mulberry32(seed: number): () => number {
    let t = seed >>> 0;
    return () => {
        t = (t + 0x6d2b79f5) >>> 0;
        let r = Math.imul(t ^ (t >>> 15), t | 1);
        r ^= r + Math.imul(r ^ (r >>> 7), r | 61);
        return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
    };
}

function hashString(s: string): number {
    let h = 0x811c9dc5;
    for (let i = 0; i < s.length; i++) {
        h = Math.imul(h ^ s.charCodeAt(i), 0x01000193);
    }
    return h >>> 0;
}

const FIRST_NAMES = [
    'Camille',
    'Léa',
    'Sami',
    'Yanis',
    'Inès',
    'Léo',
    'Manon',
    'Karim',
    'Théa',
    'Eliott',
    'Nora',
    'Tom',
];
const LAST_NAMES = [
    'Durand',
    'Robert',
    'Martin',
    'Faure',
    'Marchal',
    'Roussel',
    'Lacombe',
    'Vasseur',
    'Petit',
    'Henry',
];
const NON_OWNER_ROLES: readonly TeamMemberRole[] = ['editor', 'viewer'];

function slug(s: string): string {
    return s
        .toLowerCase()
        .normalize('NFD')
        .replace(/[̀-ͯ]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
}

function pick<T>(arr: readonly T[], rng: () => number): T {
    const idx = Math.floor(rng() * arr.length);
    const item = arr[idx];
    if (item === undefined) {
        const fallback = arr[0];
        if (fallback === undefined) throw new Error('pick: empty array');
        return fallback;
    }
    return item;
}

export function generateInitialTeam(artisanId: string): TeamMember[] {
    const artisan = mockArtisanById(artisanId);
    if (!artisan) return [];
    if (artisan.tier !== 'Studio' && artisan.tier !== 'Maison') return [];

    const rng = mulberry32(hashString(artisanId));
    const count = 3 + Math.floor(rng() * 3);
    const domain = slug(artisan.atelierName) || 'atelier';
    const ownerEmail = `${slug(artisan.displayName).replace(/-/g, '.')}@${domain}.fr`;

    const members: TeamMember[] = [
        {
            id: `mbr-${artisanId}-owner`,
            name: artisan.displayName,
            email: ownerEmail,
            role: 'owner',
            joinedAt: artisan.joinedAt,
            status: 'active',
        },
    ];

    const baseTime = new Date(artisan.joinedAt).getTime();
    for (let i = 1; i < count; i++) {
        const first = pick(FIRST_NAMES, rng);
        const last = pick(LAST_NAMES, rng);
        const role = pick(NON_OWNER_ROLES, rng);
        const dayOffset = 14 + Math.floor(rng() * 365);
        const joinedAt = new Date(baseTime + dayOffset * 86_400_000).toISOString();
        members.push({
            id: `mbr-${artisanId}-${i}`,
            name: `${first} ${last}`,
            email: `${slug(first)}.${slug(last)}@${domain}.fr`,
            role,
            joinedAt,
            status: 'active',
        });
    }
    return members;
}

export interface MockTeamActivityEntry {
    id: string;
    actorId: string;
    actorName: string;
    role: 'admin';
    action: string;
    targetType: 'passport' | 'artisan' | 'journal' | 'repairer';
    targetLabel: string;
    timestamp: string;
}

export const mockAdmins: readonly AdminProfile[] = [
    {
        id: 'usr-fdr-juba',
        email: 'juba@lumiris.fr',
        role: 'admin',
        name: 'Juba Aït-Adda',
        avatar: 'https://placehold.co/128x128/png?text=Juba',
        createdAt: '2024-04-10T08:00:00Z',
        lastSeenAt: '2026-04-29T20:00:00Z',
    },
    {
        id: 'usr-adm-ops',
        email: 'ops@lumiris.fr',
        role: 'admin',
        name: 'Camille - DevOps',
        avatar: 'https://placehold.co/128x128/png?text=Ops',
        createdAt: '2024-05-15T08:00:00Z',
        lastSeenAt: '2026-04-29T17:30:00Z',
    },
    {
        id: 'usr-cm-elise',
        email: 'elise@lumiris.fr',
        role: 'admin',
        name: 'Élise Garnier',
        avatar: 'https://placehold.co/128x128/png?text=Elise',
        createdAt: '2024-09-02T08:00:00Z',
        lastSeenAt: '2026-04-29T18:45:00Z',
    },
];

export const mockTeamActivity: readonly MockTeamActivityEntry[] = [
    {
        id: 'act-001',
        actorId: 'usr-fdr-juba',
        actorName: 'Juba Aït-Adda',
        role: 'admin',
        action: 'Approbation modération',
        targetType: 'passport',
        targetLabel: 'CHE-MAR-001 (Atelier de Marie)',
        timestamp: '2026-04-29T16:42:00Z',
    },
    {
        id: 'act-002',
        actorId: 'usr-cm-elise',
        actorName: 'Élise Garnier',
        role: 'admin',
        action: 'Publication article',
        targetType: 'journal',
        targetLabel: 'Le lin breton - circuit court',
        timestamp: '2026-04-29T14:08:00Z',
    },
    {
        id: 'act-003',
        actorId: 'usr-fdr-juba',
        actorName: 'Juba Aït-Adda',
        role: 'admin',
        action: 'Mise en revue',
        targetType: 'passport',
        targetLabel: 'PAN-LEI-002 (Leïla Couture)',
        timestamp: '2026-04-29T11:20:00Z',
    },
    {
        id: 'act-004',
        actorId: 'usr-adm-ops',
        actorName: 'Camille - DevOps',
        role: 'admin',
        action: 'Validation KYC retoucheur',
        targetType: 'repairer',
        targetLabel: 'Mehdi Bouzid - Lyon',
        timestamp: '2026-04-28T09:55:00Z',
    },
    {
        id: 'act-005',
        actorId: 'usr-fdr-juba',
        actorName: 'Juba Aït-Adda',
        role: 'admin',
        action: 'Onboarding artisan',
        targetType: 'artisan',
        targetLabel: 'Pauline Roux Mode - Nantes',
        timestamp: '2026-04-27T15:14:00Z',
    },
];

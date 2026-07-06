'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { safeJSONStorage } from './persist-storage';
import { generateInitialTeam, type TeamMember, type TeamMemberRole } from '@lumiris/mock-data';

export { TIER_SEATS } from '@lumiris/mock-data';
export type { TeamMember, TeamMemberRole } from '@lumiris/mock-data';

interface TeamStoreState {
    byArtisan: Record<string, TeamMember[]>;
    ensure: (artisanId: string) => void;
    invite: (artisanId: string, email: string, role: TeamMemberRole) => void;
    changeRole: (artisanId: string, memberId: string, role: TeamMemberRole) => void;
    remove: (artisanId: string, memberId: string) => void;
}

function newMemberId(): string {
    return `mbr-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
}

export const useTeamStore = create<TeamStoreState>()(
    persist(
        (set) => ({
            byArtisan: {},
            ensure: (artisanId) =>
                set((s) => {
                    if (s.byArtisan[artisanId]) return s;
                    const initial = generateInitialTeam(artisanId);
                    if (initial.length === 0) return s;
                    return { byArtisan: { ...s.byArtisan, [artisanId]: initial } };
                }),
            invite: (artisanId, email, role) =>
                set((s) => {
                    const cur = s.byArtisan[artisanId] ?? generateInitialTeam(artisanId);
                    const member: TeamMember = {
                        id: newMemberId(),
                        name: email.split('@')[0] ?? email,
                        email,
                        role,
                        joinedAt: new Date().toISOString(),
                        status: 'pending',
                    };
                    return { byArtisan: { ...s.byArtisan, [artisanId]: [...cur, member] } };
                }),
            changeRole: (artisanId, memberId, role) =>
                set((s) => {
                    const cur = s.byArtisan[artisanId];
                    if (!cur) return s;
                    return {
                        byArtisan: {
                            ...s.byArtisan,
                            [artisanId]: cur.map((m) => (m.id === memberId && m.role !== 'owner' ? { ...m, role } : m)),
                        },
                    };
                }),
            remove: (artisanId, memberId) =>
                set((s) => {
                    const cur = s.byArtisan[artisanId];
                    if (!cur) return s;
                    return {
                        byArtisan: {
                            ...s.byArtisan,
                            [artisanId]: cur.filter((m) => m.id !== memberId || m.role === 'owner'),
                        },
                    };
                }),
        }),
        {
            name: 'atelier-team',
            version: 1,
            storage: safeJSONStorage,
        },
    ),
);

export function useTeam(artisanId: string): readonly TeamMember[] {
    const stored = useTeamStore((s) => s.byArtisan[artisanId]);
    if (stored) return stored;
    return generateInitialTeam(artisanId);
}

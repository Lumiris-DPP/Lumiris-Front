'use client';

import { useMemo } from 'react';
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { mockCertificates } from '@lumiris/mock-data';
import type { CertificationKind, CertificationRef } from '@lumiris/types';

export const MOCK_CERT_TO_ARTISAN: Record<string, string> = {
    'cert-gots-marie-lin': 'art-marie',
    'cert-oeko-claire-laine': 'art-claire',
    'cert-epv-paul': 'art-paul',
    'cert-ofg-marie': 'art-marie',
    'cert-grs-jules': 'art-jules',
    'cert-bluesign-romain': 'art-romain',
    'cert-iso14001-laurens': 'art-maison-laurens',
    'cert-custom-amelie': 'art-amelie',
    'cert-gots-pauline-expired': 'art-pauline',
    'cert-oeko-soraya-expired': 'art-soraya',
    'cert-custom-leila-unverified': 'art-leila',
    'cert-ofg-nicolas-unverified': 'art-nicolas',
};

const MOCK_CERT_IDS = new Set(mockCertificates.map((c) => c.id));

export function isMockCertificate(id: string): boolean {
    return MOCK_CERT_IDS.has(id);
}

export interface LocalCertificate extends CertificationRef {
    artisanId: string;
    fileDataUri?: string;
    addedAt: string;
}

export interface ArtisanCertificate extends CertificationRef {
    artisanId: string;
    isLocal: boolean;
    fileDataUri?: string;
    addedAt?: string;
}

interface CertificatesStoreState {
    byArtisan: Record<string, LocalCertificate[]>;
    expiredOverrides: Record<string, true>;
    addCertificate: (cert: LocalCertificate) => void;
    markExpired: (id: string) => void;
    removeCertificate: (artisanId: string, id: string) => void;
}

const noopStorage = {
    getItem: () => null,
    setItem: () => undefined,
    removeItem: () => undefined,
};

export const useCertificatesStore = create<CertificatesStoreState>()(
    persist(
        (set) => ({
            byArtisan: {},
            expiredOverrides: {},
            addCertificate: (cert) =>
                set((s) => ({
                    byArtisan: {
                        ...s.byArtisan,
                        [cert.artisanId]: [...(s.byArtisan[cert.artisanId] ?? []), cert],
                    },
                })),
            markExpired: (id) =>
                set((s) => ({
                    expiredOverrides: { ...s.expiredOverrides, [id]: true },
                })),
            removeCertificate: (artisanId, id) =>
                set((s) => ({
                    byArtisan: {
                        ...s.byArtisan,
                        [artisanId]: (s.byArtisan[artisanId] ?? []).filter((c) => c.id !== id),
                    },
                })),
        }),
        {
            name: 'atelier-certs',
            storage: createJSONStorage(() => (typeof window === 'undefined' ? noopStorage : localStorage)),
            version: 1,
        },
    ),
);

const EPOCH = '1970-01-01T00:00:00.000Z';

function applyOverride<T extends CertificationRef>(cert: T, overrides: Record<string, true>): T {
    return overrides[cert.id] ? { ...cert, expiresAt: EPOCH } : cert;
}

export function useCertificatesForArtisan(artisanId: string): ArtisanCertificate[] {
    const local = useCertificatesStore((s) => s.byArtisan[artisanId]);
    const overrides = useCertificatesStore((s) => s.expiredOverrides);
    return useMemo(() => {
        const mocks: ArtisanCertificate[] = mockCertificates
            .filter((c) => MOCK_CERT_TO_ARTISAN[c.id] === artisanId)
            .map((c) => ({ ...applyOverride(c, overrides), artisanId, isLocal: false }));
        const locals: ArtisanCertificate[] = (local ?? []).map((c) => ({
            ...applyOverride(c, overrides),
            isLocal: true,
        }));
        return [...mocks, ...locals];
    }, [artisanId, local, overrides]);
}

export const CERTIFICATION_KINDS: readonly CertificationKind[] = [
    'GOTS',
    'OEKO-TEX',
    'OFG',
    'EPV',
    'GRS',
    'BLUESIGN',
    'ISO-14001',
    'CUSTOM',
];

export function newCertificateId(): string {
    return `cert-local-${Math.random().toString(36).slice(2, 10)}`;
}

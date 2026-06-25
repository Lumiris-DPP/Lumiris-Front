'use client';

import { useEffect, useMemo, useState } from 'react';
import { mockPassports } from '@lumiris/mock-data';
import type { GarmentKind, Passport, PassportStatus } from '@lumiris/types';
import { buildGS1Identifier } from '@lumiris/types';
import { useAuthStore } from './auth-store';
import { fetchDppForms, type DppFormDto } from './dpp-api';
import { useDraftStore, draftToPassport } from './draft-store';

function dppFormToPassport(dto: DppFormDto): Passport {
    return {
        id: dto.id,
        gs1: buildGS1Identifier('0000000000000', dto.id),
        status: (dto.status as PassportStatus) ?? 'Draft',
        createdAt: dto.createdAt,
        updatedAt: dto.updatedAt,
        artisanId: '',
        garment: {
            kind: (dto.productType as GarmentKind) ?? 'other',
            name: dto.productName ?? undefined,
            reference: dto.internalReference ?? '',
            mainPhotoUrl: '',
            dimensions: {},
            retailPrice: dto.retailPrice ?? 0,
            currency: 'EUR',
        },
        materials: [],
        steps: [],
        certifications: [],
        warranty: { durationMonths: 0, terms: '' },
    };
}

export function usePassports(artisanId: string): readonly Passport[] {
    const token = useAuthStore((s) => s.token);
    const drafts = useDraftStore((s) => s.drafts);
    const [backendPassports, setBackendPassports] = useState<Passport[]>([]);

    useEffect(() => {
        if (!token) return;
        fetchDppForms(token)
            .then((dtos) => setBackendPassports(dtos.map(dppFormToPassport)))
            .catch(() => {});
    }, [token]);

    return useMemo(() => {
        if (token) return backendPassports;
        const draftPassports = Object.values(drafts)
            .filter((d) => d.artisanId === artisanId)
            .map(draftToPassport);
        const fixed = mockPassports.filter((p) => p.artisanId === artisanId);
        return [...draftPassports, ...fixed];
    }, [token, backendPassports, drafts, artisanId]);
}

export { dppFormToPassport };

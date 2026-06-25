'use client';

import { useMemo } from 'react';
import { mockPassports } from '@lumiris/mock-data';
import type { Passport } from '@lumiris/types';
import { useDraftStore, draftToPassport } from './draft-store';

export function usePassports(artisanId: string): readonly Passport[] {
    const drafts = useDraftStore((s) => s.drafts);

    return useMemo(() => {
        const draftPassports = Object.values(drafts)
            .filter((d) => d.artisanId === artisanId)
            .map(draftToPassport);
        const fixed = mockPassports.filter((p) => p.artisanId === artisanId);
        return [...draftPassports, ...fixed];
    }, [drafts, artisanId]);
}

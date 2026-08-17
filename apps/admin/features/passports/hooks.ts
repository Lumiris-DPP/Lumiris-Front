'use client';

import { useMemo } from 'react';
import type { Passport, ScoreResult } from '@lumiris/types';
import { computeScore } from '@lumiris/core/scoring';
import { useComputeScore } from '@lumiris/scoring-ui';
import { mockArtisans, mockRepairers } from '@lumiris/mock-data';
import { deriveCurationStatus } from '@/lib/curation-status';
import { useCurationStore } from './curation-store';
import type { PassportRow } from './types';
import { FIXTURE_NOW, FIXTURE_NOW_MS } from '@/lib/fixture-clock';

function scorePassportSync(passport: Passport): ScoreResult {
    const artisan = mockArtisans.find((a) => a.id === passport.artisanId);
    return computeScore(passport, {
        certificates: passport.materials.flatMap((m) => m.certifications),
        ...(artisan ? { artisan } : {}),
        retoucheurs: mockRepairers,
        now: FIXTURE_NOW,
    });
}

export function usePassportRows(passports: readonly Passport[]): readonly PassportRow[] {
    const { overlays } = useCurationStore();
    return useMemo(() => {
        return passports.map((passport) => {
            const overlay = overlays.get(passport.id);
            const ageHours = Math.max(
                0,
                Math.round((FIXTURE_NOW_MS - new Date(passport.createdAt).getTime()) / 3_600_000),
            );
            const score = scorePassportSync(passport);
            const artisan = mockArtisans.find((a) => a.id === passport.artisanId);
            return {
                passport,
                status: deriveCurationStatus(passport, overlay?.status),
                ageHours,
                grade: overlay?.overrideGrade ?? score.grade,
                capApplied: score.cap?.applied === true,
                hasMissingRegulatoryField: score.cap?.applied === true && (score.cap.reason ?? '').includes('champ '),
                isAtelierPlus: artisan?.plus === true,
                decidedAt: overlay?.publishedAt ?? passport.moderation?.reviewedAt ?? null,
            };
        });
    }, [passports, overlays]);
}

export function useIrisScore(passport: Passport): ScoreResult {
    const options = useMemo(() => {
        const artisan = mockArtisans.find((a) => a.id === passport.artisanId);
        return {
            certificates: passport.materials.flatMap((m) => m.certifications),
            ...(artisan ? { artisan } : {}),
            retoucheurs: mockRepairers,
            now: FIXTURE_NOW,
        };
    }, [passport]);
    return useComputeScore(passport, options);
}

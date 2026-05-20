import type { IrisGrade } from '@lumiris/types';

export interface MockKpi {
    periodLabel: string;
    passportsCreatedThisMonth: number;
    passportsPublishedThisMonth: number;
    gradeDistribution: Record<IrisGrade, number>;
    topRegions: ReadonlyArray<{ region: string; share: number }>;
    topFibers: ReadonlyArray<{ fiber: string; share: number }>;
    draftToPublishedRate: number;
    cappedThisMonth: number;
}

export const mockKpi: MockKpi = {
    periodLabel: 'Avril 2026',
    passportsCreatedThisMonth: 38,
    passportsPublishedThisMonth: 22,
    gradeDistribution: {
        A: 18,
        B: 32,
        C: 28,
        D: 16,
        E: 6,
    },
    topRegions: [
        { region: 'Auvergne-Rhône-Alpes', share: 22 },
        { region: 'Bretagne', share: 18 },
        { region: 'Occitanie', share: 17 },
        { region: 'Île-de-France', share: 14 },
        { region: 'Hauts-de-France', share: 11 },
    ],
    topFibers: [
        { fiber: 'linen', share: 34 },
        { fiber: 'wool', share: 27 },
        { fiber: 'leather', share: 18 },
        { fiber: 'cotton', share: 11 },
        { fiber: 'silk', share: 6 },
    ],
    draftToPublishedRate: 58,
    cappedThisMonth: 4,
};

import { describe, expect, it } from 'bun:test';
import type { Artisan, Passport, CertificationRef, ProductionStep, Material, Repairer } from '@lumiris/types';
import { computeScore, IRIS_THRESHOLDS, LUMIRIS_WEIGHTS, toIrisGrade } from '../scoring';

const NOW = new Date('2026-04-30T12:00:00Z');

function makeCert(id: string, overrides: Partial<CertificationRef> = {}): CertificationRef {
    return {
        id,
        kind: 'GOTS',
        issuer: 'Ecocert',
        issuedAt: '2025-01-01T00:00:00Z',
        expiresAt: '2027-12-31T00:00:00Z',
        verified: true,
        fileUrl: `https://example.com/${id}.pdf`,
        ...overrides,
    };
}

function makeStep(id: string, performedBy: string): ProductionStep {
    return {
        id,
        kind: 'sewing',
        label: 'Couture main',
        performedBy,
        locationCity: 'Lyon',
        locationCountry: 'FR',
        photos: ['https://example.com/photo.jpg'],
    };
}

function makeMaterial(fiber: Material['fiber'], percentage: number, overrides: Partial<Material> = {}): Material {
    return {
        fiber,
        percentage,
        supplierId: 'SUP-FR-LIN',
        originCountry: 'FR',
        certifications: [makeCert(`cert-${fiber}`)],
        invoiceRef: `INV-${fiber}`,
        ...overrides,
    };
}

const artisan: Artisan = {
    id: 'ART-001',
    displayName: 'Marie L.',
    atelierName: 'Atelier de Marie',
    city: 'Quimper',
    region: 'Bretagne',
    tier: 'Solo',
    plus: false,
    epvLabeled: true,
    ofgLabeled: true,
    specialities: ['Couture haute façon'],
    story: 'Atelier familial.',
    photoUrl: 'https://example.com/marie.jpg',
    joinedAt: '2025-06-01T00:00:00Z',
    passportLimit: 50,
};

const retoucheurs: Repairer[] = [
    makeRepairer('RTC-001', 'Quimper'),
    makeRepairer('RTC-002', 'Quimper'),
    makeRepairer('RTC-003', 'Quimper'),
];

function makeRepairer(id: string, city: string): Repairer {
    return {
        id,
        displayName: `Repairer ${id}`,
        city,
        region: 'Bretagne',
        specialities: ['alteration'],
        certifications: [],
        avgRating: 4.5,
        reviewCount: 20,
        avgDelayDays: 3,
        priceRange: { min: 10, max: 80, currency: 'EUR' },
        localSubscribed: true,
        joinedAt: '2025-01-01T00:00:00Z',
    };
}

function makePassport(overrides: Partial<Passport> = {}): Passport {
    return {
        id: 'PASS-001',
        gs1: {
            gtin: '03000000000001',
            serial: 'SN-001',
            verificationUrl: 'https://lumiris.fr/passeport/SN-001',
        },
        status: 'Published',
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: '2026-03-01T00:00:00Z',
        artisanId: 'ART-001',
        garment: {
            kind: 'shirt',
            reference: 'CHE-2026-001',
            mainPhotoUrl: 'https://example.com/main.jpg',
            dimensions: { weightG: 300 },
            retailPrice: 240,
            currency: 'EUR',
        },
        materials: [makeMaterial('linen', 100)],
        steps: [makeStep('S1', 'Atelier de Marie'), makeStep('S2', 'Marie L.'), makeStep('S3', 'Atelier de Marie')],
        certifications: [],
        warranty: { durationMonths: 24, terms: 'Réparation gratuite première année.' },
        care: {
            washing: 'Lavage 30 °C, programme délicat.',
            drying: 'Séchage à plat, à l’abri du soleil.',
            ironing: 'Repassage tiède sur l’envers.',
            storage: 'Stocker plié, à l’abri de la lumière.',
        },
        ...overrides,
    };
}

describe('LUMIRIS_WEIGHTS', () => {
    it('somme des poids vaut 1', () => {
        const sum =
            LUMIRIS_WEIGHTS.transparency +
            LUMIRIS_WEIGHTS.craftsmanship +
            LUMIRIS_WEIGHTS.impact +
            LUMIRIS_WEIGHTS.repairability;
        expect(sum).toBeCloseTo(1, 6);
    });
});

describe('computeScore - cas nominaux', () => {
    it('passeport vide → grade E (cap appliqué)', () => {
        const passport = makePassport({
            materials: [],
            steps: [],
            warranty: { durationMonths: 0, terms: '' },
            garment: {
                kind: 'other',
                reference: '',
                mainPhotoUrl: '',
                dimensions: {},
                retailPrice: 0,
                currency: 'EUR',
            },
        });
        const score = computeScore(passport, { certificates: [], now: NOW });
        expect(score.cap?.applied).toBe(true);
        expect(score.grade).toBe('E');
    });

    it('passeport "presque parfait" → grade A', () => {
        const passport = makePassport();
        const score = computeScore(passport, {
            certificates: passport.materials.flatMap((m) => m.certifications),
            artisan,
            retoucheurs,
            now: NOW,
        });
        expect(score.cap?.applied).toBe(false);
        expect(score.grade).toBe('A');
        expect(score.total).toBeGreaterThanOrEqual(80);
    });

    it('cap.applied = false quand tout est complet', () => {
        const passport = makePassport();
        const score = computeScore(passport, {
            certificates: passport.materials.flatMap((m) => m.certifications),
            artisan,
            retoucheurs,
            now: NOW,
        });
        expect(score.cap).toEqual({ applied: false });
    });
});

describe('computeScore - certifications', () => {
    it('certif expirée comptée à 0 (effective weight nul)', () => {
        const expired = makeCert('exp', { expiresAt: '2024-01-01T00:00:00Z' });
        const validRef = makeCert('ok');

        const withExpired = makePassport({
            materials: [makeMaterial('linen', 100, { certifications: [expired] })],
        });
        const withValid = makePassport({
            materials: [makeMaterial('linen', 100, { certifications: [validRef] })],
        });

        const a = computeScore(withExpired, { certificates: [expired], artisan, retoucheurs, now: NOW });
        const b = computeScore(withValid, { certificates: [validRef], artisan, retoucheurs, now: NOW });

        expect(a.breakdown.transparency).toBeLessThan(b.breakdown.transparency);
    });

    it('certif non vérifiée comptée à 0.5', () => {
        const unverified = makeCert('uv', { verified: false });
        const validRef = makeCert('ok');

        const withUnverified = makePassport({
            materials: [makeMaterial('linen', 100, { certifications: [unverified] })],
        });
        const withValid = makePassport({
            materials: [makeMaterial('linen', 100, { certifications: [validRef] })],
        });

        const a = computeScore(withUnverified, { certificates: [unverified], artisan, retoucheurs, now: NOW });
        const b = computeScore(withValid, { certificates: [validRef], artisan, retoucheurs, now: NOW });

        expect(a.breakdown.transparency).toBeLessThan(b.breakdown.transparency);
        expect(a.breakdown.transparency).toBeGreaterThan(b.breakdown.transparency - 15);
    });
});

describe('computeScore - plafond D', () => {
    it('grade plafonné à D si un champ ESPR manque (même avec total > 85)', () => {
        const passport = makePassport({
            garment: {
                kind: 'shirt',
                reference: 'CHE-2026-001',
                mainPhotoUrl: '',
                dimensions: { weightG: 300 },
                retailPrice: 240,
                currency: 'EUR',
            },
        });

        const score = computeScore(passport, {
            certificates: passport.materials.flatMap((m) => m.certifications),
            artisan,
            retoucheurs,
            now: NOW,
        });

        expect(score.cap?.applied).toBe(true);
        expect(score.cap?.reason).toContain('ESPR');
        expect(score.grade).toBe('D');
    });

    it('grade plafonné à D si un champ AGEC manque', () => {
        const passport = makePassport({
            materials: [makeMaterial('linen', 100, { supplierId: '' })],
        });

        const score = computeScore(passport, {
            certificates: [],
            artisan,
            retoucheurs,
            now: NOW,
        });

        expect(score.cap?.applied).toBe(true);
        expect(score.cap?.reason).toMatch(/AGEC/);
        expect(score.grade).toBe('D');
    });
});

describe('computeScore - reasons & déterminisme', () => {
    it('reasons[] non vide quand des points manquent', () => {
        const passport = makePassport({
            warranty: { durationMonths: 6, terms: 'Garantie 6 mois.' },
            steps: [makeStep('S1', 'Atelier de Marie')],
        });
        const score = computeScore(passport, {
            certificates: passport.materials.flatMap((m) => m.certifications),
            artisan,
            retoucheurs,
            now: NOW,
        });
        expect(score.reasons.length).toBeGreaterThan(0);
        expect(score.reasons.some((r) => r.axis === 'craftsmanship')).toBe(true);
    });

    it('déterminisme : 2 appels successifs → mêmes valeurs', () => {
        const passport = makePassport();
        const a = computeScore(passport, {
            certificates: passport.materials.flatMap((m) => m.certifications),
            artisan,
            retoucheurs,
            now: NOW,
        });
        const b = computeScore(passport, {
            certificates: passport.materials.flatMap((m) => m.certifications),
            artisan,
            retoucheurs,
            now: NOW,
        });
        expect(a.total).toBe(b.total);
        expect(a.grade).toBe(b.grade);
        expect(a.breakdown).toEqual(b.breakdown);
    });
});

describe('IRIS_THRESHOLDS - frontières A/B/C/D/E', () => {
    it('expose les valeurs canoniques A:80 / B:65 / C:50 / D:35', () => {
        expect(IRIS_THRESHOLDS).toEqual({ A: 80, B: 65, C: 50, D: 35 });
    });

    it.each([
        [80, 'A'],
        [79.9, 'B'],
        [65, 'B'],
        [64.9, 'C'],
        [50, 'C'],
        [49.9, 'D'],
        [35, 'D'],
        [34.9, 'E'],
        [0, 'E'],
    ] as const)('total %p → %p', (total, expected) => {
        expect(toIrisGrade(total)).toBe(expected);
    });

    it('cap=D plafonne à D au-dessus du seuil, mais conserve E sous le seuil', () => {
        expect(toIrisGrade(95, 'D')).toBe('D');
        expect(toIrisGrade(40, 'D')).toBe('D');
        expect(toIrisGrade(20, 'D')).toBe('E');
    });
});

describe('computeScore - surcharge impact déclarée', () => {
    it('passport.carbonKg surcharge le calcul fibre × masse (carbone faible déclaré → meilleur impact)', () => {
        const baseline = makePassport({
            materials: [makeMaterial('cotton', 100)],
        });
        const declared = makePassport({
            materials: [makeMaterial('cotton', 100)],
            carbonKg: 0.5,
        });
        const a = computeScore(baseline, { certificates: [], artisan, retoucheurs, now: NOW });
        const b = computeScore(declared, { certificates: [], artisan, retoucheurs, now: NOW });
        expect(b.breakdown.impact).toBeGreaterThan(a.breakdown.impact);
    });

    it('passport.transportKm surcharge le malus origines non-FR', () => {
        const local = makePassport({ transportKm: 80 });
        const long = makePassport({ transportKm: 1900 });
        const a = computeScore(local, { certificates: [], artisan, retoucheurs, now: NOW });
        const b = computeScore(long, { certificates: [], artisan, retoucheurs, now: NOW });
        expect(a.breakdown.impact).toBeGreaterThan(b.breakdown.impact);
    });
});

describe('computeScore - care AGEC obligatoire en Published', () => {
    it('passeport Published sans care.washing → cap D', () => {
        const passport = makePassport({ status: 'Published', care: undefined });
        const score = computeScore(passport, { certificates: [], artisan, retoucheurs, now: NOW });
        expect(score.cap?.applied).toBe(true);
        expect(score.cap?.reason).toMatch(/AGEC/);
    });

    it('passeport Published avec care.washing → pas de cap pour ce motif', () => {
        const passport = makePassport({
            status: 'Published',
            care: {
                washing: 'Lavage 30 °C, programme délicat.',
                drying: 'Séchage à plat, à l’abri du soleil.',
                ironing: 'Repassage tiède sur l’envers.',
                storage: 'Stocker plié, à l’abri de la lumière.',
            },
        });
        const score = computeScore(passport, {
            certificates: passport.materials.flatMap((m) => m.certifications),
            artisan,
            retoucheurs,
            now: NOW,
        });
        const reason = score.cap?.reason ?? '';
        expect(reason).not.toMatch(/care\.washing/);
    });
});

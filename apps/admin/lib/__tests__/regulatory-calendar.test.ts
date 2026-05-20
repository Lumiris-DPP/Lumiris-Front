import { describe, expect, it } from 'bun:test';
import {
    REGULATORY_MILESTONES,
    TIMELINE_RANGE,
    computeReadiness,
    daysUntil,
    majorMilestones,
    timelinePositionPct,
    type RegulatoryMilestone,
} from '../regulatory-calendar';
import { makeArtisan, makePassport } from '@/test/factories';

function milestoneFor(id: string): RegulatoryMilestone {
    const m = REGULATORY_MILESTONES.find((x) => x.id === id);
    if (!m) throw new Error(`fixture milestone manquante: ${id}`);
    return m;
}

describe('daysUntil — clock injectée via prop now', () => {
    it('renvoie 0 le jour même', () => {
        const ms = milestoneFor('ESPR-2026-REGISTRY');
        const onDay = new Date('2026-07-19T12:00:00Z');
        expect(Math.abs(daysUntil(ms, onDay))).toBe(0);
    });

    it("renvoie un nombre positif avant l'échéance", () => {
        const ms = milestoneFor('ESPR-2026-REGISTRY');
        const before = new Date('2026-05-01T00:00:00Z');
        expect(daysUntil(ms, before)).toBeGreaterThan(0);
    });

    it("renvoie un nombre négatif après l'échéance (registre déjà ouvert)", () => {
        const ms = milestoneFor('AGEC-2025-LABEL');
        const after = new Date('2026-04-30T00:00:00Z');
        expect(daysUntil(ms, after)).toBeLessThan(0);
    });

    it("reste précis pour l'application textile (2028-12-31)", () => {
        const ms = milestoneFor('ESPR-2028-TEXTILE-APP');
        const now = new Date('2027-12-31T00:00:00Z');
        const days = daysUntil(ms, now);
        expect(days).toBeGreaterThan(360);
        expect(days).toBeLessThan(370);
    });

    it('réagit aux différentes dates simulées (clock progressant)', () => {
        const ms = milestoneFor('ESPR-2027-TEXTILE-ACT');
        const d1 = daysUntil(ms, new Date('2026-06-30T00:00:00Z'));
        const d2 = daysUntil(ms, new Date('2027-06-29T00:00:00Z'));
        expect(d1).toBeGreaterThan(d2);
    });
});

describe('timelinePositionPct', () => {
    it('borne le résultat entre 0 et 100', () => {
        for (const m of REGULATORY_MILESTONES) {
            const pct = timelinePositionPct(m);
            expect(pct).toBeGreaterThanOrEqual(0);
            expect(pct).toBeLessThanOrEqual(100);
        }
    });

    it('clampe à 0 pour les jalons antérieurs à 2026-01-01', () => {
        expect(timelinePositionPct(milestoneFor('AGEC-2025-LABEL'))).toBe(0);
    });

    it('renvoie 100 pour 2030-12-31 (borne supérieure)', () => {
        const at2030 = REGULATORY_MILESTONES.find((m) => m.id === 'ESPR-2030-FURNITURE-APP');
        expect(at2030).toBeDefined();
        expect(timelinePositionPct(at2030!)).toBe(100);
    });

    it('croît monotonement avec la date', () => {
        const m2026 = milestoneFor('ESPR-2026-REGISTRY');
        const m2028 = milestoneFor('ESPR-2028-TEXTILE-APP');
        expect(timelinePositionPct(m2028)).toBeGreaterThan(timelinePositionPct(m2026));
    });
});

describe('majorMilestones', () => {
    it('ne retient que les jalons major=true', () => {
        const now = new Date('2026-05-01T00:00:00Z');
        const result = majorMilestones(now);
        for (const m of result) {
            expect(m.major).toBe(true);
        }
    });

    it('exclut les jalons dépassés de plus de 180 jours', () => {
        const farFuture = new Date('2030-01-01T00:00:00Z');
        const result = majorMilestones(farFuture);
        for (const m of result) {
            expect(daysUntil(m, farFuture)).toBeGreaterThan(-180);
        }
    });

    it('renvoie les jalons triés chronologiquement', () => {
        const now = new Date('2026-01-01T00:00:00Z');
        const result = majorMilestones(now);
        for (let i = 1; i < result.length; i++) {
            const prev = new Date(result[i - 1]!.date).getTime();
            const cur = new Date(result[i]!.date).getTime();
            expect(cur).toBeGreaterThanOrEqual(prev);
        }
    });

    it('avant 2026 — la fenêtre majeure couvre registre + acte + application', () => {
        const before = new Date('2026-01-01T00:00:00Z');
        const ids = majorMilestones(before).map((m) => m.id);
        expect(ids).toContain('ESPR-2026-REGISTRY');
        expect(ids).toContain('ESPR-2027-TEXTILE-ACT');
        expect(ids).toContain('ESPR-2028-TEXTILE-APP');
    });
});

describe('TIMELINE_RANGE', () => {
    it('couvre 2026 → 2030', () => {
        expect(TIMELINE_RANGE.start.getUTCFullYear()).toBe(2026);
        expect(TIMELINE_RANGE.end.getUTCFullYear()).toBe(2030);
    });
});

describe('computeReadiness — détection des écarts ESPR', () => {
    const artisan = makeArtisan({ id: 'ART-A', atelierName: 'Atelier A', city: 'Lyon' });
    const publishedPassport = makePassport({
        artisanId: 'ART-A',
        status: 'Published',
        warranty: {
            durationMonths: 24,
            terms: 'Garantie complète',
            repairabilityCommitment: 'Engagement réparabilité confirmé',
        },
        moderation: { status: 'Approved', reviewerId: 'CUR-001', reviewedAt: '2026-04-15T08:00:00Z' },
    });

    it('compte les artisans sans passeport publié comme "no_published_dpp"', () => {
        const result = computeReadiness(
            [artisan],
            [],
            new Map([[artisan.id, { avg: 0, published: 0, allCapped: false }]]),
        );
        expect(result.readyCount).toBe(0);
        expect(result.gaps[0]?.reasons).toContain('no_published_dpp');
        expect(result.gaps[0]?.recommendedAction).toBe('demo');
    });

    it('artisan avec moyenne ≥ 70 et 1 passeport complet → ready', () => {
        const result = computeReadiness(
            [artisan],
            [publishedPassport],
            new Map([[artisan.id, { avg: 80, published: 1, allCapped: false }]]),
        );
        expect(result.readyCount).toBe(1);
        expect(result.readyRatio).toBe(1);
        expect(result.gaps).toHaveLength(0);
    });

    it('détecte all_capped_d → recommendation = training', () => {
        const result = computeReadiness(
            [artisan],
            [publishedPassport],
            new Map([[artisan.id, { avg: 35, published: 2, allCapped: true }]]),
        );
        expect(result.gaps[0]?.reasons).toContain('all_capped_d');
        expect(result.gaps[0]?.recommendedAction).toBe('training');
    });

    it('détecte missing_espr_fields quand carbonKg / weightG sont absents', () => {
        const broken = makePassport({
            artisanId: 'ART-A',
            status: 'Published',
            carbonKg: undefined,
            garment: {
                ...publishedPassport.garment,
                dimensions: {},
            },
        });
        const result = computeReadiness(
            [artisan],
            [broken],
            new Map([[artisan.id, { avg: 85, published: 1, allCapped: false }]]),
        );
        expect(result.gaps[0]?.reasons).toContain('missing_espr_fields');
    });

    it('readyRatio = 0 quand la liste artisans est vide', () => {
        const result = computeReadiness([], [], new Map());
        expect(result.readyRatio).toBe(0);
        expect(result.totalArtisans).toBe(0);
    });
});

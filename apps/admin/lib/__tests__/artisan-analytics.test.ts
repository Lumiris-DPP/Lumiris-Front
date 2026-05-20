import { describe, expect, it } from 'bun:test';
import {
    PLUS_ADDON,
    TIER_MRR,
    buildArtisanRow,
    buildArtisanRows,
    computeCohortMetrics,
    listCohortMonths,
} from '../artisan-analytics';
import { makeArtisan, makePassport, makeSubscription, makeAuditEntry } from '@/test/factories';

const NOW = new Date('2026-04-30T08:00:00Z');

describe('TIER_MRR / PLUS_ADDON — verrouillés', () => {
    it('Solo=29, Studio=79, Maison=149, ATELIER+=19', () => {
        expect(TIER_MRR.Solo).toBe(29);
        expect(TIER_MRR.Studio).toBe(79);
        expect(TIER_MRR.Maison).toBe(149);
        expect(PLUS_ADDON).toBe(19);
    });
});

describe('buildArtisanRow', () => {
    const artisan = makeArtisan({
        id: 'ART-A',
        tier: 'Solo',
        passportLimit: 5,
        joinedAt: '2025-10-01T00:00:00Z',
        plus: false,
    });

    it("publishedCount = 0 quand l'artisan n'a pas de passeport publié", () => {
        const row = buildArtisanRow(artisan, [], [], [], NOW);
        expect(row.publishedCount).toBe(0);
        expect(row.avgGrade).toBe('-');
        expect(row.avgScore).toBe(0);
    });

    it("compte uniquement les passports Published de l'artisan ciblé", () => {
        const passports = [
            makePassport({ artisanId: 'ART-A', status: 'Published' }),
            makePassport({ artisanId: 'ART-A', status: 'Draft' }),
            makePassport({ artisanId: 'ART-B', status: 'Published' }),
        ];
        const row = buildArtisanRow(artisan, passports, [], [], NOW);
        expect(row.publishedCount).toBe(1);
    });

    it('mrr = tier + ATELIER+ quand plus=true', () => {
        const studio = makeArtisan({ id: 'ART-S', tier: 'Studio', plus: true });
        const row = buildArtisanRow(studio, [], [], [], NOW);
        expect(row.mrr).toBe(TIER_MRR.Studio + PLUS_ADDON);
    });

    it('upgradeHint déclenche au-dessus de 80% de la capacité (Solo → Studio)', () => {
        const passports = [
            makePassport({ artisanId: 'ART-A', status: 'Published' }),
            makePassport({ artisanId: 'ART-A', status: 'Published' }),
            makePassport({ artisanId: 'ART-A', status: 'Published' }),
            makePassport({ artisanId: 'ART-A', status: 'Published' }),
            makePassport({ artisanId: 'ART-A', status: 'Published' }),
        ];
        const row = buildArtisanRow(artisan, passports, [], [], NOW);
        expect(row.upgradeHint).toBe('Studio');
    });

    it('upgradeHint = null pour Maison (pas de tier supérieur)', () => {
        const maison = makeArtisan({ id: 'ART-M', tier: 'Maison', passportLimit: Number.POSITIVE_INFINITY });
        const row = buildArtisanRow(maison, [], [], [], NOW);
        expect(row.upgradeHint).toBeNull();
    });

    it('cohortMonth = YYYY-MM du joinedAt', () => {
        const row = buildArtisanRow(artisan, [], [], [], NOW);
        expect(row.cohortMonth).toBe('2025-10');
    });

    it('cohortOffset négatif quand joinedAt est antérieur à now', () => {
        const row = buildArtisanRow(artisan, [], [], [], NOW);
        expect(row.cohortOffset).toBeLessThan(0);
        expect(row.cohortOffset).toBe(-6);
    });

    it('compte les overrides 90j via audit log + payload.artisanId', () => {
        const auditLog = [
            makeAuditEntry({
                action: 'passport.override',
                targetType: 'artisan',
                targetId: 'ART-A',
                payload: { artisanId: 'ART-A', from: 'C', to: 'B' },
                ts: '2026-04-01T00:00:00Z',
            }),
            makeAuditEntry({
                action: 'passport.override',
                targetType: 'artisan',
                targetId: 'ART-A',
                payload: { artisanId: 'ART-A' },
                ts: '2025-10-01T00:00:00Z',
            }),
        ];
        const row = buildArtisanRow(artisan, [], [], auditLog, NOW);
        expect(row.overrideCount90d).toBe(1);
    });

    it('health.total reste borné 0-100', () => {
        const row = buildArtisanRow(artisan, [], [], [], NOW);
        expect(row.health.total).toBeGreaterThanOrEqual(0);
        expect(row.health.total).toBeLessThanOrEqual(100);
    });
});

describe('buildArtisanRows', () => {
    it('renvoie une row par artisan dans le même ordre', () => {
        const artisans = [makeArtisan({ id: 'A1' }), makeArtisan({ id: 'A2' }), makeArtisan({ id: 'A3' })];
        const rows = buildArtisanRows(artisans, [], [], [], NOW);
        expect(rows.map((r) => r.artisan.id)).toEqual(['A1', 'A2', 'A3']);
    });

    it('renvoie un tableau vide pour une liste vide', () => {
        expect(buildArtisanRows([], [], [], [], NOW)).toEqual([]);
    });
});

describe('computeCohortMetrics', () => {
    const cohortNow = new Date('2026-04-30T00:00:00Z');

    it('renvoie 3 cohortes par défaut (M-3, M-6, M-12)', () => {
        const result = computeCohortMetrics([], [], cohortNow);
        expect(result.map((r) => r.label)).toEqual(['M-3', 'M-6', 'M-12']);
    });

    it('NRR = 100 % quand toutes les subs sont active sans plus', () => {
        const oldArtisan = makeArtisan({ joinedAt: '2024-04-30T00:00:00Z', tier: 'Studio', plus: false });
        const sub = makeSubscription({ subscriberId: oldArtisan.id, status: 'active', artisanTier: 'Studio' });
        const result = computeCohortMetrics([oldArtisan], [sub], cohortNow, [3]);
        expect(result[0]?.nrr).toBe(100);
    });

    it('Compte les canceled comme churn (NRR < 100)', () => {
        const oldArtisan = makeArtisan({ joinedAt: '2024-04-30T00:00:00Z', tier: 'Studio' });
        const sub = makeSubscription({ subscriberId: oldArtisan.id, status: 'canceled' });
        const result = computeCohortMetrics([oldArtisan], [sub], cohortNow, [3]);
        expect(result[0]?.churn).toBe(1);
        expect(result[0]?.nrr).toBe(0);
    });

    it('expansion = artisans avec plus=true et sub non canceled', () => {
        const oldArtisan = makeArtisan({ joinedAt: '2024-04-30T00:00:00Z', tier: 'Solo', plus: true });
        const sub = makeSubscription({ subscriberId: oldArtisan.id, status: 'active' });
        const result = computeCohortMetrics([oldArtisan], [sub], cohortNow, [3]);
        expect(result[0]?.expansion).toBe(1);
    });

    it('cohortSize ignore les artisans trop récents pour le bucket', () => {
        const recent = makeArtisan({ joinedAt: '2026-04-01T00:00:00Z' });
        const result = computeCohortMetrics([recent], [], cohortNow, [3]);
        expect(result[0]?.cohortSize).toBe(0);
    });
});

describe('listCohortMonths', () => {
    it('renvoie une liste vide pour 0 artisans', () => {
        expect(listCohortMonths([])).toEqual([]);
    });

    it('renvoie les mois uniques triés du plus récent au plus ancien', () => {
        const artisans = [
            makeArtisan({ joinedAt: '2025-06-01T00:00:00Z' }),
            makeArtisan({ joinedAt: '2025-06-15T00:00:00Z' }),
            makeArtisan({ joinedAt: '2025-03-01T00:00:00Z' }),
            makeArtisan({ joinedAt: '2026-01-01T00:00:00Z' }),
        ];
        const months = listCohortMonths(artisans);
        expect(months).toEqual(['2026-01', '2025-06', '2025-03']);
    });
});

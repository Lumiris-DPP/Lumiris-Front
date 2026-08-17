import { describe, expect, it } from 'bun:test';
import { buildArtisanKpi, buildCurationKpi, buildIrisKpi, buildMrrKpi, buildTrajectory } from '../cockpit-metrics';
import { makeArtisan, makeAuditEntry, makePassport, makeSubscription } from '@/test/factories';

const NOW = new Date('2026-04-30T00:00:00Z');

describe('buildArtisanKpi — split par tier + churn 30 j', () => {
    it('agrège par tier (Solo / Studio / Maison)', () => {
        const artisans = [
            makeArtisan({ tier: 'Solo' }),
            makeArtisan({ tier: 'Solo' }),
            makeArtisan({ tier: 'Studio' }),
            makeArtisan({ tier: 'Maison' }),
        ];
        const kpi = buildArtisanKpi(artisans, [], NOW);
        expect(kpi.total).toBe(4);
        expect(kpi.splitByTier).toEqual({ Solo: 2, Studio: 1, Maison: 1 });
    });

    it('renvoie 0 sur liste vide', () => {
        expect(buildArtisanKpi([], [], NOW).total).toBe(0);
    });

    it('compte les artisan.unsubscribe < 30 jours (string-side, type pas encore exporté)', () => {
        const log = [
            makeAuditEntry({
                targetType: 'artisan',
                action: 'artisan.unsubscribe' as never,
                ts: '2026-04-15T00:00:00Z',
            }),
            makeAuditEntry({
                targetType: 'artisan',
                action: 'artisan.unsubscribe' as never,
                ts: '2026-01-01T00:00:00Z',
            }),
        ];
        expect(buildArtisanKpi([], log, NOW).churn30d).toBe(1);
    });

    it('ignore les autres actions même targetType=artisan', () => {
        const log = [makeAuditEntry({ targetType: 'artisan', action: 'artisan.suspend', ts: '2026-04-15T00:00:00Z' })];
        expect(buildArtisanKpi([], log, NOW).churn30d).toBe(0);
    });
});

describe('buildCurationKpi — file de validation', () => {
    it('liste vide → 0 partout, mediane null', () => {
        const kpi = buildCurationKpi([]);
        expect(kpi.pendingCount).toBe(0);
        expect(kpi.draftCount).toBe(0);
        expect(kpi.inCompletionCount).toBe(0);
        expect(kpi.medianValidationDays).toBeNull();
    });

    it('compte Draft et InCompletion séparément', () => {
        const passports = [
            makePassport({ status: 'Draft' }),
            makePassport({ status: 'InCompletion' }),
            makePassport({ status: 'InCompletion' }),
            makePassport({ status: 'Published' }),
        ];
        const kpi = buildCurationKpi(passports);
        expect(kpi.draftCount).toBe(1);
        expect(kpi.inCompletionCount).toBe(2);
    });

    it('mediane = délai en jours entre createdAt et moderation.reviewedAt', () => {
        const p1 = makePassport({
            status: 'Published',
            createdAt: '2026-04-01T00:00:00Z',
            moderation: { status: 'Approved', reviewerId: 'CUR', reviewedAt: '2026-04-03T00:00:00Z' },
        });
        const p2 = makePassport({
            status: 'Published',
            createdAt: '2026-04-01T00:00:00Z',
            moderation: { status: 'Approved', reviewerId: 'CUR', reviewedAt: '2026-04-05T00:00:00Z' },
        });
        const kpi = buildCurationKpi([p1, p2]);
        expect(kpi.medianValidationDays).toBe(3);
    });

    it('pending = même file que /passeports : tout ce que la modération n’a pas tranché', () => {
        const passports = [
            makePassport({ status: 'Draft', moderation: undefined }),
            makePassport({
                status: 'Published',
                moderation: { status: 'PendingReview', reviewerId: 'CUR', reviewedAt: '2026-04-10T00:00:00Z' },
            }),
            makePassport({
                status: 'Published',
                moderation: { status: 'Approved', reviewerId: 'CUR', reviewedAt: '2026-04-15T00:00:00Z' },
            }),
            makePassport({
                status: 'Published',
                moderation: { status: 'Rejected', reviewerId: 'CUR', reviewedAt: '2026-04-15T00:00:00Z' },
            }),
        ];
        const kpi = buildCurationKpi(passports);
        expect(kpi.pendingCount).toBe(2);
    });

    it('mediane = null si aucun passeport publié avec date de revue', () => {
        const passports = [makePassport({ status: 'Draft' })];
        expect(buildCurationKpi(passports).medianValidationDays).toBeNull();
    });
});

describe('buildIrisKpi — Iris moyen plateforme', () => {
    it('liste vide → sampleSize 0 et deltaVsTarget = -target', () => {
        const kpi = buildIrisKpi([], [], NOW, 3.2);
        expect(kpi.sampleSize).toBe(0);
        expect(kpi.avgTotal).toBe(0);
        expect(kpi.dominantGrade).toBe('-');
        expect(kpi.deltaVsTarget).toBe(-3.2);
    });

    it('agrège les passports Published uniquement', () => {
        const passports = [
            makePassport({ status: 'Draft', artisanId: 'ART-A' }),
            makePassport({ status: 'Published', artisanId: 'ART-A' }),
        ];
        const kpi = buildIrisKpi(passports, [makeArtisan({ id: 'ART-A' })], NOW, 3.2);
        expect(kpi.sampleSize).toBe(1);
    });

    it('avgOnFive = avgTotal / 100 × 5', () => {
        const passports = [makePassport({ status: 'Published', artisanId: 'ART-A' })];
        const kpi = buildIrisKpi(passports, [makeArtisan({ id: 'ART-A' })], NOW, 3.2);
        expect(kpi.avgOnFive).toBeCloseTo((kpi.avgTotal / 100) * 5, 5);
    });

    it('dominantGrade est l\'une des 5 lettres ou "-"', () => {
        const kpi = buildIrisKpi([], [], NOW, 3.2);
        expect(['A', 'B', 'C', 'D', 'E', '-']).toContain(kpi.dominantGrade);
    });

    it('deltaVsTarget reflète avgOnFive − target', () => {
        const passports = [makePassport({ status: 'Published', artisanId: 'ART-A' })];
        const kpi = buildIrisKpi(passports, [makeArtisan({ id: 'ART-A' })], NOW, 3.2);
        expect(kpi.deltaVsTarget).toBeCloseTo(kpi.avgOnFive - 3.2, 5);
    });
});

describe('buildMrrKpi — MRR consolidé', () => {
    it('addition Atelier + Plus + Local', () => {
        const subs = [
            makeSubscription({ subscriberKind: 'artisan', artisanTier: 'Solo', plus: false, status: 'active' }),
            makeSubscription({ subscriberKind: 'artisan', artisanTier: 'Studio', plus: true, status: 'active' }),
            makeSubscription({ subscriberKind: 'repairer', tier: 'local', status: 'active' }),
        ];
        const kpi = buildMrrKpi(subs);
        expect(kpi.atelierMrr).toBe(29 + 79);
        expect(kpi.plusMrr).toBe(19);
        expect(kpi.localMrr).toBe(19);
        expect(kpi.mrrTotal).toBe(29 + 79 + 19 + 19);
        expect(kpi.arrTotal).toBe(kpi.mrrTotal * 12);
    });

    it('ignore les subs canceled / trialing', () => {
        const subs = [
            makeSubscription({ subscriberKind: 'artisan', artisanTier: 'Solo', status: 'canceled' }),
            makeSubscription({ subscriberKind: 'artisan', artisanTier: 'Solo', status: 'trialing' }),
        ];
        expect(buildMrrKpi(subs).mrrTotal).toBe(0);
    });

    it('compte past_due comme actif (recouvrement en cours)', () => {
        const subs = [makeSubscription({ subscriberKind: 'artisan', artisanTier: 'Solo', status: 'past_due' })];
        expect(buildMrrKpi(subs).atelierMrr).toBe(29);
    });

    it('ignore les repairer free (tier=free)', () => {
        const subs = [makeSubscription({ subscriberKind: 'repairer', tier: 'free', status: 'active' })];
        expect(buildMrrKpi(subs).localMrr).toBe(0);
    });

    it('liste vide → 0 partout', () => {
        const kpi = buildMrrKpi([]);
        expect(kpi.mrrTotal).toBe(0);
        expect(kpi.arrTotal).toBe(0);
    });
});

describe('buildTrajectory — ARR vs charges, scénario nominal / stressé', () => {
    it('renvoie 37 points (M0 → M36)', () => {
        const result = buildTrajectory(false);
        expect(result.points.length).toBe(37);
    });

    it('breakevenRange diffère entre nominal et stressé', () => {
        expect(buildTrajectory(false).breakevenRange).toEqual([22, 24]);
        expect(buildTrajectory(true).breakevenRange).toEqual([28, 30]);
    });

    it('scénario stressé < scénario nominal sur le même mois', () => {
        const nominal = buildTrajectory(false).points;
        const stressed = buildTrajectory(true).points;
        for (let i = 6; i < nominal.length; i++) {
            expect(stressed[i]!.arrTotal).toBeLessThan(nominal[i]!.arrTotal);
        }
    });

    it('M0 ARR ≈ 0 (lancement)', () => {
        expect(buildTrajectory(false).points[0]?.arrTotal).toBe(0);
    });

    it('chargesAnnualized > 0 dès M0', () => {
        expect(buildTrajectory(false).points[0]?.chargesAnnualized).toBeGreaterThan(0);
    });
});

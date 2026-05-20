import { describe, expect, it } from 'bun:test';
import type { MrrPoint } from '@lumiris/mock-data';
import {
    computeBillingKpi,
    computeLtvCac,
    computeMonthlyToAnnualConversion,
    computeViability,
    findBreakevenMonth,
} from '../billing-kpi';
import { makeSubscription } from '@/test/factories';

const EMPTY_TRAJ: readonly MrrPoint[] = [];
function mrrPoint(p: Partial<MrrPoint> = {}): MrrPoint {
    return {
        month: '2026-04',
        label: 'Avr. 2026',
        solo: 0,
        studio: 0,
        maison: 0,
        plus: 0,
        local: 0,
        ...p,
    };
}

describe('computeBillingKpi — split MRR par segment', () => {
    it('agrège les subs actives uniquement (active + past_due)', () => {
        const subs = [
            makeSubscription({ status: 'active', mrrEur: 29 }),
            makeSubscription({ status: 'past_due', mrrEur: 79 }),
            makeSubscription({ status: 'canceled', mrrEur: 149 }),
            makeSubscription({ status: 'trialing', mrrEur: 19 }),
        ];
        const result = computeBillingKpi(subs, EMPTY_TRAJ);
        expect(result.mrr).toBe(29 + 79);
        expect(result.arr).toBe((29 + 79) * 12);
    });

    it('renvoie 0 MRR pour une liste vide', () => {
        const result = computeBillingKpi([], EMPTY_TRAJ);
        expect(result.mrr).toBe(0);
        expect(result.arr).toBe(0);
        expect(result.churnPct).toBe(0);
    });

    it('netNew = trajectoire mois courant − mois précédent', () => {
        const result = computeBillingKpi(
            [],
            [mrrPoint({ month: '2026-03', solo: 100 }), mrrPoint({ month: '2026-04', solo: 200 })],
        );
        expect(result.netNew).toBe(100);
    });

    it('churnPct = canceled / (active + canceled) × 100', () => {
        const subs = [
            makeSubscription({ status: 'active', mrrEur: 29 }),
            makeSubscription({ status: 'active', mrrEur: 29 }),
            makeSubscription({ status: 'active', mrrEur: 29 }),
            makeSubscription({ status: 'canceled', mrrEur: 29 }),
        ];
        const result = computeBillingKpi(subs, EMPTY_TRAJ);
        expect(result.churnPct).toBeCloseTo(25, 1);
    });

    it('split = dernier point de la trajectoire MRR', () => {
        const result = computeBillingKpi(
            [],
            [mrrPoint({ month: '2026-04', solo: 11, studio: 22, maison: 33, plus: 44, local: 55 })],
        );
        expect(result.split).toMatchObject({ solo: 11, studio: 22, maison: 33, plus: 44, local: 55 });
    });
});

describe('computeLtvCac — LTV par segment', () => {
    const rows = computeLtvCac();

    it('renvoie les 5 segments de pricing', () => {
        const ids = rows.map((r) => r.id).sort();
        expect(ids).toEqual(['local', 'maison', 'plus', 'solo', 'studio']);
    });

    it('LTV Maison > Studio > Solo (rétention croît avec le tier)', () => {
        const solo = rows.find((r) => r.id === 'solo')!;
        const studio = rows.find((r) => r.id === 'studio')!;
        const maison = rows.find((r) => r.id === 'maison')!;
        expect(maison.ltvEur).toBeGreaterThan(studio.ltvEur);
        expect(studio.ltvEur).toBeGreaterThan(solo.ltvEur);
    });

    it('ratio LTV/CAC > 0 pour tous les segments', () => {
        for (const r of rows) {
            expect(r.ratio).toBeGreaterThan(0);
            expect(r.ltvEur).toBeGreaterThan(0);
            expect(r.cacEur).toBeGreaterThan(0);
        }
    });

    it('grossMargin = 0.8 (fixé Chiffrage v4.2 § 8.2)', () => {
        for (const r of rows) {
            expect(r.grossMargin).toBe(0.8);
        }
    });

    it('arpu correspond au monthlyEur de la PriceLine', () => {
        const solo = rows.find((r) => r.id === 'solo')!;
        expect(solo.arpuEur).toBe(29);
    });
});

describe('computeViability + findBreakevenMonth', () => {
    it('renvoie 37 points (M0 inclus) sur 36 mois', () => {
        const points = computeViability(36);
        expect(points.length).toBe(37);
        expect(points[0]?.month).toBe(0);
        expect(points[36]?.month).toBe(36);
    });

    it('le point-mort nominal arrive avant le stressé', () => {
        const points = computeViability(36);
        const nominal = findBreakevenMonth(points, false);
        const stressed = findBreakevenMonth(points, true);
        expect(nominal).not.toBeNull();
        if (nominal !== null && stressed !== null) {
            expect(stressed).toBeGreaterThan(nominal);
        }
    });

    it('le revenu mensuel croît avec le temps', () => {
        const points = computeViability(36);
        expect(points[36]!.revenueEur).toBeGreaterThan(points[0]!.revenueEur);
    });

    it('le revenu stressé = revenu × 0.55', () => {
        const points = computeViability(12);
        for (const p of points) {
            expect(p.revenueStressedEur).toBeCloseTo(p.revenueEur * 0.55, 0);
        }
    });

    it("findBreakevenMonth renvoie null quand aucun point n'est positif", () => {
        const negPoints = [
            {
                month: 0,
                label: 'M0',
                revenueEur: 0,
                costEur: 100,
                ebitdaEur: -100,
                revenueStressedEur: 0,
                ebitdaStressedEur: -100,
            },
        ];
        expect(findBreakevenMonth(negPoints, false)).toBeNull();
    });
});

describe('computeMonthlyToAnnualConversion', () => {
    it('renvoie 0 % avec une liste vide', () => {
        const result = computeMonthlyToAnnualConversion([]);
        expect(result.totalActive).toBe(0);
        expect(result.pct).toBe(0);
    });

    it('compte une sub comme annuelle si nextBilling − lastCharge > 60 j', () => {
        const annualLike = makeSubscription({
            status: 'active',
            lastChargeAt: '2026-01-01T00:00:00Z',
            nextBillingAt: '2027-01-01T00:00:00Z',
        });
        const monthlyLike = makeSubscription({
            status: 'active',
            lastChargeAt: '2026-04-01T00:00:00Z',
            nextBillingAt: '2026-05-01T00:00:00Z',
        });
        const result = computeMonthlyToAnnualConversion([annualLike, monthlyLike]);
        expect(result.annualLike).toBe(1);
        expect(result.totalActive).toBe(2);
        expect(result.pct).toBeCloseTo(50, 1);
    });

    it('ne compte que les subs status=active', () => {
        const canceled = makeSubscription({ status: 'canceled' });
        const result = computeMonthlyToAnnualConversion([canceled]);
        expect(result.totalActive).toBe(0);
    });

    it('ignore les subs sans lastChargeAt', () => {
        const noCharge = makeSubscription({ status: 'active', lastChargeAt: undefined });
        const result = computeMonthlyToAnnualConversion([noCharge]);
        expect(result.annualLike).toBe(0);
        expect(result.totalActive).toBe(1);
    });
});

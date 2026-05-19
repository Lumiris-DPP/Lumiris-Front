// Score santé artisan : 3 axes pondérés (40 % capacité, 35 % iris, 25 % overrides).

import { describe, expect, it } from 'bun:test';
import { HEALTH_WEIGHTS, computeHealthScore, healthBand } from '@/lib/health-score';

describe('HEALTH_WEIGHTS', () => {
    it('somme = 1', () => {
        expect(HEALTH_WEIGHTS.capacity + HEALTH_WEIGHTS.iris + HEALTH_WEIGHTS.overrides).toBeCloseTo(1, 5);
    });

    it('expose les 3 poids verrouillés (40 / 35 / 25)', () => {
        expect(HEALTH_WEIGHTS.capacity).toBe(0.4);
        expect(HEALTH_WEIGHTS.iris).toBe(0.35);
        expect(HEALTH_WEIGHTS.overrides).toBe(0.25);
    });
});

describe('computeHealthScore — axes pondérés', () => {
    it('artisan vide (0 passeport, 0 iris) → total ~25 (axe override plein)', () => {
        const h = computeHealthScore({
            publishedCount: 0,
            passportLimit: 5,
            avgIrisScore: 0,
            overrideCount90d: 0,
        });
        expect(h.capacityScore).toBe(0);
        expect(h.irisScore).toBe(0);
        expect(h.overrideScore).toBe(100);
        expect(h.total).toBe(25);
    });

    it('plein régime (80 % capacité, 90 iris, 0 override) → > 75 = healthy', () => {
        const h = computeHealthScore({
            publishedCount: 4,
            passportLimit: 5,
            avgIrisScore: 90,
            overrideCount90d: 0,
        });
        expect(h.total).toBeGreaterThan(75);
    });

    it('overrideScore décroît de 25 points par override', () => {
        const zero = computeHealthScore({ publishedCount: 0, passportLimit: 5, avgIrisScore: 0, overrideCount90d: 0 });
        const one = computeHealthScore({ publishedCount: 0, passportLimit: 5, avgIrisScore: 0, overrideCount90d: 1 });
        const two = computeHealthScore({ publishedCount: 0, passportLimit: 5, avgIrisScore: 0, overrideCount90d: 2 });
        expect(zero.overrideScore).toBe(100);
        expect(one.overrideScore).toBe(75);
        expect(two.overrideScore).toBe(50);
    });

    it('overrideScore borné à 0 même avec un nombre absurde', () => {
        const h = computeHealthScore({
            publishedCount: 0,
            passportLimit: 5,
            avgIrisScore: 0,
            overrideCount90d: 999,
        });
        expect(h.overrideScore).toBe(0);
    });

    it('capacityUtilization atteint 100 dès 5/5 passeports (plafond inclusif)', () => {
        const h = computeHealthScore({
            publishedCount: 5,
            passportLimit: 5,
            avgIrisScore: 0,
            overrideCount90d: 0,
        });
        expect(h.capacityUtilization).toBe(100);
    });

    it("capacityScore plafonne à 100 dès 80 % d'utilisation", () => {
        const at80 = computeHealthScore({
            publishedCount: 4,
            passportLimit: 5,
            avgIrisScore: 0,
            overrideCount90d: 0,
        });
        const at100 = computeHealthScore({
            publishedCount: 5,
            passportLimit: 5,
            avgIrisScore: 0,
            overrideCount90d: 0,
        });
        expect(at80.capacityScore).toBe(100);
        expect(at100.capacityScore).toBe(100);
    });

    it('Maison (passportLimit=Infinity) : capacityScore=100 si actif, 0 sinon', () => {
        const active = computeHealthScore({
            publishedCount: 1,
            passportLimit: Number.POSITIVE_INFINITY,
            avgIrisScore: 60,
            overrideCount90d: 0,
        });
        const inactive = computeHealthScore({
            publishedCount: 0,
            passportLimit: Number.POSITIVE_INFINITY,
            avgIrisScore: 0,
            overrideCount90d: 0,
        });
        expect(active.capacityScore).toBe(100);
        expect(inactive.capacityScore).toBe(0);
    });

    it('irisScore clampé entre 0 et 100', () => {
        const high = computeHealthScore({
            publishedCount: 0,
            passportLimit: 5,
            avgIrisScore: 150,
            overrideCount90d: 0,
        });
        const negative = computeHealthScore({
            publishedCount: 0,
            passportLimit: 5,
            avgIrisScore: -5,
            overrideCount90d: 0,
        });
        expect(high.irisScore).toBe(100);
        expect(negative.irisScore).toBe(0);
    });
});

describe('healthBand', () => {
    it('< 50 → critical', () => {
        expect(healthBand(0)).toBe('critical');
        expect(healthBand(49)).toBe('critical');
    });

    it('50–74 → warning', () => {
        expect(healthBand(50)).toBe('warning');
        expect(healthBand(74)).toBe('warning');
    });

    it('>= 75 → healthy', () => {
        expect(healthBand(75)).toBe('healthy');
        expect(healthBand(100)).toBe('healthy');
    });

    it('reste défini sur les bornes 0 et 100', () => {
        expect(['critical', 'warning', 'healthy']).toContain(healthBand(0));
        expect(['critical', 'warning', 'healthy']).toContain(healthBand(100));
    });
});

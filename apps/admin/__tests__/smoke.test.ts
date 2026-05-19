// Smoke tests apps/admin — couvre deux helpers pivots que la pyramide de tests doit garantir
// avant tout merge : computeHealthScore (lib/health-score) et findRoute (_shared/nav-routes).

import { describe, expect, it } from 'bun:test';
import { computeHealthScore } from '@/lib/health-score';
import { findRoute } from '@/features/_shared/nav-routes';

describe('computeHealthScore — smoke', () => {
    it('cas nominal : Studio à pleine charge avec bon Iris remonte un total ≥ 75', () => {
        const h = computeHealthScore({
            publishedCount: 8,
            passportLimit: 10,
            avgIrisScore: 85,
            overrideCount90d: 0,
        });
        expect(h.total).toBeGreaterThanOrEqual(75);
        expect(h.capacityUtilization).toBe(80);
    });

    it('edge : Maison sans passeport publié → total dominé par axe overrides (~25)', () => {
        const h = computeHealthScore({
            publishedCount: 0,
            passportLimit: Number.POSITIVE_INFINITY,
            avgIrisScore: 0,
            overrideCount90d: 0,
        });
        expect(h.capacityScore).toBe(0);
        expect(h.irisScore).toBe(0);
        expect(h.total).toBe(25);
    });
});

describe('findRoute — smoke', () => {
    it('URL connue → renvoie groupe + route correspondants', () => {
        const hit = findRoute('/artisans');
        expect(hit).toBeDefined();
        expect(hit?.group.id).toBe('curation');
        expect(hit?.route.href).toBe('/artisans');
    });

    it('URL inconnue → renvoie undefined', () => {
        expect(findRoute('/route/inconnue')).toBeUndefined();
    });
});

import { describe, expect, it } from 'bun:test';
import {
    ACQUISITION_SOURCE_MIX,
    ARTISAN_TIER_MIX,
    ATELIER_MONTHLY_EUR,
    ATELIER_PLUS_ADOPTION_PCT,
    ATELIER_PLUS_MONTHLY_EUR,
    B2C_ACCOUNT_ACTIVATION_PCT,
    B2C_AFFILIATION_ARPU_MONTHLY_EUR,
    BREAKEVEN_NOMINAL_RANGE,
    BREAKEVEN_STRESS_RANGE,
    CHARGES_CUMULATIVE_M18_EUR,
    ESPR_DEADLINES,
    FUNNEL_CONVERSION,
    IRIS_AVERAGE_TARGET,
    LOCAL_MONTHLY_EUR,
    LTV_CAC_TARGETS,
    STRESS_B2B_FACTOR,
    STRESS_B2C_FACTOR,
    TARGET_PERIOD_END_MONTHS,
    TARGET_PERIOD_START_ISO,
    buildMonthlyTargets,
    monthlyCostEur,
} from '../business-targets';

describe('ATELIER_MONTHLY_EUR — prix B2B verrouillés Chiffrage v4.2 § 4', () => {
    it('Solo = 29 €, Studio = 79 €, Maison = 149 € (drift = bug)', () => {
        expect(ATELIER_MONTHLY_EUR.Solo).toBe(29);
        expect(ATELIER_MONTHLY_EUR.Studio).toBe(79);
        expect(ATELIER_MONTHLY_EUR.Maison).toBe(149);
    });

    it('Solo < Studio < Maison', () => {
        expect(ATELIER_MONTHLY_EUR.Solo).toBeLessThan(ATELIER_MONTHLY_EUR.Studio);
        expect(ATELIER_MONTHLY_EUR.Studio).toBeLessThan(ATELIER_MONTHLY_EUR.Maison);
    });

    it('ATELIER+ = 19 €, LUMIRIS Local = 19 €', () => {
        expect(ATELIER_PLUS_MONTHLY_EUR).toBe(19);
        expect(LOCAL_MONTHLY_EUR).toBe(19);
    });
});

describe('ARTISAN_TIER_MIX — Chiffrage v4.2 § 5 (60/30/10)', () => {
    it('expose 60 % Solo, 30 % Studio, 10 % Maison', () => {
        expect(ARTISAN_TIER_MIX.Solo).toBe(0.6);
        expect(ARTISAN_TIER_MIX.Studio).toBe(0.3);
        expect(ARTISAN_TIER_MIX.Maison).toBe(0.1);
    });

    it('somme à 1.0', () => {
        const total = ARTISAN_TIER_MIX.Solo + ARTISAN_TIER_MIX.Studio + ARTISAN_TIER_MIX.Maison;
        expect(total).toBeCloseTo(1, 5);
    });
});

describe('ACQUISITION_SOURCE_MIX', () => {
    it('somme des 5 canaux = 1.0', () => {
        const total = Object.values(ACQUISITION_SOURCE_MIX).reduce((s, v) => s + v, 0);
        expect(total).toBeCloseTo(1, 5);
    });

    it('expose les 5 canaux attendus', () => {
        const keys = Object.keys(ACQUISITION_SOURCE_MIX).sort();
        expect(keys).toEqual(['CMA', 'Démarchage', 'LinkedIn', 'RP', 'Salon']);
    });
});

describe('FUNNEL_CONVERSION', () => {
    it('expose les 3 taux cumulés', () => {
        expect(FUNNEL_CONVERSION.leadToDemo).toBe(0.45);
        expect(FUNNEL_CONVERSION.demoToSignature).toBe(0.32);
        expect(FUNNEL_CONVERSION.signatureToActivation).toBe(0.78);
    });

    it('le produit (lead → activation) reste sous 12 % (cohérence v4.2 § 6)', () => {
        const overall =
            FUNNEL_CONVERSION.leadToDemo * FUNNEL_CONVERSION.demoToSignature * FUNNEL_CONVERSION.signatureToActivation;
        expect(overall).toBeLessThan(0.12);
        expect(overall).toBeGreaterThan(0.1);
    });
});

describe('buildMonthlyTargets — trajectoire M0 → M36', () => {
    it('renvoie 37 points (M0 inclus, M36 inclus)', () => {
        const points = buildMonthlyTargets();
        expect(points.length).toBe(TARGET_PERIOD_END_MONTHS + 1);
    });

    it('M0 = 0 artisans / 0 vision / 0 local', () => {
        const [m0] = buildMonthlyTargets();
        expect(m0).toMatchObject({ monthIndex: 0, artisans: 0, visionUsers: 0, localPaid: 0 });
    });

    it('cible M18 ≈ 130 artisans · 25k VISION · 60 Local (Chiffrage v4.2 § 5)', () => {
        const m18 = buildMonthlyTargets().find((p) => p.monthIndex === 18);
        expect(m18).toBeDefined();
        expect(m18?.artisans).toBe(130);
        expect(m18?.visionUsers).toBe(25_000);
        expect(m18?.localPaid).toBe(60);
    });

    it('cible M36 ≈ 420 artisans · 140k VISION · 220 Local', () => {
        const m36 = buildMonthlyTargets().find((p) => p.monthIndex === 36);
        expect(m36).toMatchObject({ artisans: 420, visionUsers: 140_000, localPaid: 220 });
    });

    it('les courbes restent monotones croissantes', () => {
        const points = buildMonthlyTargets();
        for (let i = 1; i < points.length; i++) {
            expect(points[i]!.artisans).toBeGreaterThanOrEqual(points[i - 1]!.artisans);
            expect(points[i]!.visionUsers).toBeGreaterThanOrEqual(points[i - 1]!.visionUsers);
            expect(points[i]!.localPaid).toBeGreaterThanOrEqual(points[i - 1]!.localPaid);
        }
    });
});

describe('monthlyCostEur — palier-courbe Chiffrage v4.2 § 7', () => {
    it('M0 = 8 000 € (rampe initiale)', () => {
        expect(monthlyCostEur(0)).toBe(8_000);
    });

    it('M9 = 14 000 € (palier après recrutement)', () => {
        expect(monthlyCostEur(9)).toBeCloseTo(14_000, -1);
    });

    it('M18 = 18 000 € (palier supérieur)', () => {
        expect(monthlyCostEur(18)).toBeCloseTo(18_000, -1);
    });

    it('charges cumulées M0→M18 dans la fourchette ~235 k€', () => {
        let sum = 0;
        for (let m = 1; m <= 18; m++) sum += monthlyCostEur(m);
        expect(sum).toBeGreaterThan(CHARGES_CUMULATIVE_M18_EUR * 0.85);
        expect(sum).toBeLessThan(CHARGES_CUMULATIVE_M18_EUR * 1.5);
    });

    it('croît avec le temps', () => {
        expect(monthlyCostEur(6)).toBeLessThan(monthlyCostEur(12));
        expect(monthlyCostEur(12)).toBeLessThan(monthlyCostEur(24));
    });
});

describe('stress factors — scénario prudent v4.2 § 8', () => {
    it('STRESS_B2B_FACTOR = 0.7 (-30 %)', () => {
        expect(STRESS_B2B_FACTOR).toBe(0.7);
    });

    it('STRESS_B2C_FACTOR = 0.67 (-33 %)', () => {
        expect(STRESS_B2C_FACTOR).toBe(0.67);
    });
});

describe('breakeven windows', () => {
    it('nominal = M22-M24, stressé = M28-M30', () => {
        expect(BREAKEVEN_NOMINAL_RANGE).toEqual([22, 24]);
        expect(BREAKEVEN_STRESS_RANGE).toEqual([28, 30]);
    });

    it('stressé > nominal', () => {
        expect(BREAKEVEN_STRESS_RANGE[0]).toBeGreaterThan(BREAKEVEN_NOMINAL_RANGE[1]);
    });
});

describe('LTV_CAC_TARGETS — 5 segments', () => {
    it('expose les 5 segments attendus', () => {
        const ids = LTV_CAC_TARGETS.map((t) => t.id).sort();
        expect(ids).toEqual([
            'atelier_solo',
            'atelier_studio',
            'local_repairer',
            'vision_no_account',
            'vision_with_account',
        ]);
    });

    it('chaque segment a un CAC > 0 et lifetime > 0', () => {
        for (const t of LTV_CAC_TARGETS) {
            expect(t.cacEur).toBeGreaterThan(0);
            expect(t.lifetimeMonths).toBeGreaterThan(0);
            expect(t.arpuMonthlyEur).toBeGreaterThan(0);
        }
    });

    it("Solo retient l'ARPU mensuel Atelier (29 €)", () => {
        const solo = LTV_CAC_TARGETS.find((t) => t.id === 'atelier_solo');
        expect(solo?.arpuMonthlyEur).toBe(ATELIER_MONTHLY_EUR.Solo);
    });
});

describe('ESPR_DEADLINES — 3 jalons stratégiques', () => {
    it('liste les 3 dates (registre, acte, application)', () => {
        const ids = ESPR_DEADLINES.map((d) => d.id);
        expect(ids).toContain('espr-registry-open');
        expect(ids).toContain('espr-textile-act');
        expect(ids).toContain('espr-textile-application');
    });

    it('les dates sont strictement croissantes', () => {
        for (let i = 1; i < ESPR_DEADLINES.length; i++) {
            const prev = new Date(ESPR_DEADLINES[i - 1]!.date).getTime();
            const cur = new Date(ESPR_DEADLINES[i]!.date).getTime();
            expect(cur).toBeGreaterThan(prev);
        }
    });
});

describe('autres invariants v4.2', () => {
    it('B2C ARPU mensuel = 0.18 €, taux activation compte = 18 %', () => {
        expect(B2C_AFFILIATION_ARPU_MONTHLY_EUR).toBe(0.18);
        expect(B2C_ACCOUNT_ACTIVATION_PCT).toBe(0.18);
    });

    it('Cible Iris moyen = 3.2 / 5 (objectif M18)', () => {
        expect(IRIS_AVERAGE_TARGET).toBe(3.2);
    });

    it('ATELIER+ adoption ciblée = 25 %', () => {
        expect(ATELIER_PLUS_ADOPTION_PCT).toBe(0.25);
    });

    it('TARGET_PERIOD_START_ISO = 2026-01-01', () => {
        expect(TARGET_PERIOD_START_ISO).toBe('2026-01-01');
    });
});

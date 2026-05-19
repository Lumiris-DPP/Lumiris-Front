import { describe, expect, it } from 'bun:test';
import {
    DEFAULT_PURCHASE_RATES,
    DEFAULT_REPAIR_COMMISSION,
    PURCHASE_RATE_BOUNDS,
    RATE_CHANGE_REASON_MIN_LENGTH,
    REPAIR_FLAT_BOUNDS,
    REPAIR_PCT_BOUNDS,
    validatePurchaseRate,
    validateRepairFlat,
    validateRepairPct,
} from '../affiliation-config';

describe('bounds — constants verrouillées sur Chiffrage v4.2 § 7.1', () => {
    it('purchase = 3-7 %', () => {
        expect(PURCHASE_RATE_BOUNDS.min).toBe(3);
        expect(PURCHASE_RATE_BOUNDS.max).toBe(7);
    });

    it('repair flat = 4-10 €', () => {
        expect(REPAIR_FLAT_BOUNDS.min).toBe(4);
        expect(REPAIR_FLAT_BOUNDS.max).toBe(10);
    });

    it('repair pct = 6-10 %', () => {
        expect(REPAIR_PCT_BOUNDS.min).toBe(6);
        expect(REPAIR_PCT_BOUNDS.max).toBe(10);
    });

    it('default purchase rates ne couvrent que les 5 catégories cadrées', () => {
        const categories = DEFAULT_PURCHASE_RATES.map((r) => r.category).sort();
        expect(categories).toEqual(['jewelry', 'leather', 'other', 'shoes', 'textile']);
    });

    it('chaque taux par défaut tient dans la fourchette légale 3-7 %', () => {
        for (const rate of DEFAULT_PURCHASE_RATES) {
            expect(validatePurchaseRate(rate.percent)).toBeNull();
        }
    });

    it('default repair commission est dans les fourchettes flat + pct', () => {
        expect(validateRepairFlat(DEFAULT_REPAIR_COMMISSION.flatEur)).toBeNull();
        expect(validateRepairPct(DEFAULT_REPAIR_COMMISSION.pct)).toBeNull();
    });
});

describe('validatePurchaseRate', () => {
    it('accepte les bornes min et max (inclusives)', () => {
        expect(validatePurchaseRate(3)).toBeNull();
        expect(validatePurchaseRate(7)).toBeNull();
        expect(validatePurchaseRate(5)).toBeNull();
    });

    it('rejette en dessous de 3 %', () => {
        const err = validatePurchaseRate(2.9);
        expect(err).not.toBeNull();
        expect(err?.field).toBe('purchase');
        expect(err?.received).toBe(2.9);
    });

    it('rejette au-dessus de 7 % (scénario UI : taux = 15 %)', () => {
        const err = validatePurchaseRate(15);
        expect(err).not.toBeNull();
        expect(err?.field).toBe('purchase');
        expect(err?.message).toContain('3-7');
    });

    it('rejette NaN / Infinity', () => {
        expect(validatePurchaseRate(Number.NaN)).not.toBeNull();
        expect(validatePurchaseRate(Number.POSITIVE_INFINITY)).not.toBeNull();
        expect(validatePurchaseRate(Number.NEGATIVE_INFINITY)).not.toBeNull();
    });

    it('rejette les valeurs négatives', () => {
        const err = validatePurchaseRate(-1);
        expect(err).not.toBeNull();
        expect(err?.field).toBe('purchase');
    });
});

describe('validateRepairFlat', () => {
    it('accepte 4 et 10 € (bornes inclusives)', () => {
        expect(validateRepairFlat(4)).toBeNull();
        expect(validateRepairFlat(10)).toBeNull();
        expect(validateRepairFlat(7)).toBeNull();
    });

    it('rejette < 4 € et > 10 €', () => {
        expect(validateRepairFlat(3.99)).not.toBeNull();
        expect(validateRepairFlat(10.01)).not.toBeNull();
        expect(validateRepairFlat(0)).not.toBeNull();
        expect(validateRepairFlat(50)).not.toBeNull();
    });

    it('renvoie le bon field code (repair-flat)', () => {
        const err = validateRepairFlat(0);
        expect(err?.field).toBe('repair-flat');
    });

    it('rejette NaN', () => {
        expect(validateRepairFlat(Number.NaN)).not.toBeNull();
    });
});

describe('validateRepairPct', () => {
    it('accepte 6 et 10 %', () => {
        expect(validateRepairPct(6)).toBeNull();
        expect(validateRepairPct(10)).toBeNull();
        expect(validateRepairPct(8)).toBeNull();
    });

    it('rejette < 6 % et > 10 %', () => {
        expect(validateRepairPct(5.9)).not.toBeNull();
        expect(validateRepairPct(10.1)).not.toBeNull();
        expect(validateRepairPct(15)).not.toBeNull();
        expect(validateRepairPct(0)).not.toBeNull();
    });

    it('renvoie le bon field code (repair-pct)', () => {
        const err = validateRepairPct(20);
        expect(err?.field).toBe('repair-pct');
    });

    it('rejette NaN et négatifs', () => {
        expect(validateRepairPct(Number.NaN)).not.toBeNull();
        expect(validateRepairPct(-1)).not.toBeNull();
    });
});

describe('audit log preconditions', () => {
    it('exige un motif >= 30 caractères pour toute modification (cohérent avec audit log)', () => {
        expect(RATE_CHANGE_REASON_MIN_LENGTH).toBe(30);
    });
});

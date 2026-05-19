import { describe, expect, it } from 'bun:test';
import {
    PURCHASE_RATE_BOUNDS,
    REPAIR_FLAT_BOUNDS,
    REPAIR_PCT_BOUNDS,
    validatePurchaseRate,
    validateRepairFlat,
    validateRepairPct,
} from '../../../lib/affiliation-config';

function modifyButtonDisabled(currentValue: number, draftValue: number, error: { message: string } | null): boolean {
    const dirty = currentValue !== draftValue;
    return !dirty || error !== null;
}

describe('Achat — taux hors borne 3-7 % bloque le bouton "Modifier"', () => {
    it('taux 15 % (cas spec) → validator renvoie erreur → bouton disabled', () => {
        const error = validatePurchaseRate(15);
        expect(error).not.toBeNull();
        expect(modifyButtonDisabled(5, 15, error)).toBe(true);
    });

    it('taux 2.9 % (< min) → bloqué', () => {
        const error = validatePurchaseRate(2.9);
        expect(modifyButtonDisabled(5, 2.9, error)).toBe(true);
    });

    it('taux 7.1 % (juste au-dessus max) → bloqué', () => {
        const error = validatePurchaseRate(7.1);
        expect(modifyButtonDisabled(5, 7.1, error)).toBe(true);
    });

    it('taux 5 % (dans bornes) ET modifié → bouton actif', () => {
        const error = validatePurchaseRate(5);
        expect(modifyButtonDisabled(4, 5, error)).toBe(false);
    });

    it('taux 5 % (dans bornes) mais NON modifié → bouton disabled (rien à enregistrer)', () => {
        const error = validatePurchaseRate(5);
        expect(modifyButtonDisabled(5, 5, error)).toBe(true);
    });

    it('NaN → bloqué', () => {
        const error = validatePurchaseRate(Number.NaN);
        expect(error).not.toBeNull();
        expect(modifyButtonDisabled(5, Number.NaN, error)).toBe(true);
    });
});

describe('Retouche — flat hors 4-10 € bloqué', () => {
    it('flat 12 € → bloqué', () => {
        expect(validateRepairFlat(12)).not.toBeNull();
    });

    it('flat 3 € → bloqué', () => {
        expect(validateRepairFlat(3)).not.toBeNull();
    });

    it('flat 7 € → autorisé', () => {
        expect(validateRepairFlat(7)).toBeNull();
    });
});

describe('Retouche — pct hors 6-10 % bloqué', () => {
    it('pct 5 % → bloqué', () => {
        expect(validateRepairPct(5)).not.toBeNull();
    });

    it('pct 11 % → bloqué', () => {
        expect(validateRepairPct(11)).not.toBeNull();
    });

    it('pct 8 % → autorisé', () => {
        expect(validateRepairPct(8)).toBeNull();
    });
});

describe('Constantes verrouillées (Chiffrage v4.2 § 7.1)', () => {
    it('achat 3-7, flat 4-10, pct 6-10', () => {
        expect(PURCHASE_RATE_BOUNDS).toEqual({ min: 3, max: 7 } as never);
        expect(REPAIR_FLAT_BOUNDS).toEqual({ min: 4, max: 10 } as never);
        expect(REPAIR_PCT_BOUNDS).toEqual({ min: 6, max: 10 } as never);
    });
});

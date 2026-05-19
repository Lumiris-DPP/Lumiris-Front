import { describe, expect, it } from 'bun:test';
import { ATELIER_LINE_IDS, ORDERED_PRICE_IDS, PRICE_LINES, formatEur, priceLine, yearlySavingsPct } from '../pricing';

describe('priceLine', () => {
    it('returns the canonical line for each id', () => {
        expect(priceLine('solo').monthlyEur).toBe(29);
        expect(priceLine('studio').monthlyEur).toBe(79);
        expect(priceLine('maison').monthlyEur).toBe(149);
        expect(priceLine('plus').monthlyEur).toBe(19);
        expect(priceLine('local').monthlyEur).toBe(19);
    });

    it('keeps the ATELIER tier order Solo < Studio < Maison', () => {
        expect(priceLine('solo').monthlyEur).toBeLessThan(priceLine('studio').monthlyEur);
        expect(priceLine('studio').monthlyEur).toBeLessThan(priceLine('maison').monthlyEur);
    });

    it('respects ATELIER_LINE_IDS shape (3 tiers, atelier kind only)', () => {
        expect(ATELIER_LINE_IDS).toEqual(['solo', 'studio', 'maison']);
        for (const id of ATELIER_LINE_IDS) {
            expect(PRICE_LINES[id].kind).toBe('atelier');
        }
    });

    it('exposes 5 ordered line ids (Solo, Studio, Maison, ATELIER+, Local)', () => {
        expect(ORDERED_PRICE_IDS).toEqual(['solo', 'studio', 'maison', 'plus', 'local']);
    });

    it('keeps add-on ATELIER+ and Local at the same monthly price (19 €)', () => {
        expect(priceLine('plus').monthlyEur).toBe(priceLine('local').monthlyEur);
        expect(priceLine('plus').kind).toBe('addon');
        expect(priceLine('local').kind).toBe('local');
    });
});

describe('yearly = monthly × 10 (≈ 2 mois offerts)', () => {
    it('locks the 10× ratio for every line in PRICE_LINES', () => {
        for (const line of Object.values(PRICE_LINES)) {
            expect<number>(line.yearlyEur).toBe(line.monthlyEur * 10);
        }
    });

    it('yearlySavingsPct ≈ 17 % (1 - 10/12) for all canonical lines', () => {
        for (const line of Object.values(PRICE_LINES)) {
            expect(yearlySavingsPct(line)).toBe(17);
        }
    });

    it('yearlySavingsPct returns 0 when the monthly price is 0 (guard against div/0)', () => {
        const free = { ...PRICE_LINES.solo, monthlyEur: 0, yearlyEur: 0 };
        expect(yearlySavingsPct(free)).toBe(0);
    });

    it('yearlySavingsPct returns 0 when yearly equals monthly × 12 (no discount)', () => {
        const noDiscount = { ...PRICE_LINES.solo, yearlyEur: PRICE_LINES.solo.monthlyEur * 12 };
        expect(yearlySavingsPct(noDiscount)).toBe(0);
    });
});

describe('formatEur', () => {
    it('formats positive integers with the fr-FR thin space', () => {
        expect(formatEur(29).endsWith(' €')).toBe(true);
        expect(formatEur(1_490)).toContain('1');
        expect(formatEur(1_490)).toContain('490');
    });

    it('formats zero as "0 €"', () => {
        expect(formatEur(0)).toBe('0 €');
    });
});

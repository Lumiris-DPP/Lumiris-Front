// LUMIRIS Local V1 strict textile : 7 spécialités exposées, jamais plus.

import { describe, expect, it } from 'bun:test';
import type { RepairerSpecialty } from '@lumiris/types';
import {
    COMMISSION_ANONYMIZE_AFTER_DAYS,
    COMMISSION_FLAT_MAX_EUR,
    COMMISSION_FLAT_MIN_EUR,
    COMMISSION_PCT,
    LUMIRIS_LOCAL_ARPU_EUR,
    LUMIRIS_LOCAL_PRICE_MONTHLY_EUR,
    LUMIRIS_LOCAL_PRICE_YEARLY_EUR,
    REVIEW_HIDE_REASON_MIN_CHARS,
    V1_SPECIALTIES,
    V1_SPECIALTY_LABEL,
    toV1Specialty,
} from '../specialties';

describe('V1_SPECIALTIES — 7 spécialités textile uniquement (V1)', () => {
    it('expose exactement 7 entrées', () => {
        expect(V1_SPECIALTIES.length).toBe(7);
    });

    it('liste les 7 codes attendus (jamais plus, pas de hors-textile)', () => {
        expect([...V1_SPECIALTIES].sort()).toEqual([
            'broderie',
            'cordonnerie',
            'couture',
            'maroquinerie',
            'retouche',
            'teinture-textile',
            'tricot-maille',
        ]);
    });

    it('ne contient PAS de spécialités hors-textile (électronique, mobilier, électroménager…)', () => {
        const forbidden = ['electronics', 'furniture', 'appliances', 'batteries', 'electromenager'] as const;
        for (const code of forbidden) {
            // V1_SPECIALTIES est typé strict, mais on vérifie en runtime que rien ne fuit.
            expect((V1_SPECIALTIES as readonly string[]).includes(code)).toBe(false);
        }
    });

    it('chaque code a un libellé FR non vide', () => {
        for (const code of V1_SPECIALTIES) {
            expect(V1_SPECIALTY_LABEL[code]).toBeTruthy();
            expect(V1_SPECIALTY_LABEL[code].length).toBeGreaterThan(0);
        }
    });
});

describe('toV1Specialty — mapping codes @lumiris/types → V1', () => {
    it('alteration → retouche', () => {
        expect(toV1Specialty('alteration')).toBe('retouche');
    });

    it('embroidery → broderie', () => {
        expect(toV1Specialty('embroidery')).toBe('broderie');
    });

    it('shoe-repair → cordonnerie', () => {
        expect(toV1Specialty('shoe-repair')).toBe('cordonnerie');
    });

    it('leather → maroquinerie', () => {
        expect(toV1Specialty('leather')).toBe('maroquinerie');
    });

    it('lining → couture', () => {
        expect(toV1Specialty('lining')).toBe('couture');
    });

    it('renvoie null pour des codes inconnus / hors-textile', () => {
        // Cast nécessaire car le type @lumiris/types ne couvre pas ces valeurs en V1.
        expect(toV1Specialty('electronics' as RepairerSpecialty)).toBeNull();
        expect(toV1Specialty('furniture' as RepairerSpecialty)).toBeNull();
        expect(toV1Specialty('unknown' as RepairerSpecialty)).toBeNull();
    });
});

describe('commissions affiliation — fourchette légale 4-10 € OU 8 %', () => {
    it('forfait min/max = 4-10 €', () => {
        expect(COMMISSION_FLAT_MIN_EUR).toBe(4);
        expect(COMMISSION_FLAT_MAX_EUR).toBe(10);
    });

    it('commission pct par défaut = 8 %', () => {
        expect(COMMISSION_PCT).toBe(8);
    });

    it('anonymisation après 90 jours (RGPD)', () => {
        expect(COMMISSION_ANONYMIZE_AFTER_DAYS).toBe(90);
    });
});

describe('LUMIRIS Local — pricing verrouillé', () => {
    it('19 € / mois et 190 € / an (≈ 2 mois offerts)', () => {
        expect(LUMIRIS_LOCAL_PRICE_MONTHLY_EUR).toBe(19);
        expect(LUMIRIS_LOCAL_PRICE_YEARLY_EUR).toBe(190);
        expect(LUMIRIS_LOCAL_PRICE_YEARLY_EUR).toBe(LUMIRIS_LOCAL_PRICE_MONTHLY_EUR * 10);
    });

    it('ARPU annuel ≈ 230 € (abonnement + affiliation)', () => {
        expect(LUMIRIS_LOCAL_ARPU_EUR).toBe(230);
        expect(LUMIRIS_LOCAL_ARPU_EUR).toBeGreaterThan(LUMIRIS_LOCAL_PRICE_YEARLY_EUR);
    });
});

describe('review_hide_reason — protection modération', () => {
    it('exige au moins 20 caractères pour masquer un avis', () => {
        expect(REVIEW_HIDE_REASON_MIN_CHARS).toBe(20);
    });
});

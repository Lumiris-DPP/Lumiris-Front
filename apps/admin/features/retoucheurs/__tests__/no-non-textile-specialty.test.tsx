import { describe, expect, it } from 'bun:test';
import { V1_SPECIALTIES, V1_SPECIALTY_LABEL, type V1Specialty } from '../specialties';

const FORBIDDEN_NON_TEXTILE: readonly string[] = [
    'electronics-repair',
    'phone-repair',
    'computer-repair',
    'appliance-repair',
    'cabinetmaking',
    'upholstery',
    'lining',
];

describe('V1 specialties — 7 métiers textile only', () => {
    it('V1_SPECIALTIES contient exactement 7 entrées', () => {
        expect(V1_SPECIALTIES.length).toBe(7);
    });

    it('aucun métier non-textile dans V1_SPECIALTIES', () => {
        for (const forbidden of FORBIDDEN_NON_TEXTILE) {
            expect(V1_SPECIALTIES).not.toContain(forbidden as V1Specialty);
        }
    });

    it('V1_SPECIALTIES contient exactement les 7 valeurs attendues', () => {
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

    it('chaque V1 specialty a un label FR humain défini', () => {
        for (const spec of V1_SPECIALTIES) {
            expect(V1_SPECIALTY_LABEL[spec]).toBeTruthy();
            expect(typeof V1_SPECIALTY_LABEL[spec]).toBe('string');
        }
    });

    it('aucun doublon dans V1_SPECIALTIES (la liste est canonique)', () => {
        expect(new Set(V1_SPECIALTIES).size).toBe(V1_SPECIALTIES.length);
    });

    it('"maroquinerie" est la seule mention "cuir" autorisée (V1 ne traite que le textile + accessoires textiles)', () => {
        const leatherLike = V1_SPECIALTIES.filter((s) => s === 'maroquinerie');
        expect(leatherLike.length).toBe(1);
    });
});
